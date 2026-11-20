import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { allowAllAuthz, createBus, createDeterministicIds, createFakeClock, createMemoryStorage, createRegistry } from '../../../../../packages/kernel/src/index.ts';
import { createIdentity, unseal } from '../../../../../packages/identity/src/index.ts';
import { signEnvelope, strictCanonicalJson, verifyEnvelope } from '../../../../../packages/federation/src/index.ts';
import { bazaarDefinitions, inventoryHoldRepo, listingRepo, listingRevisionId, listingRevisionRepo, publicationRepo, validateListingRevision, validatePublicationRecord } from '../../../../../packages/bazaar/src/index.ts';
import { discoveryDefinitions, retainedListingId, retainedListingRepo, validateRetainedRecord } from '../../../../../packages/discovery/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../../../../packages/vault/src/index.ts';
import { publicationBackupCodec } from '../../../../../apps/pwa/src/publication-backup.ts';
import { retainedBackupCodec } from '../../../../../apps/pwa/src/retained-backup.ts';

// Positive compatibility evidence only: real domain commands, signatures and memory storage.
// The former target codec definitions below are copied from this identified source.
const baseline = 'eeee923adbd4dee3634898d035c74072803ea2f0';
const cwd = fileURLToPath(new URL('../../../../../', import.meta.url));
const oldMain = execFileSync('git', ['show', `${baseline}:apps/pwa/src/main.ts`], { cwd, encoding: 'utf8' });
assert.ok(oldMain.includes('{ ...backupCodec(publicationRepo), validate: (input: unknown) => validatePublicationRecord(input, verifyEnvelope) }'));
assert.ok(oldMain.includes('{ ...backupCodec(retainedListingRepo), validate: (input: unknown) => validateRetainedRecord(input, verifyEnvelope) }'));
const supportCodecs = [
  { ...backupCodec(listingRepo), async restoreData(input, principal) {
    const data = listingRepo.schema.parse(input);
    assert.equal(data.ownerId, principal);
    return data;
  } },
  { ...backupCodec(listingRevisionRepo), recordId(input) {
    const data = listingRevisionRepo.schema.parse(input);
    return listingRevisionId(data.listingId, data.revisionNo);
  }, validate: validateListingRevision, async restoreData(input, principal) {
    const data = listingRevisionRepo.schema.parse(input);
    assert.equal(data.ownerId, principal);
    return data;
  } },
  { ...backupCodec(inventoryHoldRepo), async restoreData(input, principal) {
    const data = inventoryHoldRepo.schema.parse(input);
    assert.equal(data.ownerId, principal);
    return data;
  } },
];
const formerCodecs = [...supportCodecs,
  { ...backupCodec(publicationRepo), validate: input => validatePublicationRecord(input, verifyEnvelope) },
  { ...backupCodec(retainedListingRepo), validate: input => validateRetainedRecord(input, verifyEnvelope) },
];
const currentCodecs = [...supportCodecs, publicationBackupCodec, retainedBackupCodec];
const source = vaultFromStorage(createMemoryStorage(), formerCodecs);
const restoredVault = vaultFromStorage(createMemoryStorage(), currentCodecs);
const roundTripVault = vaultFromStorage(createMemoryStorage(), currentCodecs);
const passphrase = 'positive codec compatibility example passphrase';
const checkMessage = new TextEncoder().encode('codec compatibility signing identity');
let peer;
let completed = 0;
const passed = name => { completed++; console.log(`PASS ${completed}: ${name}`); };
const ordered = rows => [...rows].sort((a, b) => `${a.type}/${a.id}`.localeCompare(`${b.type}/${b.id}`));
const allRows = session => session.storage.read(tx => ordered(currentCodecs.flatMap(codec =>
  tx.records.query({ tenant: session.principal, type: codec.type, filters: [], orderSlot: 0, dir: 'asc', limit: 100 }))));
const publicationRows = (session, listingId) => session.storage.read(tx => tx.records.query({
  tenant: session.principal, type: publicationRepo.type,
  filters: [{ slot: publicationRepo.slots.listing, op: 'eq', value: listingId }], orderSlot: 0, dir: 'asc', limit: 20,
}));
const retainedRows = (session, ownerId) => session.storage.read(tx => tx.records.query({
  tenant: session.principal, type: retainedListingRepo.type,
  filters: [{ slot: retainedListingRepo.slots.owner, op: 'eq', value: ownerId }], orderSlot: 0, dir: 'asc', limit: 20,
}));
try {
  const session = await source.create(passphrase);
  peer = await createIdentity('positive peer evidence example passphrase');
  const clock = createFakeClock(Date.now());
  const ids = createDeterministicIds({ seed: 404, now: () => clock.now() });
  const categoryId = ids.next();
  const listings = bazaarDefinitions({ categoryAllowed: id => id === categoryId,
    signProjection: (type, payload, seq, prev) => signEnvelope(session.identity, { type, payload, seq, prev, createdAt: clock.iso() }),
    verifyProjection: verifyEnvelope,
  });
  const registry = createRegistry().add(...listings.all, ...discoveryDefinitions({ verifyEnvelope }).all);
  const bus = createBus({ registry, storage: session.storage, clock, ids, authz: allowAllAuthz });
  const context = { actor: { kind: 'user', id: session.principal, roles: ['member'] }, tenantId: session.principal };
  const command = async (name, input) => {
    const result = await bus.dispatch(context, name, input, { idempotencyKey: ids.next() });
    assert.equal(result.ok, true, `${name} should accept ordinary valid input`);
    return result.value.value;
  };
  const listingId = ids.next();
  const created = await command('bazaar.listing.create', { listingId, kind: 'giveaway', title: 'Winter bicycle',
    description: 'A useful bicycle for winter commuting.', categoryId, condition: 'good', tags: [], locale: 'en',
    regionCell: 'c2b2', barterOptIn: true, privateNotes: 'Owner note retained by normal backup.' });
  const published = await command('bazaar.listing.publish', { listingId, expectedRevision: created.revision, expiryDays: 7 });
  const reserved = await command('bazaar.inventory.reserve', { listingId, expectedRevision: published.listing.revision,
    holdId: ids.next(), subjectId: ids.next(), revisionHash: 'ordinary-revision-evidence', expiresAt: new Date(clock.now() + 86400000).toISOString() });
  await command('bazaar.inventory.release', { holdId: reserved.hold.id, expectedRevision: reserved.hold.revision });
  const unpublished = await command('bazaar.listing.unpublish', { listingId, expectedRevision: published.listing.revision });
  const localPublications = await publicationRows(session, listingId);
  assert.equal(localPublications.length, 3);
  assert.deepEqual(new Set(localPublications.map(row => row.data.envelope.type)), new Set([
    'classrup.bazaar.listing/v1', 'classrup.alpha.reservation/v1', 'classrup.alpha.tombstone/v1',
  ]));
  for (const row of localPublications) {
    assert.equal(row.id, row.data.envelope.cid);
    assert.equal(publicationBackupCodec.recordId(row.data), row.id);
    assert.deepEqual(publicationBackupCodec.indexes(row.data), [listingId, null, null, null]);
    await publicationBackupCodec.validate(row.data);
  }
  passed('normal publish, reservation, release and withdrawal preserve CID keys and publication index');

  for (const withdraw of [false, true]) {
    const peerListingId = ids.next();
    const projection = { listingId: peerListingId, ownerId: peer.identity.principal, revision: 1, kind: 'giveaway',
      title: withdraw ? 'Small reading lamp' : 'Wooden side table', description: 'An ordinary item available from a local peer.',
      categoryId, condition: 'good', tags: [], locale: 'en', regionCell: 'c2b2', barterOptIn: true,
      availability: 'available', expiresAt: new Date(clock.now() + 86400000).toISOString() };
    const envelope = await signEnvelope(peer.identity, { type: 'classrup.bazaar.listing/v1', payload: projection,
      createdAt: clock.iso(), seq: 1, prev: null });
    await command('discovery.listing.retain', { envelope });
    if (withdraw) {
      const tombstone = await signEnvelope(peer.identity, { type: 'classrup.alpha.tombstone/v1',
        payload: { ownerId: peer.identity.principal, listingId: peerListingId, revision: 2, target: envelope.cid, reason: 'owner' },
        createdAt: clock.iso(), seq: 2, prev: envelope.cid });
      await command('discovery.listing.retain', { envelope: tombstone });
    }
  }
  const peerRows = await retainedRows(session, peer.identity.principal);
  assert.equal(peerRows.length, 2);
  assert.equal(peerRows.filter(row => row.data.projection === null).length, 1);
  for (const row of peerRows) {
    assert.equal(row.id, `${row.data.ownerId}/${row.data.listingId}`);
    assert.equal(row.id, retainedListingId(row.data.ownerId, row.data.listingId));
    assert.equal(retainedBackupCodec.recordId(row.data), row.id);
    assert.deepEqual(retainedBackupCodec.indexes(row.data), [peer.identity.principal, null, null, null]);
    await retainedBackupCodec.validate(row.data);
  }
  passed('normal peer retention and withdrawal preserve owner/listing keys and owner index');

  const originalRows = await allRows(session);
  const signedEvidence = originalRows.filter(row => row.type === publicationRepo.type || row.type === retainedListingRepo.type)
    .map(row => [row.type, row.id, strictCanonicalJson(row.data)]);
  const originalSignature = await session.identity.sign(checkMessage);
  const legacyBackup = await session.exportBackup(passphrase);
  assert.equal(legacyBackup.format, 'classrup.sealed/v1');
  assert.equal(legacyBackup.kdf, 'scrypt-131072-8-1');
  assert.equal(legacyBackup.cipher, 'xchacha20poly1305');
  const plaintext = await unseal(legacyBackup, passphrase);
  try {
    const manifest = await verifyEnvelope(JSON.parse(new TextDecoder().decode(plaintext)), { expectedType: 'classrup.vault.alpha_backup/v1' });
    assert.equal(manifest.author, session.principal);
    assert.deepEqual(ordered(manifest.payload.records), originalRows);
    assert.deepEqual(manifest.payload.recordTypes, formerCodecs.map(codec => codec.type).sort());
  } finally { plaintext.fill(0); }
  assert.deepEqual(await allRows(session), originalRows);
  const restored = await restoredVault.restoreBackup(legacyBackup, passphrase);
  assert.equal(restored.principal, session.principal);
  assert.deepEqual(await restored.identity.sign(checkMessage), originalSignature);
  assert.deepEqual(await allRows(restored), originalRows);
  assert.deepEqual(await publicationRows(restored, listingId), localPublications);
  assert.deepEqual(await retainedRows(restored, peer.identity.principal), peerRows);
  passed('canonical v1 from former codec definitions restores with all metadata, indexes, evidence and signing identity');

  const restoredBus = createBus({ registry, storage: restored.storage, clock, ids, authz: allowAllAuthz });
  const readPublication = await restoredBus.query(context, 'bazaar.listing.publication', { listingId });
  assert.equal(readPublication.ok, true);
  assert.deepEqual(readPublication.value.value.envelope, unpublished.envelope);
  const currentBackup = await restored.exportBackup(passphrase);
  assert.equal(currentBackup.format, 'classrup.sealed/v1');
  const finalSession = await roundTripVault.restoreBackup(currentBackup, passphrase);
  assert.equal(finalSession.principal, session.principal);
  assert.deepEqual(await finalSession.identity.sign(checkMessage), originalSignature);
  assert.deepEqual(await allRows(finalSession), originalRows);
  assert.deepEqual(await publicationRows(finalSession, listingId), localPublications);
  assert.deepEqual(await retainedRows(finalSession, peer.identity.principal), peerRows);
  assert.deepEqual((await allRows(finalSession)).filter(row => row.type === publicationRepo.type || row.type === retainedListingRepo.type)
    .map(row => [row.type, row.id, strictCanonicalJson(row.data)]), signedEvidence);
  passed('current codec export/restore and normal publication reader retain the same canonical records');
  console.log(JSON.stringify({ outcome: 'passed', groups: completed, records: originalRows.length,
    publicationRecords: localPublications.length, retainedRecords: peerRows.length,
    codecTypes: currentCodecs.map(codec => codec.type).sort(), node: process.version, maxRssKiB: process.resourceUsage().maxRSS }));
} finally {
  peer?.identity.lock();
  await source.close();
  await restoredVault.close();
  await roundTripVault.close();
}
