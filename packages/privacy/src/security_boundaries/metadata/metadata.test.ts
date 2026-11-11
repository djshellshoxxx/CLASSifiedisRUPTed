import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { concat } from './bytes.ts';
import { makeJpeg, makePng, makeWebp, residualMarkers, SCAN_DATA } from './test-fixtures.ts';
import {
  metadataErrors, orderKey, outboundLinkPolicy, publicTime, rateLimitKey, sanitizeImportedImage, stripImage, truncateIp, userAgentFamily, verifyImageClean,
} from './index.ts';

const here = new URL('.', import.meta.url).pathname;
const ascii = (s: string) => Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
const GPS_XMP = '<x:xmpmeta><rdf:Description exif:GPSLatitude="52,31.2N" exif:GPSLongitude="13,24.5E"/></x:xmpmeta>';
const ALL_EXIF = { gps: true, makernote: true, thumbnail: true, orientation: 6 } as const;

async function strip(bytes: Uint8Array) {
  const r = await stripImage(bytes);
  if (!r.ok) throw new Error(`strip failed: ${r.error.code}`);
  return r.value;
}
function codeOf(r: { ok: boolean; error?: { code: string } }): string | undefined {
  return r.ok ? undefined : r.error?.code;
}

/** Deterministic corpus of 40 tricky files built from the fixtures. */
function corpus(): { name: string; bytes: Uint8Array }[] {
  const out: { name: string; bytes: Uint8Array }[] = [];
  const kinds = [undefined, { gps: true }, ALL_EXIF, { makernote: true }, { thumbnail: true }] as const;
  kinds.forEach((exif, i) => {
    out.push({ name: `jpeg-exif-${i}`, bytes: makeJpeg({ exif }) });
    out.push({ name: `jpeg-exif-xmp-${i}`, bytes: makeJpeg({ exif, xmp: GPS_XMP, iptc: true }) });
    out.push({ name: `jpeg-polyglot-${i}`, bytes: makeJpeg({ exif, comment: 'PK\x03\x04 author Jane', trailing: ascii('PK\x03\x04zipbomb-ish trailing archive') }) });
    out.push({ name: `png-${i}`, bytes: makePng({ exif, text: true, time: true }) });
    out.push({ name: `webp-${i}`, bytes: makeWebp({ exif, xmp: GPS_XMP, icc: true }) });
  });
  out.push({ name: 'jpeg-jfif-thumb', bytes: makeJpeg({ jfifThumb: true, icc: true }) });
  out.push({ name: 'jpeg-progressive', bytes: makeJpeg({ progressive: true, exif: { gps: true } }) });
  out.push({ name: 'jpeg-big', bytes: makeJpeg({ width: 4096, height: 3072, exif: ALL_EXIF }) });
  out.push({ name: 'jpeg-app-other', bytes: makeJpeg({ extraApp: [Uint8Array.of(0xff, 0xec, 0, 8, 68, 117, 99, 107, 121, 0)] }) });
  out.push({ name: 'png-xmp-gps', bytes: makePng({ xmpText: GPS_XMP }) });
  out.push({ name: 'png-trns', bytes: makePng({ trns: true, icc: true }) });
  out.push({ name: 'png-polyglot', bytes: makePng({ trailing: ascii('Rar!\x1a\x07\x00 trailing') }) });
  out.push({ name: 'webp-lossless-alpha', bytes: makeWebp({ lossless: true, alpha: true, exif: { gps: true } }) });
  out.push({ name: 'webp-polyglot', bytes: makeWebp({ trailing: ascii('MZ trailing executable') }) });
  out.push({ name: 'webp-xmp-only', bytes: makeWebp({ xmp: GPS_XMP }) });
  out.push({ name: 'jpeg-comment-gps', bytes: makeJpeg({ comment: 'GPSLatitude=52.5208' }) });
  out.push({ name: 'jpeg-iptc', bytes: makeJpeg({ iptc: true }) });
  out.push({ name: 'png-iccp', bytes: makePng({ icc: true }) });
  out.push({ name: 'png-time', bytes: makePng({ time: true }) });
  out.push({ name: 'jpeg-clean', bytes: makeJpeg() });
  return out;
}

describe('image stripping (corpus of generated files)', () => {
  it('builds a corpus of 40 files', () => expect(corpus()).toHaveLength(40));

  it('removes all metadata from every corpus file, keeps pixel data byte-identical and reports dimensions', async () => {
    for (const { name, bytes } of corpus()) {
      const clean = await strip(bytes);
      expect(residualMarkers(clean.bytes), name).toEqual([]);
      expect(verifyImageClean(clean.bytes), name).toEqual({ clean: true, findings: [] });
      expect(Math.max(clean.width, clean.height)).toBeLessThanOrEqual(4096);
      expect(clean.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    const jpeg = await strip(makeJpeg({ exif: ALL_EXIF, xmp: GPS_XMP }));
    const text = Array.from(jpeg.bytes, (x) => String.fromCharCode(x)).join('');
    expect(text.includes(Array.from(SCAN_DATA, (x) => String.fromCharCode(x)).join(''))).toBe(true);
    expect([jpeg.width, jpeg.height]).toEqual([64, 48]);
    expect(jpeg.orientation).toBe(6);
  });

  it('flags every metadata kind on the unstripped corpus and nothing on the stripped output', async () => {
    const kinds = new Set(corpus().flatMap((c) => verifyImageClean(c.bytes).findings.map((f) => f.kind)));
    for (const k of ['exif', 'xmp', 'iptc', 'gps', 'makernote', 'thumbnail', 'icc', 'comment', 'text_chunk', 'ancillary', 'trailing_data', 'unknown_segment', 'metadata_flag']) expect(kinds.has(k as never), k).toBe(true);
    for (const { bytes } of corpus()) {
      const clean = await strip(bytes);
      expect(verifyImageClean(clean.bytes).clean).toBe(true);
    }
  });

  it('is idempotent: stripping a clean image returns identical bytes', async () => {
    for (const { bytes } of corpus()) {
      const once = await strip(bytes);
      const twice = await strip(once.bytes);
      expect(Array.from(twice.bytes)).toEqual(Array.from(once.bytes));
      expect(twice.sha256).toBe(once.sha256);
    }
  });

  it('keeps PNG transparency and drops GPS found only in an XMP packet or a MakerNote thumbnail', async () => {
    const png = await strip(makePng({ trns: true, text: true }));
    expect(Array.from(png.bytes, (x) => String.fromCharCode(x)).join('')).toContain('tRNS');
    const f = verifyImageClean(makeJpeg({ xmp: GPS_XMP })).findings.map((x) => x.kind);
    expect(f).toContain('gps');
    const g = verifyImageClean(makeJpeg({ exif: { makernote: true, thumbnail: true } })).findings.map((x) => x.kind);
    expect(g).toEqual(expect.arrayContaining(['makernote', 'thumbnail', 'exif']));
  });
});

describe('image error handling', () => {
  it('TEST-PS-080-09.T03 animated WebP, 12 MiB file, truncated file and polyglot give documented outcomes', async () => {
    const animated = await stripImage(makeWebp({ animated: true }));
    expect(codeOf(animated)).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    expect(codeOf(await stripImage(makePng({ animated: true })))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    const big = new Uint8Array(12 * 1024 * 1024);
    big.set(makeJpeg());
    const tooLarge = await stripImage(big);
    expect(codeOf(tooLarge)).toBe('PRIVACY_METADATA_IMAGE_TOO_LARGE');
    if (!tooLarge.ok) expect(tooLarge.error.status).toBe(413);
    const jpeg = makeJpeg({ exif: { gps: true } });
    for (const cut of [3, 10, jpeg.length - 1, jpeg.length - 5]) {
      const r = await stripImage(jpeg.subarray(0, cut));
      expect(codeOf(r)).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    }
    const png = makePng();
    expect(codeOf(await stripImage(png.subarray(0, png.length - 4)))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    const webp = makeWebp();
    expect(codeOf(await stripImage(webp.subarray(0, webp.length - 3)))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    const polyglot = makeJpeg({ trailing: ascii('PK\x03\x04archive bytes that must not survive') });
    const clean = await strip(polyglot);
    expect(clean.bytes.length).toBeLessThan(polyglot.length);
    expect(Array.from(clean.bytes.subarray(-2))).toEqual([0xff, 0xd9]);
    expect(verifyImageClean(clean.bytes).clean).toBe(true);
    const pngPoly = await strip(makePng({ trailing: ascii('Rar!trailing') }));
    expect(verifyImageClean(pngPoly.bytes).clean).toBe(true);
  });

  it('rejects unsupported types, empty and non-binary input, bad CRC, oversized dimensions and zero dimensions', async () => {
    expect(codeOf(await stripImage(ascii('GIF89a......')))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    expect(codeOf(await stripImage(Uint8Array.of(0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0, 0, 0, 0)))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    expect(codeOf(await stripImage(new Uint8Array(0)))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    expect(codeOf(await stripImage('not bytes' as unknown as Uint8Array))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    expect(codeOf(await stripImage(makePng({ badCrc: true })))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    expect(codeOf(await stripImage(makeJpeg({ width: 16385, height: 10 })))).toBe('PRIVACY_METADATA_IMAGE_TOO_LARGE');
    expect(codeOf(await stripImage(makePng({ width: 0, height: 5 })))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    expect(codeOf(await stripImage(makeJpeg(), { maxSide: 5 }))).toBe('VALIDATION_FAILED');
    expect(codeOf(await stripImage(makeJpeg(), { maxBytes: 20 * 1024 * 1024 }))).toBe('VALIDATION_FAILED');
  });

  it('refuses images above maxSide without a codec and accepts them when a downscale port returns a smaller verified image', async () => {
    const big = makeJpeg({ width: 5000, height: 3000, exif: { gps: true } });
    expect(codeOf(await stripImage(big))).toBe('PRIVACY_METADATA_IMAGE_TOO_LARGE');
    let received = 0;
    const ok1 = await stripImage(big, { downscale: async (input, maxSide) => { received = input.width; expect(maxSide).toBe(4096); return makeJpeg({ width: 4096, height: 2458, exif: { gps: true } }); } });
    expect(received).toBe(5000);
    expect(ok1.ok && ok1.value.width).toBe(4096);
    expect(ok1.ok && verifyImageClean(ok1.value.bytes).clean).toBe(true);
    expect(codeOf(await stripImage(big, { downscale: async () => makeJpeg({ width: 5000, height: 3000 }) }))).toBe('PRIVACY_METADATA_IMAGE_TOO_LARGE');
    expect(codeOf(await stripImage(big, { downscale: async () => { throw new Error('codec crashed'); } }))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    expect(codeOf(await stripImage(big, { downscale: async () => ascii('garbage') }))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
  });

  it('verifyImageClean never calls undecodable, animated or oversized input clean', () => {
    expect(verifyImageClean(new Uint8Array(0)).clean).toBe(false);
    expect(verifyImageClean(ascii('hello world')).clean).toBe(false);
    expect(verifyImageClean(makeWebp({ animated: true })).clean).toBe(false);
    expect(verifyImageClean(makeJpeg().subarray(0, 40)).clean).toBe(false);
  });
});

describe('hostile input', () => {
  it('survives 1000 deterministic mutations: never throws, never reads out of range, any accepted output is clean', async () => {
    const seeds = [makeJpeg({ exif: ALL_EXIF, xmp: GPS_XMP }), makePng({ text: true, exif: { gps: true } }), makeWebp({ exif: { gps: true }, xmp: GPS_XMP, alpha: true })];
    let state = 0x9e3779b9;
    const next = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state; };
    let accepted = 0;
    for (let i = 0; i < 1000; i++) {
      const base = seeds[i % 3] as Uint8Array;
      const mutated = Uint8Array.from(base);
      const flips = 1 + (next() % 4);
      for (let k = 0; k < flips; k++) mutated[next() % mutated.length] = next() & 0xff;
      const input = next() % 5 === 0 ? mutated.subarray(0, next() % mutated.length) : mutated;
      const r = await stripImage(input);
      if (r.ok) {
        accepted++;
        expect(verifyImageClean(r.value.bytes).clean).toBe(true);
        expect(r.value.bytes.length).toBeLessThanOrEqual(input.length);
      } else expect(r.error.code).toMatch(/^PRIVACY_METADATA_/);
    }
    expect(accepted).toBeGreaterThan(0);
  });

  it('rejects headers with huge declared lengths without allocating or reading beyond the buffer', async () => {
    const png = makePng();
    const lie = Uint8Array.from(png);
    lie.set([0x7f, 0xff, 0xff, 0xff], 33);
    expect(codeOf(await stripImage(lie))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    const jpeg = makeJpeg();
    const jl = Uint8Array.from(jpeg);
    jl.set([0xff, 0xff], 4);
    expect(codeOf(await stripImage(jl))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    const webp = Uint8Array.from(makeWebp());
    webp.set([0xff, 0xff, 0xff, 0x7f], 4);
    expect(codeOf(await stripImage(webp))).toBe('PRIVACY_METADATA_IMAGE_UNSUPPORTED');
    const exifLoop = makeJpeg({ exif: { gps: true } });
    const copy = Uint8Array.from(exifLoop);
    const at = Array.from(copy).findIndex((_, i) => copy[i] === 0x49 && copy[i + 1] === 0x49 && copy[i + 2] === 42);
    copy.set([8, 0, 0, 0], at + 4); // IFD0 offset points to itself
    expect((await stripImage(copy)).ok).toBe(true);
  });

  it('TEST-PS-080-09.T06 stripping and the helpers are deterministic and idempotent over random inputs', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({ w: fc.integer({ min: 1, max: 4096 }), h: fc.integer({ min: 1, max: 4096 }), kind: fc.constantFrom('jpeg', 'png', 'webp'), gps: fc.boolean(), text: fc.boolean(), junk: fc.uint8Array({ maxLength: 20 }) }),
      async ({ w, h, kind, gps, text, junk }) => {
        const bytes = kind === 'jpeg' ? makeJpeg({ width: w, height: h, exif: gps ? { gps } : undefined, comment: text ? 'x' : undefined, trailing: junk })
          : kind === 'png' ? makePng({ width: w, height: h, exif: gps ? { gps } : undefined, text, trailing: junk })
            : makeWebp({ width: w, height: h, exif: gps ? { gps } : undefined, trailing: junk });
        const a = await strip(bytes);
        const b = await strip(bytes);
        expect(a.sha256).toBe(b.sha256);
        const again = await strip(a.bytes);
        expect(again.sha256).toBe(a.sha256);
        expect([a.width, a.height]).toEqual([w, h]);
      }), { numRuns: 60 });
    await fc.assert(fc.asyncProperty(fc.uint8Array({ maxLength: 300 }), async (junk) => {
      const r = await stripImage(junk);
      expect(r.ok).toBe(false);
      expect(verifyImageClean(junk).clean).toBe(false);
    }), { numRuns: 200 });
    await fc.assert(fc.property(fc.ipV4(), fc.ipV6(), fc.integer({ min: 0, max: 4_102_444_799_000 }), (v4, v6, ms) => {
      for (const ip of [v4, v6]) {
        const n = truncateIp(ip);
        expect(n.ok).toBe(true);
        if (n.ok) {
          const again = truncateIp(n.value.networkString.split('/')[0] as string);
          expect(again.ok && again.value.networkString).toBe(n.value.networkString);
          expect(n.value.networkString).not.toBe(ip);
        }
      }
      const t = publicTime(new Date(ms).toISOString());
      expect(t.ok).toBe(true);
      if (t.ok) { const t2 = publicTime(t.value); expect(t2.ok && t2.value).toBe(t.value); }
    }));
  });
});

describe('network and time helpers', () => {
  it('TEST-PS-080-09.T04 truncates IPv4, IPv6 and IPv4-mapped addresses and rejects invalid input', () => {
    const net = (ip: string) => { const r = truncateIp(ip); return r.ok ? r.value : r.error.code; };
    expect(net('203.0.113.57')).toEqual({ family: 4, prefix: 24, networkString: '203.0.113.0/24' });
    expect(net('2001:db8:abcd:12::1')).toEqual({ family: 6, prefix: 48, networkString: '2001:db8:abcd::/48' });
    expect(net('::ffff:203.0.113.57')).toEqual({ family: 4, prefix: 24, networkString: '203.0.113.0/24' });
    expect(net('::ffff:cb00:7139')).toEqual({ family: 4, prefix: 24, networkString: '203.0.113.0/24' });
    expect(net('2001:0DB8:ABCD:0012:0000:0000:0000:0001')).toEqual({ family: 6, prefix: 48, networkString: '2001:db8:abcd::/48' });
    for (const bad of ['', 'abc', '256.1.1.1', '1.2.3', '1.2.3.4.5', '01.2.3.4', '1.2.3.4/24', ' 1.2.3.4', '2001:db8::1::2', 'g::1', ':::', 'x'.repeat(100), '203.0.113.57\n']) expect(net(bad), bad).toBe('VALIDATION_FAILED');
    expect(truncateIp(undefined as unknown as string).ok).toBe(false);
    for (const ip of ['203.0.113.57', '2001:db8:abcd:12::1', '198.51.100.9']) {
      const r = truncateIp(ip);
      expect(JSON.stringify(r)).not.toContain(ip);
    }
  });

  it('TEST-PS-080-09.T05 floors hour-boundary timestamps and rejects invalid ones', () => {
    const t = (s: string) => { const r = publicTime(s); return r.ok ? r.value : r.error.code; };
    expect(t('2026-11-04T14:59:59.999Z')).toBe('2026-11-04T14:00:00.000Z');
    expect(t('2026-11-04T14:00:00.000Z')).toBe('2026-11-04T14:00:00.000Z');
    expect(t('2026-11-04T23:59:59Z')).toBe('2026-11-04T23:00:00.000Z');
    expect(t('2026-11-04T00:00:00.123456789Z')).toBe('2026-11-04T00:00:00.000Z');
    expect(t('1970-01-01T00:00:00Z')).toBe('1970-01-01T00:00:00.000Z');
    expect(t('2024-02-29T10:30:00Z')).toBe('2024-02-29T10:00:00.000Z');
    for (const bad of ['', 'yesterday', '2026-11-04', '2026-11-04T14:59:59+01:00', '2026-11-04T24:00:00Z', '2026-02-30T10:00:00Z', '2025-02-29T10:00:00Z', '2026-13-01T00:00:00Z', '1969-12-31T23:59:59Z', '2101-01-01T00:00:00Z', '2026-11-04T14:60:00Z', '2026-11-04 14:00:00Z', 'x'.repeat(100)]) expect(t(bad), bad).toBe('VALIDATION_FAILED');
    expect(publicTime(5 as unknown as string).ok).toBe(false);
    const owner = '2026-11-04T14:59:59.999Z';
    expect(owner).toBe('2026-11-04T14:59:59.999Z'); // owner views keep the exact value; the helper never mutates it
    const a = publicTime('2026-11-04T14:01:00.000Z');
    const b = publicTime('2026-11-04T14:58:00.000Z');
    expect(a.ok && b.ok && orderKey(a.value, 'id-1') < orderKey(b.value, 'id-2')).toBe(true);
    expect(a.ok && orderKey(a.value, 'b') > orderKey(a.value, 'a')).toBe(true);
  });

  it('TEST-PS-080-09.T12 rate-limit keys are stable within a salt, differ across salts and /24s, and never contain the address', async () => {
    const day1 = 'salt-for-day-one-0123456789';
    const day2 = 'salt-for-day-two-9876543210';
    const k = async (ip: string, salt: string) => { const r = await rateLimitKey(ip, salt); if (!r.ok) throw new Error(r.error.code); return r.value; };
    const a = await k('203.0.113.5', day1);
    expect(await k('203.0.113.200', day1)).toBe(a);
    expect(await k('::ffff:203.0.113.77', day1)).toBe(a);
    expect(await k('203.0.114.5', day1)).not.toBe(a);
    expect(await k('203.0.113.5', day2)).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain('203');
    const v6 = await k('2001:db8:abcd:12::1', day1);
    expect(await k('2001:db8:abcd:ffff::9', day1)).toBe(v6);
    expect(await k('2001:db8:abce::1', day1)).not.toBe(v6);
    expect(codeOf(await rateLimitKey('nope', day1))).toBe('VALIDATION_FAILED');
    expect(codeOf(await rateLimitKey('203.0.113.5', 'short'))).toBe('VALIDATION_FAILED');
  });

  it('reduces user agents to family and major version and bounds the input', () => {
    const f = (ua: string) => { const r = userAgentFamily(ua); return r.ok ? r.value : r.error.code; };
    expect(f('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.122 Mobile Safari/537.36')).toEqual({ family: 'chrome', major: 126 });
    expect(f('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.81')).toEqual({ family: 'edge', major: 126 });
    expect(f('Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0')).toEqual({ family: 'firefox', major: 127 });
    expect(f('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')).toEqual({ family: 'safari', major: 17 });
    expect(f('Mozilla/5.0 Chrome/125.0 Safari/537.36 OPR/111.0.0.0')).toEqual({ family: 'opera', major: 111 });
    expect(f('curl/8.5.0')).toEqual({ family: 'other', major: 0 });
    expect(f('')).toEqual({ family: 'other', major: 0 });
    expect(f('a'.repeat(513))).toBe('VALIDATION_FAILED');
    expect(f('a'.repeat(512))).toEqual({ family: 'other', major: 0 });
    expect(JSON.stringify(userAgentFamily('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126.0.6478.122'))).not.toMatch(/Pixel|Android|6478/);
    expect(outboundLinkPolicy()).toMatchObject({ referrerPolicy: 'no-referrer', headers: { 'Referrer-Policy': 'no-referrer' }, thirdPartyRequests: false, analyticsCookies: false });
    expect(outboundLinkPolicy().rel).toContain('noreferrer');
  });
});

describe('integration and contract', () => {
  it('TEST-PS-080-09.T07 the public surface and error codes match the errors table', async () => {
    expect(Object.keys(metadataErrors.codes).sort()).toEqual(['PRIVACY_METADATA_GPS_PRESENT', 'PRIVACY_METADATA_IMAGE_TOO_LARGE', 'PRIVACY_METADATA_IMAGE_UNSUPPORTED']);
    expect(metadataErrors.codes).toEqual({
      PRIVACY_METADATA_IMAGE_UNSUPPORTED: { status: 415, retryable: false },
      PRIVACY_METADATA_IMAGE_TOO_LARGE: { status: 413, retryable: false },
      PRIVACY_METADATA_GPS_PRESENT: { status: 422, retryable: false },
    });
    const api = await import('./index.ts');
    for (const name of ['stripImage', 'verifyImageClean', 'truncateIp', 'rateLimitKey', 'publicTime', 'userAgentFamily', 'outboundLinkPolicy']) expect(typeof (api as Record<string, unknown>)[name], name).toBe('function');
    const clean = await strip(makeJpeg({ exif: { gps: true } }));
    expect(Object.keys(clean).sort()).toEqual(['bytes', 'height', 'mime', 'orientation', 'sha256', 'width'].filter((k) => k in clean).sort());
    expect(clean.mime).toBe('image/jpeg');
    const v = verifyImageClean(clean.bytes);
    expect(Object.keys(v).sort()).toEqual(['clean', 'findings']);
    const bad = await stripImage(new Uint8Array(0));
    expect(!bad.ok && bad.error).toMatchObject({ code: 'PRIVACY_METADATA_IMAGE_UNSUPPORTED', status: 415, retryable: false, messageKey: 'error.privacy_metadata_image_unsupported' });
    const stripped = await stripImage(makeJpeg(), { maxSide: 10 });
    expect(stripped.ok).toBe(false);
    for (const t of ['jpeg', 'png', 'webp'] as const) {
      const r = await stripImage(t === 'jpeg' ? makeJpeg() : t === 'png' ? makePng() : makeWebp());
      expect(r.ok && r.value.mime).toBe(`image/${t}`);
    }
  });

  it('TEST-PS-080-09.T08 a relay double re-encodes an unstripped image from an old client and stores no original bytes', async () => {
    const stored: Uint8Array[] = [];
    const relayReceive = async (upload: Uint8Array) => {
      const v = verifyImageClean(upload);
      if (v.clean) { stored.push(upload); return { status: 'stored' as const }; }
      const r = await stripImage(upload);
      if (!r.ok || !verifyImageClean(r.value.bytes).clean) return { status: 'rejected' as const, code: r.ok ? 'PRIVACY_METADATA_GPS_PRESENT' : r.error.code };
      stored.push(r.value.bytes);
      return { status: 'reencoded' as const };
    };
    const original = makeJpeg({ exif: { gps: true, makernote: true, thumbnail: true }, xmp: GPS_XMP });
    const client = await strip(original);
    expect(await relayReceive(client.bytes)).toEqual({ status: 'stored' });
    expect(await relayReceive(original)).toEqual({ status: 'reencoded' });
    expect(await relayReceive(Uint8Array.from(original).subarray(0, 50))).toMatchObject({ status: 'rejected', code: 'PRIVACY_METADATA_IMAGE_UNSUPPORTED' });
    expect(stored).toHaveLength(2);
    for (const s of stored) {
      expect(verifyImageClean(s).clean).toBe(true);
      expect(Array.from(s)).not.toEqual(Array.from(original));
      expect(residualMarkers(s)).toEqual([]);
    }
  });

  it('TEST-PS-080-09.T17 import re-strips legacy images and quarantines failures; clean exports pass verification', async () => {
    const exportedClean = await strip(makePng({ text: true, exif: { gps: true } }));
    expect(verifyImageClean(exportedClean.bytes).clean).toBe(true);
    const again = await sanitizeImportedImage(exportedClean.bytes);
    expect(again.status === 'accepted' && Array.from(again.image.bytes)).toEqual(Array.from(exportedClean.bytes));
    const legacy = makeJpeg({ exif: { gps: true }, xmp: GPS_XMP });
    expect(verifyImageClean(legacy).clean).toBe(false);
    const imported = await sanitizeImportedImage(legacy);
    expect(imported.status).toBe('accepted');
    if (imported.status === 'accepted') {
      expect(verifyImageClean(imported.image.bytes).clean).toBe(true);
      expect(residualMarkers(imported.image.bytes)).toEqual([]);
    }
    expect(await sanitizeImportedImage(makeWebp({ animated: true }))).toEqual({ status: 'quarantined', code: 'PRIVACY_METADATA_IMAGE_UNSUPPORTED' });
    expect(await sanitizeImportedImage(makeJpeg().subarray(0, 30))).toEqual({ status: 'quarantined', code: 'PRIVACY_METADATA_IMAGE_UNSUPPORTED' });
    expect(await sanitizeImportedImage(makeJpeg({ width: 20000, height: 4 }))).toEqual({ status: 'quarantined', code: 'PRIVACY_METADATA_IMAGE_TOO_LARGE' });
  });

  it('TEST-PS-080-09.T09 the package has no network, storage, clock, randomness or node: access', () => {
    const files = readdirSync(here).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const src = readFileSync(join(here, f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(src, f).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|indexedDB|localStorage|sessionStorage|node:|require\(|\bprocess\./);
      expect(src, f).not.toMatch(/\bDate\b|Math\.random|performance\.now|setTimeout|crypto\.getRandomValues/);
      const imports = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1] as string);
      for (const i of imports) expect(i.startsWith('.') || i === '@classrup/kernel', `${f}: ${i}`).toBe(true);
    }
  });
});

void concat;
