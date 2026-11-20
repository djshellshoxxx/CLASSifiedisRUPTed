import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  collectingSink, createBus, createDeterministicIds, createFakeClock, createMemoryStorage, createOutboxDispatcher, createRegistry,
  type FakeClock, type IdGen, type Page, type SignedEnvelope, type StoredRecord,
} from '../../packages/kernel/src/index.ts';
import { didFromPublicKey, type UnlockedIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, verifyEnvelope } from '../../packages/federation/src/index.ts';
import { archiveRecordRepo, bazaarDefinitions, inventoryHoldRepo, listingRepo, listingRevisionRepo, publicationRepo,
  type Listing, type ListingRevision } from '../../packages/bazaar/src/index.ts';
import { discoveryDefinitions, locationDefinitions, locationSettingRepo, retainedListingRepo,
  type LocationSetting, type LocationView, type RetainedListing } from '../../packages/discovery/src/index.ts';
import {
  admitSignedGraph, coordinationRepo, discoverCycles, prepareProposal, PROPOSAL_TYPE, WANT_TYPE, WITHDRAWAL_TYPE, wantRepo, validateCoordinationRecord,
  type CoordinationState,
} from '../../packages/mutiny/src/index.ts';
import { inApp, localNotificationDefinitions, preferences } from '../../packages/notify/src/index.ts';
import { openVault, type UnlockedVault, type Vault } from '../../packages/vault/src/index.ts';
import { createBarterRuntime, type BarterInputs } from '../../apps/pwa/src/barter-runtime.ts';
import { mountBarter } from '../../apps/pwa/src/barter.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';
import { drainNotificationDelivery } from '../../apps/pwa/src/notification-delivery.ts';
import { NodeStub } from '../support/node-stub.ts';

const HOUR = 3600000;
const DAY = 24 * HOUR;
const passphrase = 'production barter recovery acceptance passphrase';
type CoordinationRecord = { ownerId: string; state: CoordinationState };
type WantRecord = { ownerId: string; envelope: SignedEnvelope; receivedAtLocal: number };
type NotificationView = inApp.Notification & { id: string; revision: number };
interface NotificationPage { items: NotificationView[]; nextCursor?: string }
interface PreferenceMatrix {
  cells: Array<preferences.NotificationPreference & { id: string; revision: number }>;
  channelStatus: { push: boolean; email: boolean };
  defaultsVersion: number;
  mirrorRef: string | null;
}

// The peer supplies real signed statements; its key encryption is outside this owner's recovery case.
async function peerIdentity(): Promise<UnlockedIdentity> {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
  const principal = didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)));
  let locked = false;
  return { principal, async sign(bytes) {
    if (locked) throw new Error('Peer locked');
    return new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, bytes.slice()));
  }, lock() { locked = true; } };
}

function runtime(session: Pick<UnlockedVault, 'principal' | 'identity' | 'storage'>, clock: FakeClock, ids: IdGen, categoryId: string) {
  const barter = createBarterRuntime(session);
  const notifications = localNotificationDefinitions({
    localPrincipal: () => session.principal, isBlocked: barter.isBlocked, isThreadMuted: () => false,
  });
  const registry = createRegistry().add(...barter.definitions,
    ...bazaarDefinitions({ categoryAllowed: id => id === categoryId,
      signProjection: async (type, payload, seq, prev) => ({
        ...await signEnvelope(session.identity, { type, payload, seq, prev, createdAt: clock.iso() }),
      }), verifyProjection: input => verifyEnvelope(input, { now: clock.now() }),
    }).all,
    ...discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now: clock.now() }) }).all,
    ...locationDefinitions({ localPrincipal: () => session.principal }).all,
    ...notifications.all,
  );
  const origin = `vault:${session.principal}`;
  const events = collectingSink();
  const bus = createBus({ registry, storage: session.storage, clock, ids, origin, eventSink: events,
    authz: { authorize: (actor, _capability, _resource, context) =>
      actor.kind === 'user' && actor.id === session.principal && context.tenantId === session.principal
        ? { allow: true } : { allow: false, code: 'FORBIDDEN' } },
  });
  const outbox = createOutboxDispatcher({ registry, storage: session.storage, clock, ids, origin, random: () => 0.5 });
  const context = { actor: { kind: 'user' as const, id: session.principal, roles: ['member'] }, tenantId: session.principal };
  return {
    setMatchingPolicy: barter.setMatchingPolicy,
    events: events.events,
    // The production helper uses a bounded drain and checks outstanding/dead-letter
    // state too: a quiet pass alone does not establish delivery completion.
    drainNotifications: () => drainNotificationDelivery(outbox, session.storage, registry),
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

function codec(type: string) {
  const found = productionBackupCodecs.find(item => item.type === type);
  if (!found?.recordId) throw new Error('Missing canonical production codec key for ' + type);
  return found as typeof found & { recordId(input: unknown): string };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('production barter record recovery', () => {
  it('preserves signed wants and freezes a real local commitment for review across encrypted restore, reopen and refresh', async () => {
    const indexedDB = new IDBFactory();
    const vaults: Vault[] = [];
    const peer = await peerIdentity();
    const peerStorage = createMemoryStorage();
    async function open(name: string) {
      const vault = await openVault({ name, indexedDB, codecs: productionBackupCodecs });
      vaults.push(vault); return vault;
    }
    try {
      const original = await (await open('barter-recovery-source')).create(passphrase);
      const principal = original.principal;
      const clock = createFakeClock(Date.now() - HOUR);
      const ids = createDeterministicIds({ seed: 110, now: () => clock.now() });
      const peerIds = createDeterministicIds({ seed: 111, now: () => clock.now() });
      const categoryId = ids.next();
      const owner = runtime(original, clock, ids, categoryId);
      const other = runtime({ principal: peer.principal, identity: peer, storage: peerStorage }, clock, peerIds, categoryId);
      owner.setMatchingPolicy({ enabled: true, blockedOwners: [] });
      other.setMatchingPolicy({ enabled: true, blockedOwners: [] });
      const actors = [
        { app: owner, identity: original.identity, listingId: ids.next(), holdId: ids.next() },
        { app: other, identity: peer, listingId: peerIds.next(), holdId: peerIds.next() },
      ];
      const listings: SignedEnvelope[] = [];
      for (const [index, actor] of actors.entries()) {
        await actor.app.command('bazaar.listing.create', { listingId: actor.listingId, kind: 'sell',
          title: `Barter item ${index}`, description: 'An ordinary signed item for the recovery acceptance case.',
          categoryId, condition: 'good', regionCell: 'c2b2q', barterOptIn: true,
          value: { amount: '100', currency: 'CAD' } });
        listings.push((await actor.app.command<{ envelope: SignedEnvelope }>(
          'bazaar.listing.publish', { listingId: actor.listingId, expectedRevision: 1 })).envelope);
      }
      await owner.command('discovery.listing.retain', { envelope: listings[1] });
      await other.command('discovery.listing.retain', { envelope: listings[0] });
      const wants = await Promise.all(actors.map((actor, index) => signEnvelope(actor.identity, {
        type: WANT_TYPE, createdAt: clock.iso(), seq: 1, prev: null,
        payload: { offeringListingCid: listings[index]!.cid, requestedListingCid: listings[1 - index]!.cid,
          expiresAt: new Date(clock.now() + 7 * DAY).toISOString() },
      })));
      for (const actor of actors) for (const envelope of wants) await actor.app.command('mutiny.want.retain', { envelope });
      clock.advance(HOUR); // Satisfy the existing 15-minute want admission rule.
      // Keep the independent archive separate from the item promised by this cycle.
      const archivedListingId = ids.next();
      await owner.command('bazaar.listing.create', { listingId: archivedListingId, kind: 'giveaway',
        title: 'Archived owner item', description: 'An independent archived item recovered beside the signed cycle.',
        categoryId, condition: 'good', regionCell: 'c2b2q', barterOptIn: false });
      await owner.command('bazaar.listing.publish', { listingId: archivedListingId, expectedRevision: 1 });
      const archived = await owner.command<{ archiveRecordId: string; envelope: SignedEnvelope }>(
        'bazaar.listing.archive', { listingId: archivedListingId, expectedRevision: 2 });
      expect(archived.archiveRecordId).not.toBe(archivedListingId);
      await owner.command('discovery.location.set_home', { cell5: 'c2b2q', publicLevel: 'L1', entryMode: 'map_tile' });
      await owner.command('notify.preference.set', { cells: [{ category: 'offers', inApp: false, expectedRevision: 1 }] });
      const graph = await admitSignedGraph(listings, wants, {
        now: clock.now(), localPrincipal: principal, optedIn: true, includeUnknownIdentities: true,
      });
      const matches = await discoverCycles(graph.edges, { now: clock.now(), monotonicNow: () => 0 });
      expect(matches.suggestions).toHaveLength(1);
      const proposal = await prepareProposal({ subjectId: ids.next(), coordinatorId: principal, revisionNo: 1,
        previousHash: null, legs: matches.suggestions[0]!.legs, createdAt: clock.now(),
        consentDeadline: clock.now() + HOUR, executionWindowMs: DAY }, clock.now());
      const opening = await signEnvelope(original.identity, { type: PROPOSAL_TYPE, payload: proposal.snapshot,
        createdAt: clock.iso(), seq: 1, prev: null });
      async function coordination(app: ReturnType<typeof runtime>) {
        const page = await app.query<Page<CoordinationRecord>>('mutiny.coordination.list', {});
        expect(page.items).toHaveLength(1);
        expect(page.items[0]!.id).toBe(proposal.snapshot.subjectId);
        return page.items[0]!;
      }
      async function ingest(app: ReturnType<typeof runtime>, envelope: SignedEnvelope) {
        return app.command('mutiny.coordination.ingest', { envelope, expectedRevision: (await coordination(app)).revision });
      }
      for (const actor of actors) await actor.app.command('mutiny.coordination.ingest', { envelope: opening, expectedRevision: 0 });
      const reservations: SignedEnvelope[] = [];
      for (const actor of actors) reservations.push((await actor.app.command<{ envelope: SignedEnvelope }>(
        'bazaar.inventory.reserve', { listingId: actor.listingId, expectedRevision: 2, holdId: actor.holdId,
          subjectId: proposal.snapshot.subjectId, revisionHash: proposal.revisionHash,
          expiresAt: new Date(proposal.snapshot.consentDeadline + proposal.snapshot.executionWindowMs).toISOString() })).envelope);
      for (const actor of actors) for (const envelope of reservations) await ingest(actor.app, envelope);
      const consents: SignedEnvelope[] = [];
      for (const actor of actors) consents.push((await actor.app.command<{ envelope: SignedEnvelope }>(
        'mutiny.alpha.consent', { subjectId: proposal.snapshot.subjectId, revisionHash: proposal.revisionHash,
          expectedRevision: (await coordination(actor.app)).revision })).envelope);
      await ingest(owner, consents[1]!);
      const before = await coordination(owner);
      expect(before.data.state).toMatchObject({ status: 'committed', reason: null,
        committedLocallyAt: clock.now(), commitFeasibility: { feasible: true, revisionHash: proposal.revisionHash } });
      const beforeWants = await owner.query<Page<WantRecord>>('mutiny.want.list', {});
      expect(beforeWants.items.map(row => row.id).sort()).toEqual(wants.map(envelope => envelope.cid).sort());
      for (const row of beforeWants.items) {
        expect(row.data.ownerId).toBe(principal);
        expect(codec(wantRepo.type).recordId(row.data)).toBe(row.id);
      }
      expect(codec(coordinationRepo.type).recordId(before.data)).toBe(before.id);
      const beforeInputs = await owner.query<BarterInputs>('mutiny.alpha.inputs', {});
      expect(beforeInputs.holds).toMatchObject([{ id: actors[0]!.holdId, data: { state: 'active' } }]);
      // Only accepted peer coordination evidence drives the real inbox subscriber.
      expect(await owner.drainNotifications()).toBe(false);
      const peerObservations = owner.events.filter(event => event.type === 'mutiny.coordination.observed'
        && (event.payload as { actorId: string }).actorId === peer.principal);
      expect(peerObservations).toHaveLength(2);
      for (const event of peerObservations) expect(event).toMatchObject({ tenantId: principal,
        payload: { subjectId: proposal.snapshot.subjectId, actorId: peer.principal } });
      async function ordinaryViews(app: ReturnType<typeof runtime>) {
        return {
          listings: await app.query<Page<Listing>>('bazaar.listing.list', {}),
          history: await app.query<Page<ListingRevision>>('bazaar.listing_revision.list', { listingId: actors[0]!.listingId }),
          archive: await app.query('bazaar.archive_record.get', { archiveRecordId: archived.archiveRecordId }),
          retained: await app.query<{ items: RetainedListing[]; source: string; staleOrExcluded: number }>(
            'discovery.listing.search', { query: 'Barter item 1', regionCell: 'c2b2q', barterOnly: true }),
          publicLocation: await app.query<LocationView>('discovery.location.get_own', {}),
          privateLocation: await app.query<LocationView>('discovery.location.get_own', { includeHomeCell: true }),
          inbox: await app.query<NotificationPage>('notify.notification.list_mine', { status: 'all' }),
          unread: await app.query('notify.notification.unread_count', {}),
          preferences: await app.query<PreferenceMatrix>('notify.preference.get_matrix', {}),
        };
      }
      const beforeViews = await ordinaryViews(owner);
      expect(beforeViews.listings.items.map(row => row.id).sort()).toEqual([actors[0]!.listingId, archivedListingId].sort());
      expect(beforeViews.history.items).toHaveLength(1);
      expect(beforeViews.archive).toMatchObject({ record: { id: archived.archiveRecordId,
        data: { listingId: archivedListingId, ownerId: principal, status: 'archived' } } });
      expect(beforeViews.retained).toMatchObject({ source: 'locally-retained', staleOrExcluded: 0,
        items: [{ ownerId: peer.principal, listingId: actors[1]!.listingId, cid: listings[1]!.cid }] });
      expect(beforeViews.retained.items).toHaveLength(1);
      expect(beforeViews.publicLocation).toMatchObject({ publicLevel: 'L1', publicCell: 'c2b2' });
      expect(beforeViews.publicLocation).not.toHaveProperty('homeCell5');
      expect(beforeViews.privateLocation).toMatchObject({ homeCell5: 'c2b2q' });
      expect(beforeViews.inbox.items).toHaveLength(1);
      const notice = beforeViews.inbox.items[0]!;
      expect(notice).toMatchObject({ userDid: principal, category: 'cycles', status: 'unread', count: 2,
        templateKey: 'notify.tpl.cycles.coordination_updated', ref: { type: 'cycle', id: before.id },
        sourceEventIds: peerObservations.map(event => event.eventId) });
      expect(beforeViews.unread).toMatchObject({ total: 1, byCategory: { cycles: 1, offers: 0 } });
      expect(beforeViews.preferences.cells).toHaveLength(7);
      expect(beforeViews.preferences.cells.find(cell => cell.category === 'offers')).toMatchObject({ inApp: false, revision: 2 });
      expect(beforeViews.preferences.cells.find(cell => cell.category === 'cycles')).toMatchObject({ inApp: true });
      expect(beforeViews.preferences).toMatchObject({ channelStatus: { push: false, email: false }, mirrorRef: null });
      const dayKey = `${Math.floor(clock.now() / DAY)}/${peer.principal}`;
      const preferenceKey = `edit/${Math.floor(clock.now() / HOUR)}`;
      const notificationState = (session: UnlockedVault) => session.storage.read(tx => ({
        seen: tx.records.query({ tenant: principal, type: inApp.seenRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 20 }),
        day: tx.records.get(principal, inApp.dayRepo.type, dayKey),
        preferences: tx.records.get(principal, preferences.counterRepo.type, preferenceKey),
        diagnostics: tx.records.get(principal, inApp.diagRepo.type, 'counters'),
      }));
      const beforeNotifications = await notificationState(original);
      expect(beforeNotifications.seen.map(row => row.id).sort()).toEqual(peerObservations.map(event => event.eventId).sort());
      for (const row of beforeNotifications.seen) expect(row.data).toEqual({ notificationId: notice.id, at: clock.iso() });
      expect(beforeNotifications.day?.data).toEqual({ count: 2 });
      expect(beforeNotifications.preferences?.data).toEqual({ count: 1 });
      expect(beforeNotifications.diagnostics?.data).toEqual({ created: 1, collapsed: 1, read: 0, dropped: 0, hidden: 0, total: 1 });
      const locationRecord = (session: UnlockedVault) => session.storage.read(tx =>
        tx.records.get<LocationSetting>(principal, locationSettingRepo.type, principal));
      const beforeLocation = await locationRecord(original);
      expect(beforeLocation?.data).toMatchObject({ changeCount24h: 1, changeTimes: [clock.iso()] });
      const { lastChangedAt, ...locationData } = beforeLocation!.data;
      expect(lastChangedAt).toBe(clock.iso());
      // Location's import policy resets its local window; notification counters persist.
      const recoveredLocation = { ...beforeLocation!, data: { ...locationData, changeCount24h: 0, changeTimes: [] } };
      const populatedTypes = [listingRepo.type, listingRevisionRepo.type, publicationRepo.type, inventoryHoldRepo.type,
        retainedListingRepo.type, wantRepo.type, coordinationRepo.type, archiveRecordRepo.type, locationSettingRepo.type,
        inApp.notificationRepo.type, inApp.seenRepo.type, inApp.dayRepo.type, inApp.diagRepo.type,
        preferences.preferenceRepo.type, preferences.counterRepo.type].sort();
      expect(populatedTypes).toHaveLength(15);
      expect(productionBackupCodecs.map(item => item.type).sort()).toEqual(populatedTypes);
      expect((await original.backupCoverage()).recordTypes.map(row => row.type)).toEqual(populatedTypes);
      const coverage = await original.backupCoverage();
      expect(coverage).toMatchObject({ registeredRecordTypes: populatedTypes, unsupportedRecordTypes: [],
        typeLimitExceeded: false, recordLimitExceeded: false });
      expect(coverage.recordTypes.every(row => row.count > 0)).toBe(true);
      const domainRecords = (session: UnlockedVault) => session.storage.read(tx => populatedTypes.flatMap(type =>
        tx.records.query({ tenant: principal, type, filters: [], orderSlot: 0, dir: 'asc', limit: 100 })));
      const beforeRecords = await domainRecords(original);
      expect(beforeRecords).toHaveLength(coverage.recordCount); // The bounded reads must capture every exported domain row.
      const beforeNotificationRecords = beforeRecords.filter(row => row.type.startsWith('notify.'));
      const message = new TextEncoder().encode('barter recovery identity');
      const signature = await original.identity.sign(message);
      const backup = await original.exportBackup(passphrase);
      expect(await coordination(owner)).toEqual(before); // Export preflight must not freeze the live source.
      expect(await ordinaryViews(owner)).toEqual(beforeViews);
      expect(await notificationState(original)).toEqual(beforeNotifications);
      expect(await locationRecord(original)).toEqual(beforeLocation);
      expect(await domainRecords(original)).toEqual(beforeRecords);

      // Signed evidence is genuine, but these two cached terminal reasons are
      // local decisions. Check repeated replay without treating either as signed proof.
      for (const reason of ['reservation_expired', 'local_reservation_lost'] as const) {
        const cached = { ...before.data.state, status: 'frozen' as const, reason };
        const verified = await validateCoordinationRecord(cached);
        expect(verified).toMatchObject({ status: 'frozen', reason });
        expect((await validateCoordinationRecord(verified)).reason).toBe(reason);
      }
      // A real signed terminal cancellation wins over a locally cached reason.
      // The test never grants an unsigned cache reason authority over evidence.
      const withdrawal = await signEnvelope(original.identity, {
        type: WITHDRAWAL_TYPE, createdAt: clock.iso(), seq: 2, prev: opening.cid,
        payload: { subjectId: proposal.snapshot.subjectId, revisionHash: proposal.revisionHash,
          revisionNo: 1, reason: 'cancel' },
      });
      const cachedWithWithdrawal = { ...before.data.state, status: 'frozen' as const,
        reason: 'local_reservation_lost',
        evidence: [...before.data.state.evidence, { envelope: withdrawal, receivedAtLocal: clock.now() }] };
      expect(await validateCoordinationRecord(cachedWithWithdrawal)).toMatchObject({
        status: 'cancelled', reason: 'cancel',
      });

      // Exercise a real loss of the local hold through the ordinary inventory
      // command, then repeat matching-enabled refresh: the reason must not drift
      // to an unrelated conflicting-promise explanation.
      const localHold = beforeInputs.holds.find(row => row.data.ownerId === principal && row.data.state === 'active');
      expect(localHold).toBeDefined();
      await owner.command('bazaar.inventory.release', { holdId: localHold!.id, expectedRevision: localHold!.revision });
      expect(await owner.command('mutiny.coordination.refresh', {})).toEqual({ refreshed: 1 });
      const lostOnce = await coordination(owner);
      expect(lostOnce.data.state).toMatchObject({ status: 'frozen', reason: 'local_reservation_lost' });
      expect(await owner.command('mutiny.coordination.refresh', {})).toEqual({ refreshed: 1 });
      const lostAgain = await coordination(owner);
      expect(lostAgain.data.state).toMatchObject({ status: 'frozen', reason: 'local_reservation_lost' });

      // The independent peer has the same signed reservation/consent chain.
      // Commit it through the normal handler, then advance only its clock:
      // the owner's archived backup remains at the original timestamp.
      await ingest(other, consents[0]!);
      expect((await coordination(other)).data.state.status).toBe('committed');
      const expiredClock = createFakeClock(clock.now() + 2 * DAY);
      const expiredPeer = runtime({ principal: peer.principal, identity: peer, storage: peerStorage },
        expiredClock, peerIds, categoryId);
      expiredPeer.setMatchingPolicy({ enabled: true, blockedOwners: [] });
      expect(await expiredPeer.command('mutiny.coordination.refresh', {})).toEqual({ refreshed: 1 });
      expect((await coordination(expiredPeer)).data.state).toMatchObject({
        status: 'frozen', reason: 'reservation_expired',
      });
      expect(await expiredPeer.command('mutiny.coordination.refresh', {})).toEqual({ refreshed: 1 });
      expect((await coordination(expiredPeer)).data.state).toMatchObject({
        status: 'frozen', reason: 'reservation_expired',
      });
      await original.lock();

      const expected = { ...before, data: { ...before.data, state: { ...before.data.state,
        status: 'frozen', reason: 'restore_requires_review', committedLocallyAt: null, commitFeasibility: null } } };
      // Independent expected exceptions; do not derive the oracle by invoking a restore codec.
      const expectedRecords = beforeRecords.map(row => row.type === coordinationRepo.type
        ? { ...row, data: expected.data } : row.type === locationSettingRepo.type ? recoveredLocation : row);
      const restored = await (await open('barter-recovery-destination')).restoreBackup(backup, passphrase);
      const restoredApp = runtime(restored, clock, ids, categoryId);
      expect(await coordination(restoredApp)).toEqual(expected);
      expect(await restoredApp.query('mutiny.want.list', {})).toEqual(beforeWants);
      expect(await restoredApp.query('mutiny.alpha.inputs', {})).toEqual(beforeInputs);
      expect(await restored.identity.sign(message)).toEqual(signature);
      expect(await domainRecords(restored)).toEqual(expectedRecords);
      expect(await ordinaryViews(restoredApp)).toEqual(beforeViews);
      expect(await notificationState(restored)).toEqual(beforeNotifications);
      expect(await locationRecord(restored)).toEqual(recoveredLocation);
      expect(await restored.backupCoverage()).toEqual(coverage);
      expect(await restoredApp.drainNotifications()).toBe(false);
      // Repeated export preflight normalization retains the review reason and canonical key.
      const normalizedAgain = await codec(coordinationRepo.type).restoreData!(expected.data, principal);
      expect(normalizedAgain).toEqual(expected.data);
      expect(codec(coordinationRepo.type).recordId(normalizedAgain)).toBe(before.id);
      await restored.lock();

      const unlocked = await (await open('barter-recovery-destination')).unlock(passphrase);
      const recovered = runtime(unlocked, clock, ids, categoryId);
      expect(unlocked.principal).toBe(principal);
      expect(await unlocked.identity.sign(message)).toEqual(signature);
      expect(await coordination(recovered)).toEqual(expected);
      expect(await recovered.query('mutiny.want.list', {})).toEqual(beforeWants);
      expect(await recovered.query('mutiny.alpha.inputs', {})).toEqual(beforeInputs);
      expect(await domainRecords(unlocked)).toEqual(expectedRecords);
      expect(await ordinaryViews(recovered)).toEqual(beforeViews);
      expect(await notificationState(unlocked)).toEqual(beforeNotifications);
      expect(await locationRecord(unlocked)).toEqual(recoveredLocation);
      expect(await unlocked.backupCoverage()).toEqual(coverage);
      recovered.setMatchingPolicy({ enabled: true, blockedOwners: [] });
      expect(await recovered.command('mutiny.coordination.refresh', {})).toEqual({ refreshed: 1 });
      const refreshed = await coordination(recovered);
      expect(refreshed.data).toEqual(expected.data);
      expect(refreshed.revision).toBe(before.revision + 1);
      expect((await recovered.query<BarterInputs>('mutiny.alpha.inputs', {})).holds)
        .toMatchObject([{ id: actors[0]!.holdId, data: { state: 'released' } }]);
      expect(await recovered.query('mutiny.want.list', {})).toEqual(beforeWants);
      expect(await recovered.drainNotifications()).toBe(false);
      expect(await ordinaryViews(recovered)).toEqual(beforeViews);
      expect(await notificationState(unlocked)).toEqual(beforeNotifications);
      expect((await domainRecords(unlocked)).filter(row => row.type.startsWith('notify.'))).toEqual(beforeNotificationRecords);

      // Refresh emits no newly accepted peer evidence, including after reopen.
      expect(await recovered.command('mutiny.coordination.refresh', {})).toEqual({ refreshed: 1 });
      expect(await coordination(recovered)).toMatchObject({ revision: before.revision + 2, data: expected.data });
      expect(await recovered.drainNotifications()).toBe(false);
      expect(await ordinaryViews(recovered)).toEqual(beforeViews);
      expect(await notificationState(unlocked)).toEqual(beforeNotifications);
      expect((await domainRecords(unlocked)).filter(row => row.type.startsWith('notify.'))).toEqual(beforeNotificationRecords);
      expect(await locationRecord(unlocked)).toEqual(recoveredLocation);

      // Recovered records must support ordinary owner actions across both modules.
      expect(await recovered.command('notify.notification.mark_read', { notificationId: notice.id, expectedRevision: notice.revision }))
        .toMatchObject({ notificationId: notice.id, status: 'read', revision: notice.revision + 1 });
      const readInbox = { ...beforeViews.inbox, items: [{ ...notice, status: 'read', revision: notice.revision + 1,
        readAt: clock.iso(), updatedAt: clock.iso() }] };
      expect(await recovered.query('notify.notification.list_mine', { status: 'all' })).toEqual(readInbox);
      expect(await recovered.query('notify.notification.unread_count', {})).toMatchObject({ total: 0 });
      const readNotifications = await notificationState(unlocked);
      expect(readNotifications.seen).toEqual(beforeNotifications.seen);
      expect(readNotifications.day).toEqual(beforeNotifications.day);
      expect(readNotifications.preferences).toEqual(beforeNotifications.preferences);
      expect(readNotifications.diagnostics?.data).toEqual({ created: 1, collapsed: 1, read: 1, dropped: 0, hidden: 0, total: 1 });
      await recovered.command('bazaar.listing.restore', { archiveRecordId: archived.archiveRecordId, expectedRevision: 1 });
      expect(await recovered.query<StoredRecord<Listing>>('bazaar.listing.get', { listingId: archivedListingId }))
        .toMatchObject({ revision: 4, data: { status: 'unpublished' } });
      const republished = await recovered.command<{ envelope: SignedEnvelope }>(
        'bazaar.listing.publish', { listingId: archivedListingId, expectedRevision: 4 });
      expect(await verifyEnvelope(republished.envelope, { now: clock.now() })).toMatchObject({ author: principal,
        seq: 3, prev: archived.envelope.cid, payload: { listingId: archivedListingId, ownerId: principal, revision: 5 } });
      expect(await recovered.query('bazaar.listing.publication', { listingId: archivedListingId })).toEqual({ envelope: republished.envelope });
      expect(await recovered.query('bazaar.archive_record.get', { archiveRecordId: archived.archiveRecordId }))
        .toMatchObject({ record: { data: { status: 'restored' } } });
      expect(await recovered.drainNotifications()).toBe(false);
      expect(await recovered.query('notify.notification.list_mine', { status: 'all' })).toEqual(readInbox);
      expect(await notificationState(unlocked)).toEqual(readNotifications);
      expect((await coordination(recovered)).data).toEqual(expected.data);
    } finally {
      peer.lock(); await peerStorage.close();
      for (const vault of vaults) await vault.close();
    }
  }, 30000);

  const reasons = [
    ['restore_requires_review', 'needs manual review', false],
    ['reservation_expired', 'A signed inventory reservation expired', false],
    ['local_reservation_lost', 'The required local inventory reservation is no longer available', false],
    ['conflicting_promise', 'Conflicting signed commitments', true],
    ['fork_detected', 'Conflicting signed proposal revisions', true],
    ['other_local_freeze', 'This coordination is frozen.', false],
  ] as const;
  it.each(reasons)('explains a %s freeze without exposing consent or reservation actions', async (reason, explanation, conflict) => {
    // Schema-valid view fixtures test text and controls only, not signed domain admission.
    const clock = createFakeClock(Date.now());
    const principal = 'view-owner';
    const nodes: NodeStub[] = [];
    vi.stubGlobal('document', {
      createElement(tag: string) { const item = new NodeStub(tag); nodes.push(item); return item; },
      createTextNode(text: string) { const item = new NodeStub(); item.textContent = text; return item; },
    });
    const storage = createMemoryStorage();
    const session: UnlockedVault = { principal, storage,
      identity: { principal, sign: vi.fn(async () => { throw new Error('No signing in a view fixture'); }), lock() {} },
      async lock() { await storage.close(); },
      async exportBackup() { throw new Error('No backup in a view fixture'); },
      async backupCoverage() { throw new Error('No coverage in a view fixture'); },
    };
    const leg = { giverId: principal, receiverId: 'view-peer', inventoryItemId: 'view-item', listingCid: 'view-listing',
      wantCid: 'view-want', valueMinor: '100', currency: 'CAD', distanceBucket: 0, wantCreatedAt: clock.now() };
    const row: StoredRecord<ReturnType<typeof coordinationRepo.schema.parse>> = {
      tenantId: principal, type: coordinationRepo.type, id: 'view-subject', revision: 1,
      createdAt: clock.iso(), updatedAt: clock.iso(), data: { ownerId: principal, state: {
        proposal: { revisionHash: 'view-revision', snapshot: { subjectId: 'view-subject', coordinatorId: principal,
          revisionNo: 1, previousHash: null, createdAt: clock.now(), consentDeadline: clock.now() + HOUR,
          executionWindowMs: DAY, legs: [leg, { ...leg, giverId: 'view-peer', receiverId: principal }] } },
        status: 'frozen', reason, evidence: [{ envelope: { v: 1, type: PROPOSAL_TYPE, cid: 'view-cid', author: principal,
          createdAt: clock.iso(), seq: 1, prev: null, payload: {}, ext: {}, sig: 'view-only-signature' }, receivedAtLocal: clock.now() }],
        consentCids: {}, reservationCids: {}, lastObservedAt: clock.now(), committedLocallyAt: null, commitFeasibility: null,
      } },
    };
    const command = vi.fn(async () => ({ refreshed: 1 }));
    const view = mountBarter({ container: new NodeStub('section') as unknown as HTMLElement, session, command,
      async query(name) {
        if (name === 'mutiny.coordination.list') return { items: [row] };
        if (name === 'mutiny.alpha.inputs') return { listings: [], retained: [], wants: [], holds: [], listingStatements: [], wantStatements: [] };
        throw new Error('Unexpected view query');
      }, action: async fn => { await fn(); }, message() {}, download() {}, refreshListings: async () => {}, setMatchingPolicy() {},
    });
    try {
      await view.refresh();
      const text = nodes.map(item => item.textContent).join('\n');
      expect(text).toContain(explanation);
      if (!conflict) expect(text).not.toContain('Conflicting signed');
      const buttons = nodes.filter(item => item.tag === 'button').map(item => item.textContent);
      expect(buttons).toContain('Download all signed evidence files');
      expect(buttons).not.toContain('I consent to this exact proposal');
      expect(buttons).not.toContain('Reserve my item and download signed claim');
      expect(buttons).not.toContain('Withdraw from this proposal');
      expect(session.identity.sign).not.toHaveBeenCalled();
      expect(command).toHaveBeenCalledOnce();
      expect(command).toHaveBeenCalledWith('mutiny.coordination.refresh', {});
    } finally { view.destroy(); await session.lock(); }
  });
});
