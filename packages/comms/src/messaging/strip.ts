/**
 * Client-side metadata stripping (F08.S01.M03). Pure functions over bytes: they never throw, never
 * grow the input, and return an error result for anything they cannot parse as the claimed format.
 * Dropping happens before encryption so EXIF/GPS never leaves the device.
 */
import type { Result } from '@classrup/kernel';
import { err, ok } from '@classrup/kernel';

export type StripError = 'not_jpeg' | 'not_png' | 'truncated' | 'malformed' | 'unsupported_mime';

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const isRestart = (m: number): boolean => m >= 0xd0 && m <= 0xd7;

/** APP1 (EXIF/XMP), APP3..APP12, APP13 (IPTC), APP15 and COM. APP0 (JFIF), APP14 (Adobe colour) and ICC profiles stay. */
function dropsJpegSegment(marker: number, data: Uint8Array): boolean {
  if (marker === 0xfe || marker === 0xe1 || marker === 0xed || marker === 0xef) return true;
  if (marker >= 0xe3 && marker <= 0xec) return true;
  if (marker === 0xe2) return !startsWithAscii(data, 'ICC_PROFILE');
  return false;
}

function startsWithAscii(data: Uint8Array, text: string): boolean {
  if (data.length < text.length) return false;
  for (let i = 0; i < text.length; i++) if (data[i] !== text.charCodeAt(i)) return false;
  return true;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** Index just past the entropy-coded scan data that starts at `pos`, or -1 when the data ends mid-marker. */
function skipScanData(input: Uint8Array, start: number): number {
  let pos = start;
  while (pos < input.length) {
    if (input[pos] !== 0xff) {
      pos++;
      continue;
    }
    const next = input[pos + 1];
    if (next === undefined) return -1;
    if (next === 0x00 || isRestart(next)) pos += 2;
    else if (next === 0xff) pos++;
    else return pos;
  }
  return pos;
}

export function stripJpegMetadata(input: Uint8Array): Result<Uint8Array, StripError> {
  if (input.length < 4 || input[0] !== 0xff || input[1] !== SOI) return err('not_jpeg');
  const parts: Uint8Array[] = [input.subarray(0, 2)];
  let pos = 2;
  while (pos < input.length) {
    if (input[pos] !== 0xff) return err('malformed');
    while (input[pos] === 0xff) pos++;
    const marker = input[pos++];
    if (marker === undefined) return err('truncated');
    if (marker === EOI) return ok(concat([...parts, Uint8Array.of(0xff, EOI)]));
    if (marker === 0x00 || marker === SOI) return err('malformed');
    if (marker === 0x01 || isRestart(marker)) {
      parts.push(Uint8Array.of(0xff, marker));
      continue;
    }
    if (pos + 2 > input.length) return err('truncated');
    const length = ((input[pos] as number) << 8) | (input[pos + 1] as number);
    const end = pos + length;
    if (length < 2) return err('malformed');
    if (end > input.length) return err('truncated');
    const data = input.subarray(pos + 2, end);
    if (!dropsJpegSegment(marker, data)) parts.push(Uint8Array.of(0xff, marker), input.subarray(pos, end));
    pos = end;
    if (marker === SOS) {
      const scanEnd = skipScanData(input, pos);
      if (scanEnd < 0) return err('truncated');
      parts.push(input.subarray(pos, scanEnd));
      pos = scanEnd;
    }
  }
  return err('truncated');
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_DROPPED = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']);

export function stripPngMetadata(input: Uint8Array): Result<Uint8Array, StripError> {
  if (input.length < 8 || PNG_SIGNATURE.some((b, i) => input[i] !== b)) return err('not_png');
  const parts: Uint8Array[] = [input.subarray(0, 8)];
  let pos = 8;
  let first = true;
  while (pos + 12 <= input.length) {
    const length = (((input[pos] as number) << 24) | ((input[pos + 1] as number) << 16) | ((input[pos + 2] as number) << 8) | (input[pos + 3] as number)) >>> 0;
    const type = String.fromCharCode(input[pos + 4] as number, input[pos + 5] as number, input[pos + 6] as number, input[pos + 7] as number);
    const end = pos + 12 + length;
    if (!/^[A-Za-z]{4}$/.test(type) || (first && type !== 'IHDR')) return err('malformed');
    if (end > input.length) return err('truncated');
    if (!PNG_DROPPED.has(type)) parts.push(input.subarray(pos, end));
    first = false;
    pos = end;
    if (type === 'IEND') return ok(concat(parts));
  }
  return err('truncated');
}

/** Strips by declared mime type. WebP and PDF are not stripped here: callers must not upload them unreviewed. */
export function stripMetadata(mime: string, input: Uint8Array): Result<Uint8Array, StripError> {
  if (mime === 'image/jpeg') return stripJpegMetadata(input);
  if (mime === 'image/png') return stripPngMetadata(input);
  return err('unsupported_mime');
}
