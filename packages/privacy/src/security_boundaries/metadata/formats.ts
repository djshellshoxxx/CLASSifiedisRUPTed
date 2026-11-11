// Byte-level parsers that rebuild a still image from a whitelist of structural segments.
// They never decode pixels: entropy-coded data is copied verbatim, everything else is dropped and reported.
import { concat, containsAscii, crc32, Malformed, rd16be, rd16le, rd24le, rd32be, rd32le, rd8, slice, startsWithAscii, u16be, u32le } from './bytes.ts';
import { inspectTiff, tiffOf } from './tiff.ts';

export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_SIDE_PX = 16384;

export type FindingKind =
  | 'exif' | 'xmp' | 'iptc' | 'gps' | 'makernote' | 'thumbnail' | 'icc' | 'comment' | 'text_chunk' | 'ancillary'
  | 'trailing_data' | 'unknown_segment' | 'metadata_flag';

export interface Finding {
  readonly kind: FindingKind;
  /** Segment or chunk name such as APP1, tEXt or EXIF; never a metadata value. */
  readonly where: string;
}

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export type Analysis =
  | { readonly ok: true; readonly mime: ImageMime; readonly width: number; readonly height: number; readonly orientation?: number; readonly output: Uint8Array; readonly findings: readonly Finding[] }
  | { readonly ok: false; readonly reason: 'unsupported' | 'too_large' | 'animated' | 'malformed' };

const GPS_NEEDLES = ['GPSLatitude', 'GPSLongitude', 'GPSPosition', 'exif:GPS', 'GPSAltitude'] as const;

function hasGpsText(b: Uint8Array): boolean {
  return GPS_NEEDLES.some((n) => containsAscii(b, n));
}

interface Collector {
  findings: Finding[];
  orientation: number | undefined;
}

function addFinding(c: Collector, kind: FindingKind, where: string): void {
  if (!c.findings.some((f) => f.kind === kind && f.where === where)) c.findings.push({ kind, where });
}

function noteExif(c: Collector, where: string, payload: Uint8Array): void {
  addFinding(c, 'exif', where);
  const info = inspectTiff(tiffOf(payload));
  if (info.gps) addFinding(c, 'gps', where);
  if (info.makernote) addFinding(c, 'makernote', where);
  if (info.thumbnail) addFinding(c, 'thumbnail', where);
  if (info.orientation !== undefined && c.orientation === undefined) c.orientation = info.orientation;
}

function checkDims(width: number, height: number): 'ok' | 'too_large' | 'malformed' {
  if (width < 1 || height < 1) return 'malformed';
  return width > MAX_SIDE_PX || height > MAX_SIDE_PX ? 'too_large' : 'ok';
}

// ---------------------------------------------------------------- JPEG

const MAX_JPEG_SEGMENTS = 20_000;

function jfifOutput(payload: Uint8Array, c: Collector): Uint8Array | undefined {
  // JFIF\0 version(2) units(1) xdensity(2) ydensity(2) xthumb(1) ythumb(1) [thumbnail data]
  if (payload.length < 14) return undefined;
  const hasThumb = rd8(payload, 12) !== 0 || rd8(payload, 13) !== 0;
  if (hasThumb) addFinding(c, 'thumbnail', 'APP0');
  else if (payload.length !== 14) addFinding(c, 'unknown_segment', 'APP0');
  if (!hasThumb && payload.length === 14) return payload;
  const trimmed = Uint8Array.from(slice(payload, 0, 14));
  trimmed[12] = 0;
  trimmed[13] = 0;
  return trimmed;
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  return concat([Uint8Array.of(0xff, marker), u16be(payload.length + 2), payload]);
}

export function parseJpeg(b: Uint8Array): Analysis {
  const c: Collector = { findings: [], orientation: undefined };
  const out: Uint8Array[] = [Uint8Array.of(0xff, 0xd8)];
  let pos = 2;
  let size: [number, number] | undefined;
  let scans = 0;
  let segments = 0;
  let eoi = false;
  while (pos < b.length) {
    if (rd8(b, pos) !== 0xff) return { ok: false, reason: 'malformed' };
    let m = rd8(b, pos + 1);
    pos += 2;
    while (m === 0xff) m = rd8(b, pos++); // fill bytes
    if (m === 0xd9) {
      eoi = true;
      break;
    }
    if (m === 0x00 || m === 0x01 || (m >= 0xd0 && m <= 0xd8)) return { ok: false, reason: 'malformed' };
    if (++segments > MAX_JPEG_SEGMENTS) return { ok: false, reason: 'malformed' };
    const len = rd16be(b, pos);
    if (len < 2) return { ok: false, reason: 'malformed' };
    const payload = slice(b, pos + 2, pos + len);
    pos += len;
    const isSof = m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
    if (isSof) {
      if (size || payload.length < 6) return { ok: false, reason: 'malformed' };
      size = [rd16be(payload, 3), rd16be(payload, 1)];
      const d = checkDims(size[0], size[1]);
      if (d !== 'ok') return { ok: false, reason: d };
      out.push(segment(m, payload));
    } else if (m === 0xc4 || m === 0xdb || m === 0xdd || m === 0xcc) {
      out.push(segment(m, payload));
    } else if (m === 0xda) {
      if (!size) return { ok: false, reason: 'malformed' };
      let i = pos;
      for (;;) {
        const x = rd8(b, i);
        if (x !== 0xff) {
          i++;
          continue;
        }
        const n = rd8(b, i + 1);
        if (n === 0x00 || (n >= 0xd0 && n <= 0xd7)) i += 2;
        else if (n === 0xff) i += 1;
        else break;
      }
      out.push(segment(m, payload), slice(b, pos, i));
      pos = i;
      scans++;
    } else if (m === 0xe0 && startsWithAscii(payload, 0, 'JFIF\0')) {
      const kept = jfifOutput(payload, c);
      if (kept) out.push(segment(m, kept));
    } else if (m === 0xee && payload.length === 12 && startsWithAscii(payload, 0, 'Adobe')) {
      out.push(segment(m, payload));
    } else {
      classifyJpegSegment(c, m, payload);
    }
  }
  if (!eoi || !size || scans === 0) return { ok: false, reason: 'malformed' };
  out.push(Uint8Array.of(0xff, 0xd9));
  if (pos < b.length) addFinding(c, 'trailing_data', 'EOI');
  return { ok: true, mime: 'image/jpeg', width: size[0], height: size[1], ...(c.orientation === undefined ? {} : { orientation: c.orientation }), output: concat(out), findings: c.findings };
}

function classifyJpegSegment(c: Collector, m: number, payload: Uint8Array): void {
  const where = m >= 0xe0 && m <= 0xef ? `APP${m - 0xe0}` : m === 0xfe ? 'COM' : `0x${m.toString(16)}`;
  if (m === 0xe1 && startsWithAscii(payload, 0, 'Exif\0\0')) noteExif(c, where, payload);
  else if (m === 0xe1 && (startsWithAscii(payload, 0, 'http://ns.adobe.com/xap/1.0/\0') || startsWithAscii(payload, 0, 'http://ns.adobe.com/xmp/extension/\0'))) {
    addFinding(c, 'xmp', where);
    if (hasGpsText(payload)) addFinding(c, 'gps', where);
  } else if (m === 0xed) addFinding(c, 'iptc', where);
  else if (m === 0xe2 && startsWithAscii(payload, 0, 'ICC_PROFILE\0')) addFinding(c, 'icc', where);
  else if (m === 0xe0 && startsWithAscii(payload, 0, 'JFXX\0')) addFinding(c, 'thumbnail', where);
  else if (m === 0xfe) {
    addFinding(c, 'comment', where);
    if (hasGpsText(payload)) addFinding(c, 'gps', where);
  } else {
    addFinding(c, 'unknown_segment', where);
    if (hasGpsText(payload)) addFinding(c, 'gps', where);
  }
}

// ---------------------------------------------------------------- PNG

const PNG_SIG = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const PNG_KEEP = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS']);

export function parsePng(b: Uint8Array): Analysis {
  const c: Collector = { findings: [], orientation: undefined };
  const out: Uint8Array[] = [PNG_SIG];
  let pos = 8;
  let width = 0;
  let height = 0;
  let idat = 0;
  let iend = false;
  let first = true;
  while (pos < b.length) {
    const len = rd32be(b, pos);
    if (len > 0x7fffffff) return { ok: false, reason: 'malformed' };
    const type = String.fromCharCode(rd8(b, pos + 4), rd8(b, pos + 5), rd8(b, pos + 6), rd8(b, pos + 7));
    if (!/^[A-Za-z]{4}$/.test(type)) return { ok: false, reason: 'malformed' };
    const data = slice(b, pos + 8, pos + 8 + len);
    const crc = rd32be(b, pos + 8 + len);
    const chunk = slice(b, pos, pos + 12 + len);
    pos += 12 + len;
    if (first) {
      if (type !== 'IHDR' || len !== 13) return { ok: false, reason: 'malformed' };
      first = false;
      width = rd32be(data, 0);
      height = rd32be(data, 4);
      const d = checkDims(width, height);
      if (d !== 'ok') return { ok: false, reason: d };
    }
    if (type === 'acTL' || type === 'fcTL' || type === 'fdAT') return { ok: false, reason: 'animated' };
    if (PNG_KEEP.has(type)) {
      if (crc32([slice(chunk, 4, 8), data]) !== crc) return { ok: false, reason: 'malformed' };
      if (type === 'IDAT') idat++;
      out.push(chunk);
      if (type === 'IEND') {
        iend = true;
        break;
      }
    } else if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
      addFinding(c, 'text_chunk', type);
      if (hasGpsText(data)) addFinding(c, 'gps', type);
    } else if (type === 'eXIf') noteExif(c, type, data);
    else if (type === 'iCCP') addFinding(c, 'icc', type);
    else addFinding(c, 'ancillary', type);
  }
  if (!iend || idat === 0 || first) return { ok: false, reason: 'malformed' };
  if (pos < b.length) addFinding(c, 'trailing_data', 'IEND');
  return { ok: true, mime: 'image/png', width, height, ...(c.orientation === undefined ? {} : { orientation: c.orientation }), output: concat(out), findings: c.findings };
}

// ---------------------------------------------------------------- WebP

export function parseWebp(b: Uint8Array): Analysis {
  const c: Collector = { findings: [], orientation: undefined };
  if (b.length < 20) return { ok: false, reason: 'malformed' };
  const riffEnd = 8 + rd32le(b, 4);
  if (riffEnd < 12 || riffEnd > b.length) return { ok: false, reason: 'malformed' };
  const kept: Uint8Array[] = [];
  let pos = 12;
  let vp8x: { width: number; height: number } | undefined;
  let image: { width: number; height: number } | undefined;
  const pad = (n: number) => n + (n & 1);
  while (pos < riffEnd) {
    if (pos + 8 > riffEnd) return { ok: false, reason: 'malformed' };
    const tag = String.fromCharCode(rd8(b, pos), rd8(b, pos + 1), rd8(b, pos + 2), rd8(b, pos + 3));
    const len = rd32le(b, pos + 4);
    if (pos + 8 + len > riffEnd) return { ok: false, reason: 'malformed' };
    const data = slice(b, pos + 8, pos + 8 + len);
    const total = pad(len);
    const padded = pos + 8 + total <= riffEnd ? total : len;
    const header = Uint8Array.from(slice(b, pos, pos + 8));
    const emit = (payload: Uint8Array) => {
      kept.push(concat([header.subarray(0, 4), u32le(payload.length), payload, payload.length & 1 ? Uint8Array.of(0) : new Uint8Array(0)]));
    };
    if (tag === 'VP8X') {
      if (len !== 10 || vp8x || image) return { ok: false, reason: 'malformed' };
      const flags = rd8(data, 0);
      if (flags & 0x02) return { ok: false, reason: 'animated' };
      if (flags & 0x2c) addFinding(c, 'metadata_flag', 'VP8X');
      const width = 1 + rd24le(data, 4);
      const height = 1 + rd24le(data, 7);
      const d = checkDims(width, height);
      if (d !== 'ok') return { ok: false, reason: d };
      vp8x = { width, height };
      const clean = Uint8Array.from(data);
      clean[0] = flags & 0x10;
      emit(clean);
    } else if (tag === 'ANIM' || tag === 'ANMF') return { ok: false, reason: 'animated' };
    else if (tag === 'ALPH') emit(data);
    else if (tag === 'VP8 ' || tag === 'VP8L') {
      if (image) return { ok: false, reason: 'malformed' };
      const dims = tag === 'VP8 ' ? vp8Dims(data) : vp8lDims(data);
      if (!dims) return { ok: false, reason: 'malformed' };
      const d = checkDims(dims.width, dims.height);
      if (d !== 'ok') return { ok: false, reason: d };
      image = dims;
      emit(data);
    } else if (tag === 'ICCP') addFinding(c, 'icc', tag);
    else if (tag === 'EXIF') noteExif(c, tag, data);
    else if (tag === 'XMP ') {
      addFinding(c, 'xmp', tag);
      if (hasGpsText(data)) addFinding(c, 'gps', tag);
    } else {
      addFinding(c, 'unknown_segment', tag.replace(/[^\x20-\x7e]/g, '?'));
      if (hasGpsText(data)) addFinding(c, 'gps', 'unknown');
    }
    pos += 8 + padded;
  }
  if (pos !== riffEnd || !image) return { ok: false, reason: 'malformed' };
  if (vp8x && (vp8x.width !== image.width || vp8x.height !== image.height)) return { ok: false, reason: 'malformed' };
  if (riffEnd < b.length) addFinding(c, 'trailing_data', 'RIFF');
  const body = concat([Uint8Array.of(0x57, 0x45, 0x42, 0x50), ...kept]);
  const output = concat([Uint8Array.of(0x52, 0x49, 0x46, 0x46), u32le(body.length), body]);
  return { ok: true, mime: 'image/webp', width: image.width, height: image.height, ...(c.orientation === undefined ? {} : { orientation: c.orientation }), output, findings: c.findings };
}

function vp8Dims(d: Uint8Array): { width: number; height: number } | undefined {
  if (d.length < 10 || rd8(d, 3) !== 0x9d || rd8(d, 4) !== 0x01 || rd8(d, 5) !== 0x2a || (rd8(d, 0) & 1) !== 0) return undefined;
  return { width: rd16le(d, 6) & 0x3fff, height: rd16le(d, 8) & 0x3fff };
}

function vp8lDims(d: Uint8Array): { width: number; height: number } | undefined {
  if (d.length < 5 || rd8(d, 0) !== 0x2f) return undefined;
  const bits = rd32le(d, 1);
  return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
}

// ---------------------------------------------------------------- dispatch

export type Sniffed = 'jpeg' | 'png' | 'webp' | 'gif' | 'heic' | 'unknown';

export function sniff(b: Uint8Array): Sniffed {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && PNG_SIG.every((v, i) => b[i] === v)) return 'png';
  if (b.length >= 12 && startsWithAscii(b, 0, 'RIFF') && startsWithAscii(b, 8, 'WEBP')) return 'webp';
  if (startsWithAscii(b, 0, 'GIF87a') || startsWithAscii(b, 0, 'GIF89a')) return 'gif';
  if (b.length >= 12 && startsWithAscii(b, 4, 'ftyp') && ['heic', 'heix', 'mif1', 'msf1', 'hevc'].some((t) => startsWithAscii(b, 8, t))) return 'heic';
  return 'unknown';
}

/** Parses untrusted bytes; never throws and never reads outside the buffer. */
export function analyzeImage(input: unknown, maxBytes: number = MAX_INPUT_BYTES): Analysis {
  if (!(input instanceof Uint8Array) || input.length === 0) return { ok: false, reason: 'unsupported' };
  if (input.length > maxBytes) return { ok: false, reason: 'too_large' };
  try {
    switch (sniff(input)) {
      case 'jpeg': return parseJpeg(input);
      case 'png': return parsePng(input);
      case 'webp': return parseWebp(input);
      default: return { ok: false, reason: 'unsupported' };
    }
  } catch (e) {
    if (e instanceof Malformed) return { ok: false, reason: 'malformed' };
    throw e;
  }
}
