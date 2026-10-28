import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { testActor } from '@classrup/kernel';
import {
  anyOf, assertEnvelope, contentHash, decryptForRecipient, encryptForRecipients, fromBase64Url, generateBoxKeyPair,
  generateSigningKeyPair, hasAnyRole, isOwner, issueCapability, keyIdOf, loadSecrets, MemoryNonceStore, open, PolicyAuthorizer,
  ReplayGuard, seal, signEnvelope, signRequest, toBase64Url, utf8, verifyCapability, verifyEnvelope, verifyRequestSignature,
} from '../src/index';

describe('encoding', () => {
  it('base64url round-trips', () => {
    fc.assert(fc.property(fc.uint8Array({ maxLength: 200 }), (b) => toBase64Url(fromBase64Url(toBase64Url(b))) === toBase64Url(b)));
    expect(() => fromBase64Url('a+b')).toThrow();
  });
});

describe('signatures', () => {
  const keys = generateSigningKeyPair();
  it('verifies valid envelopes and rejects tampering, wrong context and wrong signer', () => {
    const env = signEnvelope(keys, 'listing', { title: 'bike', price: { minor: 100n } });
    expect(verifyEnvelope(env, 'listing')).toBe(true);
    expect(verifyEnvelope(env, 'listing', keyIdOf(keys.publicKey))).toBe(true);
    expect(verifyEnvelope({ ...env, payload: { title: 'car', price: { minor: 100n } } }, 'listing')).toBe(false);
    expect(verifyEnvelope(env, 'receipt')).toBe(false);
    expect(verifyEnvelope(env, 'listing', keyIdOf(generateSigningKeyPair().publicKey))).toBe(false);
    expect(verifyEnvelope({ ...env, sig: 'AAAA' }, 'listing')).toBe(false);
    expect(() => assertEnvelope({ ...env, signer: 'ed25519:xx' }, 'listing')).toThrow(/signature/);
  });
  it('signature is independent of key order', () => {
    const a = signEnvelope(keys, 'x.y', { a: 1, b: 2 });
    expect(verifyEnvelope({ ...a, payload: { b: 2, a: 1 } }, 'x.y')).toBe(true);
    expect(contentHash({ a: 1, b: 2 })).toBe(contentHash({ b: 2, a: 1 }));
  });
  it('signed requests bind method, path and body', () => {
    const h = signRequest(keys, { method: 'post', path: '/v1/x', body: '{}', timestamp: 5, sessionId: 'ses_1' });
    const base = { method: 'POST', path: '/v1/x', body: '{}', timestamp: 5, nonce: h['x-classrup-nonce'], sessionId: 'ses_1' };
    expect(verifyRequestSignature(h['x-classrup-key'], h['x-classrup-sig'], base)).toBe(true);
    expect(verifyRequestSignature(h['x-classrup-key'], h['x-classrup-sig'], { ...base, body: '{"a":1}' })).toBe(false);
    expect(verifyRequestSignature(h['x-classrup-key'], h['x-classrup-sig'], { ...base, path: '/v1/y' })).toBe(false);
  });
});

describe('encryption', () => {
  it('seals and opens; rejects wrong key and tampered aad', () => {
    const bob = generateBoxKeyPair();
    const s = seal(bob.publicKey, utf8('meet at library'), utf8('thread-1'));
    expect(new TextDecoder().decode(open(bob, s, utf8('thread-1')))).toBe('meet at library');
    expect(() => open(generateBoxKeyPair(), s, utf8('thread-1'))).toThrow(/authenticated/);
    expect(() => open(bob, s, utf8('thread-2'))).toThrow(/authenticated/);
  });
  it('multi-recipient encryption', () => {
    const a = generateBoxKeyPair();
    const b = generateBoxKeyPair();
    const m = encryptForRecipients({ a: a.publicKey, b: b.publicKey }, utf8('hi'));
    expect(new TextDecoder().decode(decryptForRecipient('b', b, m))).toBe('hi');
    expect(() => decryptForRecipient('c', b, m)).toThrow(/recipient/);
    expect(() => decryptForRecipient('a', b, m)).toThrow();
  });
});

describe('authorization', () => {
  const authz = new PolicyAuthorizer([
    { permission: 'listing:read', allow: () => true, public: true, description: 'public listings' },
    { permission: 'listing:edit', allow: isOwner, description: 'owner edits' },
    { permission: 'moderation:*', allow: anyOf(hasAnyRole('moderator'), hasAnyRole('admin')), description: 'moderators' },
  ]);
  const alice = testActor('acct_alice');
  it('denies by default, isolates tenants, and distinguishes 401 from 403', () => {
    expect(authz.can({ kind: 'anonymous', id: 'anonymous', roles: [], tenantId: 'tnt_default' }, 'listing:read')).toBe(true);
    expect(authz.can(alice, 'listing:edit', { type: 'listing', ownerId: 'acct_alice' })).toBe(true);
    expect(authz.can(alice, 'listing:edit', { type: 'listing', ownerId: 'acct_bob' })).toBe(false);
    expect(authz.can(alice, 'listing:edit', { type: 'listing', ownerId: 'acct_alice', tenantId: 'tnt_other' })).toBe(false);
    expect(authz.can(testActor('m', ['moderator']), 'moderation:decide')).toBe(true);
    expect(() => authz.authorize(alice, 'listing:delete')).toThrow(/not permitted/);
    expect(() => authz.authorize({ kind: 'anonymous', id: 'anonymous', roles: [], tenantId: 'tnt_default' }, 'listing:edit')).toThrow(/authentication/);
  });
});

describe('capabilities, replay, secrets', () => {
  it('verifies scoped capabilities and rejects expired/revoked/mismatched', () => {
    const issuer = generateSigningKeyPair();
    const tok = issueCapability(issuer, { jti: 'j1', sub: 'acct_a', permission: 'trade:read', resourceType: 'trade', resourceId: 't1', iat: 0, exp: 1000 });
    const check = { issuerKeyId: keyIdOf(issuer.publicKey), now: 10, isRevoked: () => false, subject: 'acct_a', permission: 'trade:read' as const, resourceType: 'trade', resourceId: 't1' };
    expect(verifyCapability(tok, check).jti).toBe('j1');
    expect(() => verifyCapability(tok, { ...check, now: 1000 })).toThrow(/expired/);
    expect(() => verifyCapability(tok, { ...check, isRevoked: () => true })).toThrow(/revoked/);
    expect(() => verifyCapability(tok, { ...check, resourceId: 't2' })).toThrow(/grant/);
  });
  it('replay guard rejects duplicates and stale timestamps', () => {
    const g = new ReplayGuard(new MemoryNonceStore(), 1000);
    g.check('nonce-0000000000001', 100, 100);
    expect(() => g.check('nonce-0000000000001', 100, 200)).toThrow(/replayed/);
    expect(() => g.check('nonce-0000000000002', 100, 5000)).toThrow(/window/);
  });
  it('secrets never print and report only names', () => {
    const s = loadSecrets({ A: 'x'.repeat(40) }, [{ name: 'A', required: true, minLength: 32 }]);
    expect(String(s.get('A'))).toBe('[secret]');
    expect(JSON.stringify({ s: s.get('A') })).toBe('{"s":"[secret]"}');
    try {
      loadSecrets({ B: 'short' }, [{ name: 'A', required: true }, { name: 'B', required: true, minLength: 32 }]);
      expect.unreachable();
    } catch (e) {
      expect(JSON.stringify(e)).not.toContain('short');
    }
  });
});
