import { appError, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, err, ok, timestamp, uuidv7, z,
  type AppError, type CommandContext, type QueryContext, type ReadScope, type Result, type StoredRecord } from '@classrup/kernel';
import { publicKeyFromDid, type StatementSigner } from '@classrup/security';
import { SUBJECT_TYPES, cidSchema, hashSchema, statementKeySchema, statementSchema, signConsentStatement, verifyConsentStatement,
  type ConsentPayload, type ConsentStatement, type SubjectType } from './statement.ts';
export * from './statement.ts';

const MODULE = 'F08.S02.M02';
const DAY = 86_400_000;
const HOUR = 3_600_000;
export const consentErrors = defineErrors({
  COMMS_CONSENT_STATEMENT_UNKNOWN: { status: 422, retryable: false }, COMMS_CONSENT_SUBJECT_MISMATCH: { status: 409, retryable: false },
  COMMS_CONSENT_STALE: { status: 409, retryable: false }, COMMS_CONSENT_SIGNATURE_INVALID: { status: 422, retryable: false },
  COMMS_CONSENT_NOT_REVOCABLE: { status: 409, retryable: false },
});
const provenanceSchema = z.strictObject({ via: z.array(z.string().min(1).max(253)).max(16).default([]), originRelay: z.string().min(1).max(253).optional() });
export const consentRecordSchema = z.strictObject({ statement: statementSchema, status: z.enum(['valid', 'revoked']), clockSuspect: z.boolean(),
  receivedAt: timestamp(), verifiedAt: timestamp(), provenance: provenanceSchema });
export type ConsentRecord = z.output<typeof consentRecordSchema>;
const subjectKey = (type: SubjectType, ref: string) => `${type}/${ref}`;
export const consentRepo = defineRepo({ type: 'comms.consent', schema: consentRecordSchema, indexes: {
  subject: d => subjectKey(d.statement.payload.subjectType, d.statement.payload.subjectRef),
  signerSubject: d => `${d.statement.payload.signerDid}/${subjectKey(d.statement.payload.subjectType, d.statement.payload.subjectRef)}`,
} });
const counterRepo = defineRepo({ type: 'comms.consent_counter', schema: z.strictObject({ count: z.int().min(0), startedAt: timestamp() }), indexes: {} });
export interface ConsentSubject {
  readonly revision: number;
  readonly currentRevision: number;
  /** Exact canonical revision hash from the owning module's canonicalizer; never a caller-supplied claim. */
  readonly hash: string;
  readonly participants: readonly { readonly did: string; readonly roles: readonly string[] }[];
  readonly committed: boolean;
}
export interface ConsentWording {
  readonly key: string; readonly subjectType: SubjectType; readonly textHash: string; readonly roles: readonly string[]; readonly retired?: boolean;
}
export interface ConsentOptions {
  localPrincipal(): string;
  readonly signer: StatementSigner;
  /** Resolves the requested historical revision, or the current revision when omitted, from this transaction. */
  subject(tx: ReadScope, type: SubjectType, ref: string, revision?: number): ConsentSubject | undefined;
  readonly wording: readonly ConsentWording[];
  /** Required for delegated keys. Consult authenticated key membership and revocation at firstSeenAt. */
  keyFor?(payload: ConsentPayload, firstSeenAt: string): Promise<Uint8Array | undefined>;
}
const subjectInput = { subjectType: z.enum(SUBJECT_TYPES), subjectRef: uuidv7() };
const eventPayload = z.strictObject({ consentId: cidSchema, signerDid: z.string(), ...subjectInput, subjectRevisionHash: hashSchema, statementKey: statementKeySchema, kind: z.enum(['consent', 'decline', 'revocation']) });
const signedEvent = defineEvent('comms.consent.signed', 1, 'P2', eventPayload);
const receivedEvent = defineEvent('comms.consent.received', 1, 'P2', eventPayload);
const revokedEvent = defineEvent('comms.consent.revoked', 1, 'P2', z.strictObject({ consentId: cidSchema, revocationId: cidSchema, signerDid: z.string(), ...subjectInput }));
type Context = CommandContext | QueryContext;
type Row = StoredRecord<ConsentRecord>;
function keyMatches(a: ConsentPayload, b: ConsentPayload): boolean {
  return a.signerDid === b.signerDid && a.subjectType === b.subjectType && a.subjectRef === b.subjectRef && a.subjectRevisionHash === b.subjectRevisionHash && a.statementKey === b.statementKey;
}

/** Strict subject-known consent core. Missing subjects/keys are rejected; no unverified statement becomes evidence. */
export function consentDefinitions(options: ConsentOptions) {
  const wording = structuredClone(options.wording);
  const local = (ctx: Context) => ctx.actor.kind === 'user' && ctx.actor.id === options.localPrincipal();
  const keyFor = async (payload: ConsentPayload, at: string) => options.keyFor ? options.keyFor(payload, at)
    : payload.signerKeyId === payload.signerDid ? publicKeyFromDid(payload.signerDid) : undefined;
  const rowsFor = (ctx: Context, type: SubjectType, ref: string) => ctx.tx.repo(consentRepo).query({ where: { subject: subjectKey(type, ref) }, limit: 500 });
  function access(ctx: Context, type: SubjectType, ref: string) {
    if (!local(ctx)) return undefined;
    const subject = options.subject(ctx.tx, type, ref);
    return subject?.participants.some(p => p.did === options.localPrincipal()) ? subject : undefined;
  }
  function validateSubject(ctx: Context, p: ConsentPayload, signing: boolean) {
    const subject = options.subject(ctx.tx, p.subjectType, p.subjectRef, p.subjectRevision);
    if (!subject || subject.revision !== p.subjectRevision || subject.hash !== p.subjectRevisionHash) return err(consentErrors.make('COMMS_CONSENT_SUBJECT_MISMATCH'));
    const current = access(ctx, p.subjectType, p.subjectRef);
    if (!current) return err(appError('FORBIDDEN'));
    if (signing && (current.currentRevision !== p.subjectRevision || subject.currentRevision !== p.subjectRevision)) return err(consentErrors.make('COMMS_CONSENT_STALE'));
    const registered = wording.find(w => w.key === p.statementKey && w.subjectType === p.subjectType && w.textHash === p.statementTextHash && (!signing || !w.retired));
    if (!registered) return err(consentErrors.make('COMMS_CONSENT_STATEMENT_UNKNOWN'));
    const party = subject.participants.find(member => member.did === p.signerDid);
    if (!party || !party.roles.some(role => registered.roles.includes(role))) return err(appError('FORBIDDEN'));
    return ok(subject);
  }
  function emit(ctx: CommandContext, row: Row, event: typeof signedEvent | typeof receivedEvent) {
    const p = row.data.statement.payload;
    ctx.emit(event, { aggregate: { type: 'consent', id: row.id }, revision: row.revision,
      payload: { consentId: row.id, signerDid: p.signerDid, subjectType: p.subjectType, subjectRef: p.subjectRef, subjectRevisionHash: p.subjectRevisionHash, statementKey: p.statementKey, kind: p.kind } });
  }
  function store(ctx: CommandContext, statement: ConsentStatement, provenance: z.output<typeof provenanceSchema>, localSign: boolean) {
    const p = statement.payload;
    const repo = ctx.tx.repo(consentRepo);
    const page = repo.query({ where: { signerSubject: `${p.signerDid}/${subjectKey(p.subjectType, p.subjectRef)}` }, limit: 21 });
    if (!page.ok) return page;
    if (page.value.nextCursor) return err(appError('RATE_LIMITED'));
    const records = page.value.items;
    const replay = records.find(r => r.id === statement.cid);
    if (replay) return ok(replay);
    // Reserve one terminal slot for every still-revocable consent; saturation cannot prevent withdrawal.
    const reserved = records.filter(r => r.data.statement.payload.kind === 'consent' && r.data.status !== 'revoked').length;
    if (records.length >= 20 || (p.kind !== 'revocation' && records.length + reserved + (p.kind === 'consent' ? 2 : 1) > 20)) return err(appError('RATE_LIMITED'));
    if (localSign && p.kind !== 'revocation') {
      const id = p.signerDid;
      const count = ctx.tx.repo(counterRepo).get(id);
      const now = ctx.clock.now();
      const resets = !count || now - Date.parse(count.data.startedAt) >= HOUR;
      const used = resets ? 0 : count.data.count;
      if (used >= 60) return err(appError('RATE_LIMITED', { retryAfterMs: HOUR }));
      const saved = ctx.tx.repo(counterRepo).put(id, { count: used + 1, startedAt: resets ? new Date(now).toISOString() : count.data.startedAt }, { expectedRevision: count?.revision ?? 0 });
      if (!saved.ok) return saved;
    }
    if (p.kind === 'revocation') {
      const original = p.revokes ? repo.get(p.revokes) : undefined;
      if (!original || original.data.status === 'revoked' || original.data.statement.payload.kind !== 'consent' || !keyMatches(original.data.statement.payload, p) || original.data.statement.payload.subjectRevision !== p.subjectRevision || original.data.statement.payload.statementTextHash !== p.statementTextHash) return err(consentErrors.make('COMMS_CONSENT_NOT_REVOCABLE'));
      const updated = repo.put(original.id, { ...original.data, status: 'revoked' }, { expectedRevision: original.revision });
      if (!updated.ok) return updated;
    }
    const at = new Date(ctx.clock.now()).toISOString();
    return repo.put(statement.cid, { statement, status: 'valid', clockSuspect: Math.abs(Date.parse(p.signedAtClaim) - ctx.clock.now()) > DAY,
      receivedAt: at, verifiedAt: at, provenance }, { expectedRevision: 0 });
  }
  const sign = defineCommand({ name: 'comms.consent.sign', module: MODULE, capability: 'comms.consent.sign', idempotent: true,
    input: z.strictObject({ ...subjectInput, subjectRevision: z.int().min(1), subjectRevisionHash: hashSchema, statementKey: statementKeySchema, statementTextHash: hashSchema, kind: z.enum(['consent', 'decline']), readConfirmed: z.literal(true) }),
    async handler(ctx, input) {
      if (!local(ctx) || options.signer.principal !== options.localPrincipal()) return err(appError('FORBIDDEN'));
      const { readConfirmed: _confirmed, ...fields } = input;
      const payload: ConsentPayload = { ...fields, signerDid: options.localPrincipal(), signerKeyId: options.signer.principal, signedAtClaim: new Date(ctx.clock.now()).toISOString() };
      const valid = validateSubject(ctx, payload, true); if (!valid.ok) return valid;
      const prior = rowsFor(ctx, payload.subjectType, payload.subjectRef); if (!prior.ok) return prior;
      if (prior.value.nextCursor) return err(appError('RATE_LIMITED'));
      const duplicate = prior.value.items.find(r => keyMatches(r.data.statement.payload, payload) && r.data.statement.payload.kind === payload.kind);
      if (duplicate) return ok({ consentId: duplicate.id, signedAtClaim: duplicate.data.statement.payload.signedAtClaim, revision: duplicate.revision, statement: duplicate.data.statement });
      let statement: ConsentStatement;
      try { statement = await signConsentStatement(options.signer, payload); await verifyConsentStatement(statement, p => keyFor(p, payload.signedAtClaim)); }
      catch { return err(consentErrors.make('COMMS_CONSENT_SIGNATURE_INVALID')); }
      const saved = store(ctx, statement, { via: [] }, true); if (!saved.ok) return saved;
      emit(ctx, saved.value, signedEvent);
      return ok({ consentId: saved.value.id, signedAtClaim: payload.signedAtClaim, revision: saved.value.revision, statement });
    },
  });
  const revoke = defineCommand({ name: 'comms.consent.revoke', module: MODULE, capability: 'comms.consent.revoke', idempotent: true,
    input: z.strictObject({ consentId: cidSchema, expectedRevision: z.int().min(1) }),
    async handler(ctx, input) {
      if (!local(ctx)) return err(appError('FORBIDDEN'));
      const original = ctx.tx.repo(consentRepo).get(input.consentId);
      if (!original || original.data.statement.payload.signerDid !== options.localPrincipal()) return err(appError('NOT_FOUND'));
      const p = original.data.statement.payload;
      const subject = access(ctx, p.subjectType, p.subjectRef);
      if (!subject || subject.committed || p.kind !== 'consent' || original.data.status === 'revoked') return err(consentErrors.make('COMMS_CONSENT_NOT_REVOCABLE'));
      if (original.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      const payload: ConsentPayload = { ...p, kind: 'revocation', revokes: original.id, signedAtClaim: new Date(ctx.clock.now()).toISOString(), signerKeyId: options.signer.principal };
      let statement: ConsentStatement;
      try { statement = await signConsentStatement(options.signer, payload); await verifyConsentStatement(statement, p => keyFor(p, payload.signedAtClaim)); }
      catch { return err(consentErrors.make('COMMS_CONSENT_SIGNATURE_INVALID')); }
      const saved = store(ctx, statement, { via: [] }, true); if (!saved.ok) return saved;
      ctx.emit(revokedEvent, { aggregate: { type: 'consent', id: original.id }, revision: original.revision + 1, payload: { consentId: original.id, revocationId: saved.value.id, signerDid: p.signerDid, subjectType: p.subjectType, subjectRef: p.subjectRef } });
      return ok({ consentId: original.id, revision: original.revision + 1, revocationId: saved.value.id, statement });
    },
  });
  const accept = defineCommand({ name: 'comms.consent.accept', module: MODULE, capability: 'comms.consent.accept', idempotent: true,
    input: z.strictObject({ statement: z.unknown(), provenance: provenanceSchema }),
    async handler(ctx, input) {
      if (!local(ctx)) return err(appError('FORBIDDEN'));
      const parsed = statementSchema.safeParse(input.statement);
      if (!parsed.success) return err(consentErrors.make('COMMS_CONSENT_SIGNATURE_INVALID'));
      const existing = ctx.tx.repo(consentRepo).get(parsed.data.cid);
      const firstSeenAt = existing?.data.receivedAt ?? new Date(ctx.clock.now()).toISOString();
      let statement: ConsentStatement;
      try { statement = await verifyConsentStatement(parsed.data, p => keyFor(p, firstSeenAt)); }
      catch { return err(consentErrors.make('COMMS_CONSENT_SIGNATURE_INVALID')); }
      const valid = validateSubject(ctx, statement.payload, false); if (!valid.ok) return valid;
      if (existing) return ok({ consentId: existing.id, status: existing.data.status });
      if (statement.payload.kind === 'revocation' && access(ctx, statement.payload.subjectType, statement.payload.subjectRef)?.committed) return err(consentErrors.make('COMMS_CONSENT_NOT_REVOCABLE'));
      const saved = store(ctx, statement, input.provenance, false); if (!saved.ok) return saved;
      emit(ctx, saved.value, receivedEvent);
      return ok({ consentId: saved.value.id, status: saved.value.data.status });
    },
  });
  type Verification = { result: 'valid' | 'stale' | 'revoked' | 'conflicted' | 'missing'; consentId?: string; signedAtClaim?: string; clockSuspect?: boolean };
  const verify = defineQuery({ name: 'comms.consent.verify', module: MODULE, capability: 'comms.consent.verify',
    input: z.strictObject({ ...subjectInput, subjectRevisionHash: hashSchema, signerDid: z.string().startsWith('did:key:').max(128), statementKey: statementKeySchema }),
    async handler(ctx, input): Promise<Result<Verification, AppError>> {
      const subject = access(ctx, input.subjectType, input.subjectRef); if (!subject) return err(appError('NOT_FOUND'));
      const page = rowsFor(ctx, input.subjectType, input.subjectRef); if (!page.ok) return page;
      if (page.value.nextCursor) return err(appError('PRECONDITION_FAILED'));
      const records = page.value.items.filter(r => { const p = r.data.statement.payload; return p.signerDid === input.signerDid && p.statementKey === input.statementKey && p.subjectRevisionHash === input.subjectRevisionHash; });
      for (const row of records) {
        try {
          const verified = await verifyConsentStatement(row.data.statement, p => keyFor(p, row.data.receivedAt));
          if (verified.cid !== row.id) return err(consentErrors.make('COMMS_CONSENT_SIGNATURE_INVALID'));
          const valid = validateSubject(ctx, verified.payload, false); if (!valid.ok) return valid;
        } catch { return err(consentErrors.make('COMMS_CONSENT_SIGNATURE_INVALID')); }
      }
      const consent = records.find(r => r.data.statement.payload.kind === 'consent');
      if (!consent) return ok({ result: 'missing' as const });
      const detail = { consentId: consent.id, signedAtClaim: consent.data.statement.payload.signedAtClaim, clockSuspect: consent.data.clockSuspect };
      const revocations = records.filter(r => r.data.statement.payload.kind === 'revocation');
      for (const revocation of revocations) {
        const payload = revocation.data.statement.payload;
        const target = records.find(r => r.id === payload.revokes && r.data.statement.payload.kind === 'consent');
        if (!target || target.data.statement.payload.subjectRevision !== payload.subjectRevision || target.data.statement.payload.statementTextHash !== payload.statementTextHash) return err(consentErrors.make('COMMS_CONSENT_NOT_REVOCABLE'));
      }
      if (revocations.length) return ok({ ...detail, result: 'revoked' as const });
      if (records.some(r => r.data.statement.payload.kind === 'decline')) return ok({ ...detail, result: 'conflicted' as const });
      return ok({ ...detail, result: subject.hash === input.subjectRevisionHash ? 'valid' as const : 'stale' as const });
    },
  });
  const list = defineQuery({ name: 'comms.consent.list_for_subject', module: MODULE, capability: 'comms.consent.read',
    input: z.strictObject({ ...subjectInput, limit: z.int().min(1).max(100).default(100), cursor: z.string().max(2000).optional() }),
    handler(ctx, input) {
      if (!access(ctx, input.subjectType, input.subjectRef)) return err(appError('NOT_FOUND'));
      const page = ctx.tx.repo(consentRepo).query({ where: { subject: subjectKey(input.subjectType, input.subjectRef) }, limit: input.limit, ...(input.cursor ? { cursor: input.cursor } : {}) });
      return page.ok ? ok({ items: page.value.items, ...(page.value.nextCursor ? { nextCursor: page.value.nextCursor } : {}) }) : page;
    },
  });
  return { sign, revoke, accept, verify, list, all: [sign, revoke, accept, verify, list] as const };
}
