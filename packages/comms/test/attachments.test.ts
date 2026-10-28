import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DomainError, HOUR } from '@classrup/kernel';
import { sha256B64 } from '@classrup/security';
import { encryptMessage, stripJpegMetadata, stripMetadata, stripPngMetadata, MAX_ATTACHMENT_BYTES } from '../src/index';
import type { AttachmentDto, MessageDto } from '../src/index';
import { fixture, openThread } from './helpers';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : String(e);
  }
  return undefined;
};

const hashOf = (s: string): string => `sha256:${sha256B64(s)}`;

describe('attachment metadata (F08.S01.M03)', () => {
  it('registers metadata, attaches it to exactly one message and exposes it to participants only', () => {
    const f = fixture(['alice', 'bob', 'eve']);
    const id = openThread(f, 'alice', ['bob']);
    const att = f.call<AttachmentDto>('comms.attachment.register', f.people.alice!, { threadId: id, contentHash: hashOf('blob'), sizeBytes: 2048, mime: 'image/jpeg' });
    expect(att.status).toBe('pending');
    const keys = f.call<{ recipients: { boxKeyIds: string[] }[] }>('comms.thread.keys', f.people.alice!, { threadId: id }).recipients.flatMap((r) => r.boxKeyIds);
    const ciphertext = encryptMessage({ type: 'attachment', attachmentId: att.id, key: 'secret-content-key' }, keys, id);
    const msg = f.call<MessageDto>('comms.message.send', f.people.alice!, { threadId: id, ciphertext, attachmentIds: [att.id] });
    expect(msg.attachmentIds).toEqual([att.id]);
    expect(f.call<AttachmentDto>('comms.attachment.get', f.people.bob!, { attachmentId: att.id })).toMatchObject({ status: 'attached', messageId: msg.id });
    expect(code(() => f.call('comms.attachment.get', f.people.eve!, { attachmentId: att.id }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('comms.message.send', f.people.alice!, { threadId: id, ciphertext, attachmentIds: [att.id] }))).toBe('COMMS.ATTACHMENT_INVALID');
    expect(JSON.stringify(f.deps.store.events.read())).not.toContain('secret-content-key');
  });

  it('enforces size, mime allowlist, hash format and ownership', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    const base = { threadId: id, contentHash: hashOf('x'), sizeBytes: 10, mime: 'image/png' };
    const alice = f.people.alice!;
    expect(code(() => f.call('comms.attachment.register', alice, { ...base, sizeBytes: MAX_ATTACHMENT_BYTES + 1 }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.attachment.register', alice, { ...base, sizeBytes: 0 }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.attachment.register', alice, { ...base, mime: 'text/html' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.attachment.register', alice, { ...base, contentHash: 'md5:abc' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(f.call<AttachmentDto>('comms.attachment.register', alice, { ...base, sizeBytes: MAX_ATTACHMENT_BYTES }).sizeBytes).toBe(MAX_ATTACHMENT_BYTES);
    const mine = f.call<AttachmentDto>('comms.attachment.register', alice, base);
    const bob = f.people.bob!;
    const keys = f.call<{ recipients: { boxKeyIds: string[] }[] }>('comms.thread.keys', bob, { threadId: id }).recipients.flatMap((r) => r.boxKeyIds);
    expect(code(() => f.call('comms.message.send', bob, { threadId: id, ciphertext: encryptMessage({ t: 1 }, keys, id), attachmentIds: [mine.id] }))).toBe('COMMS.ATTACHMENT_INVALID');
  });

  it('discards unsent attachments after 24h and removes attached ones with their message', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    f.call('comms.attachment.register', f.people.alice!, { threadId: id, contentHash: hashOf('a'), sizeBytes: 5, mime: 'application/pdf' });
    f.deps.clock.advance(23 * HOUR);
    expect(f.sys<{ expired: number }>('comms.attachment.expire_due').expired).toBe(0);
    f.deps.clock.advance(2 * HOUR);
    expect(f.sys<{ expired: number }>('comms.attachment.expire_due').expired).toBe(1);
    expect(f.deps.store.collection('comms_attachments').count()).toBe(0);
    expect(code(() => f.call('comms.attachment.expire_due', f.people.alice!))).toBe('AUTHZ.FORBIDDEN');
  });
});

const bytes = (...n: number[]): Uint8Array => Uint8Array.from(n);
const ascii = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));
const seg = (marker: number, body: number[]): number[] => [0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 0xff, ...body];
const SCAN = [0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56];

function jpeg(): Uint8Array {
  return bytes(
    0xff, 0xd8,
    ...seg(0xe0, ascii('JFIF\0\x01\x01\0\0\x01\0\x01\0\0')),
    ...seg(0xe1, ascii('Exif\0\0GPS 52.5200 N 13.4050 E')),
    ...seg(0xe1, ascii('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>')),
    ...seg(0xed, ascii('Photoshop 3.0\0IPTC')),
    ...seg(0xfe, ascii('camera serial 12345')),
    ...seg(0xe2, ascii('ICC_PROFILE\0\x01\x01profile')),
    ...seg(0xe2, ascii('MPF\0multi-picture')),
    ...seg(0xee, ascii('Adobe\0\x64\0\0\0\0\x01')),
    ...seg(0xdb, [0, ...new Array<number>(64).fill(8)]),
    ...seg(0xc0, [8, 0, 1, 0, 1, 1, 1, 0x11, 0]),
    ...seg(0xda, [1, 1, 0, 0, 63, 0]),
    ...SCAN,
    0xff, 0xd9,
    ...ascii('trailing hidden data'),
  );
}

const asText = (b: Uint8Array): string => String.fromCharCode(...b);

describe('client-side metadata stripping', () => {
  it('removes EXIF/XMP/IPTC/COM and unknown APP segments from JPEG but keeps image data and colour segments', () => {
    const r = stripJpegMetadata(jpeg());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const text = asText(r.value);
    for (const gone of ['Exif', 'GPS', 'xmpmeta', 'Photoshop', 'camera serial', 'MPF', 'trailing hidden']) expect(text).not.toContain(gone);
    for (const kept of ['JFIF', 'ICC_PROFILE', 'Adobe']) expect(text).toContain(kept);
    expect([...r.value.slice(-2)]).toEqual([0xff, 0xd9]);
    expect(asText(r.value)).toContain(asText(bytes(...SCAN)));
    const again = stripJpegMetadata(r.value);
    expect(again.ok && [...again.value]).toEqual([...r.value]);
  });

  it('removes text, time and EXIF chunks from PNG and keeps the rest', () => {
    const chunk = (type: string, data: number[]): number[] => [0, 0, 0, data.length, ...ascii(type), ...data, 1, 2, 3, 4];
    const png = bytes(
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ...chunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]),
      ...chunk('tEXt', ascii('Author\0Alice at home')),
      ...chunk('eXIf', ascii('GPSDATA')),
      ...chunk('tIME', [7, 234, 1, 1, 0, 0, 0]),
      ...chunk('iTXt', ascii('XML:com.adobe.xmp\0secret')),
      ...chunk('zTXt', ascii('k\0\0zz')),
      ...chunk('iCCP', ascii('profile')),
      ...chunk('IDAT', [1, 2, 3]),
      ...chunk('IEND', []),
      ...ascii('trailing'),
    );
    const r = stripPngMetadata(png);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const text = asText(r.value);
    for (const gone of ['tEXt', 'eXIf', 'tIME', 'iTXt', 'zTXt', 'Alice', 'GPSDATA', 'trailing']) expect(text).not.toContain(gone);
    for (const kept of ['IHDR', 'iCCP', 'IDAT', 'IEND']) expect(text).toContain(kept);
  });

  it('returns error results for malformed or wrong-format input', () => {
    expect(stripJpegMetadata(bytes(1, 2, 3, 4))).toEqual({ ok: false, error: 'not_jpeg' });
    expect(stripJpegMetadata(jpeg().slice(0, 30))).toMatchObject({ ok: false });
    expect(stripPngMetadata(bytes(1, 2, 3))).toEqual({ ok: false, error: 'not_png' });
    expect(stripPngMetadata(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, ...ascii('IDAT'), 0, 0, 0, 0))).toEqual({ ok: false, error: 'malformed' });
    expect(stripMetadata('application/pdf', bytes(1))).toEqual({ ok: false, error: 'unsupported_mime' });
    expect(stripMetadata('image/jpeg', jpeg()).ok).toBe(true);
  });

  it('never throws on arbitrary bytes and never grows the input (fuzz)', () => {
    const jpegPrefix = [0xff, 0xd8];
    const pngPrefix = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const body = fc.uint8Array({ maxLength: 400 });
    const withPrefix = (prefix: number[]) => body.map((b) => Uint8Array.from([...prefix, ...b]));
    fc.assert(
      fc.property(fc.oneof(body, withPrefix(jpegPrefix), withPrefix(pngPrefix)), (input) => {
        for (const strip of [stripJpegMetadata, stripPngMetadata]) {
          const r = strip(input);
          if (r.ok && r.value.length > input.length) return false;
        }
        return true;
      }),
      { numRuns: 500 },
    );
  });

  it('survives truncation and corruption of a valid JPEG at every position (fuzz)', () => {
    const valid = jpeg();
    fc.assert(
      fc.property(fc.nat(valid.length), fc.nat(valid.length - 1), fc.integer({ min: 0, max: 255 }), (cut, at, value) => {
        const mutated = valid.slice(0, cut);
        if (at < mutated.length) mutated[at] = value;
        const r = stripJpegMetadata(mutated);
        return !r.ok || r.value.length <= mutated.length;
      }),
      { numRuns: 500 },
    );
  });
});
