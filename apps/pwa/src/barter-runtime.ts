import { canonicalJson, defineQuery, defineCommand, appError, err, z, type ReadScope, type RepoDef, type StoredRecord, type CommandContext } from '../../../packages/kernel/src/index.ts';
import { ok } from '../../../packages/kernel/src/index.ts';
import { listingRepo, publicationRepo, inventoryHoldRepo, ownReservationExists, releaseSubjectReservations } from '../../../packages/bazaar/src/index.ts';
import { retainedListingRepo } from '../../../packages/discovery/src/index.ts';
import { signEnvelope, verifyEnvelope } from '../../../packages/federation/src/index.ts';
import { backupCodec, type UnlockedVault } from '../../../packages/vault/src/index.ts';
import { coordinationRepo, wantRepo, mutinyDefinitions, validateCoordinationRecord, normalizeCoordinationRecord, validateWantRecord, parseWant, WANT_TYPE, CONSENT_TYPE, admitSignedGraph, type Proposal } from '../../../packages/mutiny/src/index.ts';

function records<T, K extends string>(scope: ReadScope, repo: RepoDef<T, K>, maximum: number): StoredRecord<T>[] {
  const output: StoredRecord<T>[] = [];
  let cursor: string | undefined;
  do {
    const page = scope.repo(repo).query({ limit: 500, ...(cursor ? { cursor } : {}) });
    if (!page.ok) throw new Error('Could not read barter records');
    output.push(...page.value.items);
    if (output.length > maximum) throw new Error('Barter record limit exceeded');
    cursor = page.value.nextCursor;
  } while (cursor);
  return output;
}
export function barterInputs(scope: ReadScope) {
  const listings = records(scope, listingRepo, 2000);
  const publications = records(scope, publicationRepo, 4000);
  const retained = records(scope, retainedListingRepo, 2000);
  const wants = records(scope, wantRepo, 500);
  const holds = records(scope, inventoryHoldRepo, 10000);
  const listingStatements = [
    ...publications.map(r => r.data.envelope).filter(e => e.type === 'classrup.bazaar.listing/v1' || e.type === 'classrup.alpha.tombstone/v1'),
    ...retained.flatMap(r => r.data.envelopes),
  ];
  return { listings, retained, wants, holds, listingStatements, wantStatements: wants.map(r => r.data.envelope) };
}
export type BarterInputs = ReturnType<typeof barterInputs>;

export interface MatchingPolicy { readonly enabled: boolean; readonly blockedOwners: readonly string[] }
async function feasibility(ctx: CommandContext, proposal: Proposal, principal: string, policy: MatchingPolicy) {
  if (!policy.enabled) return { revisionHash: proposal.revisionHash, checkedAt: ctx.clock.now(), feasible: false };
  const input = barterInputs(ctx.tx);
  const graph = await admitSignedGraph(input.listingStatements, input.wantStatements, { now: ctx.clock.now(), localPrincipal: principal, optedIn: true, includeUnknownIdentities: true, blockedOwners: policy.blockedOwners });
  const edges = new Set(graph.edges.map(e => canonicalJson(e)));
  const localLeg = proposal.snapshot.legs.find(leg => leg.giverId === principal);
  const localListing = localLeg && input.listings.find(r => r.id === localLeg.inventoryItemId);
  const ownItemUsable = !!localLeg && !!localListing && localListing.data.ownerId === principal && localListing.data.status === 'published'
    && localListing.data.onHand === 1 && localListing.data.barterOptIn && localListing.data.publicationCid === localLeg.listingCid
    && Date.parse(localListing.data.expiresAt ?? '') >= proposal.snapshot.consentDeadline + proposal.snapshot.executionWindowMs
    && ownReservationExists(ctx, proposal.snapshot.subjectId, proposal.revisionHash, localLeg.inventoryItemId, proposal.snapshot.consentDeadline + proposal.snapshot.executionWindowMs)
    && !input.holds.some(r => r.data.listingId === localLeg.inventoryItemId && r.data.state === 'active' && Date.parse(r.data.expiresAt) > ctx.clock.now() && (r.data.subjectId !== proposal.snapshot.subjectId || r.data.revisionHash !== proposal.revisionHash));
  return { revisionHash: proposal.revisionHash, checkedAt: ctx.clock.now(), feasible: ownItemUsable && proposal.snapshot.legs.every(leg => edges.has(canonicalJson(leg))) };
}
export function createBarterRuntime(session: Pick<UnlockedVault, 'principal' | 'identity'>) {
  const principal = session.principal;
  let policy: MatchingPolicy = { enabled: false, blockedOwners: [] };
  const domains = mutinyDefinitions({
    hasLocalReservation(ctx, proposal, actor) {
      const leg = proposal.snapshot.legs.find(l => l.giverId === actor);
      return actor === principal && !!leg && ownReservationExists(ctx, proposal.snapshot.subjectId, proposal.revisionHash, leg.inventoryItemId, proposal.snapshot.consentDeadline + proposal.snapshot.executionWindowMs);
    },
    checkFeasibility: (ctx, proposal) => feasibility(ctx, proposal, principal, policy),
    releaseLocalReservations(ctx, subjectId) {
      const result = releaseSubjectReservations(ctx, subjectId);
      if (!result.ok) throw new Error('Could not release local reservations');
    },
  });
  const consent = defineCommand({ name: 'mutiny.alpha.consent', module: 'F02.S03.M01', capability: 'mutiny.coordination.ingest', idempotent: true,
    input: z.strictObject({ subjectId: z.string().min(1).max(512), revisionHash: z.string().min(1).max(512), expectedRevision: z.int().positive() }),
    async handler(ctx, input) {
      if (ctx.actor.kind !== 'user' || ctx.actor.id !== principal || !policy.enabled) return err(appError('FORBIDDEN'));
      const record = ctx.tx.repo(coordinationRepo).get(input.subjectId);
      if (!record || record.data.ownerId !== principal || record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      const state = await validateCoordinationRecord(record.data.state);
      if (state.status !== 'proposed' || state.proposal.revisionHash !== input.revisionHash || state.proposal.snapshot.consentDeadline <= ctx.clock.now()) return err(appError('CONFLICT_STATE'));
      if (!(await feasibility(ctx, state.proposal, principal, policy)).feasible) return err(appError('PRECONDITION_FAILED'));
      const envelope = await signEnvelope(session.identity, { type: CONSENT_TYPE, createdAt: new Date(ctx.clock.now()).toISOString(), seq: 1, prev: null, payload: { subjectId: input.subjectId, revisionHash: input.revisionHash, revisionNo: state.proposal.snapshot.revisionNo } });
      const saved = await domains.ingest.handler(ctx, { envelope, expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved;
      return ok({ envelope, coordination: saved.value });
    },
  });
  const inputs = defineQuery({ name: 'mutiny.alpha.inputs', module: 'F02.S02.M04', capability: 'mutiny.coordination.read', input: z.strictObject({}), handler(ctx) { return ok(barterInputs(ctx.tx)); } });
  return { definitions: [...domains.all, inputs, consent], setMatchingPolicy(next: MatchingPolicy) {
    if (typeof next.enabled !== 'boolean' || next.blockedOwners.length > 2000) throw new Error('Invalid matching policy');
    policy = { enabled: next.enabled, blockedOwners: [...next.blockedOwners] };
  } };
}

/** Backup validation is mandatory, even for locally encrypted signed archives. */
export const barterCodecs = [
  { ...backupCodec(wantRepo), async restoreData(input: unknown, principal: string) {
    const data = wantRepo.schema.parse(input);
    if (data.ownerId !== principal) throw new Error('Backup want belongs to another local principal');
    return data;
  }, async validate(input: unknown) {
    const data = wantRepo.schema.parse(input);
    const envelope = await verifyEnvelope(data.envelope, { expectedType: WANT_TYPE, now: Math.max(Date.now(), data.receivedAtLocal) });
    parseWant(envelope.payload);
  } },
  { ...backupCodec(coordinationRepo), async restoreData(input: unknown, principal: string) {
    const data = coordinationRepo.schema.parse(input);
    if (data.ownerId !== principal) throw new Error('Backup coordination belongs to another local principal');
    return normalizeCoordinationRecord(data);
  }, async validate(input: unknown) {
    const data = coordinationRepo.schema.parse(input);
    const state = await validateCoordinationRecord(data.state);
    if (!state.proposal.snapshot.legs.some(leg => leg.giverId === data.ownerId)) throw new Error('Backup coordination owner is not a participant');
  } },
];
