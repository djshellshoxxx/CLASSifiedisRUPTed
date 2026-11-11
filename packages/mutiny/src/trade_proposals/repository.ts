import { appError, defineCommand, defineEvent, defineQuery, defineRepo, err, ok, z, type CommandContext } from '@classrup/kernel';
import { verifyEnvelope, type VerifiedEnvelope } from '@classrup/federation';
import { WANT_TYPE, parseWant } from '../cycle_matching/admission.ts';
import { CONSENT_TYPE, PROPOSAL_TYPE, conflictingSubjects, evaluateCoordination, freezeConflict, ingestCoordination, openCoordination, reviseCoordination, type CoordinationState, type Feasibility, type Proposal } from './index.ts';

const safeInteger = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const identifier = z.string().min(1).max(512);
const edge = z.strictObject({ giverId: identifier, receiverId: identifier, inventoryItemId: identifier, listingCid: identifier, wantCid: identifier, receiverOfferingListingCid: identifier.optional(), valueMinor: z.string().regex(/^(0|[1-9][0-9]{0,29})$/), currency: z.string().regex(/^[A-Z]{3}$/), distanceBucket: z.int().min(0).max(4), wantCreatedAt: safeInteger });
const envelopeSchema = z.strictObject({ v: z.literal(1), type: identifier, cid: identifier, author: identifier, createdAt: identifier, seq: safeInteger, prev: identifier.nullable(), payload: z.unknown(), ext: z.record(z.string(), z.unknown()), sig: identifier });
export const coordinationSchema = z.strictObject({
  proposal: z.strictObject({ snapshot: z.strictObject({ subjectId: identifier, coordinatorId: identifier, revisionNo: z.int().min(1).max(20), previousHash: identifier.nullable(), legs: z.array(edge).min(2).max(8), createdAt: safeInteger, consentDeadline: safeInteger, executionWindowMs: safeInteger }), revisionHash: identifier }),
  status: z.enum(['proposed', 'committed', 'cancelled', 'declined', 'frozen']), reason: z.string().max(100).nullable(),
  evidence: z.array(z.strictObject({ envelope: envelopeSchema, receivedAtLocal: safeInteger })).min(1).max(200),
  consentCids: z.record(z.string(), identifier), reservationCids: z.record(z.string(), identifier), lastObservedAt: safeInteger, committedLocallyAt: safeInteger.nullable(), commitFeasibility: z.strictObject({ revisionHash: identifier, checkedAt: safeInteger, feasible: z.boolean() }).nullable(),
});
const recordSchema = z.strictObject({ ownerId: identifier, state: coordinationSchema });
export const coordinationRepo = defineRepo({ type: 'mutiny.coordination', schema: recordSchema, indexes: { owner: d => d.ownerId } });
export const wantRepo = defineRepo({ type: 'mutiny.want', schema: z.strictObject({ ownerId: identifier, envelope: envelopeSchema, receivedAtLocal: safeInteger }), indexes: { author: d => d.envelope.author } });
const changed = defineEvent('mutiny.coordination.changed', 1, 'P2', z.strictObject({ subjectId: identifier, status: identifier }));
const wantRetained = defineEvent('mutiny.want.retained', 1, 'P2', z.strictObject({ cid: identifier }));
export interface MutinyOptions {
  /** Check the actual local inventory inside this same kernel transaction, never a UI boolean. */
  readonly hasLocalReservation: (ctx: CommandContext, proposal: Proposal, principal: string) => boolean;
  /** Fresh local signed-projection rechecking; a caller-supplied report cannot commit a cycle. */
  readonly checkFeasibility: (ctx: CommandContext, proposal: Proposal) => Promise<Feasibility>;
  /** Release own holds in this same transaction when coordination terminates. */
  readonly releaseLocalReservations: (ctx: CommandContext, subjectId: string) => void;
}
/** Reverify durable evidence before trusting cached state; imported backups cannot turn fake signatures into consent. */
async function reconstructCoordination(input: unknown, trustLocalVerdict: boolean): Promise<CoordinationState> {
  const parsed = coordinationSchema.parse(input);
  const evidence = [];
  for (const entry of parsed.evidence) {
    const envelope = await verifyEnvelope(entry.envelope, { now: Math.max(parsed.lastObservedAt, entry.receivedAtLocal) });
    evidence.push({ envelope, receivedAtLocal: entry.receivedAtLocal });
  }
  // Rebuild the proposal/head from signed coordinator evidence, not the untrusted cached snapshot.
  const revisions = evidence.filter(e => e.envelope.type === PROPOSAL_TYPE);
  if (!revisions[0]) throw new TypeError('Missing proposal evidence');
  let state = await openCoordination(revisions[0].envelope, parsed.proposal.snapshot.coordinatorId, revisions[0].receivedAtLocal);
  function replayCommit(): void {
    if (trustLocalVerdict && parsed.committedLocallyAt !== null && parsed.commitFeasibility && state.status === 'proposed' && state.lastObservedAt <= parsed.committedLocallyAt) {
      state = evaluateCoordination(state, parsed.commitFeasibility, parsed.committedLocallyAt);
    }
  }
  for (const entry of evidence.slice(1)) {
    if (entry.envelope.type === PROPOSAL_TYPE) state = await reviseCoordination(state, entry.envelope, entry.receivedAtLocal);
    else state = await ingestCoordination(state, entry.envelope, entry.receivedAtLocal);
    replayCommit();
  }
  replayCommit();
  if (trustLocalVerdict && parsed.committedLocallyAt !== null && state.committedLocallyAt === null) throw new TypeError('Unsupported cached commitment');
  if (state.proposal.revisionHash !== parsed.proposal.revisionHash) throw new TypeError('Cached proposal mismatch');
  // Local conflicts/terminal clock decisions are retained; committed status must be freshly re-evaluated.
  if (parsed.status === 'frozen') state = freezeConflict(state);
  // Restore cannot prove historical feasibility. Keep expired previously committed exchanges frozen for explicit recovery.
  if (!trustLocalVerdict && parsed.committedLocallyAt !== null && parsed.status === 'committed') state = { ...state, status: 'frozen', reason: 'restore_requires_review', committedLocallyAt: null, commitFeasibility: null };
  const noCommit: Feasibility = { revisionHash: state.proposal.revisionHash, feasible: false, checkedAt: parsed.lastObservedAt };
  return evaluateCoordination(state, noCommit, parsed.lastObservedAt);
}
export function mutinyDefinitions(options: MutinyOptions) {
  const retainWant = defineCommand({ name: 'mutiny.want.retain', module: 'F02.S02.M04', capability: 'mutiny.want.retain', idempotent: true,
    input: z.strictObject({ envelope: z.unknown() }),
    async handler(ctx, input) {
      if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
      try {
        const envelope = await verifyEnvelope(input.envelope, { expectedType: WANT_TYPE, now: ctx.clock.now() });
        const want = parseWant(envelope.payload);
        if (Date.parse(want.expiresAt) <= ctx.clock.now()) return err(appError('PRECONDITION_FAILED'));
        const repo = ctx.tx.repo(wantRepo);
        const previous = repo.get(envelope.cid);
        if (previous) return ok(previous);
        const count = repo.query({ limit: 500 });
        if (!count.ok) return count;
        if (count.value.items.length >= 500 || count.value.nextCursor) return err(appError('PRECONDITION_FAILED'));
        const stored = repo.put(envelope.cid, { ownerId: ctx.actor.id, envelope, receivedAtLocal: ctx.clock.now() }, { expectedRevision: 0 });
        if (!stored.ok) return stored;
        ctx.emit(wantRetained, { aggregate: { type: 'want', id: envelope.cid }, revision: stored.value.revision, payload: { cid: envelope.cid } });
        return ok(stored.value);
      } catch { return err(appError('VALIDATION_FAILED')); }
    },
  });
  const ingest = defineCommand({ name: 'mutiny.coordination.ingest', module: 'F02.S03.M01', capability: 'mutiny.coordination.ingest', idempotent: true,
    input: z.strictObject({ envelope: z.unknown(), expectedRevision: z.int().min(0) }),
    async handler(ctx, input) {
      if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
      try {
        const envelope = await verifyEnvelope(input.envelope, { now: ctx.clock.now() });
        const payload = envelope.payload as Record<string, unknown>;
        if (!payload || typeof payload !== 'object' || typeof payload.subjectId !== 'string') return err(appError('VALIDATION_FAILED'));
        const repo = ctx.tx.repo(coordinationRepo);
        const previous = repo.get(payload.subjectId);
        if ((previous?.revision ?? 0) !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
        if (previous && previous.data.ownerId !== ctx.actor.id) return err(appError('NOT_FOUND'));
        const all = repo.query({ where: { owner: ctx.actor.id }, limit: 500 });
        if (!all.ok) return all;
        if (all.value.nextCursor || (!previous && all.value.items.length >= 100)) return err(appError('PRECONDITION_FAILED'));
        if (!previous && all.value.items.filter(r => ['proposed', 'committed'].includes(r.data.state.status)).length >= 5) return err(appError('PRECONDITION_FAILED'));
        let state: CoordinationState;
        if (!previous) state = await openCoordination(envelope, ctx.actor.id, ctx.clock.now());
        else {
          const before = await reconstructCoordination(previous.data.state, true);
          if (envelope.author === ctx.actor.id && envelope.type === CONSENT_TYPE && !options.hasLocalReservation(ctx, before.proposal, ctx.actor.id)) return err(appError('PRECONDITION_FAILED'));
          state = envelope.type === PROPOSAL_TYPE ? await reviseCoordination(before, envelope, ctx.clock.now()) : await ingestCoordination(before, envelope, ctx.clock.now());
        }
        if (state.evidence.length > 200) return err(appError('PRECONDITION_FAILED'));
        const report = await options.checkFeasibility(ctx, state.proposal);
        const ownsHold = options.hasLocalReservation(ctx, state.proposal, ctx.actor.id);
        if (state.status === 'committed' && !ownsHold) state = { ...freezeConflict(state), reason: 'local_reservation_lost' };
        state = evaluateCoordination(state, { ...report, feasible: report.feasible && ownsHold }, ctx.clock.now());
        const others = await Promise.all(all.value.items.filter(r => r.id !== payload.subjectId).map(async r => ({ record: r, state: await reconstructCoordination(r.data.state, true) })));
        const conflicts = new Set(conflictingSubjects([state, ...others.map(r => r.state)], ctx.clock.now()));
        if (conflicts.has(state.proposal.snapshot.subjectId)) state = freezeConflict(state);
        for (const other of others) {
          if (!conflicts.has(other.record.id)) continue;
          const frozen = freezeConflict(other.state);
          const saved = repo.put(other.record.id, { ownerId: ctx.actor.id, state: coordinationSchema.parse(frozen) }, { expectedRevision: other.record.revision });
          if (!saved.ok) return saved;
          options.releaseLocalReservations(ctx, other.record.id);
          ctx.emit(changed, { aggregate: { type: 'coordination', id: other.record.id }, revision: saved.value.revision, payload: { subjectId: other.record.id, status: frozen.status } });
        }
        const saved = repo.put(state.proposal.snapshot.subjectId, { ownerId: ctx.actor.id, state: coordinationSchema.parse(state) }, { expectedRevision: input.expectedRevision });
        if (!saved.ok) return saved;
        if (['cancelled', 'declined', 'frozen'].includes(state.status)) options.releaseLocalReservations(ctx, state.proposal.snapshot.subjectId);
        ctx.emit(changed, { aggregate: { type: 'coordination', id: saved.value.id }, revision: saved.value.revision, payload: { subjectId: saved.value.id, status: state.status } });
        return ok(saved.value);
      } catch { return err(appError('VALIDATION_FAILED')); }
    },
  });
  const refresh = defineCommand({ name: 'mutiny.coordination.refresh', module: 'F02.S03.M01', capability: 'mutiny.coordination.ingest', idempotent: true,
    input: z.strictObject({}),
    async handler(ctx) {
      if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
      try {
        const repo = ctx.tx.repo(coordinationRepo);
        const all = repo.query({ where: { owner: ctx.actor.id }, limit: 100 });
        if (!all.ok) return all;
        if (all.value.nextCursor) return err(appError('PRECONDITION_FAILED'));
        const refreshed = [];
        for (const record of all.value.items) {
          const state = await reconstructCoordination(record.data.state, true);
          const report = await options.checkFeasibility(ctx, state.proposal);
          const ownsHold = options.hasLocalReservation(ctx, state.proposal, ctx.actor.id);
          const checked = evaluateCoordination(state, { ...report, feasible: report.feasible && ownsHold }, ctx.clock.now());
          const updated = checked.status === 'committed' && !ownsHold ? { ...freezeConflict(checked), reason: 'local_reservation_lost' } : checked;
          refreshed.push({ record, state: updated });
        }
        const conflicts = new Set(conflictingSubjects(refreshed.map(r => r.state), ctx.clock.now()));
        for (const item of refreshed) {
          const state = conflicts.has(item.record.id) ? freezeConflict(item.state) : item.state;
          const saved = repo.put(item.record.id, { ownerId: ctx.actor.id, state: coordinationSchema.parse(state) }, { expectedRevision: item.record.revision });
          if (!saved.ok) return saved;
          if (['cancelled', 'declined', 'frozen'].includes(state.status)) options.releaseLocalReservations(ctx, item.record.id);
          ctx.emit(changed, { aggregate: { type: 'coordination', id: item.record.id }, revision: saved.value.revision, payload: { subjectId: item.record.id, status: state.status } });
        }
        return ok({ refreshed: refreshed.length });
      } catch { return err(appError('VALIDATION_FAILED')); }
    },
  });
  const list = defineQuery({ name: 'mutiny.coordination.list', module: 'F02.S03.M01', capability: 'mutiny.coordination.read', input: z.strictObject({}),
    handler(ctx) { if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN')); return ctx.tx.repo(coordinationRepo).query({ where: { owner: ctx.actor.id }, limit: 100 }); },
  });
  const listWants = defineQuery({ name: 'mutiny.want.list', module: 'F02.S02.M04', capability: 'mutiny.want.read', input: z.strictObject({}),
    handler(ctx) { if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN')); return ctx.tx.repo(wantRepo).query({ limit: 500 }); },
  });
  return { retainWant, ingest, refresh, list, listWants, all: [retainWant, ingest, refresh, list, listWants] as const };
}

/** Backup codec normalization must persist this returned value, never just discard it after validation. */
export async function normalizeCoordinationRecord(input: unknown): Promise<z.output<typeof recordSchema>> {
  const record = recordSchema.parse(input);
  const state = await validateCoordinationRecord(record.state);
  return { ownerId: record.ownerId, state: coordinationSchema.parse(state) };
}
export async function validateWantRecord(input: unknown): Promise<void> {
  const record = wantRepo.schema.parse(input);
  const envelope = await verifyEnvelope(record.envelope, { expectedType: WANT_TYPE, now: record.receivedAtLocal });
  parseWant(envelope.payload);
}

/** Restore boundary: cached commit feasibility is not authority; previous commitments freeze for explicit recovery. */
export function validateCoordinationRecord(input: unknown): Promise<CoordinationState> {
  return reconstructCoordination(input, false);
}
