import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { createDeterministicIds, ok } from '../../packages/kernel/src/index.ts';
import { signEnvelope, strictCanonicalJson } from '../../packages/federation/src/index.ts';
import { openVault } from '../../packages/vault/src/index.ts';
import { archiveRecordRepo, publicationRepo, RESTORE_WINDOW_MS } from '../../packages/bazaar/src/index.ts';
import { locationSettingRepo, type PublicListingProjection } from '../../packages/discovery/src/index.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'production mixed backup compatibility passphrase';

function productionCodec(type: string) {
  const codec = productionBackupCodecs.find(candidate => candidate.type === type);
  if (!codec) throw new Error('Missing production backup codec for ' + type);
  return codec;
}

describe('mixed production PWA codec recovery', () => {
  it('restores mixed signed and local records into encrypted IndexedDB, reopens, and rebuilds canonical indexes', async () => {
    // Both vaults use the exact same registry as the PWA, not a test-only subset.
    const indexedDB = new IDBFactory();
    const source = await openVault({ name: 'mixed-production-source', indexedDB, codecs: productionBackupCodecs });
    const session = await source.create(passphrase);
    const now = Date.now();
    const createdAt = new Date(now).toISOString();
    const expiresAt = new Date(now + 86_400_000).toISOString();
    const ids = createDeterministicIds({ seed: 96, now: () => now });
    const listingId = ids.next();
    const archiveListingId = ids.next();
    const categoryId = ids.next();
    const settingId = ids.next();
    const archiveCodec = productionCodec(archiveRecordRepo.type);
    const publicationCodec = productionCodec(publicationRepo.type);
    const locationCodec = productionCodec(locationSettingRepo.type);
    const restoreUntil = new Date(now + RESTORE_WINDOW_MS).toISOString();
    const archive = { listingId: archiveListingId, ownerId: session.principal, status: 'archived' as const,
      endedAt: createdAt, archivedAt: createdAt, restoreUntil, purgeAt: restoreUntil };
    const location = { settingId, ownerDid: session.principal, homeCell5: 'u4pru',
      publicLevel: 'L1' as const, entryMode: 'map_tile' as const,
      changeCount24h: 1, changeTimes: [createdAt], lastChangedAt: createdAt };
    const listingProjection: PublicListingProjection = {
      ownerId: session.principal, listingId, revision: 1, kind: 'giveaway',
      title: 'Mixed backup bicycle', description: 'Signed publication recovery canary',
      categoryId, condition: 'good', tags: [], locale: 'en',
      regionCell: 'c2b2', barterOptIn: true, availability: 'available', expiresAt,
    };
    const signed = await signEnvelope(session.identity, {
      type: 'classrup.bazaar.listing/v1', payload: listingProjection, createdAt, seq: 1, prev: null,
    });
    const publication = { envelope: signed, listingId };
    const key = signed.cid;
    const signatureMessage = new TextEncoder().encode('mixed production backup identity');
    const beforeSignature = await session.identity.sign(signatureMessage);
    const records = [
      { codec: archiveCodec, id: archiveListingId, data: archive },
      { codec: publicationCodec, id: key, data: publication },
      { codec: locationCodec, id: session.principal, data: location },
    ];
    let originalArchive: unknown;
    let originalPublication: unknown;
    let backup: Awaited<ReturnType<typeof session.exportBackup>>;
    try {
      const inserted = await session.storage.transaction(tx => {
        for (const record of records) {
          const saved = tx.records.put({
            tenant: session.principal, type: record.codec.type, id: record.id,
            data: record.data, idx: record.codec.indexes(record.data),
            expectedRevision: 0, now,
          });
          if (!saved.ok) return saved;
        }
        return ok(undefined);
      });
      expect(inserted.ok).toBe(true);
      const expectedTypes = records.map(record => record.codec.type).sort();
      expect((await session.backupCoverage()).recordTypes.map(row => row.type)).toEqual(expectedTypes);
      originalArchive = await session.storage.read(tx =>
        tx.records.get(session.principal, archiveRecordRepo.type, archiveListingId));
      originalPublication = await session.storage.read(tx =>
        tx.records.get(session.principal, publicationRepo.type, key));
      backup = await session.exportBackup(passphrase);
      expect(backup.format).toBe('classrup.sealed/v1');
      expect(JSON.stringify(backup)).not.toContain('Signed publication recovery canary');
      expect(JSON.stringify(backup)).not.toContain('u4pru');
    } finally {
      await session.lock();
    }

    const destination = await openVault({ name: 'mixed-production-destination', indexedDB, codecs: productionBackupCodecs });
    const restored = await destination.restoreBackup(backup, passphrase);
    expect(restored.principal).toBe(signed.author);
    expect(await restored.identity.sign(signatureMessage)).toEqual(beforeSignature);
    await restored.lock();

    const reopened = await openVault({ name: 'mixed-production-destination', indexedDB, codecs: productionBackupCodecs });
    const unlocked = await reopened.unlock(passphrase);
    try {
      expect(unlocked.principal).toBe(signed.author);
      expect(await unlocked.identity.sign(signatureMessage)).toEqual(beforeSignature);
      const archiveRows = await unlocked.storage.read(tx => tx.records.query({
        tenant: unlocked.principal, type: archiveRecordRepo.type,
        filters: [{ slot: 1, op: 'eq', value: unlocked.principal }, { slot: 2, op: 'eq', value: archiveListingId },
          { slot: 3, op: 'eq', value: 'archived' }, { slot: 4, op: 'eq', value: restoreUntil }],
        orderSlot: 0, dir: 'asc', limit: 10,
      }));
      const publicationRows = await unlocked.storage.read(tx => tx.records.query({
        tenant: unlocked.principal, type: publicationRepo.type,
        filters: [{ slot: 1, op: 'eq', value: listingId }],
        orderSlot: 0, dir: 'asc', limit: 10,
      }));
      expect(archiveRows).toEqual([originalArchive]);
      expect(publicationRows).toEqual([originalPublication]);
      expect(publicationRows[0]?.id).toBe(key);
      expect(strictCanonicalJson((publicationRows[0]?.data as typeof publication).envelope)).toBe(strictCanonicalJson(signed));
      const reopenedLocation = await unlocked.storage.read(tx =>
        tx.records.get(unlocked.principal, locationSettingRepo.type, unlocked.principal));
      expect(reopenedLocation?.id).toBe(unlocked.principal);
      expect(reopenedLocation?.data).toEqual({
        settingId, ownerDid: unlocked.principal, homeCell5: 'u4pru',
        publicLevel: 'L1', entryMode: 'map_tile', changeCount24h: 0, changeTimes: [],
      });
      expect((await unlocked.backupCoverage()).recordTypes.map(row => row.type)).toEqual(records.map(row => row.codec.type).sort());
    } finally {
      await unlocked.lock();
    }
  }, 30000);
});
