import { describe, expect, it } from 'vitest';
import { createMemoryStorage, ok } from '../../packages/kernel/src/index.ts';
import { signEnvelope, strictCanonicalJson } from '../../packages/federation/src/index.ts';
import { publicationRepo } from '../../packages/bazaar/src/index.ts';
import { type PublicListingProjection } from '../../packages/discovery/src/index.ts';
import { vaultFromStorage } from '../../packages/vault/src/index.ts';
import { publicationBackupCodec } from '../../apps/pwa/src/publication-backup.ts';

const passphrase = 'publication backup round trip passphrase';
const listingId = '0195aaaa-0000-7000-8000-000000000001';

describe('production publication backup codec', () => {
  it('preserves CID keys and signed listing, tombstone and reservation evidence through encrypted backup', async () => {
    const source = vaultFromStorage(createMemoryStorage(), [publicationBackupCodec]);
    const destination = vaultFromStorage(createMemoryStorage(), [publicationBackupCodec]);
    try {
      const session = await source.create(passphrase);
      const now = Date.now();
      const createdAt = new Date(now).toISOString();
      const expiresAt = new Date(now + 86_400_000).toISOString();
      const projection: PublicListingProjection = {
        ownerId: session.principal, listingId, revision: 1,
        kind: 'giveaway', title: 'Winter bicycle', description: 'A good winter bicycle.',
        categoryId: '0195aaaa-0000-7000-8000-000000000002', condition: 'good',
        tags: [], locale: 'en', regionCell: 'c2b2', barterOptIn: true, availability: 'available', expiresAt,
      };
      const listing = await signEnvelope(session.identity, {
        type: 'classrup.bazaar.listing/v1', payload: projection, createdAt, seq: 1, prev: null,
      });
      const reservation = await signEnvelope(session.identity, {
        type: 'classrup.alpha.reservation/v1', createdAt, seq: 1, prev: null,
        payload: { subjectId: '0195aaaa-0000-7000-8000-000000000003', revisionHash: 'normal-reservation-revision',
          giverId: session.principal, itemId: listingId, expiresAt, holdId: '0195aaaa-0000-7000-8000-000000000004' },
      });
      const tombstone = await signEnvelope(session.identity, {
        type: 'classrup.alpha.tombstone/v1', createdAt, seq: 2, prev: listing.cid,
        payload: { ownerId: session.principal, listingId, revision: 2, target: listing.cid, reason: 'owner' },
      });
      const envelopes = [listing, reservation, tombstone];
      const signedEvidence = new Map(envelopes.map(envelope => [envelope.cid, strictCanonicalJson(envelope)]));
      const saved = await session.storage.transaction(tx => {
        for (const envelope of envelopes) {
          const data = { envelope, listingId };
          expect(publicationBackupCodec.recordId!(data)).toBe(envelope.cid);
          const result = tx.records.put({ tenant: session.principal, type: publicationRepo.type, id: envelope.cid,
            data, idx: publicationBackupCodec.indexes(data), expectedRevision: 0, now });
          if (!result.ok) return result;
        }
        return ok(undefined);
      });
      expect(saved.ok).toBe(true);
      const original = await session.storage.read(tx => tx.records.query({ tenant: session.principal, type: publicationRepo.type,
        filters: [{ slot: 1, op: 'eq', value: listingId }], orderSlot: 0, dir: 'asc', limit: 10 }));
      expect(original).toHaveLength(3);
      const message = new TextEncoder().encode('publication backup signing identity');
      const signature = await session.identity.sign(message);
      const backup = await session.exportBackup(passphrase);
      expect(backup.format).toBe('classrup.sealed/v1');
      const restored = await destination.restoreBackup(backup, passphrase);
      expect(restored.principal).toBe(session.principal);
      expect(await restored.identity.sign(message)).toEqual(signature);
      const rows = await restored.storage.read(tx => tx.records.query({ tenant: restored.principal, type: publicationRepo.type,
        filters: [{ slot: 1, op: 'eq', value: listingId }], orderSlot: 0, dir: 'asc', limit: 10 }));
      expect(rows).toEqual(original);
      for (const row of rows) {
        const data = publicationRepo.schema.parse(row.data);
        expect(row.id).toBe(data.envelope.cid);
        expect(strictCanonicalJson(data.envelope)).toBe(signedEvidence.get(row.id));
      }
    } finally {
      await source.close();
      await destination.close();
    }
  });
});
