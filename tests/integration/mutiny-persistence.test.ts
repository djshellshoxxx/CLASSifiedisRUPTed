import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { canonicalJson, createBus, createRegistry, createFakeClock, createDeterministicIds, type Bus, type Storage, type CommandContext, type IdGen, type Result, type CommandOutcome, type AppError } from '../../packages/kernel/src/index.ts';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { didFromPublicKey, type UnlockedIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, verifyEnvelope, type VerifiedEnvelope } from '../../packages/federation/src/index.ts';
import { bazaarDefinitions, inventoryHoldRepo, ownReservationExists, publicationRepo } from '../../packages/bazaar/src/index.ts';
import { discoveryDefinitions, retainedListingRepo } from '../../packages/discovery/src/index.ts';
import { admitSignedGraph, WANT_TYPE } from '../../packages/mutiny/src/cycle_matching/admission.ts';
import { discoverCycles } from '../../packages/mutiny/src/cycle_matching/index.ts';
import { prepareProposal, CONSENT_TYPE, PROPOSAL_TYPE, RESERVATION_TYPE, WITHDRAWAL_TYPE, type Proposal } from '../../packages/mutiny/src/trade_proposals/index.ts';
import { mutinyDefinitions, coordinationRepo, coordinationSchema, wantRepo, validateCoordinationRecord, normalizeCoordinationRecord } from '../../packages/mutiny/src/trade_proposals/repository.ts';

const NOW = Date.parse('2026-11-09T12:00:00.000Z');
const HOUR = 3600000;
const DAY = 24 * HOUR;
const CATEGORY = '0192f3a4-0000-7000-8000-000000000999';
const openStores = new Set<Storage>();
afterEach(async () => { for (const store of openStores) await store.close(); openStores.clear(); });

// Real Ed25519 keys/signatures. This fixture deliberately does not test passphrase/key encryption.
async function realIdentity(): Promise<UnlockedIdentity> {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
  const principal = didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)));
  let unlocked = true;
  return { principal, sign: async bytes => {
    if (!unlocked) throw new Error('locked');
    return new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, bytes.slice()));
  }, lock() { unlocked = false; } };
}
interface Peer {
  identity: UnlockedIdentity;
  ids: IdGen;
  sign(type: string, payload: unknown, seq?: number, prev?: string | null): Promise<VerifiedEnvelope>;
  command(name: string, input: unknown, key?: string): Promise<Result<CommandOutcome, AppError>>;
  must(name: string, input: unknown): Promise<unknown>;
  ingest(envelope: VerifiedEnvelope): Promise<unknown>;
  record(subjectId: string): Promise<{ revision: number; state: ReturnType<typeof coordinationSchema.parse> } | undefined>;
  listingId: string;
  listing: VerifiedEnvelope;
  readonly storage: Storage;
  restart(): Promise<void>;
}
async function scenario(size: number, failRelease: () => boolean = () => false) {
  const clock = createFakeClock(NOW - HOUR);
  const factory = new IDBFactory();
  const identities = await Promise.all(Array.from({ length: size }, realIdentity));
  const peers: Peer[] = [];
  for (const [index, identity] of identities.entries()) {
    const ids = createDeterministicIds({ seed: index + 41, now: () => clock.now() });
    const name = `review-mutiny-${size}-${index}`;
    let storage = await openIndexedDbStorage({ name, indexedDB: factory, clock });
    openStores.add(storage);
    const context = { actor: { kind: 'user' as const, id: identity.principal, roles: ['member'] }, tenantId: identity.principal };
    const sign = (type: string, payload: unknown, seq = 1, prev: string | null = null) => signEnvelope(identity, { type, payload, seq, prev, createdAt: clock.iso() });
    const definitions = mutinyDefinitions({
      hasLocalReservation(ctx, proposal, principal) {
        const item = proposal.snapshot.legs.find(leg => leg.giverId === principal)?.inventoryItemId;
        return item !== undefined && ownReservationExists(ctx, proposal.snapshot.subjectId, proposal.revisionHash, item, proposal.snapshot.consentDeadline + proposal.snapshot.executionWindowMs);
      },
      async checkFeasibility(ctx, proposal) {
        const publications = ctx.tx.repo(publicationRepo).query({ limit: 500 });
        const retained = ctx.tx.repo(retainedListingRepo).query({ limit: 500 });
        const wants = ctx.tx.repo(wantRepo).query({ limit: 500 });
        if (!publications.ok || !retained.ok || !wants.ok) throw new Error('Repository read failed');
        const graph = await admitSignedGraph([
          ...publications.value.items.map(r => r.data.envelope).filter(e => e['type'] === 'classrup.bazaar.listing/v1' || e['type'] === 'classrup.alpha.tombstone/v1'),
          ...retained.value.items.flatMap(r => r.data.envelopes),
        ], wants.value.items.map(r => r.data.envelope), { now: clock.now(), localPrincipal: identity.principal, optedIn: true, includeUnknownIdentities: true });
        return { revisionHash: proposal.revisionHash, checkedAt: clock.now(), feasible: proposal.snapshot.legs.every(leg => graph.edges.some(edge => canonicalJson(edge) === canonicalJson(leg))) };
      },
      releaseLocalReservations(ctx: CommandContext, subjectId: string) {
        const repo = ctx.tx.repo(inventoryHoldRepo);
        const page = repo.query({ limit: 500 });
        if (!page.ok) throw new Error('Hold read failed');
        for (const hold of page.value.items) {
          if (hold.data.ownerId === identity.principal && hold.data.subjectId === subjectId && hold.data.state === 'active') {
            const result = repo.put(hold.id, { ...hold.data, state: 'released' }, { expectedRevision: hold.revision });
            if (!result.ok) throw new Error('Hold release failed');
          }
        }
        if (failRelease()) throw new Error('Injected release failure after hold mutation');
      },
    });
    const registry = createRegistry().add(...definitions.all, ...bazaarDefinitions({ categoryAllowed: id => id === CATEGORY, signProjection: async (type, payload, seq, prev) => ({ ...await sign(type, payload, seq, prev) }), verifyProjection: e => verifyEnvelope(e, { now: clock.now() }) }).all, ...discoveryDefinitions({ verifyEnvelope: e => verifyEnvelope(e, { now: clock.now() }) }).all);
    function attach(): Bus {
      return createBus({ registry, storage, clock, ids, authz: { authorize: (actor, _cap, _resource, ctx) => actor.kind === 'user' && actor.id === identity.principal && ctx.tenantId === identity.principal ? { allow: true } : { allow: false, code: 'FORBIDDEN' } } });
    }
    let bus = attach();
    async function command(name: string, input: unknown, key: string = ids.next()) {
      return bus.dispatch(context, name, input, { idempotencyKey: key });
    }
    async function must(name: string, input: unknown) {
      const result = await command(name, input);
      if (!result.ok) throw new Error(`${name}: ${JSON.stringify(result.error)}`);
      return result.value.value;
    }
    async function record(subjectId: string) {
      return storage.read(tx => {
        const r = tx.records.get(identity.principal, coordinationRepo.type, subjectId);
        return r ? { revision: r.revision, state: coordinationSchema.parse((r.data as { state: unknown }).state) } : undefined;
      });
    }
    async function ingest(envelope: VerifiedEnvelope) {
      const subjectId = (envelope.payload as { subjectId: string }).subjectId;
      return must('mutiny.coordination.ingest', { envelope, expectedRevision: (await record(subjectId))?.revision ?? 0 });
    }
    const listingId = ids.next();
    await must('bazaar.listing.create', { listingId, kind: 'sell', title: `Item ${index}`, description: `Public item description number ${index}`, categoryId: CATEGORY, condition: 'good', regionCell: 'c2b2q', barterOptIn: true, value: { amount: '100', currency: 'CAD' } });
    const published = await must('bazaar.listing.publish', { listingId, expectedRevision: 1 }) as { envelope: unknown };
    const listing = await verifyEnvelope(published.envelope, { now: clock.now() });
    peers.push({ identity, ids, sign, command, must, ingest, record, listingId, listing, get storage() { return storage; },
      async restart() { await storage.close(); openStores.delete(storage); storage = await openIndexedDbStorage({ name, indexedDB: factory, clock }); openStores.add(storage); bus = attach(); },
    });
  }
  const wants: VerifiedEnvelope[] = [];
  for (const [i, peer] of peers.entries()) {
    wants.push(await peer.sign(WANT_TYPE, { offeringListingCid: peer.listing.cid, requestedListingCid: peers[(i + 1) % size]!.listing.cid, expiresAt: new Date(NOW + 7 * DAY).toISOString() }));
  }
  for (const peer of peers) {
    for (const listing of peers.map(p => p.listing)) await peer.must('discovery.listing.retain', { envelope: listing });
    for (const envelope of wants) await peer.must('mutiny.want.retain', { envelope });
  }
  clock.advance(HOUR);
  const graph = await admitSignedGraph(peers.map(p => p.listing), wants, { now: NOW, localPrincipal: peers[0]!.identity.principal, optedIn: true, includeUnknownIdentities: true });
  const matches = await discoverCycles(graph.edges, { now: NOW, monotonicNow: () => 0 });
  expect(matches.suggestions).toHaveLength(1);
  const coordinator = peers[0]!;
  const proposal = await prepareProposal({ subjectId: coordinator.ids.next(), coordinatorId: coordinator.identity.principal, revisionNo: 1, previousHash: null, legs: matches.suggestions[0]!.legs, createdAt: NOW, consentDeadline: NOW + HOUR, executionWindowMs: DAY }, NOW);
  const opening = await coordinator.sign(PROPOSAL_TYPE, proposal.snapshot);
  for (const peer of peers) await peer.ingest(opening);
  async function reserveAll(p: Proposal = proposal) {
    const reservations: VerifiedEnvelope[] = [];
    const holds: string[] = [];
    for (const peer of peers) {
      const holdId = peer.ids.next(); holds.push(holdId);
      const result = await peer.must('bazaar.inventory.reserve', { listingId: peer.listingId, expectedRevision: 2, holdId, subjectId: p.snapshot.subjectId, revisionHash: p.revisionHash, expiresAt: new Date(p.snapshot.consentDeadline + p.snapshot.executionWindowMs).toISOString() }) as { envelope: unknown };
      reservations.push(await verifyEnvelope(result.envelope, { now: clock.now() }));
    }
    return { reservations, holds };
  }
  async function consents(p: Proposal = proposal) {
    return Promise.all(peers.map(peer => peer.sign(CONSENT_TYPE, { subjectId: p.snapshot.subjectId, revisionHash: p.revisionHash, revisionNo: p.snapshot.revisionNo })));
  }
  async function broadcast(envelopes: readonly VerifiedEnvelope[]) { for (const envelope of envelopes) for (const peer of peers) await peer.ingest(envelope); }
  return { peers, wants, clock, proposal, opening, reserveAll, consents, broadcast };
}

describe('independent durable signed Mutiny verification', () => {
  for (const size of [2, 3, 4]) it(`${size} actual principals retain signed listings/wants, reserve, consent, commit and survive IndexedDB adapter restart`, async () => {
    const f = await scenario(size);
    const { reservations } = await f.reserveAll();
    const consent = await f.consents();
    // Delivery ordering differs from author ordering, and one participant remains offline until last.
    await f.broadcast([...reservations].reverse());
    await f.broadcast(consent.slice(0, -1));
    for (const peer of f.peers) expect((await peer.record(f.proposal.snapshot.subjectId))!.state.status).toBe('proposed');
    await f.peers.at(-1)!.restart();
    await f.broadcast(consent.slice(-1));
    for (const peer of f.peers) {
      expect((await peer.record(f.proposal.snapshot.subjectId))!.state.status).toBe('committed');
      await peer.restart();
      const saved = (await peer.record(f.proposal.snapshot.subjectId))!;
      expect(saved.state.status).toBe('committed');
      const before = saved.state.evidence.length;
      await peer.ingest(consent[0]!);
      expect((await peer.record(f.proposal.snapshot.subjectId))!.state.evidence.length).toBe(before);
    }
  });

  it('rejects unreserved local consent, stale optimistic revisions and mathematically valid outsider consent', async () => {
    const f = await scenario(2); const peer = f.peers[0]!; const subjectId = f.proposal.snapshot.subjectId;
    const consent = (await f.consents())[0]!;
    const before = (await peer.record(subjectId))!;
    const unreserved = await peer.command('mutiny.coordination.ingest', { envelope: consent, expectedRevision: before.revision });
    expect(unreserved.ok).toBe(false);
    const stale = await peer.command('mutiny.coordination.ingest', { envelope: consent, expectedRevision: 0 });
    expect(stale.ok ? '' : stale.error.code).toBe('CONFLICT_REVISION');
    const outsider = await realIdentity();
    const signed = await signEnvelope(outsider, { type: CONSENT_TYPE, payload: consent.payload, seq: 1, prev: null, createdAt: f.clock.iso() });
    const result = await peer.command('mutiny.coordination.ingest', { envelope: signed, expectedRevision: before.revision });
    expect(result.ok).toBe(false);
    expect(await peer.record(subjectId)).toEqual(before);
  });

  it('cannot reserve a local item twice and expiry releases incomplete coordination holds', async () => {
    const f = await scenario(2); const { reservations, holds } = await f.reserveAll();
    await f.broadcast(reservations); const peer = f.peers[0]!;
    const conflict = await peer.command('bazaar.inventory.reserve', { listingId: peer.listingId, expectedRevision: 2, holdId: peer.ids.next(), subjectId: peer.ids.next(), revisionHash: f.proposal.revisionHash, expiresAt: new Date(NOW + 2 * DAY).toISOString() });
    expect(conflict.ok ? '' : conflict.error.code).toBe('CONFLICT_STATE');
    f.clock.advance(HOUR + 1);
    await peer.must('mutiny.coordination.refresh', {});
    expect((await peer.record(f.proposal.snapshot.subjectId))!.state.status).toBe('cancelled');
    const hold = await peer.storage.read(tx => tx.records.get(peer.identity.principal, inventoryHoldRepo.type, holds[0]!));
    expect((hold!.data as { state: string }).state).toBe('released');
  });

  it('proposal revisions invalidate old consent and dropout persists with hold release', async () => {
    const f = await scenario(2); const { reservations, holds } = await f.reserveAll();
    await f.broadcast(reservations); const consent = await f.consents();
    await f.broadcast(consent.slice(0, 1));
    const coordinator = f.peers[0]!;
    const revised = await prepareProposal({ ...f.proposal.snapshot, revisionNo: 2, previousHash: f.proposal.revisionHash, consentDeadline: NOW + 2 * HOUR }, NOW);
    await f.broadcast([await coordinator.sign(PROPOSAL_TYPE, revised.snapshot)]);
    const before = (await coordinator.record(revised.snapshot.subjectId))!;
    expect(before.state.consentCids).toEqual({});
    expect(before.state.reservationCids).toEqual({});
    const stale = await coordinator.command('mutiny.coordination.ingest', { envelope: consent[1], expectedRevision: before.revision });
    expect(stale.ok).toBe(false);
    const withdrawal = await f.peers[1]!.sign(WITHDRAWAL_TYPE, { subjectId: revised.snapshot.subjectId, revisionHash: revised.revisionHash, revisionNo: 2, reason: 'dropout' });
    await f.broadcast([withdrawal]);
    for (const [index, peer] of f.peers.entries()) {
      await peer.restart();
      expect((await peer.record(revised.snapshot.subjectId))!.state.status).toBe('cancelled');
      const hold = await peer.storage.read(tx => tx.records.get(peer.identity.principal, inventoryHoldRepo.type, holds[index]!));
      expect((hold!.data as { state: string }).state).toBe('released');
    }
  });

  it('signed remote double-promises freeze both local subjects and survive restart', async () => {
    const f = await scenario(2); const coordinator = f.peers[0]!; const subjectId = f.proposal.snapshot.subjectId;
    const fork = await prepareProposal({ ...f.proposal.snapshot, subjectId: coordinator.ids.next() }, NOW);
    await coordinator.ingest(await coordinator.sign(PROPOSAL_TYPE, fork.snapshot));
    const remote = f.peers[1]!;
    const itemId = remote.listingId;
    const promises = await Promise.all([f.proposal, fork].map(p => remote.sign(RESERVATION_TYPE, { subjectId: p.snapshot.subjectId, revisionHash: p.revisionHash, giverId: remote.identity.principal, itemId, expiresAt: new Date(NOW + 2 * DAY).toISOString(), holdId: remote.ids.next() })));
    for (const envelope of promises) await coordinator.ingest(envelope);
    for (const id of [subjectId, fork.snapshot.subjectId]) expect((await coordinator.record(id))!.state.status).toBe('frozen');
    await coordinator.restart();
    for (const id of [subjectId, fork.snapshot.subjectId]) expect((await validateCoordinationRecord((await coordinator.record(id))!.state)).status).toBe('frozen');
  });

  it('final consent cannot commit after the actual local inventory hold was released', async () => {
    const f = await scenario(2); const { reservations, holds } = await f.reserveAll();
    await f.broadcast(reservations); const consent = await f.consents();
    await f.broadcast(consent.slice(0, 1));
    const peer = f.peers[0]!;
    await peer.must('bazaar.inventory.release', { holdId: holds[0], expectedRevision: 1 });
    await peer.ingest(consent[1]!);
    expect((await peer.record(f.proposal.snapshot.subjectId))!.state.status).not.toBe('committed');
  });

  it('restore normalization never trusts forged cached commitment or feasibility', async () => {
    const f = await scenario(2); const peer = f.peers[0]!;
    const saved = (await peer.record(f.proposal.snapshot.subjectId))!;
    const forged = { ...saved.state, status: 'committed', committedLocallyAt: NOW, commitFeasibility: { feasible: true, checkedAt: NOW, revisionHash: f.proposal.revisionHash } };
    const restored = await normalizeCoordinationRecord({ ownerId: peer.identity.principal, state: forged });
    expect(restored.state.status).toBe('frozen');
    expect(restored.state.reason).toBe('restore_requires_review');
    expect(restored.state.committedLocallyAt).toBeNull();
    expect(restored.state.commitFeasibility).toBeNull();
    const { reservations } = await f.reserveAll();
    await f.broadcast(reservations); await f.broadcast(await f.consents());
    const committed = (await peer.record(f.proposal.snapshot.subjectId))!.state;
    expect(committed.status).toBe('committed');
    expect((await normalizeCoordinationRecord({ ownerId: peer.identity.principal, state: committed })).state.status).toBe('frozen');
    await peer.restart(); f.clock.advance(HOUR + 1);
    await peer.must('mutiny.coordination.refresh', {});
    expect((await peer.record(f.proposal.snapshot.subjectId))!.state.status).toBe('committed');
  });

  it('previously committed coordination freezes when its actual local reservation disappears', async () => {
    const f = await scenario(2); const { reservations, holds } = await f.reserveAll();
    await f.broadcast(reservations); await f.broadcast(await f.consents());
    const peer = f.peers[0]!;
    await peer.must('bazaar.inventory.release', { holdId: holds[0], expectedRevision: 1 });
    await peer.restart(); await peer.must('mutiny.coordination.refresh', {});
    const state = (await peer.record(f.proposal.snapshot.subjectId))!.state;
    expect(state.status).toBe('frozen');
    expect(state.reason).toBe('local_reservation_lost');
  });

  it('committed coordination freezes after signed reservations expire and releases its hold', async () => {
    const f = await scenario(2); const { reservations, holds } = await f.reserveAll();
    await f.broadcast(reservations); await f.broadcast(await f.consents());
    f.clock.advance(DAY + HOUR + 1);
    const peer = f.peers[0]!;
    await peer.restart(); await peer.must('mutiny.coordination.refresh', {});
    const state = (await peer.record(f.proposal.snapshot.subjectId))!.state;
    expect(state.status).toBe('frozen');
    expect(state.reason).toBe('reservation_expired');
    const hold = await peer.storage.read(tx => tx.records.get(peer.identity.principal, inventoryHoldRepo.type, holds[0]!));
    expect((hold!.data as { state: string }).state).toBe('released');
  });

  it('a signed participant dropout after the consent deadline cancels committed coordination and releases holds', async () => {
    const f = await scenario(2); const { reservations, holds } = await f.reserveAll();
    await f.broadcast(reservations); await f.broadcast(await f.consents());
    f.clock.advance(HOUR + 10);
    const withdrawal = await f.peers[1]!.sign(WITHDRAWAL_TYPE, { subjectId: f.proposal.snapshot.subjectId, revisionHash: f.proposal.revisionHash, revisionNo: 1, reason: 'dropout' });
    await f.broadcast([withdrawal]);
    for (const [index, peer] of f.peers.entries()) {
      await peer.restart();
      expect((await peer.record(f.proposal.snapshot.subjectId))!.state.status).toBe('cancelled');
      const hold = await peer.storage.read(tx => tx.records.get(peer.identity.principal, inventoryHoldRepo.type, holds[index]!));
      expect((hold!.data as { state: string }).state).toBe('released');
    }
  });

  it('a failure after hold release rolls back coordination and inventory together', async () => {
    let releaseFails = false;
    const f = await scenario(2, () => releaseFails); const { reservations, holds } = await f.reserveAll();
    await f.broadcast(reservations); await f.broadcast(await f.consents());
    const peer = f.peers[0]!; const subjectId = f.proposal.snapshot.subjectId;
    const before = (await peer.record(subjectId))!;
    const withdrawal = await f.peers[1]!.sign(WITHDRAWAL_TYPE, { subjectId, revisionHash: f.proposal.revisionHash, revisionNo: 1, reason: 'dropout' });
    releaseFails = true;
    const rejected = await peer.command('mutiny.coordination.ingest', { envelope: withdrawal, expectedRevision: before.revision });
    expect(rejected.ok).toBe(false);
    expect(await peer.record(subjectId)).toEqual(before);
    const hold = await peer.storage.read(tx => tx.records.get(peer.identity.principal, inventoryHoldRepo.type, holds[0]!));
    expect((hold!.data as { state: string }).state).toBe('active');
    releaseFails = false;
    await peer.ingest(withdrawal);
    expect((await peer.record(subjectId))!.state.status).toBe('cancelled');
  });

  it('actual Bazaar tombstone prevents matching after unpublish', async () => {
    const f = await scenario(2); const peer = f.peers[0]!;
    const result = await peer.must('bazaar.listing.unpublish', { listingId: peer.listingId, expectedRevision: 2 }) as { envelope: unknown };
    const graph = await admitSignedGraph([...f.peers.map(p => p.listing), result.envelope], f.wants, { now: NOW, localPrincipal: peer.identity.principal, optedIn: true, includeUnknownIdentities: true });
    expect(graph.edges).toHaveLength(0);
  });
});
