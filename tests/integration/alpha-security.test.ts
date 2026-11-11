import { beforeAll, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { createMemoryDriver } from '../../packages/kernel/src/storage/memory-driver.ts';
import { createStorage } from '../../packages/kernel/src/storage/storage.ts';
import { ok } from '../../packages/kernel/src/errors/result.ts';
import { createIdentity, unlockIdentity, seal, unseal, type UnlockedIdentity, type ProtectedIdentity } from '../../packages/identity/src/identity.ts';
import { signEnvelope, verifyEnvelope, strictCanonicalJson, MAX_ENVELOPE_BYTES, type Envelope } from '../../packages/federation/src/envelope.ts';
import { createTestKernel } from '../../packages/kernel/src/testing/harness.ts';
import { discoveryDefinitions, publicListingSchema, retainedListingRepo, validateRetainedRecord, type PublicListingProjection, type RetainedListing } from '../../packages/discovery/src/search/index.ts';
import { bazaarDefinitions } from '../../packages/bazaar/src/listings/index.ts';
import { createBarterRuntime, barterCodecs } from '../../apps/pwa/src/barter-runtime.ts';
import { admitSignedGraph, WANT_TYPE } from '../../packages/mutiny/src/cycle_matching/admission.ts';
import { openVault, backupCodec, type BackupCodec } from '../../packages/vault/src/vault.ts';
import { prepareProposal, openCoordination, ingestCoordination, PROPOSAL_TYPE, CONSENT_TYPE, RESERVATION_TYPE, WITHDRAWAL_TYPE } from '../../packages/mutiny/src/trade_proposals/index.ts';
import { validateCoordinationRecord } from '../../packages/mutiny/src/trade_proposals/repository.ts';

const now = Date.parse('2026-11-09T12:00:00.000Z');
const indexes = [null, null, null, null] as const;
const record = (tenant: string, id: string, title: string, expectedRevision = 0) => ({
  tenant, type: 'test.listing', id, data: { title }, idx: indexes, expectedRevision, now,
});

describe('independent signed-statement security', () => {
  let alice: UnlockedIdentity;
  let bob: UnlockedIdentity;
  let protectedAlice: ProtectedIdentity;
  let original: Envelope;
  const passphrase = 'a sufficiently long test passphrase';
  beforeAll(async () => {
    const a = await createIdentity(passphrase);
    const b = await createIdentity(passphrase);
    alice = a.identity;
    bob = b.identity;
    protectedAlice = a.protectedIdentity;
    original = await signEnvelope(alice, { type: 'classrup.bazaar.listing/v1', createdAt: new Date(now).toISOString(),
      seq: 1, prev: null, payload: { ownerId: alice.principal, title: 'Original listing' } });
  }, 30_000);

  it('rejects a mathematically valid statement when its signer lacks the expected role', async () => {
    const unauthorized = await signEnvelope(bob, { type: 'classrup.bazaar.listing/v1', createdAt: new Date(now).toISOString(),
      seq: 1, prev: null, payload: { ownerId: alice.principal, title: 'Impersonated listing' } });
    await expect(verifyEnvelope(unauthorized, { expectedAuthor: alice.principal, now })).rejects.toThrow('Unauthorized author');
  });

  it('rejects signature, payload, author, type, and CID substitution', async () => {
    const replacements: Partial<Envelope>[] = [
      { payload: { ownerId: alice.principal, title: 'Changed listing' } },
      { author: bob.principal }, { type: 'classrup.federation.tombstone/v1' },
      { cid: `sha256-${'0'.repeat(64)}` },
      { sig: `${original.sig[0] === 'A' ? 'B' : 'A'}${original.sig.slice(1)}` },
    ];
    for (const replacement of replacements) await expect(verifyEnvelope({ ...original, ...replacement }, { now })).rejects.toThrow();
  });

  it('detaches input before asynchronous verification and returns immutable evidence', async () => {
    const callerCopy = JSON.parse(JSON.stringify(original)) as { payload: { title: string } } & Envelope;
    const pending = verifyEnvelope(callerCopy, { now });
    callerCopy.payload.title = 'Race after verification begins';
    const verified = await pending;
    expect(verified.payload).toEqual(original.payload);
    expect(Object.isFrozen(verified)).toBe(true);
    expect(Object.isFrozen(verified.payload)).toBe(true);
  });

  it('rejects unsupported versions, broken chains, future claims and stale statements', async () => {
    await expect(verifyEnvelope({ ...original, v: 2 }, { now })).rejects.toThrow();
    await expect(verifyEnvelope({ ...original, seq: 2, prev: null }, { now })).rejects.toThrow();
    await expect(verifyEnvelope(original, { now: now - 300_001 })).rejects.toThrow('validity window');
    await expect(verifyEnvelope(original, { now: now + 1001, maxAgeMs: 1000 })).rejects.toThrow('validity window');
  });

  it('does not unlock a private key under a substituted principal', async () => {
    await expect(unlockIdentity({ ...protectedAlice, principal: bob.principal }, passphrase)).rejects.toThrow('Identity key mismatch');
  });

  it('rejects wrong recovery material and invalid KDF parameters', async () => {
    await expect(unlockIdentity(protectedAlice, 'another long incorrect passphrase')).rejects.toThrow('Incorrect passphrase');
    await expect(unlockIdentity({ ...protectedAlice, secret: { ...protectedAlice.secret, kdf: 'scrypt-1-1-1' } }, passphrase)).rejects.toThrow('Unsupported encrypted format');
  });

  it('revokes signing capability after lock', async () => {
    const unlocked = await unlockIdentity(protectedAlice, passphrase);
    unlocked.lock();
    await expect(unlocked.sign(new Uint8Array([1]))).rejects.toThrow('locked');
  });

  it('rejects ambiguous or excessive JSON before signing', () => {
    let getterCalled = false;
    const getter = Object.defineProperty({}, 'x', { enumerable: true, get() { getterCalled = true; return 1; } });
    const cycle: { x?: unknown } = {}; cycle.x = cycle;
    const nonJson = [undefined, { a: undefined }, NaN, Infinity, { bad: '\ud800' }, new Array(2), getter, cycle,
      { excessive: 'x'.repeat(MAX_ENVELOPE_BYTES + 1) }, new Date()];
    for (const value of nonJson) expect(() => strictCanonicalJson(value)).toThrow();
    expect(getterCalled).toBe(false);
  });

  function projection(): PublicListingProjection {
    return publicListingSchema.parse({ listingId: '019a685b-0200-7000-8000-000000000001', ownerId: alice.principal, revision: 1,
      kind: 'giveaway', title: 'Winter jacket', description: 'Clean winter jacket for exchanging.',
      categoryId: '019a685b-0200-7000-8000-000000000002', condition: 'good', tags: [], locale: 'en',
      regionCell: 'c2b2', barterOptIn: true, availability: 'available', expiresAt: new Date(now + 86400000).toISOString() });
  }
  const statement = (signer: UnlockedIdentity, payload: unknown) => signEnvelope(signer, {
    type: 'classrup.bazaar.listing/v1', createdAt: new Date(now).toISOString(), seq: 1, prev: null, payload,
  });

  it('discovery refuses a valid signature from somebody other than the listing owner and refuses private fields', async () => {
    const definitions = discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now }) });
    const kernel = createTestKernel({ start: now, definitions: definitions.all });
    try {
      const forgedOwnership = await statement(bob, projection());
      const privateLeak = await statement(alice, { ...projection(), privateNotes: 'Do not publish' });
      for (const envelope of [forgedOwnership, privateLeak]) {
        expect((await kernel.cmd('discovery.listing.retain', { envelope })).ok).toBe(false);
      }
      const result = await kernel.ask('discovery.listing.search', {});
      expect(result.ok && result.value.value).toMatchObject({ items: [] });
    } finally { await kernel.storage.close(); }
  });

  it('freezes discovery on two signed listing versions at the same revision and preserves both evidence envelopes', async () => {
    const definitions = discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now }) });
    const kernel = createTestKernel({ start: now, definitions: definitions.all });
    try {
      const first = await statement(alice, projection());
      const fork = await statement(alice, { ...projection(), title: 'Conflicting jacket' });
      expect((await kernel.cmd('discovery.listing.retain', { envelope: first })).ok).toBe(true);
      expect((await kernel.cmd('discovery.listing.retain', { envelope: first })).ok).toBe(true);
      const conflict = await kernel.cmd('discovery.listing.retain', { envelope: fork });
      expect(conflict.ok && conflict.value.value).toMatchObject({ state: 'conflicted' });
      const search = await kernel.ask('discovery.listing.search', {});
      expect(search.ok && search.value.value).toMatchObject({ items: [] });
      const retained = await kernel.storage.read(tx => tx.records.get<RetainedListing>(kernel.tenantId,
        'discovery.retained_listing', `${alice.principal}/${projection().listingId}`));
      expect(retained?.data.envelopes).toHaveLength(2);
      for (const envelope of retained?.data.envelopes ?? []) await expect(verifyEnvelope(envelope, { now })).resolves.toBeDefined();
    } finally { await kernel.storage.close(); }
  });

  it('retains the verified evidence snapshot when a caller mutates the input during asynchronous verification', async () => {
    let verifiedSignal: () => void = () => undefined;
    const verified = new Promise<void>(resolve => { verifiedSignal = resolve; });
    let continueSignal: () => void = () => undefined;
    const proceed = new Promise<void>(resolve => { continueSignal = resolve; });
    const definitions = discoveryDefinitions({ verifyEnvelope: async input => {
      const result = await verifyEnvelope(input, { now });
      verifiedSignal();
      await proceed;
      return result;
    } });
    const kernel = createTestKernel({ start: now, definitions: definitions.all });
    try {
      const input = JSON.parse(JSON.stringify(await statement(alice, projection()))) as Envelope & { payload: { title: string } };
      const importing = kernel.cmd('discovery.listing.retain', { envelope: input });
      await verified;
      input.payload.title = 'Tampered after crypto verification';
      continueSignal();
      expect((await importing).ok).toBe(true);
      const retained = await kernel.storage.read(tx => tx.records.get<RetainedListing>(kernel.tenantId,
        'discovery.retained_listing', `${alice.principal}/${projection().listingId}`));
      expect(retained?.data.envelopes).toHaveLength(1);
      await expect(verifyEnvelope(retained?.data.envelopes[0], { now })).resolves.toMatchObject({ payload: { title: 'Winter jacket' } });
    } finally { continueSignal(); await kernel.storage.close(); }
  });

  it('restores an encrypted signed backup and rejects a bad later record without initializing the target', async () => {
    const codec: BackupCodec = { type: 'test.listing', indexes: () => indexes, parse(input) {
      if (!input || typeof input !== 'object' || !('title' in input) || typeof input.title !== 'string') throw new Error('Invalid title');
      return input;
    } };
    const indexedDB = new IDBFactory();
    const source = await openVault({ name: 'independent-backup-source', indexedDB, codecs: [codec] });
    const goodTarget = await openVault({ name: 'independent-backup-target', indexedDB, codecs: [codec] });
    const badTarget = await openVault({ name: 'independent-backup-reject', indexedDB, codecs: [codec] });
    try {
      const unlocked = await source.create(passphrase);
      await unlocked.storage.transaction(tx => tx.records.put(record(unlocked.principal, 'one', 'Original')));
      const backup = await unlocked.exportBackup(passphrase);
      const restored = await goodTarget.restoreBackup(backup, passphrase);
      expect(restored.principal).toBe(unlocked.principal);
      expect(await restored.storage.read(tx => tx.records.get(restored.principal, 'test.listing', 'one')?.data)).toEqual({ title: 'Original' });
      const bytes = await unseal(backup, passphrase);
      const manifest = JSON.parse(new TextDecoder().decode(bytes)) as Envelope & { payload: { records: object[] } };
      bytes.fill(0);
      manifest.payload.records.push({ ...manifest.payload.records[0], id: 'two', data: { title: 42 } });
      const changed = await signEnvelope(unlocked.identity, { type: manifest.type, createdAt: manifest.createdAt, seq: 1, prev: null, payload: manifest.payload });
      const invalidBackup = await seal(new TextEncoder().encode(JSON.stringify(changed)), passphrase);
      await expect(badTarget.restoreBackup(invalidBackup, passphrase)).rejects.toThrow('Invalid title');
      expect(await badTarget.isInitialized()).toBe(false);
    } finally { await source.close(); await goodTarget.close(); await badTarget.close(); }
  });

  it('locking a vault during an awaited write rolls the write back before closing persistent storage', async () => {
    const indexedDB = new IDBFactory();
    const name = 'independent-lock-race';
    const vault = await openVault({ name, indexedDB });
    const unlocked = await vault.create(passphrase);
    let enteredSignal: () => void = () => undefined;
    const entered = new Promise<void>(resolve => { enteredSignal = resolve; });
    let releaseSignal: () => void = () => undefined;
    const release = new Promise<void>(resolve => { releaseSignal = resolve; });
    const write = unlocked.storage.transaction(async tx => {
      const result = tx.records.put(record(unlocked.principal, 'race', 'Must not commit'));
      enteredSignal();
      await release;
      return result;
    });
    await entered;
    const rejected = expect(write).rejects.toThrow();
    const locking = unlocked.lock();
    releaseSignal();
    await rejected;
    await locking;
    const reopened = await openVault({ name, indexedDB });
    try {
      const session = await reopened.unlock(passphrase);
      expect(await session.storage.read(tx => tx.records.get(session.principal, 'test.listing', 'race'))).toBeUndefined();
    } finally { await reopened.close(); }
  });

  it('rejects a forged peer projection inside a correctly signed and encrypted local backup', async () => {
    const peerProjection = { ...projection(), ownerId: bob.principal };
    const peerEnvelope = await statement(bob, peerProjection);
    const retained: RetainedListing = { ownerId: bob.principal, listingId: peerProjection.listingId,
      remoteRevision: 1, cid: peerEnvelope.cid, envelopes: [peerEnvelope], projection: peerProjection,
      observedAt: new Date(now).toISOString(), conflicted: false, evidenceCids: [peerEnvelope.cid] };
    const verify = (input: unknown) => verifyEnvelope(input, { now });
    await expect(validateRetainedRecord(retained, verify)).resolves.toBeUndefined();
    const forged = { ...retained, projection: { ...peerProjection, title: 'Forged by backup owner' } };
    await expect(validateRetainedRecord(forged, verify)).rejects.toThrow('differs from signed evidence');
    const codec = { ...backupCodec(retainedListingRepo), validate: (input: unknown) => validateRetainedRecord(input, verify) };
    const target = await openVault({ name: 'independent-forged-peer-backup', indexedDB: new IDBFactory(), codecs: [codec] });
    try {
      const timestamp = new Date().toISOString();
      const manifest = await signEnvelope(alice, { type: 'classrup.vault.alpha_backup/v1', createdAt: timestamp, seq: 1, prev: null,
        payload: { principal: alice.principal, protectedIdentity: protectedAlice, recordTypes: [retainedListingRepo.type], records: [
          { tenantId: alice.principal, type: retainedListingRepo.type, id: `${bob.principal}/${peerProjection.listingId}`,
            revision: 1, data: forged, createdAt: timestamp, updatedAt: timestamp },
        ] } });
      const encrypted = await seal(new TextEncoder().encode(JSON.stringify(manifest)), passphrase);
      await expect(target.restoreBackup(encrypted, passphrase)).rejects.toThrow('differs from signed evidence');
      expect(await target.isInitialized()).toBe(false);
    } finally { await target.close(); }
  });

  it('does not trust a restored feasibility boolean to mark authentic consent evidence committed', async () => {
    const leg = (giver: UnlockedIdentity, receiver: UnlockedIdentity, suffix: string) => ({ giverId: giver.principal,
      receiverId: receiver.principal, inventoryItemId: `item-${suffix}`, listingCid: `listing-${suffix}`,
      wantCid: `want-${suffix}`, valueMinor: '100', currency: 'CAD', distanceBucket: 0, wantCreatedAt: now - 3600000 });
    const proposal = await prepareProposal({ subjectId: 'independent-cached-feasibility', coordinatorId: alice.principal,
      revisionNo: 1, previousHash: null, legs: [leg(alice, bob, 'a'), leg(bob, alice, 'b')], createdAt: now,
      consentDeadline: now + 3600000, executionWindowMs: 86400000 }, now);
    const signed = (identity: UnlockedIdentity, type: string, payload: unknown) => signEnvelope(identity, {
      type, payload, createdAt: new Date(now).toISOString(), seq: 1, prev: null,
    });
    let state = await openCoordination(await signed(alice, PROPOSAL_TYPE, proposal.snapshot), alice.principal, now);
    for (const [identity, suffix] of [[alice, 'a'], [bob, 'b']] as const) {
      state = await ingestCoordination(state, await signed(identity, RESERVATION_TYPE, {
        subjectId: proposal.snapshot.subjectId, revisionHash: proposal.revisionHash, giverId: identity.principal,
        itemId: `item-${suffix}`, expiresAt: new Date(now + 3600000 + 86400000).toISOString(), holdId: `hold-${suffix}`,
      }), now);
      state = await ingestCoordination(state, await signed(identity, CONSENT_TYPE, {
        subjectId: proposal.snapshot.subjectId, revisionHash: proposal.revisionHash, revisionNo: 1,
      }), now);
    }
    const cached = { ...state, status: 'committed', committedLocallyAt: now,
      commitFeasibility: { revisionHash: proposal.revisionHash, checkedAt: now, feasible: true } };
    const recovered = await validateCoordinationRecord(cached);
    expect(recovered.status).not.toBe('committed');
    expect(recovered.commitFeasibility).toBeNull();
    expect(recovered.committedLocallyAt).toBeNull();
    const codec = barterCodecs.find(entry => entry.type === 'mutiny.coordination');
    if (!codec) throw new Error('Missing production coordination backup codec');
    const target = await openVault({ name: 'independent-coordination-normalization', indexedDB: new IDBFactory(), codecs: [codec] });
    try {
      const timestamp = new Date().toISOString();
      const manifest = await signEnvelope(alice, { type: 'classrup.vault.alpha_backup/v1', createdAt: timestamp, seq: 1, prev: null,
        payload: { principal: alice.principal, protectedIdentity: protectedAlice, recordTypes: ['mutiny.coordination'], records: [{
          tenantId: alice.principal, type: 'mutiny.coordination', id: proposal.snapshot.subjectId, revision: 1,
          data: { ownerId: alice.principal, state: cached }, createdAt: timestamp, updatedAt: timestamp,
        }] } });
      const backup = await seal(new TextEncoder().encode(JSON.stringify(manifest)), passphrase);
      const restored = await target.restoreBackup(backup, passphrase);
      const stored = await restored.storage.read(tx => tx.records.get<{ state: { status: string; commitFeasibility: unknown } }>(
        alice.principal, 'mutiny.coordination', proposal.snapshot.subjectId));
      expect(stored?.data.state.status).not.toBe('committed');
      expect(stored?.data.state.commitFeasibility).toBeNull();
    } finally { await target.close(); }
  });

  it('does not commit after the local hold is released even when all signed consents and reservation statements exist', async () => {
    const verify = (input: unknown) => verifyEnvelope(input, { now });
    const signed = (identity: UnlockedIdentity, type: string, payload: unknown, seq = 1, prev: string | null = null) => signEnvelope(identity, {
      type, payload, seq, prev, createdAt: new Date(now - 3600000).toISOString(),
    });
    const bazaar = bazaarDefinitions({ categoryAllowed: () => true, verifyProjection: verify,
      signProjection: async (type, payload, seq, prev) => ({ ...await signed(alice, type, payload, seq, prev) }) });
    const runtime = createBarterRuntime({ principal: alice.principal, identity: alice });
    runtime.setMatchingPolicy({ enabled: true, blockedOwners: [] });
    const kernel = createTestKernel({ start: now, definitions: [...bazaar.all, ...discoveryDefinitions({ verifyEnvelope: verify }).all,
      ...runtime.definitions] });
    const actor = { kind: 'user' as const, id: alice.principal, roles: ['member'] };
    const cmd = (name: string, input: unknown) => kernel.cmd(name, input, { actor });
    try {
      const localId = projection().listingId;
      expect((await cmd('bazaar.listing.create', { listingId: localId, title: 'Winter jacket', description: 'A useful winter jacket.',
        kind: 'giveaway', condition: 'good', categoryId: projection().categoryId, regionCell: 'c2b2q', barterOptIn: true,
        value: { amount: '100', currency: 'CAD' } })).ok).toBe(true);
      const publication = await cmd('bazaar.listing.publish', { listingId: localId, expectedRevision: 1 });
      expect(publication.ok).toBe(true);
      if (!publication.ok) throw new Error('Publication failed');
      const local = (publication.value.value as { envelope: Envelope }).envelope;
      const peerId = '019a685b-0200-7000-8000-000000000003';
      const peer = await signed(bob, local.type, { ...projection(), listingId: peerId, ownerId: bob.principal,
        regionCell: 'c2b2q', value: { amount: '100', currency: 'CAD' }, expiresAt: new Date(now + 3 * 86400000).toISOString() });
      expect((await cmd('discovery.listing.retain', { envelope: peer })).ok).toBe(true);
      const wa = await signed(alice, WANT_TYPE, { offeringListingCid: local.cid, requestedListingCid: peer.cid, expiresAt: new Date(now + 3 * 86400000).toISOString() });
      const wb = await signed(bob, WANT_TYPE, { offeringListingCid: peer.cid, requestedListingCid: local.cid, expiresAt: new Date(now + 3 * 86400000).toISOString() });
      for (const envelope of [wa, wb]) expect((await cmd('mutiny.want.retain', { envelope })).ok).toBe(true);
      const graph = await admitSignedGraph([local, peer], [wa, wb], { now, localPrincipal: alice.principal, optedIn: true, includeUnknownIdentities: true });
      expect(graph.edges).toHaveLength(2);
      const subjectId = '019a685b-0200-7000-8000-000000000004';
      const proposal = await prepareProposal({ subjectId, coordinatorId: alice.principal, revisionNo: 1, previousHash: null,
        legs: graph.edges, createdAt: now - 3600000, consentDeadline: now + 3600000, executionWindowMs: 86400000 }, now);
      let revision = 0;
      async function ingest(envelope: Envelope) {
        const result = await cmd('mutiny.coordination.ingest', { envelope, expectedRevision: revision });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(`Coordination failed: ${result.error.code}`);
        revision++;
        return result.value.value as { data: { state: { status: string } } };
      }
      await ingest(await signed(alice, PROPOSAL_TYPE, proposal.snapshot));
      const consentInput = { subjectId, revisionHash: proposal.revisionHash, expectedRevision: revision };
      // The real runtime command must not sign a consent without both explicit policy and a real hold.
      runtime.setMatchingPolicy({ enabled: false, blockedOwners: [] });
      expect((await cmd('mutiny.alpha.consent', consentInput)).ok).toBe(false);
      runtime.setMatchingPolicy({ enabled: true, blockedOwners: [] });
      expect((await cmd('mutiny.alpha.consent', consentInput)).ok).toBe(false);
      const holdId = '019a685b-0200-7000-8000-000000000005';
      const expiresAt = new Date(proposal.snapshot.consentDeadline + proposal.snapshot.executionWindowMs).toISOString();
      const reservation = await cmd('bazaar.inventory.reserve', { listingId: localId, expectedRevision: 2,
        holdId, subjectId, revisionHash: proposal.revisionHash, expiresAt });
      expect(reservation.ok).toBe(true);
      if (!reservation.ok) throw new Error('Reservation failed');
      await ingest((reservation.value.value as { envelope: Envelope }).envelope);
      runtime.setMatchingPolicy({ enabled: true, blockedOwners: [bob.principal] });
      expect((await cmd('mutiny.alpha.consent', { ...consentInput, expectedRevision: revision })).ok).toBe(false);
      runtime.setMatchingPolicy({ enabled: true, blockedOwners: [] });
      const ownConsent = await cmd('mutiny.alpha.consent', { ...consentInput, expectedRevision: revision });
      expect(ownConsent.ok).toBe(true);
      if (!ownConsent.ok) throw new Error('Local consent failed');
      const consentEnvelope = (ownConsent.value.value as { envelope: Envelope }).envelope;
      await expect(verify(consentEnvelope)).resolves.toMatchObject({ author: alice.principal, type: CONSENT_TYPE });
      revision++;
      expect((await cmd('bazaar.inventory.release', { holdId, expectedRevision: 1 })).ok).toBe(true);
      await ingest(await signed(bob, RESERVATION_TYPE, { subjectId, revisionHash: proposal.revisionHash,
        giverId: bob.principal, itemId: peerId, expiresAt, holdId: 'peer-hold' }));
      const last = await ingest(await signed(bob, CONSENT_TYPE, { subjectId, revisionHash: proposal.revisionHash, revisionNo: 1 }));
      expect(last.data.state.status).not.toBe('committed');
      // Positive control: the same authenticated graph/evidence can commit once a real local hold exists again.
      const renewed = await cmd('bazaar.inventory.reserve', { listingId: localId, expectedRevision: 2,
        holdId: '019a685b-0200-7000-8000-000000000006', subjectId, revisionHash: proposal.revisionHash, expiresAt });
      expect(renewed.ok).toBe(true);
      if (!renewed.ok) throw new Error('Renewed reservation failed');
      const committed = await ingest((renewed.value.value as { envelope: Envelope }).envelope);
      expect(committed.data.state.status).toBe('committed');
      kernel.clock.set(proposal.snapshot.consentDeadline + 1);
      const dropout = await signEnvelope(alice, { type: WITHDRAWAL_TYPE, createdAt: kernel.clock.iso(), seq: 1, prev: null,
        payload: { subjectId, revisionHash: proposal.revisionHash, revisionNo: 1, reason: 'dropout' } });
      const withdrawn = await ingest(dropout);
      expect(withdrawn.data.state.status).toBe('cancelled');
    } finally { await kernel.storage.close(); }
  });
});

describe('independent alpha persistence security', () => {
  it('rolls back an earlier restored record when a later revision conflicts, including after reopen', async () => {
    const indexedDB = new IDBFactory();
    const name = 'independent-restore-atomicity';
    const storage = await openIndexedDbStorage({ name, indexedDB });
    try {
      expect((await storage.transaction(tx => tx.records.put(record('alice', 'existing', 'original')))).ok).toBe(true);
      const imported = await storage.transaction(tx => {
        const first = tx.records.restore({ tenantId: 'alice', type: 'test.listing', id: 'new', revision: 2,
          data: { title: 'must roll back' }, createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() }, indexes);
        if (!first.ok) return first;
        return tx.records.restore({ tenantId: 'alice', type: 'test.listing', id: 'existing', revision: 3,
          data: { title: 'must not replace' }, createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() }, indexes);
      });
      expect(imported.ok).toBe(false);
      expect(await storage.read(tx => tx.records.get('alice', 'test.listing', 'new'))).toBeUndefined();
    } finally { await storage.close(); }
    const reopened = await openIndexedDbStorage({ name, indexedDB });
    try {
      expect(await reopened.read(tx => tx.records.get('alice', 'test.listing', 'new'))).toBeUndefined();
      expect(await reopened.read(tx => tx.records.get('alice', 'test.listing', 'existing')?.data)).toEqual({ title: 'original' });
    } finally { await reopened.close(); }
  });

  it('keeps identical record IDs in separate principal databases isolated across reopen', async () => {
    const indexedDB = new IDBFactory();
    for (const principal of ['alice', 'bob']) {
      const storage = await openIndexedDbStorage({ name: `independent-vault:${principal}`, indexedDB });
      try {
        expect((await storage.transaction(tx => tx.records.put(record(principal, 'same-id', principal)))).ok).toBe(true);
      } finally { await storage.close(); }
    }
    const alice = await openIndexedDbStorage({ name: 'independent-vault:alice', indexedDB });
    try {
      expect(await alice.read(tx => tx.records.get('alice', 'test.listing', 'same-id')?.data)).toEqual({ title: 'alice' });
      expect(await alice.read(tx => tx.records.get('bob', 'test.listing', 'same-id'))).toBeUndefined();
    } finally { await alice.close(); }
  });

  it('does not leave partial working-set changes after a persistence quota failure', async () => {
    let fail = false;
    const storage = createStorage(createMemoryDriver({ persist: async () => {
      if (fail) throw new DOMException('Quota reached', 'QuotaExceededError');
    } }));
    try {
      await storage.transaction(tx => tx.records.put(record('alice', 'existing', 'original')));
      fail = true;
      await expect(storage.transaction(tx => {
        const edited = tx.records.put(record('alice', 'existing', 'changed', 1));
        if (!edited.ok) return edited;
        const inserted = tx.records.put(record('alice', 'new', 'new'));
        return inserted.ok ? ok(true) : inserted;
      })).rejects.toMatchObject({ name: 'QuotaExceededError' });
      expect(await storage.read(tx => tx.records.get('alice', 'test.listing', 'existing')?.revision)).toBe(1);
      expect(await storage.read(tx => tx.records.get('alice', 'test.listing', 'existing')?.data)).toEqual({ title: 'original' });
      expect(await storage.read(tx => tx.records.get('alice', 'test.listing', 'new'))).toBeUndefined();
      fail = false;
      expect((await storage.transaction(tx => tx.records.put(record('alice', 'existing', 'recovered', 1)))).ok).toBe(true);
    } finally { await storage.close(); }
  });
});
