import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createBus, createDeterministicIds, createFakeClock, createMemoryStorage, createRegistry,
  type FakeClock, type IdGen, type Page, type SignedEnvelope, type StoredRecord,
} from '../../packages/kernel/src/index.ts';
import { didFromPublicKey, type UnlockedIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, verifyEnvelope } from '../../packages/federation/src/index.ts';
import { bazaarDefinitions, inventoryHoldRepo, listingRepo, listingRevisionRepo, publicationRepo } from '../../packages/bazaar/src/index.ts';
import { discoveryDefinitions, retainedListingRepo } from '../../packages/discovery/src/index.ts';
import {
  admitSignedGraph, coordinationRepo, discoverCycles, prepareProposal, PROPOSAL_TYPE, WANT_TYPE, wantRepo, validateCoordinationRecord,
  type CoordinationState,
} from '../../packages/mutiny/src/index.ts';
import { openVault, type UnlockedVault, type Vault } from '../../packages/vault/src/index.ts';
import { createBarterRuntime, type BarterInputs } from '../../apps/pwa/src/barter-runtime.ts';
import { mountBarter } from '../../apps/pwa/src/barter.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';
import { NodeStub } from '../support/node-stub.ts';

const HOUR = 3600000;
const DAY = 24 * HOUR;
const passphrase = 'production barter recovery acceptance passphrase';
type CoordinationRecord = { ownerId: string; state: CoordinationState };
type WantRecord = { ownerId: string; envelope: SignedEnvelope; receivedAtLocal: number };

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
  const registry = createRegistry().add(...barter.definitions,
    ...bazaarDefinitions({ categoryAllowed: id => id === categoryId,
      signProjection: async (type, payload, seq, prev) => ({
        ...await signEnvelope(session.identity, { type, payload, seq, prev, createdAt: clock.iso() }),
      }), verifyProjection: input => verifyEnvelope(input, { now: clock.now() }),
    }).all,
    ...discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now: clock.now() }) }).all,
  );
  const bus = createBus({ registry, storage: session.storage, clock, ids,
    authz: { authorize: (actor, _capability, _resource, context) =>
      actor.kind === 'user' && actor.id === session.principal && context.tenantId === session.principal
        ? { allow: true } : { allow: false, code: 'FORBIDDEN' } },
  });
  const context = { actor: { kind: 'user' as const, id: session.principal, roles: ['member'] }, tenantId: session.principal };
  return {
    setMatchingPolicy: barter.setMatchingPolicy,
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
      const populatedTypes = [listingRepo.type, listingRevisionRepo.type, publicationRepo.type, inventoryHoldRepo.type,
        retainedListingRepo.type, wantRepo.type, coordinationRepo.type].sort();
      expect((await original.backupCoverage()).recordTypes.map(row => row.type)).toEqual(populatedTypes);
      const message = new TextEncoder().encode('barter recovery identity');
      const signature = await original.identity.sign(message);
      const backup = await original.exportBackup(passphrase);
      expect(await coordination(owner)).toEqual(before); // Export preflight must not freeze the live source.

      // Signed evidence is genuine, but these two cached terminal reasons are
      // local decisions. Check repeated replay without treating either as signed proof.
      for (const reason of ['reservation_expired', 'local_reservation_lost'] as const) {
        const cached = { ...before.data.state, status: 'frozen' as const, reason };
        const verified = await validateCoordinationRecord(cached);
        expect(verified).toMatchObject({ status: 'frozen', reason });
        expect((await validateCoordinationRecord(verified)).reason).toBe(reason);
      }

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
      await original.lock();

      const expected = { ...before, data: { ...before.data, state: { ...before.data.state,
        status: 'frozen', reason: 'restore_requires_review', committedLocallyAt: null, commitFeasibility: null } } };
      const restored = await (await open('barter-recovery-destination')).restoreBackup(backup, passphrase);
      const restoredApp = runtime(restored, clock, ids, categoryId);
      expect(await coordination(restoredApp)).toEqual(expected);
      expect(await restoredApp.query('mutiny.want.list', {})).toEqual(beforeWants);
      expect(await restoredApp.query('mutiny.alpha.inputs', {})).toEqual(beforeInputs);
      expect(await restored.identity.sign(message)).toEqual(signature);
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
      recovered.setMatchingPolicy({ enabled: true, blockedOwners: [] });
      expect(await recovered.command('mutiny.coordination.refresh', {})).toEqual({ refreshed: 1 });
      const refreshed = await coordination(recovered);
      expect(refreshed.data).toEqual(expected.data);
      expect(refreshed.revision).toBe(before.revision + 1);
      expect((await recovered.query<BarterInputs>('mutiny.alpha.inputs', {})).holds)
        .toMatchObject([{ id: actors[0]!.holdId, data: { state: 'released' } }]);
      expect(await recovered.query('mutiny.want.list', {})).toEqual(beforeWants);
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
