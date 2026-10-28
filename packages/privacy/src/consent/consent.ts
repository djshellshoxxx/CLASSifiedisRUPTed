/**
 * F10.S01.M01 consent: purpose-based, per account, with the policy version the person agreed to.
 * Every grant and withdrawal appends an immutable history entry; the current state is derived and
 * cached for O(1) `hasConsent`. Withdrawal is as easy as granting and takes effect immediately.
 */
import type { CommandContext } from '@classrup/kernel';
import { parse, runCommand, z } from '@classrup/kernel';
import type { PrivacyEnv } from '../env';
import { authorize, checkFlag, EVENTS, event, FLAGS, ownerRef } from '../env';
import type { ConsentDecision, ConsentPurpose, ConsentStateRecord } from '../records';
import { CONSENT_PURPOSES } from '../records';

export interface ConsentStateDto {
  readonly purpose: ConsentPurpose;
  readonly granted: boolean;
  readonly policyVersion: string | null;
  readonly since: number | null;
}

export interface ConsentEntryDto {
  readonly id: string;
  readonly purpose: ConsentPurpose;
  readonly decision: ConsentDecision;
  readonly policyVersion: string;
  readonly at: number;
}

const purposeSchema = z.enum(CONSENT_PURPOSES);
const grantSchema = z.object({ purpose: purposeSchema, policyVersion: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/) }).strict();
const withdrawSchema = z.object({ purpose: purposeSchema }).strict();
const historySchema = z
  .object({ purpose: purposeSchema.optional(), limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).max(10_000).default(0) })
  .strict();

const stateId = (accountId: string, purpose: ConsentPurpose): string => `${accountId}:${purpose}`;

export interface ConsentService {
  grant(ctx: CommandContext, input: z.input<typeof grantSchema>): ConsentStateDto;
  withdraw(ctx: CommandContext, input: z.input<typeof withdrawSchema>): ConsentStateDto;
  listMine(ctx: CommandContext): ConsentStateDto[];
  history(ctx: CommandContext, input?: z.input<typeof historySchema>): ConsentEntryDto[];
  /**
   * Consumer API for other features. True only while the latest decision is a grant (and, when
   * `policyVersion` is given, was made against exactly that version). Unknown means no consent.
   */
  hasConsent(accountId: string, purpose: ConsentPurpose, policyVersion?: string): boolean;
}

const toDto = (purpose: ConsentPurpose, s: ConsentStateRecord | undefined): ConsentStateDto => ({
  purpose,
  granted: s?.decision === 'granted',
  policyVersion: s?.decision === 'granted' ? s.policyVersion : null,
  since: s?.since ?? null,
});

export function createConsentService(env: PrivacyEnv): ConsentService {
  const { deps, stores } = env;

  /** Appends a history entry and moves the cached state; returns the new state. */
  function record(ctx: CommandContext, purpose: ConsentPurpose, decision: ConsentDecision, policyVersion: string) {
    const now = deps.clock.now();
    const entryId = deps.ids.next('cns');
    const entry = stores.consentLog.put({ id: entryId, tenantId: ctx.actor.tenantId, accountId: ctx.actor.id, purpose, decision, policyVersion, at: now }, 0);
    const id = stateId(ctx.actor.id, purpose);
    const current = stores.consentState.get(id);
    const state = stores.consentState.put(
      { id, tenantId: ctx.actor.tenantId, accountId: ctx.actor.id, purpose, decision, policyVersion, since: now, entryId },
      current?.version ?? 0,
    );
    const type = decision === 'granted' ? EVENTS.consentGranted : EVENTS.consentWithdrawn;
    return { state, events: [event(type, 'consent', entry.id, entry.version, { consentId: entry.id, accountId: ctx.actor.id, purpose, policyVersion })] };
  }

  const resource = (ctx: CommandContext) => ownerRef('consent', ctx.actor.id, ctx.actor.tenantId);

  return {
    grant(ctx, input) {
      const i = parse(grantSchema, input);
      authorize(env, ctx, 'privacy.consent:grant', resource(ctx));
      return runCommand(deps, ctx, { name: 'privacy.consent.grant', flag: FLAGS.consent, request: i }, () => {
        const current = stores.consentState.get(stateId(ctx.actor.id, i.purpose));
        if (current?.decision === 'granted' && current.policyVersion === i.policyVersion) return { result: toDto(i.purpose, current) };
        const { state, events } = record(ctx, i.purpose, 'granted', i.policyVersion);
        return { result: toDto(i.purpose, state), events };
      });
    },

    withdraw(ctx, input) {
      const i = parse(withdrawSchema, input);
      authorize(env, ctx, 'privacy.consent:withdraw', resource(ctx));
      return runCommand(deps, ctx, { name: 'privacy.consent.withdraw', flag: FLAGS.consent, request: i }, () => {
        const current = stores.consentState.get(stateId(ctx.actor.id, i.purpose));
        if (current?.decision !== 'granted') return { result: toDto(i.purpose, current) };
        const { state, events } = record(ctx, i.purpose, 'withdrawn', current.policyVersion);
        return { result: toDto(i.purpose, state), events };
      });
    },

    listMine(ctx) {
      authorize(env, ctx, 'privacy.consent:read', resource(ctx));
      checkFlag(env, ctx, FLAGS.consent);
      return CONSENT_PURPOSES.map((p) => toDto(p, stores.consentState.get(stateId(ctx.actor.id, p))));
    },

    history(ctx, input = {}) {
      const i = parse(historySchema, input);
      authorize(env, ctx, 'privacy.consent:read', resource(ctx));
      checkFlag(env, ctx, FLAGS.consent);
      return stores.consentLog
        .list((e) => e.accountId === ctx.actor.id && (i.purpose === undefined || e.purpose === i.purpose))
        .sort((a, b) => b.at - a.at || (a.id < b.id ? 1 : -1))
        .slice(i.offset, i.offset + i.limit)
        .map((e) => ({ id: e.id, purpose: e.purpose, decision: e.decision, policyVersion: e.policyVersion, at: e.at }));
    },

    hasConsent(accountId, purpose, policyVersion) {
      const s = stores.consentState.get(stateId(accountId, purpose));
      return s?.decision === 'granted' && (policyVersion === undefined || s.policyVersion === policyVersion);
    },
  };
}
