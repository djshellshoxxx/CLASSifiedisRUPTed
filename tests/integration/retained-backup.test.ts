import { describe, expect, it } from 'vitest';
import { allowAllAuthz, createBus, createDeterministicIds, createFakeClock, createMemoryStorage, createRegistry } from '../../packages/kernel/src/index.ts';
import { createIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, strictCanonicalJson, verifyEnvelope } from '../../packages/federation/src/index.ts';
import { discoveryDefinitions, retainedListingId, retainedListingRepo, type PublicListingProjection, type RetainedListing } from '../../packages/discovery/src/index.ts';
import { vaultFromStorage } from '../../packages/vault/src/index.ts';
import { retainedBackupCodec } from '../../apps/pwa/src/retained-backup.ts';

const passphrase = 'retained listing backup passphrase';

describe('production retained listing backup codec', () => {
  it('round-trips normal signed retention with the existing key, evidence, indexes and signing identity', async () => {
    const source = vaultFromStorage(createMemoryStorage(), [retainedBackupCodec]);
    const destination = vaultFromStorage(createMemoryStorage(), [retainedBackupCodec]);
    const peer = await createIdentity('retained listing peer passphrase');
    try {
      const session = await source.create(passphrase);
      const clock = createFakeClock(Date.now());
      const ids = createDeterministicIds({ seed: 94, now: () => clock.now() });
      const projection: PublicListingProjection = {
        ownerId: peer.identity.principal, listingId: ids.next(), revision: 1,
        kind: 'giveaway', title: 'Winter bicycle', description: 'A good winter bicycle.', categoryId: ids.next(),
        condition: 'good', tags: [], locale: 'en', regionCell: 'c2b2', barterOptIn: true,
        availability: 'available', expiresAt: new Date(clock.now() + 86_400_000).toISOString(),
      };
      const envelope = await signEnvelope(peer.identity, {
        type: 'classrup.bazaar.listing/v1', payload: projection, createdAt: clock.iso(), seq: 1, prev: null,
      });
      const signedEvidence = strictCanonicalJson(envelope);
      const registry = createRegistry().add(...discoveryDefinitions({ verifyEnvelope }).all);
      const bus = createBus({ registry, storage: session.storage, clock, ids, authz: allowAllAuthz });
      const retained = await bus.dispatch({ actor: { kind: 'user', id: session.principal, roles: ['member'] }, tenantId: session.principal },
        'discovery.listing.retain', { envelope }, { idempotencyKey: ids.next() });
      expect(retained.ok).toBe(true);
      const key = retainedListingId(projection.ownerId, projection.listingId);
      expect(key).toBe(`${projection.ownerId}/${projection.listingId}`);
      const original = await session.storage.read(tx => tx.records.get<RetainedListing>(session.principal, retainedListingRepo.type, key));
      expect(original).toBeDefined();
      expect(retainedBackupCodec.recordId!(original!.data)).toBe(key);
      expect(original!.data.envelopes).toEqual([envelope]);

      const message = new TextEncoder().encode('retained backup signing identity');
      const signature = await session.identity.sign(message);
      const backup = await session.exportBackup(passphrase);
      expect(backup.format).toBe('classrup.sealed/v1');
      expect(await session.storage.read(tx => tx.records.get(session.principal, retainedListingRepo.type, key))).toEqual(original);
      const restored = await destination.restoreBackup(backup, passphrase);
      expect(restored.principal).toBe(session.principal);
      expect(await restored.identity.sign(message)).toEqual(signature);
      const rows = await restored.storage.read(tx => tx.records.query<RetainedListing>({
        tenant: restored.principal, type: retainedListingRepo.type,
        filters: [{ slot: 1, op: 'eq', value: projection.ownerId }], orderSlot: 0, dir: 'asc', limit: 10,
      }));
      expect(rows).toEqual([original]);
      expect(strictCanonicalJson(rows[0]!.data.envelopes[0])).toBe(signedEvidence);
    } finally {
      peer.identity.lock();
      await source.close();
      await destination.close();
    }
  });
});
