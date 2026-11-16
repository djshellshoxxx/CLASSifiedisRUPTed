// Synthetic image builders for tests: structurally valid containers with chosen metadata, no pixel codec involved.
import { concat, crc32, u16be, u32le } from './bytes.ts';

const ascii = (s: string): Uint8Array => Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
const be32 = (n: number): Uint8Array => Uint8Array.of((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);

/** Entropy-coded bytes used as the "pixel content"; contains byte stuffing and a restart marker. */
export const SCAN_DATA = Uint8Array.of(0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56, 0x78, 0xff, 0x00, 0x9a);

function le16(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff];
}
function le32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

export interface ExifOptions {
  readonly gps?: boolean;
  readonly makernote?: boolean;
  readonly thumbnail?: boolean;
  readonly orientation?: number;
}

/** Little-endian TIFF block with Make, optional Orientation, GPS IFD pointer, Exif IFD with MakerNote and an IFD1 thumbnail. */
export function exifTiff(o: ExifOptions = {}): Uint8Array {
  type Entry = { tag: number; type: number; count: number; value: number };
  const ifd0: Entry[] = [{ tag: 0x010f, type: 2, count: 4, value: 0x41424300 }];
  if (o.orientation !== undefined) ifd0.push({ tag: 0x0112, type: 3, count: 1, value: o.orientation });
  const base = 8;
  const ifd0Size = 2 + 12 * (ifd0.length + (o.gps ? 1 : 0) + (o.makernote ? 1 : 0)) + 4;
  const gpsOff = base + ifd0Size;
  const gpsSize = 2 + 12 + 4;
  const exifOff = gpsOff + gpsSize;
  const exifSize = 2 + 12 + 4;
  const ifd1Off = exifOff + exifSize;
  if (o.gps) ifd0.push({ tag: 0x8825, type: 4, count: 1, value: gpsOff });
  if (o.makernote) ifd0.push({ tag: 0x8769, type: 4, count: 1, value: exifOff });
  const entry = (e: Entry) => [...le16(e.tag), ...le16(e.type), ...le32(e.count), ...le32(e.value)];
  const bytes: number[] = [0x49, 0x49, 42, 0, ...le32(base), ...le16(ifd0.length), ...ifd0.flatMap(entry), ...le32(o.thumbnail ? ifd1Off : 0)];
  bytes.push(...le16(1), ...entry({ tag: 0x0001, type: 2, count: 2, value: 0x4e00 }), ...le32(0)); // GPS IFD (latitude ref)
  bytes.push(...le16(1), ...entry({ tag: 0x927c, type: 7, count: 4, value: 0x01020304 }), ...le32(0)); // Exif IFD with MakerNote
  if (o.thumbnail) bytes.push(...le16(0), ...le32(0));
  return Uint8Array.from(bytes);
}

export function app(marker: number, payload: Uint8Array): Uint8Array {
  return concat([Uint8Array.of(0xff, marker), u16be(payload.length + 2), payload]);
}

export interface JpegOptions {
  readonly width?: number;
  readonly height?: number;
  readonly exif?: ExifOptions;
  readonly xmp?: string;
  readonly iptc?: boolean;
  readonly icc?: boolean;
  readonly comment?: string;
  readonly jfifThumb?: boolean;
  readonly extraApp?: readonly Uint8Array[];
  readonly trailing?: Uint8Array;
  readonly progressive?: boolean;
  readonly scan?: Uint8Array;
}

export function makeJpeg(o: JpegOptions = {}): Uint8Array {
  const w = o.width ?? 64;
  const h = o.height ?? 48;
  const parts: Uint8Array[] = [Uint8Array.of(0xff, 0xd8)];
  const jfif = [...ascii('JFIF\0'), 1, 1, 1, 0, 72, 0, 72, o.jfifThumb ? 2 : 0, o.jfifThumb ? 2 : 0, ...(o.jfifThumb ? new Array<number>(12).fill(7) : [])];
  parts.push(app(0xe0, Uint8Array.from(jfif)));
  if (o.exif) parts.push(app(0xe1, concat([ascii('Exif\0\0'), exifTiff(o.exif)])));
  if (o.xmp !== undefined) parts.push(app(0xe1, concat([ascii('http://ns.adobe.com/xap/1.0/\0'), ascii(o.xmp)])));
  if (o.iptc) parts.push(app(0xed, concat([ascii('Photoshop 3.0\0'), ascii('8BIM'), Uint8Array.of(4, 4, 0, 0)])));
  if (o.icc) parts.push(app(0xe2, concat([ascii('ICC_PROFILE\0'), Uint8Array.of(1, 1), new Uint8Array(32)])));
  if (o.comment !== undefined) parts.push(app(0xfe, ascii(o.comment)));
  for (const a of o.extraApp ?? []) parts.push(a);
  parts.push(app(0xdb, Uint8Array.of(0, ...new Array<number>(64).fill(8))));
  parts.push(app(o.progressive ? 0xc2 : 0xc0, Uint8Array.of(8, h >> 8, h & 0xff, w >> 8, w & 0xff, 1, 1, 0x11, 0)));
  parts.push(app(0xc4, Uint8Array.of(0x00, ...new Array<number>(16).fill(0), 0)));
  parts.push(app(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0)), o.scan ?? SCAN_DATA, Uint8Array.of(0xff, 0xd9));
  if (o.trailing) parts.push(o.trailing);
  return concat(parts);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const t = ascii(type);
  return concat([be32(data.length), t, data, be32(crc32([t, data]))]);
}

export interface PngOptions {
  readonly width?: number;
  readonly height?: number;
  readonly text?: boolean;
  readonly exif?: ExifOptions;
  readonly xmpText?: string;
  readonly icc?: boolean;
  readonly time?: boolean;
  readonly trns?: boolean;
  readonly animated?: boolean;
  readonly trailing?: Uint8Array;
  readonly badCrc?: boolean;
  readonly idat?: Uint8Array;
}

export function makePng(o: PngOptions = {}): Uint8Array {
  const w = o.width ?? 32;
  const h = o.height ?? 16;
  const ihdr = concat([be32(w), be32(h), Uint8Array.of(8, 6, 0, 0, 0)]);
  const parts: Uint8Array[] = [Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), pngChunk('IHDR', ihdr)];
  if (o.icc) parts.push(pngChunk('iCCP', concat([ascii('icc\0\0'), new Uint8Array(8)])));
  if (o.text) parts.push(pngChunk('tEXt', ascii('Author\0Jane Example, 12 Main Street')));
  if (o.xmpText !== undefined) parts.push(pngChunk('iTXt', concat([ascii('XML:com.adobe.xmp\0\0\0\0\0'), ascii(o.xmpText)])));
  if (o.exif) parts.push(pngChunk('eXIf', exifTiff(o.exif)));
  if (o.time) parts.push(pngChunk('tIME', Uint8Array.of(7, 234, 11, 4, 10, 0, 0)));
  if (o.animated) parts.push(pngChunk('acTL', Uint8Array.of(0, 0, 0, 2, 0, 0, 0, 0)));
  if (o.trns) parts.push(pngChunk('tRNS', Uint8Array.of(1, 2, 3)));
  const idat = pngChunk('IDAT', o.idat ?? Uint8Array.of(0x78, 0x9c, 1, 2, 3, 4));
  if (o.badCrc) idat[idat.length - 1] = (idat[idat.length - 1] as number) ^ 0xff;
  parts.push(idat, pngChunk('IEND', new Uint8Array(0)));
  if (o.trailing) parts.push(o.trailing);
  return concat(parts);
}

function riffChunk(tag: string, data: Uint8Array): Uint8Array {
  return concat([ascii(tag), u32le(data.length), data, data.length & 1 ? Uint8Array.of(0) : new Uint8Array(0)]);
}

export interface WebpOptions {
  readonly width?: number;
  readonly height?: number;
  readonly lossless?: boolean;
  readonly exif?: ExifOptions;
  readonly xmp?: string;
  readonly icc?: boolean;
  readonly alpha?: boolean;
  readonly animated?: boolean;
  readonly trailing?: Uint8Array;
}

export function makeWebp(o: WebpOptions = {}): Uint8Array {
  const w = o.width ?? 40;
  const h = o.height ?? 30;
  const extended = Boolean(o.exif || o.xmp !== undefined || o.icc || o.alpha || o.animated);
  const chunks: Uint8Array[] = [];
  if (extended) {
    const flags = (o.icc ? 0x20 : 0) | (o.exif ? 0x08 : 0) | (o.xmp !== undefined ? 0x04 : 0) | (o.alpha ? 0x10 : 0) | (o.animated ? 0x02 : 0);
    const dims = [(w - 1) & 0xff, ((w - 1) >> 8) & 0xff, ((w - 1) >> 16) & 0xff, (h - 1) & 0xff, ((h - 1) >> 8) & 0xff, ((h - 1) >> 16) & 0xff];
    chunks.push(riffChunk('VP8X', Uint8Array.of(flags, 0, 0, 0, ...dims)));
  }
  if (o.icc) chunks.push(riffChunk('ICCP', new Uint8Array(10)));
  if (o.animated) chunks.push(riffChunk('ANIM', new Uint8Array(6)));
  if (o.alpha) chunks.push(riffChunk('ALPH', Uint8Array.of(0, 1, 2, 3, 4)));
  if (o.lossless) {
    const bits = ((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14);
    chunks.push(riffChunk('VP8L', Uint8Array.of(0x2f, ...le32(bits), 9, 9, 9)));
  } else {
    chunks.push(riffChunk('VP8 ', Uint8Array.of(0x10, 0, 0, 0x9d, 0x01, 0x2a, ...le16(w), ...le16(h), 1, 2, 3)));
  }
  if (o.exif) chunks.push(riffChunk('EXIF', concat([ascii('Exif\0\0'), exifTiff(o.exif)])));
  if (o.xmp !== undefined) chunks.push(riffChunk('XMP ', ascii(o.xmp)));
  const body = concat([ascii('WEBP'), ...chunks]);
  return concat([ascii('RIFF'), u32le(body.length), body, o.trailing ?? new Uint8Array(0)]);
}

/** Independent byte scan for metadata markers, deliberately not sharing code with the parsers. */
export function residualMarkers(b: Uint8Array): string[] {
  const text = Array.from(b, (x) => String.fromCharCode(x)).join('');
  const hits: string[] = [];
  for (const needle of ['Exif', 'http://ns.adobe.com', 'GPS', '8BIM', 'Photoshop', 'ICC_PROFILE', 'tEXt', 'iTXt', 'zTXt', 'eXIf', 'iCCP', 'tIME', 'EXIF', 'XMP ', 'ICCP', 'MakerNote', 'JFXX']) {
    if (text.includes(needle)) hits.push(needle);
  }
  if (text.startsWith('\xff\xd8')) {
    // JPEG: any APPn other than a thumbnail-less JFIF or Adobe, or a COM segment
    let i = 2;
    while (i + 4 <= b.length && b[i] === 0xff) {
      const m = b[i + 1] as number;
      if (m === 0xda || m === 0xd9) break;
      const len = ((b[i + 2] as number) << 8) | (b[i + 3] as number);
      if (m === 0xfe || (m >= 0xe1 && m <= 0xef && m !== 0xee)) hits.push(`marker 0x${m.toString(16)}`);
      i += 2 + len;
    }
  }
  return hits;
}
