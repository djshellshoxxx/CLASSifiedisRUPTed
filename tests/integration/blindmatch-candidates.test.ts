import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { allowAllAuthz, createBus, createDeterministicIds, createFakeClock, createMemoryStorage,
  createRegistry, unwrap, type Storage } from '../../packages/kernel/src/index.ts';
import { createIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, verifyEnvelope } from '../../packages/federation/src/index.ts';
import { discoveryDefinitions, retainedListingId, retainedListingRepo,
  type PublicListingProjection, type RetainedListing } from '../../packages/discovery/src/index.ts';
import { matchLocalCandidates } from '../../packages/blindmatch/src/index.ts';
import { createLocalCandidateLoader } from '../../apps/pwa/src/blindmatch-candidates.ts';

const principal = 'did:key:synthetic-local-reader';
let peer: Awaited<ReturnType<typeof createIdentity>>;
beforeAll(async () => { peer = await createIdentity('local candidate public evidence fixture passphrase'); });
afterAll(() => { peer.identity.lock(); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

async function fixture(storage: Storage = createMemoryStorage()) {
  const clock = createFakeClock('2026-11-27T12:00:00.000Z');
  const ids = createDeterministicIds({ seed: 150, now: () => clock.now() });
  const projection: PublicListingProjection = { ownerId: peer.identity.principal, listingId: ids.next(), revision: 1,
    kind: 'sell', title: 'Bicycle for local matching', description: 'Public synthetic bicycle listing evidence.',
    categoryId: ids.next(), condition: 'good', tags: ['bicycle'], locale: 'en', regionCell: 'c2b2',
    barterOptIn: false, availability: 'available', value: { currency: 'CAD', amount: '12500' },
    expiresAt: new Date(clock.now() + 86_400_000).toISOString() };
  const envelope = await signEnvelope(peer.identity, { type: 'classrup.bazaar.listing/v1', payload: projection,
    createdAt: clock.iso(), seq: 1, prev: null });
  const defs = discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now: clock.now() }) });
  const bus = createBus({ registry: createRegistry().add(...defs.all), storage, clock, ids, authz: allowAllAuthz });
  const context = { actor: { kind: 'user' as const, id: principal, roles: ['member'] }, tenantId: principal };
  const retain = async (value: unknown) => unwrap(await bus.dispatch(context, defs.retain.name,
    { envelope: value }, { idempotencyKey: ids.next() }));
  await retain(envelope);
  const id = retainedListingId(projection.ownerId, projection.listingId);
  const read = async () => (await storage.read(tx => tx.records.get<RetainedListing>(principal, retainedListingRepo.type, id)))!;
  const replace = async (data: RetainedListing) => {
    const row = await read();
    return unwrap(await storage.transaction(tx => tx.records.put({ tenant: principal, type: retainedListingRepo.type,
      id, data, idx: [data.ownerId, null, null, null], expectedRevision: row.revision, now: clock.now() })));
  };
  const controller = new AbortController();
  let current = true;
  const load = createLocalCandidateLoader({ storage, principal, clock, isCurrent: () => current });
  return { storage, clock, ids, projection, envelope, retain, id, read, replace, controller,
    load: () => load({ signal: controller.signal, limit: 128 }), revoke: () => { current = false; } };
}

describe('BlindMatch authenticated local public-candidate adapter', () => {
  it('reads only the current owner snapshot, verifies real signatures, and neither writes nor uses a network', async () => {
    const f = await fixture();
    try {
      const before = await f.read();
      unwrap(await f.storage.transaction(tx => tx.records.put({ tenant: 'did:key:another-local-owner',
        type: retainedListingRepo.type, id: 'foreign-malformed-row', data: {}, idx: [null, null, null, null],
        expectedRevision: 0, now: f.clock.now() })));
      const transactions = vi.spyOn(f.storage, 'transaction');
      const network = vi.fn(() => { throw new Error('Unexpected network request'); });
      vi.stubGlobal('fetch', network);
      const candidates = await f.load();
      expect(candidates).toEqual([before.data]);
      expect(candidates[0]).not.toBe(before.data);
      expect(transactions.mock.calls.length).toBe(2);
      expect(transactions.mock.calls.every(([, options]) => options?.mode === 'read')).toBe(true);
      expect(network).not.toHaveBeenCalled();
      expect(unwrap(matchLocalCandidates({ query: 'bicycle' }, candidates, { ownerId: principal, now: f.clock.now() })))
        .toEqual([{ ownerId: f.projection.ownerId, listingId: f.projection.listingId, revision: 1, cid: f.envelope.cid }]);
      expect(await f.read()).toEqual(before);
    } finally { await f.storage.close(); }
  });

  it.each(['projection', 'signature', 'revision', 'subject', 'conflict'] as const)('rejects retained %s inconsistent with signed evidence', async field => {
    const f = await fixture();
    try {
      const data = structuredClone((await f.read()).data);
      if (field === 'projection') data.projection!.title = 'Unsigned replacement title';
      if (field === 'signature') {
        const envelope = data.envelopes[0] as { sig: string };
        envelope.sig = (envelope.sig[0] === 'A' ? 'B' : 'A') + envelope.sig.slice(1);
      }
      if (field === 'revision') data.remoteRevision++;
      if (field === 'subject') data.listingId = f.ids.next();
      if (field === 'conflict') data.conflicted = true;
      await f.replace(data);
      await expect(f.load()).rejects.toThrow('Local candidates unavailable');
    } finally { await f.storage.close(); }
  });

  it('authenticates withdrawals and conflicting evidence while the matcher excludes both', async () => {
    const f = await fixture();
    try {
      const conflict = await signEnvelope(peer.identity, { type: 'classrup.bazaar.listing/v1',
        payload: { ...f.projection, title: 'Conflicting bicycle statement' }, createdAt: f.clock.iso(), seq: 2, prev: f.envelope.cid });
      await f.retain(conflict);
      const conflicted = await f.load();
      expect(conflicted[0]?.conflicted).toBe(true);
      expect(unwrap(matchLocalCandidates({}, conflicted, { ownerId: principal, now: f.clock.now() }))).toEqual([]);
      const withdrawnListing = { ...f.projection, listingId: f.ids.next() };
      const listing = await signEnvelope(peer.identity, { type: 'classrup.bazaar.listing/v1', payload: withdrawnListing,
        createdAt: f.clock.iso(), seq: 1, prev: null });
      await f.retain(listing);
      const withdrawal = await signEnvelope(peer.identity, { type: 'classrup.alpha.tombstone/v1',
        payload: { ownerId: withdrawnListing.ownerId, listingId: withdrawnListing.listingId, revision: 2, target: listing.cid, reason: 'owner' },
        createdAt: f.clock.iso(), seq: 2, prev: listing.cid });
      await f.retain(withdrawal);
      const candidates = await f.load();
      expect(candidates).toHaveLength(2);
      expect(candidates.find(row => row.listingId === withdrawnListing.listingId)?.projection).toBeNull();
      expect(unwrap(matchLocalCandidates({}, candidates, { ownerId: principal, now: f.clock.now() }))).toEqual([]);
    } finally { await f.storage.close(); }
  });

  it('rejects overflow before signature work instead of silently truncating retained candidates', async () => {
    const f = await fixture();
    try {
      const data = (await f.read()).data;
      await f.storage.transaction(tx => {
        for (let count = 0; count < 128; count++) {
          const listingId = f.ids.next();
          unwrap(tx.records.put({ tenant: principal, type: retainedListingRepo.type,
            id: retainedListingId(data.ownerId, listingId), data: { ...data, listingId },
            idx: [data.ownerId, null, null, null], expectedRevision: 0, now: f.clock.now() }));
        }
        return { ok: true, value: undefined } as const;
      });
      const verify = vi.spyOn(crypto.subtle, 'verify');
      await expect(f.load()).rejects.toThrow('Local candidates unavailable');
      expect(verify).not.toHaveBeenCalled();
    } finally { await f.storage.close(); }
  });

  it('rejects a revision changed after the authenticated snapshot was read', async () => {
    const f = await fixture();
    try {
      const row = await f.read();
      const originalRead = f.storage.read.bind(f.storage);
      let reads = 0;
      vi.spyOn(f.storage, 'read').mockImplementation(async callback => {
        if (++reads === 2) {
          unwrap(await f.storage.transaction(tx => tx.records.put({ tenant: principal, type: retainedListingRepo.type,
            id: row.id, data: row.data, idx: [row.data.ownerId, null, null, null], expectedRevision: row.revision, now: f.clock.now() })));
        }
        return originalRead(callback);
      });
      await expect(f.load()).rejects.toThrow('Local candidates unavailable');
      expect(reads).toBe(2);
    } finally { await f.storage.close(); }
  });

  it.each(['cancel', 'session-change'] as const)('discards verified evidence on %s during an asynchronous signature check', async reason => {
    const f = await fixture();
    const entered = deferred(), release = deferred();
    const originalVerify = crypto.subtle.verify.bind(crypto.subtle);
    try {
      vi.spyOn(crypto.subtle, 'verify').mockImplementation(async (...args) => {
        entered.resolve();
        await release.promise;
        return originalVerify(...args);
      });
      const result = f.load();
      const rejection = expect(result).rejects.toThrow('Local candidates unavailable');
      await entered.promise;
      if (reason === 'cancel') f.controller.abort(); else f.revoke();
      release.resolve();
      await rejection;
    } finally { release.resolve(); await f.storage.close(); }
  });

  it('rejects a cancelled or replaced session before opening a storage read', async () => {
    const f = await fixture();
    try {
      const read = vi.spyOn(f.storage, 'read');
      f.revoke();
      await expect(f.load()).rejects.toThrow('Local candidates unavailable');
      f.controller.abort();
      await expect(f.load()).rejects.toThrow('Local candidates unavailable');
      expect(read).not.toHaveBeenCalled();
    } finally { await f.storage.close(); }
  });
});
