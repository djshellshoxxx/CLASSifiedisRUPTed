// Isomorphic encoding and Ed25519 did:key binding; no key ownership or account policy.
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const MAX_SECRET_BYTES = 16 * 1024 * 1024;

export function encodeBase64url(bytes: Uint8Array): string {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Accept canonical unpadded base64url only, before allocation. */
export function decodeBase64url(value: unknown, maxBytes = MAX_SECRET_BYTES): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || value.length > Math.ceil(maxBytes * 4 / 3) || !/^[A-Za-z0-9_-]*$/.test(value)) throw new Error('Invalid base64url');
  const bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  if (bytes.length > maxBytes || encodeBase64url(bytes) !== value) throw new Error('Invalid base64url');
  return bytes;
}

/** W3C did:key, unsigned-varint multicodec ed25519-pub (0xed, 0x01), base58btc. */
export function didFromPublicKey(key: Uint8Array): string {
  if (key.length !== 32) throw new Error('Ed25519 public key must have 32 bytes');
  let n = 0n;
  for (const b of new Uint8Array([0xed, 0x01, ...key])) n = n * 256n + BigInt(b);
  let text = '';
  while (n > 0n) { text = alphabet[Number(n % 58n)] + text; n /= 58n; }
  return `did:key:z${text}`;
}

export function publicKeyFromDid(did: string): Uint8Array<ArrayBuffer> {
  if (!/^did:key:z[1-9A-HJ-NP-Za-km-z]{46,48}$/.test(did)) throw new Error('Unsupported DID');
  let n = 0n;
  for (const c of did.slice(9)) n = n * 58n + BigInt(alphabet.indexOf(c));
  const bytes: number[] = [];
  while (n > 0n) { bytes.unshift(Number(n % 256n)); n /= 256n; }
  if (bytes.length !== 34 || bytes[0] !== 0xed || bytes[1] !== 1) throw new Error('Unsupported DID codec');
  const key = new Uint8Array(bytes.slice(2));
  if (didFromPublicKey(key) !== did) throw new Error('Noncanonical DID');
  return key;
}

export interface StatementSigner {
  readonly principal: string;
  sign(bytes: Uint8Array): Promise<Uint8Array>;
  lock(): void;
}
