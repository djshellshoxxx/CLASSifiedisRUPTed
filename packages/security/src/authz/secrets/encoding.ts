// Strict unpadded base64url (RFC 4648 §5) and UTF-8 helpers; isomorphic, no Buffer.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const LOOKUP: ReadonlyMap<string, number> = new Map([...ALPHABET].map((c, i) => [c, i]));
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export const BASE64URL_RE = /^[A-Za-z0-9_-]*$/;

export function bytesToBase64url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let c = 0; c < chars; c++) out += ALPHABET[(n >> (18 - 6 * c)) & 63];
  }
  return out;
}

/** Decodes canonical unpadded base64url; undefined for any other alphabet, a 1-char tail or non-zero padding bits. */
export function base64urlToBytes(text: string): Uint8Array | undefined {
  if (!BASE64URL_RE.test(text) || text.length % 4 === 1) return undefined;
  const out = new Uint8Array(Math.floor((text.length * 6) / 8));
  let acc = 0;
  let bits = 0;
  let o = 0;
  for (const ch of text) {
    acc = (acc << 6) | (LOOKUP.get(ch) ?? 0);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 0xff;
    }
    acc &= (1 << bits) - 1;
  }
  if (acc !== 0) return undefined;
  return out;
}

export function utf8(text: string): Uint8Array {
  return encoder.encode(text);
}

/** Strict UTF-8 decode; undefined for invalid byte sequences. */
export function fromUtf8(bytes: Uint8Array): string | undefined {
  try {
    return decoder.decode(bytes);
  } catch {
    return undefined;
  }
}

export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}
