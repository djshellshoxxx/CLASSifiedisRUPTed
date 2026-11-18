import { describe, expect, it, vi } from 'vitest';
import { createIdentity, unlockIdentity, didFromPublicKey, publicKeyFromDid, encodeBase64url, decodeBase64url, IdentityCryptoError, type IdentityCryptoStage } from './identity.ts';

const passphrase = 'example correct long passphrase';
const diagnostic = 'private diagnostic canary';
function expectSanitizedFailure(error: unknown, stage: IdentityCryptoStage): void {
  expect(error).toBeInstanceOf(IdentityCryptoError);
  expect(error).toMatchObject({ stage, message: `Browser cryptography failed during ${stage}.` });
  expect(String(error)).not.toContain(diagnostic);
  expect(error).not.toHaveProperty('cause');
}

describe('local identity key protection', () => {
  it('reports the exact failed native stage without retrying or exposing native exception data', async () => {
    const native = new Error('private diagnostic canary');
    const generate = vi.spyOn(crypto.subtle, 'generateKey').mockRejectedValueOnce(native);
    try {
      const error = await createIdentity('example correct long passphrase').catch(error => error as unknown);
      expect(error).toBeInstanceOf(IdentityCryptoError);
      expect(error).toMatchObject({ stage: 'generate-key', message: 'Browser cryptography failed during generate-key.' });
      expect(String(error)).not.toContain('canary');
      expect(error).not.toHaveProperty('cause');
      expect(generate).toHaveBeenCalledTimes(1);
    } finally { generate.mockRestore(); }
  });
  it.each([1, 2])('recovers after %i native generation failures and preserves the real identity through lock and unlock', async failures => {
    let rejectFirst!: (reason: unknown) => void;
    const firstAttempt = new Promise<CryptoKeyPair>((_resolve, reject) => { rejectFirst = reject; });
    const generate = vi.spyOn(crypto.subtle, 'generateKey').mockReturnValueOnce(firstAttempt);
    for (let attempt = 1; attempt < failures; attempt++) generate.mockRejectedValueOnce(new DOMException(diagnostic, 'OperationError'));
    try {
      const creating = createIdentity(passphrase);
      await Promise.resolve();
      expect(generate).toHaveBeenCalledTimes(1);
      rejectFirst(new DOMException(diagnostic, 'OperationError'));
      const { identity, protectedIdentity } = await creating;
      try {
        expect(generate).toHaveBeenCalledTimes(failures + 1);
        for (const call of generate.mock.calls) expect(call).toEqual(['Ed25519', true, ['sign', 'verify']]);
        const pair = await generate.mock.results[failures]!.value as CryptoKeyPair;
        const publicBytes = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
        expect(identity.principal).toBe(didFromPublicKey(publicBytes));
        expect(protectedIdentity.principal).toBe(identity.principal);
        const bytes = new TextEncoder().encode('recovered identity message');
        const signature = await identity.sign(bytes);
        expect(await crypto.subtle.verify('Ed25519', pair.publicKey, signature.slice(), bytes)).toBe(true);
        identity.lock();
        await expect(identity.sign(bytes)).rejects.toThrow('locked');
        const restored = await unlockIdentity(JSON.parse(JSON.stringify(protectedIdentity)), passphrase);
        try {
          expect(restored.principal).toBe(identity.principal);
          expect(await restored.sign(bytes)).toEqual(signature);
        } finally { restored.lock(); }
        await expect(restored.sign(bytes)).rejects.toThrow('locked');
        expect(generate).toHaveBeenCalledTimes(failures + 1);
      } finally { identity.lock(); }
    } finally { generate.mockRestore(); }
  });
  it('fails closed after three generation attempts without exporting or importing any key', async () => {
    const generate = vi.spyOn(crypto.subtle, 'generateKey').mockRejectedValue(new DOMException(diagnostic, 'OperationError'));
    const exported = vi.spyOn(crypto.subtle, 'exportKey');
    const imported = vi.spyOn(crypto.subtle, 'importKey');
    try {
      const error = await createIdentity(passphrase).catch(error => error as unknown);
      expectSanitizedFailure(error, 'generate-key');
      expect(generate).toHaveBeenCalledTimes(3);
      for (const call of generate.mock.calls) expect(call).toEqual(['Ed25519', true, ['sign', 'verify']]);
      expect(exported).not.toHaveBeenCalled();
      expect(imported).not.toHaveBeenCalled();
    } finally { imported.mockRestore(); exported.mockRestore(); generate.mockRestore(); }
  });
  it.each([
    ['unsupported algorithm', new DOMException(diagnostic, 'NotSupportedError')],
    ['invalid access', new DOMException(diagnostic, 'InvalidAccessError')],
    ['invalid syntax', new DOMException(diagnostic, 'SyntaxError')],
    ['invalid data', new DOMException(diagnostic, 'DataError')],
    ['security policy', new DOMException(diagnostic, 'SecurityError')],
    ['aborted operation', new DOMException(diagnostic, 'AbortError')],
    ['type error', new TypeError(diagnostic)],
    ['renamed ordinary error', Object.assign(new Error(diagnostic), { name: 'OperationError' })],
    ['error-shaped object', { name: 'OperationError', message: diagnostic }],
    ['string rejection', diagnostic],
    ['null rejection', null],
    ['undefined rejection', undefined],
  ] as const)('does not retry an ineligible generation failure: %s', async (_label, native) => {
    const generate = vi.spyOn(crypto.subtle, 'generateKey').mockRejectedValue(native);
    try {
      const error = await createIdentity(passphrase).catch(error => error as unknown);
      expectSanitizedFailure(error, 'generate-key');
      expect(generate).toHaveBeenCalledTimes(1);
    } finally { generate.mockRestore(); }
  });
  it('stops immediately when an eligible generation failure is followed by an ineligible failure', async () => {
    const generate = vi.spyOn(crypto.subtle, 'generateKey')
      .mockRejectedValueOnce(new DOMException(diagnostic, 'OperationError'))
      .mockRejectedValueOnce(new DOMException(diagnostic, 'NotSupportedError'));
    try {
      const error = await createIdentity(passphrase).catch(error => error as unknown);
      expectSanitizedFailure(error, 'generate-key');
      expect(generate).toHaveBeenCalledTimes(2);
    } finally { generate.mockRestore(); }
  });
  it.each([
    ['raw', 'export-public-key'],
    ['pkcs8', 'export-private-key'],
  ] as const)('does not regenerate when %s export reports OperationError', async (format, stage) => {
    const nativeExport = crypto.subtle.exportKey.bind(crypto.subtle);
    const generate = vi.spyOn(crypto.subtle, 'generateKey');
    const exported = vi.spyOn(crypto.subtle, 'exportKey');
    const imported = vi.spyOn(crypto.subtle, 'importKey');
    if (format === 'pkcs8') exported.mockImplementationOnce((_format, key) => nativeExport('raw', key));
    exported.mockRejectedValueOnce(new DOMException(diagnostic, 'OperationError'));
    try {
      const error = await createIdentity(passphrase).catch(error => error as unknown);
      expectSanitizedFailure(error, stage);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(exported.mock.calls.map(call => call[0])).toEqual(format === 'raw' ? ['raw'] : ['raw', 'pkcs8']);
      expect(imported).not.toHaveBeenCalled();
    } finally { imported.mockRestore(); exported.mockRestore(); generate.mockRestore(); }
  });
  it('does not regenerate when private-key import reports OperationError and clears the exported bytes', async () => {
    const generate = vi.spyOn(crypto.subtle, 'generateKey');
    const exported = vi.spyOn(crypto.subtle, 'exportKey');
    const imported = vi.spyOn(crypto.subtle, 'importKey').mockRejectedValueOnce(new DOMException(diagnostic, 'OperationError'));
    try {
      const error = await createIdentity(passphrase).catch(error => error as unknown);
      expectSanitizedFailure(error, 'import-private-key');
      expect(generate).toHaveBeenCalledTimes(1);
      expect(exported.mock.calls.map(call => call[0])).toEqual(['raw', 'pkcs8']);
      expect(imported).toHaveBeenCalledTimes(1);
      expect(imported).toHaveBeenCalledWith('pkcs8', expect.any(Uint8Array), 'Ed25519', false, ['sign']);
      const bytes = imported.mock.calls[0]![1];
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect((bytes as Uint8Array).every(byte => byte === 0)).toBe(true);
    } finally { imported.mockRestore(); exported.mockRestore(); generate.mockRestore(); }
  });
  it('rejects an invalid passphrase before attempting generation', async () => {
    const generate = vi.spyOn(crypto.subtle, 'generateKey');
    try {
      await expect(createIdentity('short')).rejects.toThrow('12–1024');
      expect(generate).not.toHaveBeenCalled();
    } finally { generate.mockRestore(); }
  });
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
