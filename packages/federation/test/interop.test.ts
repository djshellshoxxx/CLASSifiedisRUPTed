import { describe, expect, it } from 'vitest';
import { ANONYMOUS, DomainError } from '@classrup/kernel';
import { generateSigningKeyPair, keyIdOf, signEnvelope } from '@classrup/security';
import type { BlockDto, BlocklistPayload, MigrationDto, PeerDto, ReceiveResult } from '../src/index';
import { BLOCKLIST_CONTEXT, signRecord, verifyAuthor, verifyCountersign } from '../src/index';
import type { Fixture } from './helpers';
import { admin, author, fixture, LOCAL, migrationProof, remoteBatch, REMOTE, RID } from './helpers';
import type { FederatedEnvelope } from '../src/index';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : String(e);
  }
  return undefined;
};

describe('trust (F11.S03.M01)', () => {
  const register = (f: Fixture, relayId = REMOTE, keyId = f.remote.keyId) => f.call<PeerDto>('federation.peer.register', admin, { relayId, publicKeyId: keyId });

  it('walks pending -> trusted -> suspended -> blocked and back through pending only', () => {
    const f = fixture();
    const peer = register(f);
    expect(peer).toMatchObject({ status: 'pending', publicKeyId: f.remote.keyId, limits: { recordsPerMinute: 600 } });
    const to = (status: string, expectedVersion?: number) => f.call<PeerDto>('federation.peer.transition', admin, { peerId: peer.id, status, ...(expectedVersion !== undefined ? { expectedVersion } : {}) });
    expect(code(() => to('suspended'))).toBe('FEDERATION_PEER.INVALID_TRANSITION');
    const trusted = to('trusted');
    expect(code(() => to('trusted', 99))).toBe('FEDERATION_PEER.INVALID_TRANSITION');
    expect(code(() => to('suspended', 99))).toBe('STORE.VERSION_CONFLICT');
    to('suspended', trusted.version);
    to('trusted');
    to('blocked');
    expect(code(() => to('trusted'))).toBe('FEDERATION_PEER.INVALID_TRANSITION');
    expect(to('pending').status).toBe('pending');
    expect(f.deps.store.events.read().filter((e) => e.event.type === 'federation.peer.status_changed')).toHaveLength(5);
  });

  it('pins the key: rotation resets trust and unblocked state is required first', () => {
    const f = fixture();
    const peer = register(f);
    f.call('federation.peer.transition', admin, { peerId: peer.id, status: 'trusted' });
    const newKey = keyIdOf(generateSigningKeyPair().publicKey);
    expect(f.call<PeerDto>('federation.peer.rotate_key', admin, { peerId: peer.id, publicKeyId: newKey })).toMatchObject({ status: 'pending', publicKeyId: newKey });
    f.call('federation.peer.transition', admin, { peerId: peer.id, status: 'blocked' });
    expect(code(() => f.call('federation.peer.rotate_key', admin, { peerId: peer.id, publicKeyId: f.remote.keyId }))).toBe('FEDERATION.PEER_BLOCKED');
    expect(code(() => f.call('federation.peer.rotate_key', admin, { peerId: peer.id, publicKeyId: 'ed25519:short' }))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('validates registration and restricts management to operators', () => {
    const f = fixture();
    register(f);
    expect(code(() => register(f))).toBe('FEDERATION.PEER_EXISTS');
    expect(code(() => register(f, LOCAL))).toBe('FEDERATION.PEER_SELF');
    expect(code(() => register(f, 'Bad Host!'))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('federation.peer.register', f.person('alice'), { relayId: 'relay.c.example', publicKeyId: f.remote.keyId }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('federation.peer.list', ANONYMOUS('tnt_default')))).toBe('AUTH.REQUIRED');
    expect(f.call<{ peers: PeerDto[] }>('federation.peer.list', admin).peers).toHaveLength(1);
  });

  it('is idempotent and honours the feature flag', () => {
    const f = fixture();
    const a = f.call<PeerDto>('federation.peer.register', admin, { relayId: 'relay.c.example', publicKeyId: f.remote.keyId }, 'peer-key-0001');
    const b = f.call<PeerDto>('federation.peer.register', admin, { relayId: 'relay.c.example', publicKeyId: f.remote.keyId }, 'peer-key-0001');
    expect(b.id).toBe(a.id);
    expect(code(() => f.call('federation.peer.register', admin, { relayId: 'relay.d.example', publicKeyId: f.remote.keyId }, 'peer-key-0001'))).toBe('IDEMPOTENCY.KEY_REUSED');
    (f.deps as { flags: unknown }).flags = { isEnabled: (flag: string) => flag !== 'federation.trust' };
    expect(code(() => f.call('federation.peer.list', admin))).toBe('FEATURE.DISABLED');
  });
});

describe('blocklists (F11.S03.M02)', () => {
  it('adds, normalises, de-duplicates and revokes entries', () => {
    const f = fixture();
    const e = f.call<BlockDto>('federation.blocklist.add', admin, { kind: 'domain', value: 'Evil.Example:8443', reason: 'abuse' });
    expect(e).toMatchObject({ value: 'evil.example', status: 'active', source: 'local' });
    expect(code(() => f.call('federation.blocklist.add', admin, { kind: 'domain', value: 'evil.example', reason: 'again' }))).toBe('FEDERATION.BLOCK_EXISTS');
    expect(code(() => f.call('federation.blocklist.add', admin, { kind: 'author_key', value: 'ed25519:nope', reason: 'x' }))).toBe('FEDERATION.BLOCK_VALUE_INVALID');
    expect(code(() => f.call('federation.blocklist.add', f.person('alice'), { kind: 'peer', value: 'relay.x.example', reason: 'x' }))).toBe('AUTHZ.FORBIDDEN');
    expect(f.fed.blocklists.isBlocked('tnt_default', 'domain', 'sub.evil.example')).toBe(true);
    expect(f.fed.blocklists.isBlocked('tnt_default', 'domain', 'notevil.example')).toBe(false);
    f.call('federation.blocklist.remove', admin, { entryId: e.id });
    expect(f.fed.blocklists.isBlocked('tnt_default', 'domain', 'evil.example')).toBe(false);
    expect(code(() => f.call('federation.blocklist.remove', admin, { entryId: e.id }))).toBe('FEDERATION_BLOCK.INVALID_TRANSITION');
  });

  const sharedList = (f: Fixture, keys = f.remote.keys, issuer = REMOTE, entries: BlocklistPayload['entries'] = [{ kind: 'domain', value: 'spam.example', reason: 'spam farm' }, { kind: 'peer', value: LOCAL, reason: 'self' }]) =>
    signEnvelope(keys, BLOCKLIST_CONTEXT, { issuer, issuedAt: f.deps.clock.now(), entries });

  it('imports signed lists from trusted peers into a review queue and applies them only after approval', () => {
    const f = fixture();
    f.trustRemote();
    const out = f.call<{ imported: number; skipped: number }>('federation.blocklist.import', admin, { signed: sharedList(f) });
    expect(out).toEqual({ imported: 1, skipped: 1 });
    const queue = f.call<{ entries: BlockDto[] }>('federation.blocklist.list', admin, { status: 'pending_review' }).entries;
    expect(queue).toMatchObject([{ value: 'spam.example', source: 'imported', importedFrom: REMOTE }]);
    expect(f.fed.blocklists.isBlocked('tnt_default', 'domain', 'spam.example')).toBe(false);
    f.call('federation.blocklist.review', admin, { entryId: queue[0]!.id, approve: true });
    expect(f.fed.blocklists.isBlocked('tnt_default', 'domain', 'spam.example')).toBe(true);
    expect(f.call<{ imported: number }>('federation.blocklist.import', admin, { signed: sharedList(f) }).imported).toBe(0);
    expect(code(() => f.call('federation.blocklist.review', admin, { entryId: queue[0]!.id, approve: false }))).toBe('FEDERATION_BLOCK.INVALID_TRANSITION');
  });

  it('rejects lists with bad signatures, wrong issuers or untrusted peers', () => {
    const f = fixture();
    const peer = f.trustRemote();
    expect(code(() => f.call('federation.blocklist.import', admin, { signed: sharedList(f, generateSigningKeyPair()) }))).toBe('FEDERATION.BLOCKLIST_SIGNATURE_INVALID');
    expect(code(() => f.call('federation.blocklist.import', admin, { signed: sharedList(f, f.remote.keys, 'relay.nobody.example') }))).toBe('FEDERATION.BLOCKLIST_ISSUER_UNTRUSTED');
    const tampered = sharedList(f);
    expect(code(() => f.call('federation.blocklist.import', admin, { signed: { ...tampered, payload: { ...tampered.payload, issuedAt: 1 } } }))).toBe('FEDERATION.BLOCKLIST_SIGNATURE_INVALID');
    f.call('federation.peer.transition', admin, { peerId: peer.id, status: 'suspended' });
    expect(code(() => f.call('federation.blocklist.import', admin, { signed: sharedList(f) }))).toBe('FEDERATION.BLOCKLIST_ISSUER_UNTRUSTED');
    expect(code(() => f.call('federation.blocklist.import', f.person('alice'), { signed: sharedList(f) }))).toBe('AUTHZ.FORBIDDEN');
  });

  it('exports its own active local entries as a signed list that a peer can import', () => {
    const f = fixture();
    f.call('federation.blocklist.add', admin, { kind: 'author_key', value: keyIdOf(generateSigningKeyPair().publicKey), reason: 'fraud' });
    const exported = f.call<{ payload: BlocklistPayload; signer: string }>('federation.blocklist.export', admin);
    expect(exported.payload).toMatchObject({ issuer: LOCAL, entries: [{ kind: 'author_key', reason: 'fraud' }] });
    expect(exported.signer).toBe(f.relayKeyId);

    const g = fixture({ relayId: 'relay.g.example' });
    const peer = g.call<PeerDto>('federation.peer.register', admin, { relayId: LOCAL, publicKeyId: f.relayKeyId });
    g.call('federation.peer.transition', admin, { peerId: peer.id, status: 'trusted' });
    expect(g.call<{ imported: number }>('federation.blocklist.import', admin, { signed: exported }).imported).toBe(1);
  });
});

describe('migration (F11.S03.M03)', () => {
  const setup = () => {
    const f = fixture();
    const alice = f.person('alice');
    f.trustRemote();
    const next = author('alice-new');
    return { f, alice, next };
  };
  const publishProfile = (f: Fixture, alice: ReturnType<typeof author>, id: string) => {
    f.fed.markFederated('alice', id, true);
    const rec = { v: 1 as const, type: 'profile.public' as const, recordId: id, revision: 1, authorKeyId: alice.keyId, originRelay: LOCAL, createdAt: f.deps.clock.now(), payload: { pseudonym: 'alice' } };
    return f.call('federation.record.publish', alice, { envelope: signRecord(alice.keys, rec) });
  };

  it('verifies dual-signed statements, tombstones the old relay records with a redirect, and queues them for peers', () => {
    const { f, alice, next } = setup();
    publishProfile(f, alice, RID(7));
    const proof = migrationProof(alice.keys, next.keys, LOCAL, 'relay.new.example', f.deps.clock.now());
    const out = f.call<MigrationDto>('federation.migration.submit', alice, { proof });
    expect(out).toMatchObject({ fromRelay: LOCAL, toRelay: 'relay.new.example', redirected: 1 });
    const record = f.call<{ state: string; type: string; redirectTo: { toRelay: string; newKeyId: string }; revision: number }>('federation.record.get', alice, { originRelay: LOCAL, recordId: RID(7) });
    expect(record).toMatchObject({ state: 'tombstoned', type: 'tombstone', revision: 2, redirectTo: { toRelay: 'relay.new.example', newKeyId: next.keyId } });
    const tombs = f.deps.store.collection<{ id: string; version: number; envelope: FederatedEnvelope; status: string }>('federation_deliveries').list().filter((d) => d.envelope.record.type === 'tombstone');
    expect(tombs).toHaveLength(1);
    expect(verifyAuthor(tombs[0]!.envelope)).toBe(true);
    expect(verifyCountersign(tombs[0]!.envelope, f.relayKeyId)).toBe(true);
    expect(f.call<{ successor: { keyId: string; relay: string } }>('federation.migration.resolve', ANONYMOUS('tnt_default'), { keyId: alice.keyId }).successor).toEqual({ keyId: next.keyId, relay: 'relay.new.example' });
    expect(f.call('federation.migration.submit', alice, { proof })).toMatchObject({ redirected: 1 });
    expect(f.deps.store.collection('federation_migrations').count()).toBe(1);
  });

  it('lets a peer relay learn the migration from the redirect tombstone and then accept the successor key', () => {
    const { f, alice, next } = setup();
    publishProfile(f, alice, RID(7));
    f.call('federation.migration.submit', alice, { proof: migrationProof(alice.keys, next.keys, LOCAL, 'relay.new.example', f.deps.clock.now()) });
    const tomb = f.deps.store.collection<{ id: string; version: number; envelope: FederatedEnvelope }>('federation_deliveries').list().find((d) => d.envelope.record.type === 'tombstone')!.envelope;

    const g = fixture({ relayId: 'relay.g.example' });
    const peer = g.call<PeerDto>('federation.peer.register', admin, { relayId: LOCAL, publicKeyId: f.relayKeyId });
    g.call('federation.peer.transition', admin, { peerId: peer.id, status: 'trusted' });
    const relayRemote = { relayId: LOCAL, keys: f.relayKeys, keyId: f.relayKeyId };
    const out = g.receive<ReceiveResult>(remoteBatch(g, relayRemote, [tomb]));
    expect(out.results[0]).toMatchObject({ outcome: 'imported' });
    expect(g.call<{ successor: { keyId: string } }>('federation.migration.resolve', ANONYMOUS('tnt_default'), { keyId: alice.keyId }).successor.keyId).toBe(next.keyId);
    expect(g.call<{ state: string; redirectTo: { toRelay: string } }>('federation.record.get', ANONYMOUS('tnt_default'), { originRelay: LOCAL, recordId: RID(7) })).toMatchObject({ state: 'tombstoned', redirectTo: { toRelay: 'relay.new.example' } });
  });

  it('rejects forged, single-signed, future-dated and conflicting statements, and strangers', () => {
    const { f, alice, next } = setup();
    const now = f.deps.clock.now();
    const proof = migrationProof(alice.keys, next.keys, LOCAL, 'relay.new.example', now);
    const mallory = author('mallory');
    f.person('mallory');
    const forged = { ...proof, newSig: migrationProof(alice.keys, mallory.keys, LOCAL, 'relay.new.example', now).newSig };
    expect(code(() => f.call('federation.migration.submit', alice, { proof: forged }))).toBe('FEDERATION.MIGRATION_SIGNATURE_INVALID');
    expect(code(() => f.call('federation.migration.submit', alice, { proof: { ...proof, oldSig: proof.newSig } }))).toBe('FEDERATION.MIGRATION_SIGNATURE_INVALID');
    expect(code(() => f.call('federation.migration.submit', alice, { proof: migrationProof(alice.keys, next.keys, LOCAL, 'relay.new.example', now + 3_600_000) }))).toBe('FEDERATION.MIGRATION_FUTURE');
    expect(code(() => f.call('federation.migration.submit', f.person('mallory'), { proof }))).toBe('FEDERATION.MIGRATION_NOT_OWNER');
    expect(code(() => f.call('federation.migration.submit', alice, { proof: migrationProof(alice.keys, alice.keys, LOCAL, 'relay.new.example', now) }))).toBe('FEDERATION.MIGRATION_SIGNATURE_INVALID');
    f.call('federation.migration.submit', alice, { proof });
    const other = author('other');
    expect(code(() => f.call('federation.migration.submit', alice, { proof: migrationProof(alice.keys, other.keys, LOCAL, 'relay.other.example', now) }))).toBe('FEDERATION.MIGRATION_CONFLICT');
    expect(code(() => f.call('federation.migration.submit', admin, { proof: migrationProof(alice.keys, other.keys, LOCAL, 'relay.other.example', now) }))).toBe('FEDERATION.MIGRATION_CONFLICT');
  });

  it('treats same-relay statements as key rotation: successor accepted, nothing tombstoned', () => {
    const { f, alice, next } = setup();
    publishProfile(f, alice, RID(7));
    const out = f.call<MigrationDto>('federation.migration.submit', alice, { proof: migrationProof(alice.keys, next.keys, LOCAL, LOCAL, f.deps.clock.now()) });
    expect(out.redirected).toBe(0);
    expect(f.call<{ state: string }>('federation.record.get', alice, { originRelay: LOCAL, recordId: RID(7) }).state).toBe('active');
    expect(f.fed.migration.isSameAuthor('tnt_default', alice.keyId, next.keyId)).toBe(true);
    expect(f.fed.migration.isSameAuthor('tnt_default', next.keyId, alice.keyId)).toBe(false);
  });

  it('follows chains safely and unknown keys resolve to nothing', () => {
    const { f, alice, next } = setup();
    const third = author('third');
    const now = f.deps.clock.now();
    f.call('federation.migration.submit', alice, { proof: migrationProof(alice.keys, next.keys, LOCAL, LOCAL, now) });
    f.call('federation.migration.submit', admin, { proof: migrationProof(next.keys, third.keys, LOCAL, LOCAL, now) });
    f.call('federation.migration.submit', admin, { proof: migrationProof(third.keys, alice.keys, LOCAL, LOCAL, now) });
    const anon = ANONYMOUS('tnt_default');
    expect(f.call<{ successor: { keyId: string } }>('federation.migration.resolve', anon, { keyId: alice.keyId }).successor.keyId).toBe(third.keyId);
    expect(f.call<{ successor: unknown }>('federation.migration.resolve', anon, { keyId: author('x').keyId }).successor).toBeNull();
  });
});

