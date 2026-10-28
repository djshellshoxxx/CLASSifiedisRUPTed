import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { generateSigningKeyPair, keyIdOf } from '@classrup/security';
import type { FederatedRecord } from '../src/index';
import { countersign, hashRecord, scanPrivacy, signRecord, validateEnvelope, verifyAuthor, verifyCountersign } from '../src/index';
import { author, listingPayload, makeRemote, remoteEnvelope, RID } from './helpers';

const rec = (payload: Record<string, unknown>, over: Partial<FederatedRecord> = {}) => {
  const a = author('alice');
  const remote = makeRemote();
  return { a, remote, env: remoteEnvelope(remote, a, 'listing.public', RID(1), 1, payload, over) };
};

describe('records (F11.S01.M02)', () => {
  it('accepts well-formed public payloads of every type', () => {
    const a = author('alice');
    const remote = makeRemote();
    const cases: [Parameters<typeof remoteEnvelope>[2], Record<string, unknown>][] = [
      ['listing.public', listingPayload({ price: { currency: 'USD', minor: '12000' }, description: 'Lightly used' })],
      ['profile.public', { pseudonym: 'bikefan', bio: 'I fix bikes', regionCell: 'u33db' }],
      ['tombstone', { reason: 'deleted' }],
      ['moderation.label', { targetRecordId: RID(2), label: 'spam', severity: 'warn', note: 'repeat posts' }],
    ];
    for (const [type, payload] of cases) expect(validateEnvelope(remoteEnvelope(remote, a, type, RID(1), 1, payload)).ok).toBe(true);
  });

  it('rejects exact coordinates, addresses and contact keys at any depth', () => {
    for (const bad of [{ lat: 52.52 }, { lng: 13.4 }, { address: '1 Main St' }, { email: 'a@b.co' }, { phone: '+4912345' }, { Latitude: 1 }, { 'street_address': 'x' }, { nested: { deep: [{ coords: [1, 2] }] } }]) {
      const r = validateEnvelope(rec(listingPayload(bad)).env);
      expect(r).toEqual({ ok: false, error: 'privacy_violation' });
    }
    expect(validateEnvelope(rec(listingPayload({ title: 'Call me: bob@example.com' })).env)).toEqual({ ok: false, error: 'privacy_violation' });
    expect(validateEnvelope(rec(listingPayload({ description: 'at 52.52000, 13.40500 sharp' })).env)).toEqual({ ok: false, error: 'privacy_violation' });
    expect(validateEnvelope(rec(listingPayload({ description: 'geo:52.5,13.4' })).env)).toEqual({ ok: false, error: 'privacy_violation' });
  });

  it('rejects precise region cells, unknown fields, oversize and malformed envelopes', () => {
    expect(validateEnvelope(rec(listingPayload({ regionCell: 'u33dbc' })).env)).toEqual({ ok: false, error: 'invalid_payload' });
    expect(validateEnvelope(rec(listingPayload({ surprise: 1 })).env)).toEqual({ ok: false, error: 'invalid_payload' });
    expect(validateEnvelope(rec(listingPayload({ title: '' })).env)).toEqual({ ok: false, error: 'invalid_payload' });
    expect(validateEnvelope(rec(listingPayload({ description: 'x'.repeat(40_000) })).env)).toEqual({ ok: false, error: 'too_large' });
    expect(validateEnvelope(rec(listingPayload({ description: 'x'.repeat(120_000) })).env)).toEqual({ ok: false, error: 'too_large' });
    expect(validateEnvelope({ record: 1 })).toEqual({ ok: false, error: 'malformed' });
    expect(validateEnvelope(null)).toEqual({ ok: false, error: 'malformed' });
    const { env } = rec(listingPayload());
    expect(validateEnvelope({ ...env, record: { ...env.record, v: 2 } })).toEqual({ ok: false, error: 'malformed' });
    expect(validateEnvelope({ ...env, record: { ...env.record, type: 'invoice' } })).toEqual({ ok: false, error: 'malformed' });
  });

  it('privacy scan is total: never throws and flags any forbidden key placed anywhere (property)', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (v) => {
        scanPrivacy(v);
        return true;
      }),
    );
    const keyArb = fc.constantFrom('lat', 'lng', 'address', 'email', 'phone', 'Latitude', 'GPS');
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), keyArb, (depth, key) => {
        let node: unknown = { [key]: 1 };
        for (let i = 0; i < depth; i++) node = i % 2 === 0 ? { wrap: node } : [node];
        return scanPrivacy({ title: 'ok', inner: node }) === 'forbidden_key';
      }),
    );
    const deep = Array.from({ length: 20 }).reduce<unknown>((acc) => ({ n: acc }), 1);
    expect(scanPrivacy(deep)).toBe('too_complex');
  });
});

describe('signatures (F11.S01.M03)', () => {
  it('verifies author and relay signatures and binds them to the exact record', () => {
    const { a, remote, env } = rec(listingPayload());
    expect(verifyAuthor(env)).toBe(true);
    expect(verifyCountersign(env, remote.keyId)).toBe(true);
    const tampered = { ...env, record: { ...env.record, revision: 2 } };
    expect(verifyAuthor(tampered)).toBe(false);
    expect(verifyCountersign(tampered, remote.keyId)).toBe(false);
    const other = generateSigningKeyPair();
    expect(verifyAuthor({ ...env, record: { ...env.record, authorKeyId: keyIdOf(other.publicKey) } })).toBe(false);
    expect(verifyCountersign(env, keyIdOf(other.publicKey))).toBe(false);
    expect(verifyCountersign({ record: env.record, authorSig: env.authorSig }, remote.keyId)).toBe(false);
    const swapped = countersign(other, keyIdOf(other.publicKey), { record: env.record, authorSig: env.authorSig });
    expect(verifyCountersign(swapped, remote.keyId)).toBe(false);
    expect(a.keyId).toBe(env.record.authorKeyId);
  });

  it('keeps signature contexts domain-separated and hashing canonical', () => {
    const a = author('alice');
    const record: FederatedRecord = { v: 1, type: 'tombstone', recordId: RID(3), revision: 1, authorKeyId: a.keyId, originRelay: 'relay.b.example', createdAt: 1, payload: { reason: 'deleted' } };
    const env = signRecord(a.keys, record);
    expect(verifyAuthor(env)).toBe(true);
    expect(hashRecord(record)).toBe(hashRecord({ ...record, payload: { reason: 'deleted' } }));
    expect(hashRecord(record)).not.toBe(hashRecord({ ...record, revision: 2 }));
    expect(verifyAuthor({ ...env, authorSig: 'A'.repeat(86) })).toBe(false);
  });
});
