import { IDBFactory } from 'fake-indexeddb';
import { expect, it, vi } from 'vitest';
import { createBus, createDeterministicIds, createFakeClock, createRegistry, unwrap } from '../../packages/kernel/src/index.ts';
import { createIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, verifyEnvelope } from '../../packages/federation/src/index.ts';
import { discoveryDefinitions, type PublicListingProjection, type RetainedListing } from '../../packages/discovery/src/index.ts';
import { createLocalIntentStore, createLocalMatchSession, privateIntentRepo } from '../../packages/blindmatch/src/index.ts';
import { openVault, type UnlockedVault, type Vault } from '../../packages/vault/src/index.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'blindmatch private intent recovery passphrase';

async function rawRows(indexedDB: IDBFactory, name: string): Promise<unknown[][]> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(`classrup-vault:${name}`);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  try {
    return await Promise.all([...db.objectStoreNames].map(table => new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction(table).objectStore(table).getAll();
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    })));
  } finally { db.close(); }
}

it('TEST-PS-149-10-001: encrypted local intents match verified public records, restore inactive and erase across reopen', async () => {
  const indexedDB = new IDBFactory();
  const vaults: Vault[] = [];
  const clock = createFakeClock('2026-11-26T12:00:00.000Z');
  const ids = createDeterministicIds({ seed: 149, now: () => clock.now() });
  const open = async (name: string, codecs = productionBackupCodecs) => {
    const vault = await openVault({ name, indexedDB, codecs }); vaults.push(vault); return vault;
  };
  const store = (session: UnlockedVault) => createLocalIntentStore({ storage: session.storage,
    principal: session.principal, clock, isCurrent: () => true, enabled: true });
  const sourceName = 'blindmatch-encrypted-source';
  try {
    const source = await open(sourceName);
    const session = await source.create(passphrase);
    const intents = store(session);
    const created = unwrap(await intents.create({ criteria: { query: 'bicycle', price: { currency: 'CAD', max: '987654321' } },
      expiresAt: '2026-11-27T12:00:00.000Z' }));
    const active = unwrap(await intents.setState({ id: created.id, expectedRevision: created.revision, state: 'active' }));
    const coverage = await session.backupCoverage();
    expect(coverage.recordTypes).toEqual([{ type: privateIntentRepo.type, count: 1 }]);
    expect(coverage.registeredRecordTypes).toContain(privateIntentRepo.type);
    expect(coverage.unsupportedRecordTypes).toEqual([]);
    const raw = JSON.stringify(await rawRows(indexedDB, sourceName));
    for (const privateValue of [created.id, '987654321', 'bicycle', privateIntentRepo.type]) expect(raw).not.toContain(privateValue);

    const peer = await createIdentity('blindmatch public listing peer passphrase');
    const listing: PublicListingProjection = { ownerId: peer.identity.principal, listingId: ids.next(), revision: 1,
      kind: 'sell', title: 'Public bicycle', description: 'A public synthetic bicycle listing.', categoryId: ids.next(),
      condition: 'good', tags: ['bicycle'], locale: 'en', regionCell: 'c2b2', barterOptIn: false,
      availability: 'available', value: { currency: 'CAD', amount: '100' }, expiresAt: active.data.expiresAt };
    const envelope = await signEnvelope(peer.identity, { type: 'classrup.bazaar.listing/v1', payload: listing,
      createdAt: clock.iso(), seq: 1, prev: null });
    const defs = discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now: clock.now() }) });
    const bus = createBus({ registry: createRegistry().add(...defs.all), storage: session.storage, clock, ids,
      authz: { authorize: (actor, _capability, _resource, context) => actor.kind === 'user'
        && actor.id === session.principal && context.tenantId === session.principal ? { allow: true } : { allow: false, code: 'FORBIDDEN' } } });
    const context = { actor: { kind: 'user' as const, id: session.principal, roles: ['member'] }, tenantId: session.principal };
    unwrap(await bus.dispatch(context, defs.retain.name, { envelope }, { idempotencyKey: ids.next() }));
    const loadCandidates = vi.fn(async () => {
      const response = unwrap(await bus.query(context, defs.search.name, { query: '' }));
      return (response.value as { items: RetainedListing[] }).items;
    });
    const matching = createLocalMatchSession({ intents, principal: session.principal, clock, isCurrent: () => true,
      enabled: true, loadCandidates });
    const network = vi.fn(() => { throw new Error('Local matching must not use a network'); });
    vi.stubGlobal('fetch', network);
    try {
      const result = unwrap(await matching.match({ id: active.id, expectedRevision: active.revision }));
      expect(result).toEqual({ mode: 'local', intentRevision: active.revision,
        items: [{ ownerId: listing.ownerId, listingId: listing.listingId, revision: 1, cid: envelope.cid }] });
      expect(JSON.stringify(result)).not.toContain('987654321');
      expect(JSON.stringify(result)).not.toContain('bicycle');
      expect(network).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
    const backup = await session.exportBackup(passphrase);
    expect(JSON.stringify(backup)).not.toContain('987654321');
    expect(unwrap(await intents.read(active.id)).data.state).toBe('active');
    await session.lock();
    const reopened = await open(sourceName);
    const unlocked = await reopened.unlock(passphrase);
    const reopenedIntents = store(unlocked);
    expect(unwrap(await reopenedIntents.read(active.id)).data).toEqual(active.data);
    unwrap(await reopenedIntents.erase({ id: active.id, expectedRevision: active.revision }));
    expect(unwrap(await reopenedIntents.list())).toEqual([]);
    expect((await unlocked.backupCoverage()).recordTypes.some(row => row.type === privateIntentRepo.type)).toBe(false);
    await unlocked.lock();
    const afterEraseVault = await open(sourceName);
    const afterErase = await afterEraseVault.unlock(passphrase);
    expect(await store(afterErase).read(active.id)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    await afterErase.lock();

    // An intentional older backup import restores content but no active authority.
    const restoredVault = await open('blindmatch-restored');
    const restored = await restoredVault.restoreBackup(backup, passphrase);
    const restoredIntents = store(restored);
    const recovered = unwrap(await restoredIntents.read(active.id));
    expect(recovered.data).toEqual({ ...active.data, state: 'draft' });
    const unexpectedLoad = vi.fn(async () => []);
    const restoredMatching = createLocalMatchSession({ intents: restoredIntents, principal: restored.principal,
      clock, isCurrent: () => true, enabled: true, loadCandidates: unexpectedLoad });
    expect(await restoredMatching.match({ id: recovered.id, expectedRevision: recovered.revision }))
      .toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
    expect(unexpectedLoad).not.toHaveBeenCalled();
    await restored.lock();

    const legacyVault = await open('blindmatch-legacy', productionBackupCodecs.filter(codec => codec.type !== privateIntentRepo.type));
    const legacy = await legacyVault.create(passphrase);
    const legacyBackup = await legacy.exportBackup(passphrase); await legacy.lock();
    const legacyDestination = await open('blindmatch-legacy-restored');
    const legacyRestored = await legacyDestination.restoreBackup(legacyBackup, passphrase);
    expect(unwrap(await store(legacyRestored).list())).toEqual([]); await legacyRestored.lock();
  } finally {
    vi.unstubAllGlobals();
    for (const vault of vaults) await vault.close();
  }
}, 60_000);
