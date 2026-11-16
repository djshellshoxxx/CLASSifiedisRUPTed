import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { z } from '@classrup/kernel';
import {
  assertSinkSafe, canFlow, canFlowTo, capLocation, checkEventClass, classOf, classRank, createClassificationRegistry, fieldPathsOfZod, geohashBounds, geohashEncode, labelKey, lintClassification,
  loadClassification, LOCATION_LEVELS, maxClass, modelErrors, parseClassificationMap, PRIVACY_CLASSES, redactFor, redactForEvent, redactForExport, redactForFederation, redactForLog, redactForNotification,
  redactForProjection, registerClassification, SINKS, validateCoverage, MODEL_MAJOR,
  type ClassificationMap, type PrivacyClass, type Sink,
} from './index.ts';

const here = new URL('.', import.meta.url).pathname;
const SCHEMA = 'classrup.test.listing/v1';
const MAP: ClassificationMap = {
  schema: SCHEMA,
  fields: {
    id: { class: 'P0' }, title: { class: 'P0' }, note: { class: 'P0' }, address: { class: 'P3' }, token: { class: 'P4' }, reputation: { class: 'P1' }, offer: { class: 'P2' },
    location: { class: 'P0', level: 'L4' }, ip: { class: 'P3', redact: 'truncate' }, seenAt: { class: 'P2', redact: 'truncate' }, tags: { class: 'P0' },
    'items[].name': { class: 'P0' }, 'items[].price': { class: 'P2' }, 'nested.deep.x': { class: 'P3' }, 'nested.deep.y': { class: 'P0' },
  },
};
const RECORD = { id: '0192', title: 'Bike', note: 'mail me a@b.example or +49 30 1234567', address: 'Main St 4', token: 'tok', reputation: 4, offer: '100', location: { lat: 52.5208, lon: 13.4095 },
  ip: '203.0.113.57', seenAt: '2026-11-04T14:59:59.999Z', tags: ['a', 'b'], items: [{ name: 'x', price: '5' }, { name: 'y', price: '6' }], nested: { deep: { x: 'secret', y: 'open' } } };
const OWNER = { owner: true } as const;
const srt = (a: string[]): string[] => [...a].sort();
const keysOf = (v: unknown): string[] => (typeof v === 'object' && v !== null ? Object.keys(v) : []);

describe('classes and sink matrix', () => {
  it('TEST-PS-081-09.T03 the class by sink matrix equals the CTR-PRV-001 table and P3/P4 never reach log, federation, notification or projection', () => {
    // columns: log event federation notification projection export ui_public ui_participant ui_owner
    const expected: Record<PrivacyClass, boolean[]> = {
      P0: [true, true, true, true, true, true, true, true, true],
      P1: [false, true, false, true, false, true, false, true, true],
      P2: [false, true, false, true, false, true, false, true, true],
      P3: [false, true, false, false, false, true, false, false, true],
      P4: [false, false, false, false, false, false, false, false, false],
    };
    expect(SINKS).toEqual(['log', 'event', 'federation', 'notification', 'projection', 'export', 'ui_public', 'ui_participant', 'ui_owner']);
    for (const cls of PRIVACY_CLASSES) SINKS.forEach((sink, i) => expect(canFlow(cls, sink), `${cls}->${sink}`).toBe(expected[cls][i]));
    for (const cls of ['P3', 'P4'] as const) for (const sink of ['log', 'federation', 'notification', 'projection'] as const) {
      expect(canFlow(cls, sink)).toBe(false);
      expect(canFlowTo(cls, sink, { owner: true, encrypted: true, optIn: true })).toBe(false);
    }
    expect(canFlowTo('P2', 'event')).toBe(false);
    expect(canFlowTo('P2', 'event', { owner: true })).toBe(true);
    expect(canFlowTo('P2', 'notification', { encrypted: true })).toBe(true);
    expect(canFlowTo('P3', 'export')).toBe(false);
    expect(canFlowTo('P3', 'export', OWNER)).toBe(true);
    expect(canFlowTo('P0', 'federation')).toBe(false);
    expect(canFlowTo('P0', 'federation', { optIn: true })).toBe(true);
    expect(canFlowTo('P3', 'ui_owner')).toBe(true);
  });

  it('TEST-PS-081-09.T05 class order is total and flow is monotone: a lower class flows wherever a higher one does', () => {
    fc.assert(fc.property(fc.constantFrom(...PRIVACY_CLASSES), fc.constantFrom(...PRIVACY_CLASSES), fc.constantFrom(...PRIVACY_CLASSES), fc.constantFrom(...SINKS), (a, b, c, sink) => {
      expect(classRank(a) <= classRank(b) || classRank(b) <= classRank(a)).toBe(true);
      expect(maxClass(a, b)).toBe(maxClass(b, a));
      expect(maxClass(maxClass(a, b), c)).toBe(maxClass(a, maxClass(b, c)));
      expect(maxClass(a, a)).toBe(a);
      if (classRank(a) <= classRank(b) && canFlow(b, sink)) expect(canFlow(a, sink)).toBe(true);
    }));
    expect(PRIVACY_CLASSES.map(classRank)).toEqual([0, 1, 2, 3, 4]);
    expect(labelKey('P0')).toBe('privacy.class.p0');
    expect(labelKey('P4')).toBe('privacy.class.p4');
  });

  it('capLocation limits every public sink to L2 and keeps lower levels', () => {
    for (const sink of ['log', 'federation', 'notification', 'projection', 'ui_public'] as const) {
      expect(LOCATION_LEVELS.map((l) => capLocation(l, sink))).toEqual(['L0', 'L1', 'L2', 'L2', 'L2']);
    }
    expect(capLocation('L4', 'ui_owner')).toBe('L4');
    expect(capLocation('L4', 'ui_participant')).toBe('L3');
  });
});

describe('classification maps', () => {
  it('TEST-PS-081-09.T01 loads a map, classifies every path and raises PRIVACY_CLASSIFICATION_MISSING for a missing one', () => {
    const reg = createClassificationRegistry();
    expect(reg.register(MAP).ok).toBe(true);
    const loaded = loadClassification(SCHEMA, reg);
    expect(loaded.ok && Object.keys(loaded.value.fields).length).toBe(Object.keys(MAP.fields).length);
    const paths = Object.keys(MAP.fields);
    expect(validateCoverage(MAP, paths).ok).toBe(true);
    const missing = validateCoverage(MAP, [...paths, 'brand.new.field']);
    expect(!missing.ok && missing.error.code).toBe('PRIVACY_CLASSIFICATION_MISSING');
    expect(!missing.ok && missing.error.status).toBe(500);
    expect(!missing.ok && missing.error.fields).toEqual([{ path: 'brand.new.field', code: 'UNCLASSIFIED' }]);
    const extra = validateCoverage(MAP, paths.slice(1));
    expect(!extra.ok && extra.error.code).toBe('VALIDATION_FAILED');
    const unknown = loadClassification('classrup.nope/v1', reg);
    expect(!unknown.ok && unknown.error.code).toBe('PRIVACY_CLASSIFICATION_MISSING');
    expect(reg.register(MAP).ok).toBe(false);
    expect(classOf('address', MAP)).toBe('P3');
    expect(classOf('items[].price', MAP)).toBe('P2');
    expect(classOf('tags[]', MAP)).toBe('P0');
    expect(classOf('not.in.map', MAP)).toBe('P3');
    expect(registerClassification({ schema: 'classrup.test.default/v1', fields: { a: { class: 'P0' } } }).ok).toBe(true);
    expect(loadClassification('classrup.test.default/v1').ok).toBe(true);
  });

  it('rejects malformed maps and enforces the 10 000 path bound', () => {
    expect(parseClassificationMap({ schema: 'x.y/v1', fields: { 'a..b': { class: 'P0' } } }).ok).toBe(false);
    expect(parseClassificationMap({ schema: 'x.y/v1', fields: { a: { class: 'P0', redact: 'explode' } } }).ok).toBe(false);
    expect(parseClassificationMap({ schema: 'x.y/v1', fields: { a: { class: 'P0', level: 'L9' } } }).ok).toBe(false);
    expect(parseClassificationMap({ schema: 'x.y/v1', fields: { a: { class: 'P0' } }, extra: 1 }).ok).toBe(false);
    const big = Object.fromEntries(Array.from({ length: 10_001 }, (_, i) => [`f${i}`, { class: 'P0' }]));
    const r = parseClassificationMap({ schema: 'x.y/v1', fields: big });
    expect(!r.ok && r.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(parseClassificationMap({ schema: 'x.y/v1', fields: Object.fromEntries(Array.from({ length: 10_000 }, (_, i) => [`f${i}`, { class: 'P0' }])) }).ok).toBe(true);
  });

  it('TEST-PS-081-09.T15 v1 maps load and a candidate with an added class requires a library major bump', () => {
    expect(MODEL_MAJOR).toBe(1);
    expect(parseClassificationMap({ schema: 'x.y/v1', libraryMajor: 1, fields: { a: { class: 'P4' }, b: { class: 'P0', level: 'L2' } } }).ok).toBe(true);
    const added = parseClassificationMap({ schema: 'x.y/v2', fields: { a: { class: 'P5' } } });
    expect(!added.ok && added.error.code).toBe('VALIDATION_FAILED');
    expect(!added.ok && added.error.fields?.[0]?.code).toBe('UNKNOWN_CLASS_REQUIRES_MAJOR');
    const v2 = parseClassificationMap({ schema: 'x.y/v2', libraryMajor: 2, fields: { a: { class: 'P5' } } });
    expect(!v2.ok && v2.error.code).toBe('UNSUPPORTED_SCHEMA_VERSION');
    expect(!v2.ok && v2.error.params).toEqual({ requiresMajor: 2, supportedMajor: 1 });
    expect(parseClassificationMap({ schema: 'x.y/v1', fields: { a: { class: 'P0' } } }).ok).toBe(true);
  });

  it('derives field paths from zod schemas and lints unclassified fields, event classes and projections', () => {
    const schema = z.strictObject({ id: z.string(), title: z.string().optional(), tags: z.array(z.string()), items: z.array(z.strictObject({ name: z.string(), price: z.string() })), nested: z.strictObject({ deep: z.strictObject({ x: z.string(), y: z.string() }) }), when: z.string().default('x'), loc: z.string().nullable() });
    const paths = fieldPathsOfZod(schema);
    expect(paths.sort()).toEqual(['id', 'items[].name', 'items[].price', 'loc', 'nested.deep.x', 'nested.deep.y', 'tags[]', 'title', 'when'].sort());
    const clean = lintClassification([{ schema: SCHEMA, paths: Object.keys(MAP.fields), map: MAP, events: [{ type: 'x.y.z', class: 'P3', payloadPaths: ['id', 'address'] }], projections: [{ name: 'public', paths: ['id', 'title'] }] }]);
    expect(clean.findings).toEqual([]);
    expect(clean.unclassified_fields_total).toBe(0);
    expect(clean.classified_fields_total).toBe(15);
    const bad = lintClassification([{ schema: SCHEMA, paths: [...Object.keys(MAP.fields), 'injected'], map: MAP, events: [{ type: 'x.y.z', class: 'P0', payloadPaths: ['id', 'address'] }], projections: [{ name: 'public', paths: ['id', 'reputation'] }] }]);
    expect(bad.unclassified_fields_total).toBe(1);
    expect(bad.event_class_violations_total).toBe(1);
    expect(bad.findings.map((f) => f.code).sort()).toEqual(['PRIVACY_CLASSIFICATION_MISSING', 'PRIVACY_CLASSIFICATION_MISSING', 'PRIVACY_SINK_FORBIDDEN']);
    expect(lintClassification([{ schema: 's', paths: ['a'], map: undefined }]).unclassified_fields_total).toBe(1);
    expect(checkEventClass('P3', ['id', 'address'], MAP).ok).toBe(true);
    const understated = checkEventClass('P0', ['id', 'address'], MAP);
    expect(!understated.ok && understated.error.code).toBe('PRIVACY_CLASSIFICATION_MISSING');
    expect(checkEventClass('P1', ['unknown.path'], MAP).ok).toBe(false);
  });
});

describe('redaction', () => {
  it('redacts the documented example for logs: address placeholder, typed email token, dropped path list', () => {
    const r = redactForLog({ id: '0192', title: 'Bike', address: 'Main St 4', note: 'mail me a@b.example' }, MAP);
    expect(r.value).toEqual({ id: '0192', title: 'Bike', address: '[redacted:P3]', note: 'mail me [email]' });
    expect(r.dropped).toEqual(['address']);
    expect(r.class).toBe('P3');
    const full = redactForLog(RECORD, MAP);
    expect(JSON.stringify(full.value)).not.toMatch(/a@b\.example|1234567|Main St|secret|203\.0\.113\.57|tok"/);
    expect((full.value as { ip: string }).ip).toBe('203.0.113.0/24');
    expect((full.value as { seenAt: string }).seenAt).toBe('2026-11-04T14:00:00.000Z');
    expect((full.value as { location: unknown }).location).toBe(geohashEncode(52.5208, 13.4095, 5));
    expect((full.value as { note: string }).note).toBe('mail me [email] or [phone]');
  });

  it('TEST-PS-081-09.T02 an unannotated field is treated as P3 and dropped from every sink', () => {
    const rec = { id: '1', title: 'x', surprise: 'leak', nested: { deep: { y: 'ok', newField: 'leak2' } }, items: [{ name: 'n', extra: 'leak3' }] };
    for (const sink of SINKS) {
      const r = redactFor(sink, rec, MAP, { owner: true, encrypted: true, optIn: true });
      expect(r.refused, sink).toBeUndefined();
      const text = JSON.stringify(r.value);
      expect(text, sink).not.toMatch(/leak/);
      expect([...r.dropped], sink).toEqual(expect.arrayContaining(['surprise', 'nested.deep.newField', 'items[].extra']));
      expect(r.class).toBe('P3');
    }
    const strict = redactForProjection(rec, MAP, { strict: true });
    expect(strict.refused).toBe(true);
    expect(strict.error?.code).toBe('PRIVACY_CLASSIFICATION_MISSING');
    expect(strict.value).toBeNull();
  });

  it('applies the sink matrix per sink to a mixed record', () => {
    const present = (sink: Sink, ctx = {}) => keysOf(redactFor(sink, RECORD, MAP, ctx).value).sort();
    expect(present('log')).toEqual(['id', 'ip', 'location', 'note', 'seenAt', 'tags', 'title', 'address', 'items', 'nested', 'offer', 'reputation', 'token'].sort());
    expect(present('projection')).toEqual(srt(['id', 'items', 'ip', 'location', 'nested', 'note', 'seenAt', 'tags', 'title']));
    expect(present('ui_public')).toEqual(srt(['id', 'items', 'ip', 'location', 'nested', 'note', 'seenAt', 'tags', 'title']));
    expect(present('ui_participant')).toEqual(srt(['id', 'items', 'ip', 'location', 'nested', 'note', 'offer', 'reputation', 'seenAt', 'tags', 'title']));
    expect(present('ui_owner')).toEqual(srt(['address', 'id', 'ip', 'items', 'location', 'nested', 'note', 'offer', 'reputation', 'seenAt', 'tags', 'title']));
    expect(present('export')).toEqual(srt(['id', 'ip', 'items', 'location', 'nested', 'note', 'reputation', 'seenAt', 'tags', 'title']));
    expect(present('export', OWNER)).toEqual(srt(['address', 'id', 'ip', 'items', 'location', 'nested', 'note', 'offer', 'reputation', 'seenAt', 'tags', 'title']));
    expect(present('event', OWNER)).toEqual(srt(['address', 'id', 'ip', 'items', 'location', 'nested', 'note', 'offer', 'reputation', 'seenAt', 'tags', 'title']));
    expect(present('event')).toEqual(srt(['id', 'ip', 'items', 'location', 'nested', 'note', 'reputation', 'seenAt', 'tags', 'title']));
    expect(present('notification')).toEqual(srt(['id', 'items', 'ip', 'location', 'nested', 'note', 'reputation', 'seenAt', 'tags', 'title']));
    expect(JSON.stringify(redactForNotification(RECORD, MAP, { encrypted: true }).value)).toContain('"offer":"100"');
    const nested = redactForProjection(RECORD, MAP).value as { nested: unknown; items: unknown; ip: string };
    expect(nested.nested).toEqual({ deep: { y: 'open' } });
    expect(nested.items).toEqual([{ name: 'x' }, { name: 'y' }]);
    const exp = redactForExport(RECORD, MAP);
    expect(exp.dropped).toEqual(expect.arrayContaining(['address', 'offer', 'token', 'items[].price']));
    expect(JSON.stringify(exp.value)).not.toMatch(/Main St|"100"|"tok"/);
  });

  it('never lets P4 through any sink, even to the owner', () => {
    for (const sink of SINKS) {
      const r = redactFor(sink, { token: 'tok-secret', id: '1' }, MAP, { owner: true, encrypted: true, optIn: true });
      expect(JSON.stringify(r.value)).not.toContain('tok-secret');
    }
  });

  it('federation needs an explicit opt-in and otherwise refuses without a copy', () => {
    const refused = redactForFederation({ id: '1', title: 't' }, MAP);
    expect(refused.refused).toBe(true);
    expect(refused.value).toBeNull();
    expect(refused.error?.code).toBe('PRIVACY_SINK_FORBIDDEN');
    const fed = redactForFederation(RECORD, MAP, { optIn: true });
    expect(fed.refused).toBeUndefined();
    expect(fed.value).toMatchObject({ id: '0192', title: 'Bike', location: geohashEncode(52.5208, 13.4095, 5) });
    expect(JSON.stringify(fed.value)).not.toMatch(/Main St|secret|"100"|tok/);
  });

  it('TEST-PS-081-09.T04 locations L0 to L4 for public sinks: L0 to L2 pass, L3 and L4 are snapped to the L2 cell or refused', () => {
    const cell = geohashEncode(52.5208, 13.4095, 5);
    const b = geohashBounds(cell);
    expect(cell).toHaveLength(5);
    expect(52.5208).toBeGreaterThanOrEqual(b.latLo);
    expect(52.5208).toBeLessThanOrEqual(b.latHi);
    expect(13.4095).toBeGreaterThanOrEqual(b.lonLo);
    expect(13.4095).toBeLessThanOrEqual(b.lonHi);
    const l4 = { lat: 52.5208, lon: 13.4095 };
    const l3 = geohashEncode(52.5208, 13.4095, 6);
    const l2 = geohashEncode(52.5208, 13.4095, 5);
    const l1 = geohashEncode(52.5208, 13.4095, 4);
    const sinks: [Sink, object][] = [['log', {}], ['federation', { optIn: true }], ['notification', {}], ['projection', {}], ['ui_public', {}]];
    for (const [sink, ctx] of sinks) {
      const out = (loc: unknown) => (redactFor(sink, { id: 'x', location: loc }, MAP, ctx).value as { location: unknown }).location;
      expect(out(null), sink).toBeNull();
      expect(out(l1), sink).toBe(l1);
      expect(out(l2), sink).toBe(l2);
      expect(out(l3), sink).toBe(l2);
      expect(out(l4), sink).toBe(l2);
      expect(out(`${l3}yz`), sink).toBe(l2);
      for (const precise of [l3, l4]) {
        const strict = redactFor(sink, { location: precise }, MAP, { ...ctx, strict: true });
        expect(strict.refused, sink).toBe(true);
        expect(strict.error?.code).toBe('PRIVACY_LOCATION_TOO_PRECISE');
        expect(strict.error?.status).toBe(422);
      }
      if (sink !== 'log') {
        for (const bad of [{ lat: 200, lon: 5 }, 'not a cell!', { x: 1 }, 12]) {
          const r = redactFor(sink, { location: bad }, MAP, ctx);
          expect(r.refused, `${sink} ${JSON.stringify(bad)}`).toBe(true);
          expect(r.error?.code).toBe('PRIVACY_LOCATION_TOO_PRECISE');
        }
      }
    }
    const owner = redactFor('ui_owner', { location: l4 }, MAP).value as { location: unknown };
    expect(owner.location).toEqual(l4);
    const participant = redactFor('ui_participant', { location: l4 }, MAP).value as { location: unknown };
    expect(participant.location).toBe(l3);
    for (const sink of ['projection', 'federation', 'notification'] as const) {
      expect(JSON.stringify(redactFor(sink, { location: l4 }, MAP, { optIn: true }).value)).not.toMatch(/52\.52|13\.40/);
    }
    const capped: ClassificationMap = { schema: 'a/v1', fields: { loc: { class: 'P0', level: 'L1' } } };
    expect(redactForProjection({ loc: l4 }, capped).value).toEqual({ loc: geohashEncode(52.5208, 13.4095, 4) });
    expect(redactForProjection({ loc: l2 }, capped).value).toEqual({ loc: l1 });
    const none: ClassificationMap = { schema: 'a/v1', fields: { loc: { class: 'P0', level: 'L0' } } };
    expect(redactForProjection({ loc: l1 }, none).dropped).toEqual(['loc']);
  });

  it('an event mixing a P0 id with a P3 address is class P3 and cannot go to federation', () => {
    const r = redactForEvent({ id: '1', address: 'Main St' }, MAP, OWNER);
    expect(r.class).toBe('P3');
    expect(r.value).toEqual({ id: '1', address: 'Main St' });
    expect(redactForFederation({ id: '1', address: 'Main St' }, MAP, { optIn: true }).value).toEqual({ id: '1' });
    expect(redactForFederation({ id: '1', address: 'Main St' }, MAP, { optIn: true, strict: true }).error?.code).toBe('PRIVACY_SINK_FORBIDDEN');
  });

  it('strategies: truncate keeps network and hour only, hash needs a caller digest, drop removes', () => {
    const map: ClassificationMap = { schema: 's/v1', fields: { ip: { class: 'P3', redact: 'truncate' }, at: { class: 'P2', redact: 'truncate' }, email: { class: 'P3', redact: 'hash' }, junk: { class: 'P3', redact: 'truncate' } } };
    const rec = { ip: '2001:db8:abcd:12::1', at: '2026-11-04T14:59:59.999Z', email: 'a@b.example', junk: 'free text' };
    const noHash = redactForLog(rec, map);
    expect(noHash.value).toEqual({ ip: '2001:db8:abcd::/48', at: '2026-11-04T14:00:00.000Z', email: '[redacted:P3]', junk: '[redacted:P3]' });
    const hashed = redactForEvent(rec, map, { hash: (s) => `h:${s.length}` });
    expect((hashed.value as { email: string }).email).toBe('h:11');
    expect(redactForProjection({ ip: '203.0.113.9' }, map).value).toEqual({ ip: '203.0.113.0/24' });
    expect(redactForProjection({ ip: '203.0.113.9' }, { schema: 's/v1', fields: { ip: { class: 'P4', redact: 'truncate' } } }).value).toEqual({});
  });

  it('refuses hostile keys without copying them and leaves inputs unmodified', () => {
    const rec = JSON.parse('{"id":"1","__proto__x":"a","constructor":{"prototype":{"polluted":true}},"a.b":"x"}') as Record<string, unknown>;
    const before = JSON.stringify(rec);
    const r = redactForProjection(rec, MAP);
    expect(JSON.stringify(rec)).toBe(before);
    expect(r.value).toEqual({ id: '1' });
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    const withProto = JSON.parse('{"id":"1","__proto__":{"polluted":true}}') as unknown;
    expect(redactForProjection(withProto, MAP).value).toEqual({ id: '1' });
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    class Odd { secret = 'x'; }
    const d = redactForProjection({ id: '1', tags: new Odd(), title: new Date(0) }, MAP);
    expect(d.value).toEqual({ id: '1' });
    expect([...d.dropped].sort()).toEqual(['tags', 'title']);
  });

  it('TEST-PS-081-09.T05 redaction is idempotent for every sink and never mutates its input', () => {
    const maps: ClassificationMap = { schema: 'p/v1', fields: { a: { class: 'P0' }, b: { class: 'P1' }, c: { class: 'P2' }, d: { class: 'P3' }, e: { class: 'P4' }, 'arr[].x': { class: 'P0' }, 'arr[].y': { class: 'P3' }, loc: { class: 'P0', level: 'L3' }, ip: { class: 'P3', redact: 'truncate' }, blob: { class: 'P0' } } };
    const text = fc.oneof(fc.string({ maxLength: 20 }), fc.constantFrom('a@b.example', '+49 30 1234567', '10.1.2.3', '[redacted:P3]'));
    const rec = fc.record({ a: text, b: text, c: text, d: text, e: text, zzz: text, loc: fc.oneof(fc.constant(null), fc.constantFrom('u336y', 'u336yz', 'u33'), fc.record({ lat: fc.double({ min: -90, max: 90, noNaN: true }), lon: fc.double({ min: -180, max: 180, noNaN: true }) })), ip: fc.oneof(fc.ipV4(), fc.ipV6(), fc.string({ maxLength: 8 })), blob: fc.jsonValue({ maxDepth: 3 }), arr: fc.array(fc.record({ x: text, y: text, z: text }), { maxLength: 3 }) }, { requiredKeys: [] });
    const ctxs = fc.record({ owner: fc.boolean(), encrypted: fc.boolean(), optIn: fc.boolean() });
    fc.assert(fc.property(rec, ctxs, fc.constantFrom(...SINKS), (record, ctx, sink) => {
      const frozen = JSON.stringify(record);
      const once = redactFor(sink, record, maps, ctx);
      expect(JSON.stringify(record)).toBe(frozen);
      if (once.refused) return;
      const twice = redactFor(sink, once.value, maps, ctx);
      expect(twice.value).toEqual(once.value);
    }), { numRuns: 300 });
  });

  it('TEST-PS-081-09.T06 unknown paths in random nested structures default to P3 and never reach public sinks', () => {
    const publicSinks = ['log', 'federation', 'notification', 'projection', 'ui_public', 'ui_participant'] as const;
    const key = fc.stringMatching(/^[a-z]{1,6}$/).filter((k) => !['id', 'title'].includes(k));
    const tree: fc.Arbitrary<unknown> = fc.letrec((t) => ({ node: fc.oneof({ depthSize: 'small' }, fc.string({ minLength: 5, maxLength: 12 }).map((s) => `LEAK-${s}`), fc.array(t('node'), { maxLength: 3 }), fc.dictionary(key, t('node'), { maxKeys: 3 })) })).node;
    fc.assert(fc.property(fc.dictionary(key, tree, { maxKeys: 4 }), fc.constantFrom(...publicSinks), (extras, sink) => {
      const rec = { id: '1', title: 't', ...extras };
      const r = redactFor(sink, rec, MAP, { optIn: true });
      expect(JSON.stringify(r.value)).not.toContain('LEAK-');
      expect((r.value as Record<string, unknown>)['id']).toBe('1');
      for (const k of Object.keys(extras)) expect(r.dropped).toContain(k);
      expect(r.class).toBe(Object.keys(extras).length > 0 ? 'P3' : 'P0');
    }), { numRuns: 200 });
  });

  it('TEST-PS-081-09.T11 a missing classification map fails closed with every field treated as P3', () => {
    const r = redactForProjection({ id: '1', title: 't', nested: { a: 1 } }, 'classrup.unregistered/v1');
    expect(r.refused).toBe(true);
    expect(r.value).toBeNull();
    expect(r.error?.code).toBe('PRIVACY_CLASSIFICATION_MISSING');
    expect(r.class).toBe('P3');
    expect([...r.dropped].sort()).toEqual(['id', 'nested', 'title'].sort());
    const reg = createClassificationRegistry([MAP]);
    const known = redactForProjection({ id: '1' }, SCHEMA, { registry: reg });
    expect(known.value).toEqual({ id: '1' });
    const log = redactForLog({ id: '1' }, 'classrup.unregistered/v1');
    expect(log.refused).toBe(true);
  });
});

describe('contract, assertions, abuse and static analysis', () => {
  it('free-text scrubbing is linear on adversarial strings and keeps dates and IPs out of the phone pattern', () => {
    const size = 900_000;
    for (const text of ['a'.repeat(size), '@'.repeat(size), 'a@'.repeat(size / 2), '1 '.repeat(size / 2), '1'.repeat(size), '.'.repeat(size), 'a@b'.repeat(size / 3), '+1'.repeat(size / 2)]) {
      const t0 = performance.now();
      const r = redactForLog({ note: text }, MAP);
      expect(r.refused).toBeUndefined();
      expect(performance.now() - t0).toBeLessThan(1500);
    }
    expect((redactForLog({ note: 'on 2026-11-04 from 203.0.113.57 call (030) 123-4567 or write a.b+c@mail.example.org.' }, MAP).value as { note: string }).note).toBe('on 2026-11-04 from 203.0.113.0/24 call ([phone] or write [email].');
    const once = redactForLog({ note: 'x@y.example 12345678901 10.0.0.1' }, MAP);
    expect(redactForLog(once.value, MAP).value).toEqual(once.value);
  });


  it('TEST-PS-081-09.T07 the public API surface and error codes match the errors table', async () => {
    expect(modelErrors.codes).toEqual({
      PRIVACY_CLASSIFICATION_MISSING: { status: 500, retryable: false },
      PRIVACY_SINK_FORBIDDEN: { status: 403, retryable: false },
      PRIVACY_LOCATION_TOO_PRECISE: { status: 422, retryable: false },
    });
    const api = (await import('./index.ts')) as Record<string, unknown>;
    for (const name of ['classOf', 'maxClass', 'canFlow', 'capLocation', 'redactForLog', 'redactForEvent', 'redactForFederation', 'redactForNotification', 'redactForProjection', 'redactForExport', 'labelKey', 'loadClassification', 'assertSinkSafe']) expect(typeof api[name], name).toBe('function');
    const r = redactForLog({ id: '1' }, MAP);
    expect(Object.keys(r).sort()).toEqual(['class', 'dropped', 'value']);
    const refused = redactForFederation({ id: '1' }, MAP);
    expect(Object.keys(refused).sort()).toEqual(['class', 'dropped', 'error', 'refused', 'value']);
    expect(refused.error).toMatchObject({ code: 'PRIVACY_SINK_FORBIDDEN', status: 403, retryable: false, messageKey: 'error.privacy_sink_forbidden' });
    expect(typeof classOf('id', MAP)).toBe('string');
  });

  it('TEST-PS-081-09.T08 assertSinkSafe fails with a path list and no values in the message', () => {
    expect(() => assertSinkSafe({ id: '1', title: 'ok' }, MAP, 'projection')).not.toThrow();
    let message = '';
    try { assertSinkSafe({ id: '1', address: 'Secret Street 9', location: { lat: 52.5208, lon: 13.4095 }, extra: 'hidden-value' }, MAP, 'projection'); } catch (e) { message = (e as Error).message; }
    expect(message).toContain('address');
    expect(message).toContain('location');
    expect(message).toContain('extra');
    expect(message).not.toMatch(/Secret Street|hidden-value|52\.52|13\.40/);
    expect(() => assertSinkSafe({ id: '1', address: 'x' }, MAP, 'ui_owner')).not.toThrow();
    expect(() => assertSinkSafe({ id: '1' }, 'classrup.unregistered/v1', 'projection')).toThrow(/PRIVACY_CLASSIFICATION_MISSING/);
  });

  it('TEST-PS-081-09.T09 the package has no network, fs, clock or randomness access and the default sink is the public log', () => {
    const files = readdirSync(here).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    expect(files.length).toBeGreaterThan(4);
    for (const f of files) {
      const src = readFileSync(join(here, f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(src, f).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|indexedDB|localStorage|node:|require\(|\bprocess\./);
      expect(src, f).not.toMatch(/\bDate\b|Math\.random|performance\.now|setTimeout|crypto\./);
      for (const m of src.matchAll(/from\s+'([^']+)'/g)) expect((m[1] as string).startsWith('.') || m[1] === '@classrup/kernel', `${f}: ${m[1]}`).toBe(true);
    }
    const noSink = redactFor(undefined, RECORD, MAP);
    expect(noSink.value).toEqual(redactForLog(RECORD, MAP).value);
    expect(JSON.stringify(noSink.value)).not.toMatch(/Main St|"100"|secret/);
    expect(redactFor('nonsense' as Sink, RECORD, MAP, OWNER).value).toEqual(redactForLog(RECORD, MAP, OWNER).value);
    expect(redactForLog(RECORD, MAP).dropped).toEqual(redactForLog(RECORD, MAP, { owner: true, encrypted: true }).dropped);
  });

  it('TEST-PS-081-09.T10 40-level nesting and a 5 MiB record are rejected quickly and no values appear in the error', () => {
    let deep: unknown = 'DEEP-SECRET-VALUE';
    for (let i = 0; i < 40; i++) deep = { n: deep };
    const huge = { id: '1', note: 'HUGE-SECRET'.padEnd(5 * 1024 * 1024, 'x') };
    const manyKeys = Object.fromEntries(Array.from({ length: 60_000 }, (_, i) => [`k${i}`, 'v']));
    const timed = (fn: () => ReturnType<typeof redactForLog>): number => {
      let best = Infinity;
      for (let i = 0; i < 20; i++) {
        const t0 = performance.now();
        const r = fn();
        best = Math.min(best, performance.now() - t0);
        expect(r.refused).toBe(true);
        expect(r.error?.code).toBe('PAYLOAD_TOO_LARGE');
        expect(r.value).toBeNull();
        expect(JSON.stringify(r)).not.toMatch(/SECRET/);
      }
      return best;
    };
    expect(timed(() => redactForLog(deep, MAP))).toBeLessThan(1);
    expect(timed(() => redactForLog(huge, MAP))).toBeLessThan(1);
    expect(timed(() => redactForProjection(manyKeys, MAP))).toBeLessThan(100);
    let ok: unknown = 'x';
    for (let i = 0; i < 30; i++) ok = { n: ok };
    expect(redactForLog(ok, MAP).refused).toBeUndefined();
    expect(redactForLog({ id: 'x'.repeat(1024 * 1024 - 10) }, MAP).refused).toBeUndefined();
    expect(redactForLog({ id: 'x'.repeat(1024 * 1024 + 1) }, MAP).refused).toBe(true);
  });
});
