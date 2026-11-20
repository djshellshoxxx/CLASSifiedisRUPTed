import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  createBus, createDeterministicIds, createFakeClock, createRegistry,
  type FakeClock, type IdGen, type Page, type SignedEnvelope, type StoredRecord,
} from '../../packages/kernel/src/index.ts';
import { createIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, verifyEnvelope } from '../../packages/federation/src/index.ts';
import {
  archiveRecordRepo, bazaarDefinitions, listingRepo, listingRevisionId, listingRevisionRepo,
  publicationRepo, type Listing, type ListingRevision,
} from '../../packages/bazaar/src/index.ts';
import {
  discoveryDefinitions, locationDefinitions, locationSettingRepo, retainedListingRepo,
  type PublicListingProjection, type RetainedListing,
} from '../../packages/discovery/src/index.ts';
import { openVault, type UnlockedVault, type Vault } from '../../packages/vault/src/index.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'normal reader recovery acceptance passphrase';

function runtime(session: UnlockedVault, clock: FakeClock, ids: IdGen, categoryId: string) {
  const registry = createRegistry().add(
    ...bazaarDefinitions({
      categoryAllowed: id => id === categoryId,
      signProjection: async (type, payload, seq, prev) => ({
        ...await signEnvelope(session.identity, { type, payload, seq, prev, createdAt: clock.iso() }),
      }),
      verifyProjection: input => verifyEnvelope(input, { now: clock.now() }),
    }).all,
    ...discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now: clock.now() }) }).all,
    ...locationDefinitions({ localPrincipal: () => session.principal }).all,
  );
  const bus = createBus({
    registry, storage: session.storage, clock, ids, origin: `vault:${session.principal}`,
    authz: { authorize: (actor, _capability, _resource, context) =>
      actor.kind === 'user' && actor.id === session.principal && context.tenantId === session.principal
        ? { allow: true } : { allow: false, code: 'FORBIDDEN' } },
  });
  const context = { actor: { kind: 'user' as const, id: session.principal, roles: ['member'] }, tenantId: session.principal };
  return {
    async command<T = unknown>(name: string, input: unknown): Promise<T> {
      const result = await bus.dispatch(context, name, input, { idempotencyKey: ids.next() });
      if (!result.ok) throw new Error(`${name}: ${result.error.code}`);
      return result.value.value as T;
    },
    async query<T = unknown>(name: string, input: unknown): Promise<T> {
      const result = await bus.query(context, name, input);
      if (!result.ok) throw new Error(`${name}: ${result.error.code}`);
      return result.value.value as T;
    },
  };
}

describe('normal readers after production-codec recovery', () => {
  it('restores command-created owner history, signed publications and peer search, then continues the recovered archive chain', async () => {
    const indexedDB = new IDBFactory();
    const vaults: Vault[] = [];
    const peer = await createIdentity('normal reader recovery peer passphrase');
    async function open(name: string) {
      const vault = await openVault({ name, indexedDB, codecs: productionBackupCodecs });
      vaults.push(vault);
      return vault;
    }
    try {
      const source = await open('production-reader-source');
      const original = await source.create(passphrase);
      const principal = original.principal;
      const clock = createFakeClock(Date.now());
      const ids = createDeterministicIds({ seed: 98, now: () => clock.now() });
      const categoryId = ids.next();
      const listingId = ids.next();
      const archivedListingId = ids.next();
      const peerListingId = ids.next();
      const owner = runtime(original, clock, ids, categoryId);
      const fields = {
        title: 'Winter bicycle', description: 'A maintained winter bicycle for local exchange.',
        categoryId, condition: 'good', regionCell: 'c2b2', barterOptIn: true,
        privateNotes: 'Private owner recovery canary',
      };
      // Real commands create canonical keys, revisions, signatures and indexes.
      await owner.command('bazaar.listing.create', { ...fields, listingId, kind: 'giveaway' });
      await owner.command('bazaar.listing.publish', { listingId, expectedRevision: 1 });
      await owner.command('bazaar.listing.unpublish', { listingId, expectedRevision: 2 });
      await owner.command('bazaar.listing.edit', { ...fields, title: 'Revised winter bicycle', listingId, expectedRevision: 3 });
      const published = await owner.command<{ envelope: SignedEnvelope }>(
        'bazaar.listing.publish', { listingId, expectedRevision: 4 });
      await owner.command('bazaar.listing.create', { ...fields, title: 'Archived touring bicycle', listingId: archivedListingId, kind: 'giveaway' });
      await owner.command('bazaar.listing.publish', { listingId: archivedListingId, expectedRevision: 1 });
      const archived = await owner.command<{ archiveRecordId: string; envelope: SignedEnvelope }>(
        'bazaar.listing.archive', { listingId: archivedListingId, expectedRevision: 2 });
      expect(archived.archiveRecordId).not.toBe(archivedListingId);
      await owner.command('discovery.location.set_home', { cell5: 'c2b2q', publicLevel: 'L1', entryMode: 'map_tile' });

      const peerProjection: PublicListingProjection = {
        ownerId: peer.identity.principal, listingId: peerListingId, revision: 1,
        kind: 'giveaway', title: 'Commuter bicycle', description: 'A retained peer bicycle with signed provenance.',
        categoryId, condition: 'good', tags: [], locale: 'en', regionCell: 'c2b2', barterOptIn: true,
        availability: 'available', expiresAt: new Date(clock.now() + 86_400_000).toISOString(),
      };
      const peerEnvelope = await signEnvelope(peer.identity, {
        type: 'classrup.bazaar.listing/v1', payload: peerProjection, createdAt: clock.iso(), seq: 1, prev: null,
      });
      await owner.command('discovery.listing.retain', { envelope: peerEnvelope });

      async function readNormalViews(current: ReturnType<typeof runtime>) {
        const first = await current.query<Page<ListingRevision>>('bazaar.listing_revision.list', { listingId, limit: 1 });
        expect(first.nextCursor).toBeDefined();
        const second = await current.query<Page<ListingRevision>>('bazaar.listing_revision.list', { listingId, limit: 1, cursor: first.nextCursor });
        expect(second.nextCursor).toBeDefined();
        const third = await current.query<Page<ListingRevision>>('bazaar.listing_revision.list', { listingId, limit: 1, cursor: second.nextCursor });
        expect(third.nextCursor).toBeUndefined();
        const history = [...first.items, ...second.items, ...third.items];
        expect(history.map(row => row.data.revisionNo)).toEqual([5, 4, 2]);
        expect(history.map(row => row.id)).toEqual([5, 4, 2].map(revision => listingRevisionId(listingId, revision)));
        return {
          listings: await current.query<Page<Listing>>('bazaar.listing.list', {}),
          listing: await current.query<StoredRecord<Listing>>('bazaar.listing.get', { listingId }),
          archivedListing: await current.query<StoredRecord<Listing>>('bazaar.listing.get', { listingId: archivedListingId }),
          publication: await current.query('bazaar.listing.publication', { listingId }),
          archivedPublication: await current.query('bazaar.listing.publication', { listingId: archivedListingId }),
          history,
          revision: await current.query('bazaar.listing_revision.get', { listingId, revisionNo: 4 }),
          archives: await current.query('bazaar.archive_record.list_mine', { listingId: archivedListingId, status: 'archived' }),
          archive: await current.query('bazaar.archive_record.get', { archiveRecordId: archived.archiveRecordId }),
          retained: await current.query<{ items: RetainedListing[]; source: string; staleOrExcluded: number }>(
            'discovery.listing.search', { query: 'Commuter', regionCell: 'c2b2', barterOnly: true }),
          publicLocation: await current.query('discovery.location.get_own', {}),
          privateLocation: await current.query('discovery.location.get_own', { includeHomeCell: true }),
        };
      }

      const before = await readNormalViews(owner);
      expect(before.listings.items.map(row => row.id).sort()).toEqual([listingId, archivedListingId].sort());
      expect(before.listing.data).toMatchObject({ title: 'Revised winter bicycle', status: 'published', privateNotes: fields.privateNotes });
      expect(before.archivedListing.data.status).toBe('archived');
      expect(before.publication).toEqual({ envelope: published.envelope });
      expect(before.archivedPublication).toEqual({ envelope: archived.envelope });
      expect(before.revision).toMatchObject({ revision: { data: { source: 'owner_edit', snapshot: { title: 'Revised winter bicycle' } } } });
      expect(JSON.stringify(before.history)).not.toContain(fields.privateNotes);
      expect(before.archives).toMatchObject({ items: [{ id: archived.archiveRecordId, data: { listingId: archivedListingId, status: 'archived' } }] });
      expect(before.retained).toMatchObject({ source: 'locally-retained', staleOrExcluded: 0,
        items: [{ ownerId: peer.identity.principal, listingId: peerListingId, cid: peerEnvelope.cid, envelopes: [peerEnvelope] }] });
      expect(before.retained.items).toHaveLength(1);
      expect(before.publicLocation).toMatchObject({ publicLevel: 'L1', publicCell: 'c2b2' });
      expect(before.publicLocation).not.toHaveProperty('homeCell5');
      expect(before.privateLocation).toMatchObject({ homeCell5: 'c2b2q' });
      const populatedTypes = [archiveRecordRepo.type, listingRepo.type, listingRevisionRepo.type,
        publicationRepo.type, locationSettingRepo.type, retainedListingRepo.type].sort();
      expect((await original.backupCoverage()).recordTypes.map(row => row.type)).toEqual(populatedTypes);

      const message = new TextEncoder().encode('normal readers preserve the signing identity');
      const signature = await original.identity.sign(message);
      const sealed = await original.exportBackup(passphrase);
      expect(JSON.stringify(sealed)).not.toContain(fields.privateNotes);
      expect(await readNormalViews(owner)).toEqual(before);
      await original.lock();

      const destination = await open('production-reader-destination');
      const restored = await destination.restoreBackup(sealed, passphrase);
      expect(restored.principal).toBe(principal);
      expect(await restored.identity.sign(message)).toEqual(signature);
      expect(await readNormalViews(runtime(restored, clock, ids, categoryId))).toEqual(before);
      await restored.lock();

      const reopened = await open('production-reader-destination');
      const unlocked = await reopened.unlock(passphrase);
      const recovered = runtime(unlocked, clock, ids, categoryId);
      expect(unlocked.principal).toBe(principal);
      expect(await unlocked.identity.sign(message)).toEqual(signature);
      expect(await readNormalViews(recovered)).toEqual(before);
      expect((await unlocked.backupCoverage()).recordTypes.map(row => row.type)).toEqual(populatedTypes);

      // Recovered evidence must support the next ordinary action, not merely display old rows.
      await recovered.command('bazaar.listing.restore', { archiveRecordId: archived.archiveRecordId, expectedRevision: 1 });
      const restoredListing = await recovered.query<StoredRecord<Listing>>('bazaar.listing.get', { listingId: archivedListingId });
      expect(restoredListing).toMatchObject({ revision: 4, data: { status: 'unpublished', privateNotes: fields.privateNotes } });
      const republished = await recovered.command<{ envelope: SignedEnvelope }>(
        'bazaar.listing.publish', { listingId: archivedListingId, expectedRevision: 4 });
      const verified = await verifyEnvelope(republished.envelope, { now: clock.now() });
      expect(verified).toMatchObject({ author: principal, seq: 3, prev: archived.envelope.cid,
        payload: { listingId: archivedListingId, ownerId: principal, revision: 5 } });
      expect(await recovered.query('bazaar.listing.publication', { listingId: archivedListingId })).toEqual({ envelope: republished.envelope });
      expect(await recovered.query('bazaar.archive_record.get', { archiveRecordId: archived.archiveRecordId }))
        .toMatchObject({ record: { data: { status: 'restored' } } });
    } finally {
      peer.identity.lock();
      for (const vault of vaults) await vault.close();
    }
  }, 30000);
});
