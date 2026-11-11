// Read-only inspection of an EXIF/TIFF block to name what it contains (GPS, MakerNote, thumbnail, orientation).
// The block is always dropped by the strippers; inspection only feeds findings and the orientation hint.
import { Malformed, rd16be, rd16le, rd32be, rd32le, slice } from './bytes.ts';

export interface TiffInfo {
  readonly gps: boolean;
  readonly makernote: boolean;
  readonly thumbnail: boolean;
  readonly orientation?: number;
}

const MAX_ENTRIES = 1024;
const MAX_IFDS = 8;

export function inspectTiff(t: Uint8Array): TiffInfo {
  let gps = false;
  let makernote = false;
  let thumbnail = false;
  let orientation: number | undefined;
  try {
    const little = t[0] === 0x49 && t[1] === 0x49;
    const big = t[0] === 0x4d && t[1] === 0x4d;
    if (!little && !big) return { gps, makernote, thumbnail };
    const r16 = (i: number) => (little ? rd16le(t, i) : rd16be(t, i));
    const r32 = (i: number) => (little ? rd32le(t, i) : rd32be(t, i));
    if (r16(2) !== 42) return { gps, makernote, thumbnail };
    const seen = new Set<number>();
    const walk = (offset: number, level: number, isExifIfd: boolean): void => {
      if (seen.size >= MAX_IFDS || seen.has(offset) || offset < 8 || offset >= t.length) return;
      seen.add(offset);
      const count = Math.min(r16(offset), MAX_ENTRIES);
      let subExif: number | undefined;
      for (let i = 0; i < count; i++) {
        const e = offset + 2 + i * 12;
        const tag = r16(e);
        if (level === 0 && !isExifIfd && tag === 0x8825) gps = true;
        else if (level === 0 && !isExifIfd && tag === 0x8769) subExif = r32(e + 8);
        else if (isExifIfd && tag === 0x927c) makernote = true;
        else if (level === 0 && !isExifIfd && tag === 0x0112 && r16(e + 2) === 3) {
          const v = r16(e + 8);
          if (v >= 1 && v <= 8) orientation = v;
        }
      }
      if (subExif !== undefined) walk(subExif, 0, true);
      if (level === 0 && !isExifIfd) {
        const next = r32(offset + 2 + count * 12);
        if (next !== 0) thumbnail = true;
      }
    };
    walk(r32(4), 0, false);
  } catch (e) {
    if (!(e instanceof Malformed)) throw e;
  }
  return { gps, makernote, thumbnail, ...(orientation === undefined ? {} : { orientation }) };
}

/** Finds the TIFF header inside an Exif payload that may carry the `Exif\0\0` prefix. */
export function tiffOf(payload: Uint8Array): Uint8Array {
  const prefixed = payload.length >= 6 && payload[0] === 0x45 && payload[1] === 0x78 && payload[2] === 0x69 && payload[3] === 0x66 && payload[4] === 0 && payload[5] === 0;
  return prefixed ? slice(payload, 6, payload.length) : payload;
}
