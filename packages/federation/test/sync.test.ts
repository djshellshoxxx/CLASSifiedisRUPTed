import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DomainError, MINUTE } from '@classrup/kernel';
import type { PeerDto, ReceiveResult, RecordType } from '../src/index';
import { backoffMs, classify, rank, resolve, signRecord, verifyBatch } from '../src/index';
import type { Author, Fixture, Remote } from './helpers';
import { admin, author, fixture, listingPayload, LOCAL, makeRemote, migrationProof, remoteBatch, remoteEnvelope, REMOTE, RID, relayActor } from './helpers';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : String(e);
  }
  return undefined;
};

describe('conflict resolution (F11.S02.M03)', () => {
  const c = (type: RecordType, revision: number, contentHash: string) => ({ type, revision, contentHash });

  it('higher revision wins; equal revision prefers the smaller content hash; tombstones win ties', () => {
    expect(resolve(c('listing.public', 1, 'sha256:b'), c('listing.public', 2, 'sha256:z'))).toBe('incoming');
    expect(resolve(c('listing.public', 3, 'sha256:a'), c('listing.public', 2, 'sha256:a'))).toBe('existing');
    expect(resolve(c('listing.public', 2, 'sha256:b'), c('listing.public', 2, 'sha256:a'))).toBe('incoming');
    expect(resolve(c('listing.public', 2, 'sha256:a'), c('listing.public', 2, 'sha256:b'))).toBe('existing');
    expect(resolve(c('listing.public', 2, 'sha256:a'), c('listing.public', 2, 'sha256:a'))).toBe('same');
    expect(resolve(c('listing.public', 5, 'sha256:a'), c('tombstone', 5, 'sha256:z'))).toBe('incoming');
    expect(resolve(c('tombstone', 5, 'sha256:z'), c('listing.public', 5, 'sha256:a'))).toBe('existing');
    expect(resolve(c('tombstone', 5, 'sha256:z'), c('listing.public', 4, 'sha256:a'))).toBe('existing');
    expect(resolve(c('tombstone', 5, 'sha256:z'), c('listing.public', 6, 'sha256:z'))).toBe('incoming');
    expect(resolve(c('listing.public', 5, 'sha256:a'), c('tombstone', 4, 'sha256:a'))).toBe('existing');
  });

  it('classifies rollbacks, forks and tombstone overrides but not ordinary progress', () => {
    expect(classify(c('listing.public', 3, 'a'), c('listing.public', 2, 'b'))).toBe('rollback');
    expect(classify(c('listing.public', 3, 'a'), c('listing.public', 3, 'b'))).toBe('fork');
    expect(classify(c('listing.public', 3, 'a'), c('tombstone', 3, 'b'))).toBe('tombstone_override');
    expect(classify(c('listing.public', 3, 'a'), c('listing.public', 4, 'b'))).toBeUndefined();
  });

  const contender = fc.record({
    type: fc.constantFrom<RecordType>('listing.public', 'tombstone'),
    revision: fc.integer({ min: 1, max: 4 }),
    contentHash: fc.constantFrom('sha256:a', 'sha256:b', 'sha256:c'),
  });

  it('is antisymmetric and order independent: every arrival order converges to the same winner (property)', () => {
    fc.assert(
      fc.property(contender, contender, (a, b) => {
        const ab = resolve(a, b);
        const ba = resolve(b, a);
        return (ab === 'same' && ba === 'same') || (ab === 'incoming' && ba === 'existing') || (ab === 'existing' && ba === 'incoming');
      }),
    );
    fc.assert(
      fc.property(fc.array(contender, { minLength: 1, maxLength: 8 }), fc.integer({ min: 0, max: 1000 }), (items, seed) => {
        const fold = (list: typeof items) => list.reduce((best, x) => (resolve(best, x) === 'incoming' ? x : best));
        const shuffled = [...items].sort((x, y) => ((x.revision * 31 + seed) % 7) - ((y.revision * 17 + seed) % 7) || x.contentHash.localeCompare(y.contentHash));
        const a = fold(items);
        const b = fold(shuffled);
        return rank(a, b) === 0;
      }),
    );
  });
});

describe('delivery (F11.S02.M01)', () => {
  const publishOne = (f: Fixture, n = 1) => {
    const alice = f.person('alice');
    for (let i = 0; i < n; i++) {
      const id = RID(100 + i);
      f.fed.markFederated('alice', id, true);
      const rec = { v: 1 as const, type: 'profile.public' as const, recordId: id, revision: 1, authorKeyId: alice.keyId, originRelay: LOCAL, createdAt: f.deps.clock.now(), payload: { pseudonym: `alice${i}` } };
      f.call('federation.record.publish', alice, { envelope: signRecord(alice.keys, rec) });
    }
  };

  it('sends one signed batch per trusted peer and marks deliveries sent', () => {
    const f = fixture();
    const peer = f.trustRemote();
    publishOne(f, 3);
    const res = f.sys<{ batches: number; sent: number }>('federation.delivery.send_due');
    expect(res).toMatchObject({ batches: 1, sent: 3, retried: 0, dead: 0 });
    expect(f.transport.sent).toHaveLength(1);
    const { peer: target, batch } = f.transport.sent[0]!;
    expect(target).toEqual({ peerId: peer.id, relayId: REMOTE });
    expect(batch.payload.records).toHaveLength(3);
    expect(verifyBatch(batch, f.relayKeyId)).toBe(true);
    expect(f.sys<{ batches: number }>('federation.delivery.send_due').batches).toBe(0);
    expect(f.call<{ counts: Record<string, number> }>('federation.delivery.status', admin).counts).toMatchObject({ sent: 3, pending: 0 });
  });

  it('caps batches at 100 records', () => {
    const f = fixture();
    f.trustRemote();
    publishOne(f, 105);
    f.sys('federation.delivery.send_due');
    expect(f.transport.sent[0]!.batch.payload.records).toHaveLength(100);
    f.sys('federation.delivery.send_due');
    expect(f.transport.sent[1]!.batch.payload.records).toHaveLength(5);
  });

  it('backs off exponentially with deterministic jitter and dead-letters after 8 attempts', () => {
    const f = fixture();
    f.trustRemote();
    f.transport.result = 'retry';
    f.setJitter(0);
    publishOne(f);
    const next = (): number => f.deps.store.collection<{ id: string; version: number; nextAttemptAt: number }>('federation_deliveries').list()[0]!.nextAttemptAt;
    const delays: number[] = [];
    for (let attempt = 1; attempt <= 7; attempt++) {
      const before = f.deps.clock.now();
      expect(f.sys<{ retried: number }>('federation.delivery.send_due').retried).toBe(1);
      delays.push(next() - before);
      f.deps.clock.set(next() - 1);
      expect(f.sys<{ batches: number }>('federation.delivery.send_due').batches).toBe(0);
      f.deps.clock.set(next());
    }
    expect(delays).toEqual([30_000, 60_000, 120_000, 240_000, 480_000, 960_000, 1_920_000]);
    expect(f.sys<{ dead: number }>('federation.delivery.send_due').dead).toBe(1);
    expect(f.sys<{ batches: number }>('federation.delivery.send_due').batches).toBe(0);
    const status = f.call<{ counts: Record<string, number>; dead: { id: string; attempts: number }[] }>('federation.delivery.status', admin);
    expect(status.counts.dead).toBe(1);
    expect(status.dead[0]!.attempts).toBe(8);
    expect(f.deps.store.events.read().filter((e) => e.event.type === 'federation.delivery.dead_lettered')).toHaveLength(1);
    f.transport.result = 'ok';
    f.call('federation.delivery.requeue', admin, { deliveryId: status.dead[0]!.id });
    expect(f.sys<{ sent: number }>('federation.delivery.send_due').sent).toBe(1);
  });

  it('applies jitter within 20% and caps the delay at one hour (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 40 }), fc.double({ min: 0, max: 0.999999, noNaN: true }), (attempts, r) => {
        const d = backoffMs(attempts, r);
        const base = Math.min(3_600_000, 30_000 * 2 ** (attempts - 1));
        return d >= base && d <= base * 1.2;
      }),
    );
  });

  it('dead-letters immediately on rejection, treats transport exceptions as retry, and skips untrusted peers', () => {
    const f = fixture();
    const peer = f.trustRemote();
    publishOne(f);
    f.transport.result = 'rejected';
    expect(f.sys<{ dead: number }>('federation.delivery.send_due').dead).toBe(1);

    const g = fixture();
    const gpeer = g.trustRemote();
    publishOne(g);
    g.transport.send = () => {
      throw new Error('socket closed');
    };
    expect(g.sys<{ retried: number }>('federation.delivery.send_due').retried).toBe(1);
    g.call('federation.peer.transition', admin, { peerId: gpeer.id, status: 'suspended' });
    g.deps.clock.advance(MINUTE * 10);
    expect(g.sys<{ batches: number }>('federation.delivery.send_due').batches).toBe(0);
    expect(peer.status).toBe('trusted');
  });

  it('is system-only and restricts status to operators', () => {
    const f = fixture();
    f.trustRemote();
    expect(code(() => f.call('federation.delivery.send_due', admin))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('federation.delivery.status', f.person('alice')))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('federation.delivery.requeue', admin, { deliveryId: 'fdel_' + 'A'.repeat(26) }))).toBe('FEDERATION.DELIVERY_NOT_FOUND');
  });
});

function inboundSetup() {
  const f = fixture();
  const peer = f.trustRemote();
  const a = author('bob');
  return { f, peer, a, remote: f.remote };
}

const send = (f: Fixture, remote: Remote, envs: readonly unknown[], over = {}) => f.receive<ReceiveResult>(remoteBatch(f, remote, envs, over));
const listing = (remote: Remote, a: Author, revision: number, payload = listingPayload(), n = 1) => remoteEnvelope(remote, a, 'listing.public', RID(n), revision, payload);

describe('inbound pipeline and malicious peers (F11.S02.M02)', () => {
  it('imports valid author-signed, relay-countersigned records and emits events with public metadata only', () => {
    const { f, a, remote } = inboundSetup();
    const out = send(f, remote, [listing(remote, a, 1)]);
    expect(out).toMatchObject({ imported: 1, duplicates: 0, rejected: 0 });
    const ev = f.deps.store.events.read().find((e) => e.event.type === 'federation.record.imported')!.event;
    expect(ev.payload).toMatchObject({ originRelay: REMOTE, recordId: RID(1), revision: 1 });
    expect(JSON.stringify(ev.payload)).not.toContain('Road bike');
  });

  it('rejects a forged author signature and a forged relay countersignature', () => {
    const { f, a, remote } = inboundSetup();
    const good = listing(remote, a, 1);
    const forgedAuthor = { ...good, authorSig: 'A'.repeat(86) };
    const mallory = author('mallory');
    const forgedWithOtherKey = remoteEnvelope(remote, mallory, 'listing.public', RID(2), 1, listingPayload(), { authorKeyId: a.keyId });
    const rogueRelay = makeRemote(REMOTE);
    const wrongRelaySig = remoteEnvelope(rogueRelay, a, 'listing.public', RID(3), 1, listingPayload());
    const out = send(f, remote, [forgedAuthor, forgedWithOtherKey, wrongRelaySig]);
    expect(out.results.map((r) => r.reason)).toEqual(['bad_author_signature', 'bad_author_signature', 'bad_relay_signature']);
    expect(f.deps.store.collection('federation_records').count()).toBe(0);
  });

  it('rejects a batch not signed by the pinned peer key and a batch from an unknown relay', () => {
    const { f, a, remote } = inboundSetup();
    const impostor = makeRemote(REMOTE);
    expect(code(() => f.receive(remoteBatch(f, impostor, [listing(remote, a, 1)])))).toBe('FEDERATION.BATCH_SIGNATURE_INVALID');
    const stranger = makeRemote('relay.unknown.example');
    expect(code(() => f.receive(remoteBatch(f, stranger, [])))).toBe('FEDERATION.PEER_UNKNOWN');
  });

  it('rejects replayed batches and stale or future-dated batch timestamps', () => {
    const { f, a, remote } = inboundSetup();
    const batch = remoteBatch(f, remote, [listing(remote, a, 1)]);
    expect(f.receive<ReceiveResult>(batch).imported).toBe(1);
    expect(code(() => f.receive(batch))).toBe('REPLAY.DUPLICATE');
    expect(code(() => f.receive(remoteBatch(f, remote, [], { sentAt: f.deps.clock.now() - 10 * MINUTE })))).toBe('REPLAY.STALE');
    expect(code(() => f.receive(remoteBatch(f, remote, [], { batchId: 'short' })))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('persists replay protection in the store so it survives a restart (new instance, same database)', () => {
    const { f, a, remote } = inboundSetup();
    const batch = remoteBatch(f, remote, [listing(remote, a, 1)]);
    f.receive(batch);
    expect(f.deps.store.collection('federation_nonces').count()).toBe(1);
    const restarted = f.rebuild();
    expect(code(() => restarted.receive({ actor: relayActor, correlationId: 'cor_restart' }, { batch }))).toBe('REPLAY.DUPLICATE');
    f.deps.clock.advance(11 * MINUTE);
    expect(f.sys<{ nonces: number }>('federation.sync.purge_expired').nonces).toBe(1);
  });

  it('treats re-delivered envelopes as duplicates, including old revisions after newer ones (idempotent import)', () => {
    const { f, a, remote } = inboundSetup();
    const r1 = listing(remote, a, 1);
    const r2 = listing(remote, a, 2, listingPayload({ description: 'edited' }));
    send(f, remote, [r1]);
    send(f, remote, [r2]);
    const again = send(f, remote, [r1, r2]);
    expect(again.results.map((r) => r.outcome)).toEqual(['duplicate', 'duplicate']);
    const third = send(f, remote, [r1]);
    expect(third.results[0]!.outcome).toBe('duplicate');
    expect(f.deps.store.collection('federation_records').count()).toBe(1);
    const stats = f.call<PeerDto>('federation.peer.get', admin, { peerId: f.deps.store.collection<{ id: string; version: number }>('federation_peers').list()[0]!.id });
    expect(stats.reputation).toMatchObject({ accepted: 2, duplicates: 3, rejected: 0 });
  });

  it('rejects oversized payloads and exact coordinates without importing anything', () => {
    const { f, a, remote } = inboundSetup();
    const big = listing(remote, a, 1, listingPayload({ description: 'x'.repeat(40_000) }));
    const coords = listing(remote, a, 1, listingPayload({ lat: 52.52, lng: 13.405 }), 2);
    const hidden = listing(remote, a, 1, listingPayload({ description: 'meet at 52.52000, 13.40500' }), 3);
    const cell = listing(remote, a, 1, listingPayload({ regionCell: 'u33dbcdefg' }), 4);
    const out = send(f, remote, [big, coords, hidden, cell]);
    expect(out.results.map((r) => r.reason)).toEqual(['too_large', 'privacy_violation', 'privacy_violation', 'invalid_payload']);
    expect(f.deps.store.collection('federation_records').count()).toBe(0);
    const peer = f.call<PeerDto>('federation.peer.list', admin) as unknown as { peers: PeerDto[] };
    expect(peer.peers[0]!.reputation.rejectionsByReason).toEqual({ too_large: 1, privacy_violation: 2, invalid_payload: 1 });
  });

  it('refuses revision rollback and keeps the newer record, recording the conflict', () => {
    const { f, a, remote } = inboundSetup();
    send(f, remote, [listing(remote, a, 3, listingPayload({ description: 'v3' }))]);
    const out = send(f, remote, [listing(remote, a, 2, listingPayload({ description: 'rollback' }))]);
    expect(out.results[0]).toMatchObject({ outcome: 'rejected', reason: 'stale_revision' });
    const stored = f.deps.store.collection<{ id: string; version: number; revision: number }>('federation_records').list()[0]!;
    expect(stored.revision).toBe(3);
    expect(f.deps.store.collection<{ id: string; version: number; kind: string; winner: string }>('federation_conflicts').list()).toMatchObject([{ kind: 'rollback', winner: 'existing' }]);
    expect(f.deps.store.events.read().some((e) => e.event.type === 'federation.conflict.recorded')).toBe(true);
  });

  it('refuses author-key hijack of an existing record, but accepts a migration-proven successor key', () => {
    const { f, a, remote } = inboundSetup();
    send(f, remote, [listing(remote, a, 1)]);
    const hijacker = author('hijacker');
    const hijack = remoteEnvelope(remote, hijacker, 'listing.public', RID(1), 2, listingPayload({ description: 'mine now' }));
    const out = send(f, remote, [hijack]);
    expect(out.results[0]).toMatchObject({ outcome: 'rejected', reason: 'author_key_mismatch' });
    expect(f.deps.store.collection<{ id: string; version: number; kind: string }>('federation_conflicts').list()[0]!.kind).toBe('author_mismatch');

    const successor = author('bob-new');
    f.call('federation.migration.submit', admin, { proof: proofBetween(f, a, successor, REMOTE, REMOTE) });
    const ok = remoteEnvelope(remote, successor, 'listing.public', RID(1), 2, listingPayload({ description: 'rotated key' }));
    expect(send(f, remote, [ok]).results[0]!.outcome).toBe('imported');
    expect(send(f, remote, [hijack]).results[0]!.reason).toBe('author_key_mismatch');
  });

  it('rejects records from blocked peers, domains and authors with reasons', () => {
    const { f, peer, a, remote } = inboundSetup();
    f.call('federation.blocklist.add', admin, { kind: 'author_key', value: a.keyId, reason: 'scammer' });
    expect(send(f, remote, [listing(remote, a, 1)]).results[0]).toMatchObject({ outcome: 'rejected', reason: 'blocked_author' });
    const b = author('carol');
    f.call('federation.blocklist.add', admin, { kind: 'domain', value: 'b.example', reason: 'abuse' });
    expect(send(f, remote, [listing(remote, b, 1, listingPayload(), 2)]).results[0]).toMatchObject({ outcome: 'rejected', reason: 'blocked_domain' });
    f.call('federation.peer.transition', admin, { peerId: peer.id, status: 'blocked' });
    expect(code(() => f.receive(remoteBatch(f, remote, [])))).toBe('FEDERATION.PEER_BLOCKED');
  });

  it('refuses untrusted peers, wrong origin relays, future-dated records and non-relay callers', () => {
    const f = fixture();
    const remote = f.remote;
    const peer = f.call<PeerDto>('federation.peer.register', admin, { relayId: remote.relayId, publicKeyId: remote.keyId });
    const a = author('bob');
    expect(code(() => f.receive(remoteBatch(f, remote, [])))).toBe('FEDERATION.PEER_NOT_TRUSTED');
    f.call('federation.peer.transition', admin, { peerId: peer.id, status: 'trusted' });
    const foreign = remoteEnvelope(remote, a, 'listing.public', RID(1), 1, listingPayload(), { originRelay: 'relay.third.example' });
    const future = remoteEnvelope(remote, a, 'listing.public', RID(2), 1, listingPayload(), { createdAt: f.deps.clock.now() + 3_600_000 });
    expect(send(f, remote, [foreign, future]).results.map((r) => r.reason)).toEqual(['origin_mismatch', 'future_dated']);
    expect(code(() => f.call('federation.sync.receive', f.person('alice'), { batch: remoteBatch(f, remote, []) }))).toBe('AUTHZ.FORBIDDEN');
    expect(relayActor.kind).toBe('relay');
  });

  it('accepts moderation labels only when signed by the peer relay key itself', () => {
    const { f, a, remote } = inboundSetup();
    const relayAuthor: Author = { id: 'relay', actor: a.actor, keys: remote.keys, keyId: remote.keyId };
    const payload = { targetRecordId: RID(1), label: 'scam', severity: 'warn' };
    const ok = remoteEnvelope(remote, relayAuthor, 'moderation.label', 'frec_' + 'B'.repeat(26), 1, payload);
    const user = remoteEnvelope(remote, a, 'moderation.label', 'frec_' + 'C'.repeat(26), 1, payload);
    expect(send(f, remote, [ok, user]).results.map((r) => r.outcome === 'imported' || r.reason)).toEqual([true, 'author_key_mismatch']);
  });

  it('enforces per-peer rate limits and daily byte quotas', () => {
    const { f, peer, a, remote } = inboundSetup();
    f.call('federation.peer.set_limits', admin, { peerId: peer.id, limits: { recordsPerMinute: 2, dailyByteQuota: 1_000_000 } });
    send(f, remote, [listing(remote, a, 1, listingPayload(), 1), listing(remote, a, 1, listingPayload(), 2)]);
    expect(code(() => send(f, remote, [listing(remote, a, 1, listingPayload(), 3)]))).toBe('FEDERATION.PEER_RATE_LIMITED');
    f.deps.clock.advance(61_000);
    expect(send(f, remote, [listing(remote, a, 1, listingPayload(), 3)]).imported).toBe(1);
    f.call('federation.peer.set_limits', admin, { peerId: peer.id, limits: { recordsPerMinute: 100, dailyByteQuota: 2048 } });
    expect(code(() => send(f, remote, [listing(remote, a, 1, listingPayload({ description: 'y'.repeat(1900) }), 4)]))).toBe('FEDERATION.PEER_QUOTA_EXCEEDED');
  });

  it('suspends a trusted peer automatically after a long run of rejected records', () => {
    const { f, peer, a, remote } = inboundSetup();
    const bad = Array.from({ length: 25 }, (_, i) => ({ ...listing(remote, a, 1, listingPayload(), i + 1), authorSig: 'A'.repeat(86) }));
    send(f, remote, bad);
    expect(f.call<PeerDto>('federation.peer.get', admin, { peerId: peer.id })).toMatchObject({ status: 'suspended', reputation: { rejected: 25, consecutiveRejections: 25 } });
    expect(code(() => f.receive(remoteBatch(f, remote, [])))).toBe('FEDERATION.PEER_NOT_TRUSTED');
  });

  it('imports tombstones even before the record, and a tombstone beats equal-or-lower revisions arriving later', () => {
    const { f, a, remote } = inboundSetup();
    const tomb = remoteEnvelope(remote, a, 'tombstone', RID(1), 5, { reason: 'deleted' });
    expect(send(f, remote, [tomb]).imported).toBe(1);
    const late = send(f, remote, [listing(remote, a, 5, listingPayload({ description: 'late' })), listing(remote, a, 4)]);
    expect(late.results.map((r) => r.reason)).toEqual(['tombstoned', 'tombstoned']);
    expect(send(f, remote, [listing(remote, a, 6, listingPayload({ description: 'resurrected by author' }))]).imported).toBe(1);
    expect(f.deps.store.events.read().some((e) => e.event.type === 'federation.record.tombstoned')).toBe(true);
  });

  it('keeps imported content independent of arrival order (property)', () => {
    const arb = fc.array(fc.record({ revision: fc.integer({ min: 1, max: 3 }), tomb: fc.boolean(), note: fc.constantFrom('a', 'b') }), { minLength: 1, maxLength: 5 });
    const a = author('bob');
    const remote = makeRemote();
    fc.assert(
      fc.property(arb, fc.integer({ min: 0, max: 99 }), (specs, seed) => {
        const envs = specs.map((s) =>
          s.tomb ? remoteEnvelope(remote, a, 'tombstone', RID(1), s.revision, { reason: 'deleted' }) : listing(remote, a, s.revision, listingPayload({ description: s.note })),
        );
        const run = (order: readonly number[]): string => {
          const f = fixture();
          f.trustRemote(remote);
          for (const i of order) send(f, remote, [envs[i]]);
          return f.deps.store.collection<{ id: string; version: number; contentHash: string }>('federation_records').list()[0]?.contentHash ?? '';
        };
        const forward = specs.map((_, i) => i);
        const rotated = forward.map((_, i) => (i + seed) % forward.length);
        return run(forward) === run(rotated);
      }),
      { numRuns: 15 },
    );
  });
});

function proofBetween(f: Fixture, from: Author, to: Author, fromRelay: string, toRelay: string) {
  return migrationProof(from.keys, to.keys, fromRelay, toRelay, f.deps.clock.now());
}

