import { describe, expect, it } from 'vitest';
import { createIdentity, unlockIdentity, didFromPublicKey, publicKeyFromDid, encodeBase64url, decodeBase64url } from './identity.ts';

describe('local identity key protection', () => {
  it('binds a did:key to the Ed25519 public key and canonical base64url', () => {
    const publicKey = new Uint8Array(32).fill(7);
    expect(publicKeyFromDid(didFromPublicKey(publicKey))).toEqual(publicKey);
    expect(() => publicKeyFromDid('did:key:z' + '1'.repeat(47))).toThrow();
    expect(decodeBase64url(encodeBase64url(publicKey))).toEqual(publicKey);
    expect(() => decodeBase64url('AB')).toThrow();
  });
  it('persists only ciphertext and rejects wrong password, substituted principal and locked signing', async () => {
    const { identity, protectedIdentity } = await createIdentity('example correct long passphrase');
    const bytes = new TextEncoder().encode('test message');
    const original = await identity.sign(bytes);
    identity.lock();
    await expect(identity.sign(bytes)).rejects.toThrow('locked');
    const restored = await unlockIdentity(JSON.parse(JSON.stringify(protectedIdentity)), 'example correct long passphrase');
    expect(await restored.sign(bytes)).toEqual(original);
    restored.lock();
    await expect(unlockIdentity(protectedIdentity, 'different long passphrase')).rejects.toThrow();
    await expect(unlockIdentity({ ...protectedIdentity, principal: didFromPublicKey(new Uint8Array(32).fill(4)) }, 'example correct long passphrase')).rejects.toThrow('mismatch');
    await expect(unlockIdentity({ ...protectedIdentity, secret: { ...protectedIdentity.secret, kdf: 'scrypt-2-1-1' } }, 'example correct long passphrase')).rejects.toThrow('Unsupported');
  });
});
