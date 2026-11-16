import { encodeBase64url, decodeBase64url, didFromPublicKey, publicKeyFromDid, type StatementSigner } from '@classrup/security';
export { encodeBase64url, decodeBase64url, didFromPublicKey, publicKeyFromDid } from '@classrup/security';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

const encoder = new TextEncoder();
const MAX_SECRET_BYTES = 16 * 1024 * 1024;
const DOMAIN = encoder.encode('classrup.sealed/v1;scrypt=131072,8,1;xchacha20poly1305');

export interface Sealed {
  readonly format: 'classrup.sealed/v1';
  readonly kdf: 'scrypt-131072-8-1';
  readonly cipher: 'xchacha20poly1305';
  readonly salt: string;
  readonly nonce: string;
  readonly ciphertext: string;
}

export function validateSealed(input: unknown): Sealed {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid encrypted data');
  const source = input as Record<string, unknown>;
  if (Object.getPrototypeOf(source) !== Object.prototype && Object.getPrototypeOf(source) !== null || Reflect.ownKeys(source).some(key => typeof key !== 'string' || !Object.getOwnPropertyDescriptor(source, key)?.enumerable || !('value' in (Object.getOwnPropertyDescriptor(source, key) ?? {})))) throw new Error('Invalid encrypted data');
  const v = { ...source };
  if (Object.keys(v).sort().join(',') !== 'cipher,ciphertext,format,kdf,nonce,salt' || v.format !== 'classrup.sealed/v1' || v.kdf !== 'scrypt-131072-8-1' || v.cipher !== 'xchacha20poly1305') throw new Error('Unsupported encrypted format');
  if (decodeBase64url(v.salt, 16).length !== 16 || decodeBase64url(v.nonce, 24).length !== 24 || decodeBase64url(v.ciphertext, MAX_SECRET_BYTES + 16).length < 16) throw new Error('Invalid encrypted data');
  return Object.freeze(v) as unknown as Sealed;
}

function passphraseBytes(passphrase: string): Uint8Array<ArrayBuffer> {
  if (typeof passphrase !== 'string' || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(passphrase)) throw new Error('Invalid passphrase');
  const bytes = encoder.encode(passphrase);
  if (bytes.length < 12 || bytes.length > 1024) throw new Error('Use a passphrase of 12–1024 UTF-8 bytes');
  return bytes;
}

async function derive(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
  const password = passphraseBytes(passphrase);
  try { return await scryptAsync(password, salt, { N: 131072, r: 8, p: 1, dkLen: 32, maxmem: 256 * 1024 * 1024 }); }
  finally { password.fill(0); }
}

export async function seal(plaintext: Uint8Array, passphrase: string): Promise<Sealed> {
  if (plaintext.length > MAX_SECRET_BYTES) throw new Error('Export too large');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(24));
  const key = await derive(passphrase, salt);
  try {
    const ciphertext = xchacha20poly1305(key, nonce, DOMAIN).encrypt(plaintext);
    return { format: 'classrup.sealed/v1', kdf: 'scrypt-131072-8-1', cipher: 'xchacha20poly1305', salt: encodeBase64url(salt), nonce: encodeBase64url(nonce), ciphertext: encodeBase64url(ciphertext) };
  } finally { key.fill(0); }
}

export async function unseal(input: unknown, passphrase: string): Promise<Uint8Array> {
  const value = validateSealed(input);
  const key = await derive(passphrase, decodeBase64url(value.salt, 16));
  try { return xchacha20poly1305(key, decodeBase64url(value.nonce, 24), DOMAIN).decrypt(decodeBase64url(value.ciphertext, MAX_SECRET_BYTES + 16)); }
  catch { throw new Error('Incorrect passphrase or damaged encrypted data'); }
  finally { key.fill(0); }
}

export interface ProtectedIdentity { readonly format: 'classrup.identity-key/v1'; readonly principal: string; readonly secret: Sealed }
export type UnlockedIdentity = StatementSigner;

function signingIdentity(principal: string, initial: CryptoKey): UnlockedIdentity {
  let key: CryptoKey | undefined = initial;
  return {
    principal,
    async sign(bytes) {
      if (!key) throw new Error('Identity locked');
      const used = key;
      const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', used, bytes.slice()));
      if (key !== used) throw new Error('Identity locked');
      return signature;
    },
    lock() { key = undefined; },
  };
}

export async function createIdentity(passphrase: string): Promise<{ identity: UnlockedIdentity; protectedIdentity: ProtectedIdentity }> {
  passphraseBytes(passphrase).fill(0);
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
  const principal = didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)));
  const privateBytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  try {
    const secret = await seal(privateBytes, passphrase);
    const key = await crypto.subtle.importKey('pkcs8', privateBytes, 'Ed25519', false, ['sign']);
    return { identity: signingIdentity(principal, key), protectedIdentity: { format: 'classrup.identity-key/v1', principal, secret } };
  } finally { privateBytes.fill(0); }
}

export async function unlockIdentity(input: unknown, passphrase: string): Promise<UnlockedIdentity> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid identity');
  const source = input as Record<string, unknown>;
  if (Object.getPrototypeOf(source) !== Object.prototype && Object.getPrototypeOf(source) !== null || Reflect.ownKeys(source).some(key => typeof key !== 'string' || !Object.getOwnPropertyDescriptor(source, key)?.enumerable || !('value' in (Object.getOwnPropertyDescriptor(source, key) ?? {})))) throw new Error('Invalid identity');
  const value = { ...source };
  if (Object.keys(value).sort().join(',') !== 'format,principal,secret' || value.format !== 'classrup.identity-key/v1' || typeof value.principal !== 'string') throw new Error('Invalid identity');
  const publicBytes = publicKeyFromDid(value.principal);
  const privateBytes = await unseal(value.secret, passphrase);
  try {
    const key = await crypto.subtle.importKey('pkcs8', privateBytes.slice(), 'Ed25519', false, ['sign']);
    const publicKey = await crypto.subtle.importKey('raw', publicBytes, 'Ed25519', false, ['verify']);
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const signature = await crypto.subtle.sign('Ed25519', key, challenge);
    if (!await crypto.subtle.verify('Ed25519', publicKey, signature, challenge)) throw new Error('Identity key mismatch');
    return signingIdentity(value.principal, key);
  } finally { privateBytes.fill(0); }
}
