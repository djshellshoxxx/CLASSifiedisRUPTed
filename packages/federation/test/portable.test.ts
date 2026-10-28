import { describe, expect, it } from 'vitest';
import { ANONYMOUS, DomainError } from '@classrup/kernel';
import type { ListingSnapshot } from '@classrup/kernel';
import type { FederatedRecord, MarkResult, PublishedDto, PublicRecordDto } from '../src/index';
import { signRecord, verifyAuthor, verifyCountersign } from '../src/index';
import type { Fixture } from './helpers';
import { admin, author, listingPayload, LOCAL, moderator } from './helpers';
import { generateSigningKeyPair, keyIdOf } from '@classrup/security';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : String(e);
  }
  return undefined;
};

import { fixture } from './helpers';

const LISTING_ID = 'lst_01HZZZZZZZZZZZZZZZZZZZZZZZ';

function listingFor(owner: string): ListingSnapshot {
  return {
    id: LISTING_ID, tenantId: 'tnt_default', ownerId: owner, kind: 'sell', status: 'published', title: 'Road bike', category: 'bikes', acceptsBarter: false,
    regionCell: 'u33db', quantityAvailable: 1, version: 1,
  };
}

function setup() {
  const f = fixture();
  const alice = f.person('alice');
  f.listings.set(LISTING_ID, listingFor('alice'));
  f.trustRemote();
  return { f, alice };
}

const record = (f: Fixture, who: ReturnType<typeof author>, over: Partial<FederatedRecord> = {}): FederatedRecord => ({
  v: 1, type: 'listing.public', recordId: LISTING_ID, revision: 1, authorKeyId: who.keyId, originRelay: LOCAL, createdAt: f.deps.clock.now(), payload: listingPayload(), ...over,
});

const publish = (f: Fixture, who: ReturnType<typeof author>, rec: FederatedRecord, key?: string) =>
  f.call<PublishedDto>('federation.record.publish', who, { envelope: signRecord(who.keys, rec) }, key);

describe('portable (F11.S01.M01): opt-in and publishing', () => {
  it('requires explicit opt-in and live consent before anything can be published', () => {
    const { f, alice } = setup();
    expect(code(() => publish(f, alice, record(f, alice)))).toBe('FEDERATION.NOT_OPTED_IN');
    f.consented.delete('alice');
    expect(code(() => f.call('federation.record.mark_federated', alice, { recordId: LISTING_ID, federate: true }))).toBe('FEDERATION.CONSENT_REQUIRED');
    f.consented.add('alice');
    expect(f.call<MarkResult>('federation.record.mark_federated', alice, { recordId: LISTING_ID, federate: true })).toEqual({ recordId: LISTING_ID, federate: true, withdrawalNeeded: false });
    f.consented.delete('alice');
    expect(code(() => publish(f, alice, record(f, alice)))).toBe('FEDERATION.CONSENT_REQUIRED');
  });

  it('publishes an author-signed record, countersigns it and queues delivery to trusted peers only', () => {
    const { f, alice } = setup();
    f.fed.markFederated('alice', LISTING_ID, true);
    f.deps.ids.next('peer');
    f.call('federation.peer.register', admin, { relayId: 'relay.c.example', publicKeyId: keyIdOf(generateSigningKeyPair().publicKey) });
    const out = publish(f, alice, record(f, alice));
    expect(out).toMatchObject({ originRelay: LOCAL, recordId: LISTING_ID, revision: 1, queuedFor: 1 });
    const got = f.call<PublicRecordDto>('federation.record.get', ANONYMOUS('tnt_default'), { originRelay: LOCAL, recordId: LISTING_ID });
    expect(got).toMatchObject({ type: 'listing.public', state: 'active', revision: 1 });
    const stored = f.deps.store.collection<{ id: string; version: number; envelope: Parameters<typeof verifyAuthor>[0] }>('federation_records').list()[0]!;
    expect(verifyAuthor(stored.envelope)).toBe(true);
    expect(verifyCountersign(stored.envelope, f.relayKeyId)).toBe(true);
    expect(f.deps.store.collection('federation_deliveries').count()).toBe(1);
    expect(f.deps.store.events.read().some((e) => e.event.type === 'federation.record.published')).toBe(true);
  });

  it('refuses keys that are not the account signing key, other accounts and other relays', () => {
    const { f, alice } = setup();
    const mallory = f.person('mallory');
    f.fed.markFederated('alice', LISTING_ID, true);
    expect(code(() => publish(f, mallory, record(f, mallory)))).toBe('FEDERATION.NOT_OPTED_IN');
    const stranger = author('alice');
    const forged = { ...record(f, alice), authorKeyId: stranger.keyId };
    expect(code(() => f.call('federation.record.publish', alice, { envelope: signRecord(stranger.keys, forged) }))).toBe('FEDERATION.AUTHOR_KEY_MISMATCH');
    const badSig = { ...signRecord(alice.keys, record(f, alice)), authorSig: 'A'.repeat(86) };
    expect(code(() => f.call('federation.record.publish', alice, { envelope: badSig }))).toBe('FEDERATION.SIGNATURE_INVALID');
    expect(code(() => publish(f, alice, record(f, alice, { originRelay: 'relay.other.example' })))).toBe('FEDERATION.ORIGIN_MISMATCH');
    expect(code(() => f.call('federation.record.publish', alice, { envelope: { ...signRecord(alice.keys, record(f, alice)), relaySig: 'A'.repeat(86) } }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.fed.markFederated('mallory', LISTING_ID, true))).toBe('FEDERATION.NOT_OWNER');
  });

  it('keeps private data out: coordinates, oversize payloads and divergence from the live listing', () => {
    const { f, alice } = setup();
    f.fed.markFederated('alice', LISTING_ID, true);
    expect(code(() => publish(f, alice, record(f, alice, { payload: listingPayload({ lat: 52.5, lng: 13.4 }) })))).toBe('FEDERATION.PRIVACY_VIOLATION');
    expect(code(() => publish(f, alice, record(f, alice, { payload: listingPayload({ description: 'x'.repeat(50_000) }) })))).toBe('FEDERATION.RECORD_TOO_LARGE');
    expect(code(() => publish(f, alice, record(f, alice, { payload: listingPayload({ regionCell: 'u33dbcd' }) })))).toBe('FEDERATION.PAYLOAD_INVALID');
    expect(code(() => publish(f, alice, record(f, alice, { payload: listingPayload({ title: 'Different thing' }) })))).toBe('FEDERATION.LISTING_MISMATCH');
    f.listings.set(LISTING_ID, { ...listingFor('alice'), status: 'sold' });
    expect(code(() => publish(f, alice, record(f, alice)))).toBe('FEDERATION.LISTING_UNAVAILABLE');
    expect(f.deps.store.collection('federation_records').count()).toBe(0);
  });

  it('enforces monotonic revisions locally and is idempotent per key', () => {
    const { f, alice } = setup();
    f.fed.markFederated('alice', LISTING_ID, true);
    const first = publish(f, alice, record(f, alice), 'publish-key-001');
    expect(publish(f, alice, record(f, alice), 'publish-key-001')).toEqual(first);
    expect(publish(f, alice, record(f, alice)).queuedFor).toBe(0);
    expect(code(() => publish(f, alice, record(f, alice, { revision: 1, payload: listingPayload({ description: 'edited' }) })))).toBe('FEDERATION.REVISION_NOT_NEWER');
    publish(f, alice, record(f, alice, { revision: 2, payload: listingPayload({ description: 'edited' }) }));
    expect(code(() => publish(f, alice, record(f, alice, { revision: 1 })))).toBe('FEDERATION.REVISION_NOT_NEWER');
    expect(code(() => publish(f, alice, record(f, alice, { revision: 3 }), 'publish-key-001'))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('withdraws via tombstone: opting out cancels unsent deliveries and the tombstone wins afterwards', () => {
    const { f, alice } = setup();
    f.fed.markFederated('alice', LISTING_ID, true);
    publish(f, alice, record(f, alice));
    const off = f.call<MarkResult>('federation.record.mark_federated', alice, { recordId: LISTING_ID, federate: false });
    expect(off.withdrawalNeeded).toBe(true);
    expect(f.deps.store.collection<{ id: string; version: number; status: string }>('federation_deliveries').list().map((d) => d.status)).toEqual(['cancelled']);
    expect(code(() => publish(f, alice, record(f, alice, { revision: 2 })))).toBe('FEDERATION.NOT_OPTED_IN');
    const out = publish(f, alice, record(f, alice, { type: 'tombstone', revision: 2, payload: { reason: 'unfederated' } }));
    expect(out.type).toBe('tombstone');
    expect(f.call<PublicRecordDto>('federation.record.get', alice, { originRelay: LOCAL, recordId: LISTING_ID }).state).toBe('tombstoned');
    f.fed.markFederated('alice', LISTING_ID, true);
    expect(code(() => publish(f, alice, record(f, alice, { revision: 2, payload: listingPayload({ description: 'back' }) })))).toBe('FEDERATION.RECORD_TOMBSTONED');
    expect(publish(f, alice, record(f, alice, { revision: 3 })).revision).toBe(3);
  });

  it('exports only the caller own records as author-signed envelopes', () => {
    const { f, alice } = setup();
    const bob = f.person('bob');
    f.fed.markFederated('alice', LISTING_ID, true);
    publish(f, alice, record(f, alice));
    const mine = f.call<{ envelopes: Parameters<typeof verifyAuthor>[0][] }>('federation.record.export', alice).envelopes;
    expect(mine).toHaveLength(1);
    expect(verifyAuthor(mine[0]!)).toBe(true);
    expect(mine[0]).not.toHaveProperty('relaySig');
    expect(f.call<{ envelopes: unknown[] }>('federation.record.export', bob).envelopes).toEqual([]);
  });

  it('lets moderators publish relay-signed labels and denies everyone else', () => {
    const { f, alice } = setup();
    const label = { targetRecordId: LISTING_ID, label: 'scam', severity: 'warn', note: 'reported twice' };
    expect(code(() => f.call('federation.record.publish_label', alice, label))).toBe('AUTHZ.FORBIDDEN');
    const first = f.call<PublishedDto>('federation.record.publish_label', moderator, label);
    expect(first).toMatchObject({ type: 'moderation.label', revision: 1, queuedFor: 1 });
    expect(f.call<PublishedDto>('federation.record.publish_label', moderator, { ...label, recordId: 'frec_' + 'A'.repeat(26), severity: 'block' }).revision).toBe(1);
    expect(code(() => publish(f, alice, record(f, alice, { type: 'moderation.label', payload: { targetRecordId: LISTING_ID, label: 'spam', severity: 'info' } })))).toBe('FEDERATION.LABEL_RESERVED');
  });

  it('denies anonymous writes', () => {
    const { f } = setup();
    const anon = ANONYMOUS('tnt_default');
    expect(code(() => f.call('federation.record.mark_federated', anon, { recordId: LISTING_ID, federate: true }))).toBe('AUTH.REQUIRED');
    expect(code(() => f.call('federation.record.publish', anon, { envelope: {} }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('federation.record.export', anon))).toBe('AUTH.REQUIRED');
    expect(code(() => f.call('federation.record.get', anon, { originRelay: LOCAL, recordId: LISTING_ID }))).toBe('FEDERATION.RECORD_NOT_FOUND');
  });
});
