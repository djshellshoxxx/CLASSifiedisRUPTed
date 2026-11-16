import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { buildEnvelope, defineEvent } from './envelope.ts';

describe('event envelope (CTR-EVT-001)', () => {
  it('TEST-PS-117-09.T06 defineEvent validates names; envelopes carry every CTR-EVT-001 field with a strict payload', () => {
    expect(() => defineEvent('Bazaar.offer.made', 1, 'P2', z.strictObject({}))).toThrow();
    expect(() => defineEvent('bazaar.offer', 1, 'P2', z.strictObject({}))).toThrow();
    expect(() => defineEvent('bazaar.offer.made', 0, 'P2', z.strictObject({}))).toThrow();
    const made = defineEvent('bazaar.offer.made', 1, 'P2', z.strictObject({ offerId: z.string() }));
    const ctx = { eventId: 'e1', tenantId: 't1', actor: { kind: 'user' as const, id: 'did:key:z6Mk1' }, occurredAt: '2026-11-04T10:15:30.123Z', correlationId: 'c1', causationId: 'cmd1', origin: 'vault:v1' };
    const env = buildEnvelope(made, { aggregate: { type: 'offer', id: 'o1' }, revision: 1, payload: { offerId: 'o1' } }, ctx);
    expect(Object.keys(env).sort()).toEqual(['actor', 'aggregate', 'causationId', 'correlationId', 'eventId', 'occurredAt', 'payload', 'privacy', 'provenance', 'revision', 'tenantId', 'type', 'version'].sort());
    expect(env).toMatchObject({ type: 'bazaar.offer.made', version: 1, privacy: 'P2', provenance: { origin: 'vault:v1', sig: null } });
    expect(() => buildEnvelope(made, { aggregate: { type: 'offer', id: 'o1' }, revision: 1, payload: { offerId: 'o1', amount: '5' } as never }, ctx)).toThrow('payload');
    expect(() => buildEnvelope(made, { aggregate: { type: 'offer', id: 'o1' }, revision: 0, payload: { offerId: 'o1' } }, ctx)).toThrow('revision');
  });
});
