/**
 * F08.S02.M02 consent: signed statements per participant and per exact revision. A statement is signed
 * on the participant's device (context `consent`) and verified here against the signing keys the identity
 * module lists for that account. Records are append-only evidence; the latest one per
 * (account, subject, revision) is the current decision. A signature evidences the participant's assertion,
 * it does not prove that the underlying trade happened.
 */
import type { AccountLookup, Actor, CommandContext, Operation } from '@classrup/kernel';
import { assertTransition, defineOperations, MINUTE, parse, requireFeature, runCommand, unauthenticated, validationError, z } from '@classrup/kernel';
import type { SignedEnvelope } from '@classrup/security';
import { verifyEnvelope } from '@classrup/security';
import { accountIdSchema, assertRefId, hashSchema, REF_TYPES, threadIdSchema } from '../schemas';
import type { Env } from '../support';
import { authorizeThread, col, COLLECTIONS, FLAGS, loadThread, withStatus } from '../support';
import type { ConsentDecision, ConsentRecord, ConsentStatement } from '../types';

export const CONSENT_CONTEXT = 'consent';
/** Statements dated further than this from server time are rejected (stops backdated or pre-dated consent). */
export const CONSENT_SKEW_MS = 10 * MINUTE;

const TRANSITIONS: Readonly<Record<ConsentDecision | 'none', readonly ConsentDecision[]>> = {
  none: ['accept', 'decline'],
  accept: ['revoke'],
  decline: ['accept'],
  revoke: ['accept'],
};

const statementSchema = z.strictObject({
  accountId: accountIdSchema,
  subjectType: z.enum(REF_TYPES),
  subjectId: z.string().max(64),
  revisionHash: hashSchema,
  decision: z.enum(['accept', 'decline', 'revoke']),
  at: z.number().int().nonnegative(),
});

const envelopeSchema = z.strictObject({
  v: z.literal(1),
  ctx: z.literal(CONSENT_CONTEXT),
  signer: z.string().regex(/^ed25519:[A-Za-z0-9_-]{43}$/),
  payload: statementSchema,
  sig: z.string().regex(/^[A-Za-z0-9_-]{86}$/),
});

const recordSchema = z.strictObject({ envelope: z.unknown() });
const statusSchema = z.strictObject({ threadId: threadIdSchema, subjectType: z.enum(REF_TYPES), subjectId: z.string().max(64), revisionHash: hashSchema });

export type ConsentRejection = 'malformed' | 'unknown_account' | 'key_not_registered' | 'bad_signature' | 'account_mismatch';
export type ConsentVerification =
  | { readonly valid: true; readonly statement: ConsentStatement; readonly signerKeyId: string; readonly signature: string }
  | { readonly valid: false; readonly reason: ConsentRejection };

/**
 * Reusable by other features through the relay: checks structure, that the signer is an active signing
 * key of the statement's account, and the signature. Freshness is a separate concern of the recorder.
 */
export function verifyConsent(accounts: AccountLookup, input: unknown, expectedAccountId?: string): ConsentVerification {
  const parsed = envelopeSchema.safeParse(input);
  if (!parsed.success) return { valid: false, reason: 'malformed' };
  const envelope = parsed.data as SignedEnvelope<ConsentStatement>;
  const statement = envelope.payload;
  if (expectedAccountId !== undefined && statement.accountId !== expectedAccountId) return { valid: false, reason: 'account_mismatch' };
  const account = accounts.get(statement.accountId);
  if (!account || account.status !== 'active') return { valid: false, reason: 'unknown_account' };
  if (!account.signingKeyIds.includes(envelope.signer)) return { valid: false, reason: 'key_not_registered' };
  if (!verifyEnvelope(envelope, CONSENT_CONTEXT, envelope.signer)) return { valid: false, reason: 'bad_signature' };
  return { valid: true, statement, signerKeyId: envelope.signer, signature: envelope.sig };
}

export interface ConsentDto {
  readonly id: string;
  readonly accountId: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly revisionHash: string;
  readonly decision: ConsentDecision;
  readonly at: number;
  readonly recordedAt: number;
}

const dto = (r: ConsentRecord): ConsentDto => ({
  id: r.id, accountId: r.statement.accountId, subjectType: r.statement.subjectType, subjectId: r.statement.subjectId,
  revisionHash: r.statement.revisionHash, decision: r.statement.decision, at: r.statement.at, recordedAt: r.recordedAt,
});

export function createConsent(env: Env) {
  const { deps, ports } = env;
  const consents = () => col<ConsentRecord>(env, COLLECTIONS.consents);

  const forSubject = (tenantId: string, type: string, id: string, revisionHash: string): ConsentRecord[] =>
    consents()
      .list((r) => r.tenantId === tenantId && r.statement.subjectType === type && r.statement.subjectId === id && r.statement.revisionHash === revisionHash)
      .sort((a, b) => a.id.localeCompare(b.id));

  /** Latest decision per account (ids are time-ordered ULIDs, so the last record wins). */
  function latestByAccount(records: readonly ConsentRecord[]): Map<string, ConsentRecord> {
    const latest = new Map<string, ConsentRecord>();
    for (const r of records) latest.set(r.statement.accountId, r);
    return latest;
  }

  function record(ctx: CommandContext, input: unknown): ConsentDto {
    const req = parse(recordSchema, input);
    return runCommand(deps, ctx, { name: 'comms.consent.record', flag: FLAGS.consent, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'comms.consent:record', { type: 'comms.consent', ownerId: actor.id, tenantId: actor.tenantId });
      const checked = verifyConsent(ports.accounts, req.envelope, actor.id);
      if (!checked.valid) throw unauthenticated('COMMS.CONSENT_INVALID', 'consent statement rejected', { reason: checked.reason });
      const { statement } = checked;
      assertRefId(statement.subjectType, statement.subjectId);
      if (Math.abs(deps.clock.now() - statement.at) > CONSENT_SKEW_MS) throw validationError('COMMS.CONSENT_STALE', 'statement time is outside the allowed window');
      const history = forSubject(actor.tenantId, statement.subjectType, statement.subjectId, statement.revisionHash).filter((r) => r.statement.accountId === actor.id);
      const replay = history.find((r) => r.signature === checked.signature);
      if (replay) return { result: dto(replay) };
      assertTransition('COMMS_CONSENT', history.at(-1)?.statement.decision ?? 'none', statement.decision, TRANSITIONS);
      const saved = consents().put(
        { id: deps.ids.next('msg'), tenantId: actor.tenantId, statement, signerKeyId: checked.signerKeyId, signature: checked.signature, recordedAt: deps.clock.now() },
        0,
      );
      return {
        result: dto(saved),
        events: [
          {
            type: 'comms.consent.recorded', aggregateType: 'consent', aggregateId: saved.id, revision: saved.version,
            payload: { consentId: saved.id, accountId: statement.accountId, subjectType: statement.subjectType, subjectId: statement.subjectId, revisionHash: statement.revisionHash, decision: statement.decision },
          },
        ],
      };
    });
  }

  /** Current decisions of the thread's members for one exact revision. */
  function status(actor: Actor, input: unknown): { decisions: ConsentDto[]; allAccepted: boolean } {
    const req = parse(statusSchema, input);
    requireFeature(deps.flags, FLAGS.consent, actor.tenantId);
    const view = loadThread(env, actor, req.threadId);
    authorizeThread(env, actor, 'comms.consent:read', view);
    const members = new Set(withStatus(view, 'active').map((p) => p.accountId));
    const latest = latestByAccount(forSubject(actor.tenantId, req.subjectType, req.subjectId, req.revisionHash).filter((r) => members.has(r.statement.accountId)));
    return { decisions: [...latest.values()].map(dto), allAccepted: [...members].every((id) => latest.get(id)?.statement.decision === 'accept') };
  }

  /** Relay-side check for other features: true only if every listed account's latest decision is `accept`. */
  function hasAllConsent(tenantId: string, subjectType: string, subjectId: string, revisionHash: string, accountIds: readonly string[]): boolean {
    const latest = latestByAccount(forSubject(tenantId, subjectType, subjectId, revisionHash));
    return accountIds.length > 0 && accountIds.every((id) => latest.get(id)?.statement.decision === 'accept');
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'comms.consent.record', kind: 'command', flag: FLAGS.consent, summary: 'Record a signed consent statement', handler: record },
    { name: 'comms.consent.status', kind: 'query', flag: FLAGS.consent, summary: 'Current consent decisions for one revision', handler: (ctx, input) => status(ctx.actor, input) },
  ]);

  return { record, status, hasAllConsent, verifyConsent: (input: unknown, expectedAccountId?: string) => verifyConsent(ports.accounts, input, expectedAccountId), operations };
}
