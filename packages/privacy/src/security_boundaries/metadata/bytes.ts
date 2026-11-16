// Bounds-checked readers for untrusted binary input: every read past the buffer throws Malformed.
export class Malformed extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Malformed';
  }
}

export function rd8(b: Uint8Array, i: number): number {
  if (!Number.isInteger(i) || i < 0 || i >= b.length) throw new Malformed('read past end');
  return b[i] as number;
}

export function rd16be(b: Uint8Array, i: number): number {
  return (rd8(b, i) << 8) | rd8(b, i + 1);
}

export function rd32be(b: Uint8Array, i: number): number {
  return ((rd8(b, i) << 24) | (rd8(b, i + 1) << 16) | (rd8(b, i + 2) << 8) | rd8(b, i + 3)) >>> 0;
}

export function rd16le(b: Uint8Array, i: number): number {
  return rd8(b, i) | (rd8(b, i + 1) << 8);
}

export function rd24le(b: Uint8Array, i: number): number {
  return rd8(b, i) | (rd8(b, i + 1) << 8) | (rd8(b, i + 2) << 16);
}

export function rd32le(b: Uint8Array, i: number): number {
  return (rd8(b, i) | (rd8(b, i + 1) << 8) | (rd8(b, i + 2) << 16) | (rd8(b, i + 3) << 24)) >>> 0;
}

/** Subarray with explicit bounds; never clamps silently. */
export function slice(b: Uint8Array, start: number, end: number): Uint8Array {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > b.length) throw new Malformed('slice out of range');
  return b.subarray(start, end);
}

export function startsWithAscii(b: Uint8Array, at: number, text: string): boolean {
  if (at < 0 || at + text.length > b.length) return false;
  for (let i = 0; i < text.length; i++) if (b[at + i] !== text.charCodeAt(i)) return false;
  return true;
}

export function asciiAt(b: Uint8Array, at: number, n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += String.fromCharCode(rd8(b, at + i));
  return s;
}

/** True when the ASCII needle occurs anywhere in b (linear, no allocation). */
export function containsAscii(b: Uint8Array, needle: string): boolean {
  const n = needle.length;
  const first = needle.charCodeAt(0);
  for (let i = 0; i + n <= b.length; i++) {
    if (b[i] !== first) continue;
    let j = 1;
    while (j < n && b[i + j] === needle.charCodeAt(j)) j++;
    if (j === n) return true;
  }
  return false;
}

export function concat(parts: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

export function u16be(n: number): Uint8Array {
  return Uint8Array.of((n >> 8) & 0xff, n & 0xff);
}

export function u32le(n: number): Uint8Array {
  return Uint8Array.of(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff);
}

let table: Uint32Array | undefined;
/** CRC-32 (PNG chunk checksum, an integrity check and not a cryptographic primitive). */
export function crc32(parts: readonly Uint8Array[]): number {
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const p of parts) for (let i = 0; i < p.length; i++) crc = (table[(crc ^ (p[i] as number)) & 0xff] as number) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
