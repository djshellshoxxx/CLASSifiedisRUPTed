import { describe, expect, it } from 'vitest';
import { DAY } from '@classrup/kernel';
import { assertNoSensitiveKeys, MODULES, POLICIES, PRIVACY_EVENTS, PRIVACY_FLAGS } from '../src/index';
import { adminActor, ctx, makeWorld, sys, user } from './helpers';

describe('privacy package contract', () => {
  it('declares every emitted event and keeps all event payloads free of location and contact keys', () => {
    const w = makeWorld();
    let healthy = false;
    w.privacy.registerExporter('identity', () => ({ pseudonym: 'x' }));
    w.privacy.registerEraser('flaky', () => {
      if (!healthy) throw new Error('down');
      return { erased: 1, retained: [] };
    });
    const admin = ctx(adminActor());
    const [alice, bob, carol, dave] = ['alice', 'bob', 'carol', 'dave'].map(user);
    if (!alice || !bob || !carol || !dave) throw new Error('fixture');

    w.privacy.consent.grant(ctx(alice), { purpose: 'analytics', policyVersion: 'v1' });
    w.privacy.consent.withdraw(ctx(alice), { purpose: 'analytics' });
    w.privacy.retention.setPolicy(admin, { retentionClass: 'audit', ms: 400 * DAY });
    const hold = w.privacy.retention.placeHold(admin, { subjectType: 'account', subjectId: bob.id, reason: 'order 1' });
    w.privacy.deletion.request(ctx(bob));
    w.deps.clock.advance(8 * DAY);
    w.privacy.deletion.processDue(sys());
    w.privacy.retention.releaseHold(admin, { holdId: hold.id });
    w.privacy.deletion.processDue(sys());

    const exp = w.privacy.exports.request(ctx(carol));
    w.privacy.exports.download(ctx(carol), { exportId: exp.id });
    w.deps.clock.advance(8 * DAY);
    w.privacy.exports.expireDue(sys());
    w.privacy.registerExporter('broken', () => {
      throw new Error('x');
    });
    w.privacy.exports.request(ctx(carol));

    const req = w.privacy.deletion.request(ctx(dave));
    w.privacy.deletion.cancel(ctx(dave), { deletionId: req.id });
    w.privacy.deletion.request(ctx(dave));
    w.deps.clock.advance(8 * DAY);
    w.privacy.deletion.processDue(sys());
    healthy = true;
    w.privacy.deletion.processDue(sys());

    const declared = new Set(MODULES.flatMap((m) => m.events ?? []));
    const emitted = new Set(w.deps.store.events.read().map((e) => e.event.type));
    for (const type of emitted) expect(declared.has(type), `${type} emitted but not declared`).toBe(true);
    expect(declared).toEqual(new Set(Object.values(PRIVACY_EVENTS)));
    expect(emitted).toEqual(declared);
    for (const e of w.deps.store.events.read()) expect(() => assertNoSensitiveKeys(e.event.payload), e.event.type).not.toThrow();
  });

  it('keeps flags, permissions and module metadata consistent', () => {
    const w = makeWorld();
    expect(w.privacy.operations).toHaveLength(20);
    const flags = new Set<string>(Object.values(PRIVACY_FLAGS));
    expect(new Set(MODULES.map((m) => m.flag))).toEqual(flags);
    for (const op of w.privacy.operations) {
      expect(op.name).toMatch(/^privacy\.[a-z_]+\.[a-z_]+$/);
      expect(flags.has(op.flag), op.name).toBe(true);
      expect(op.public).toBeUndefined();
    }
    const permissions = new Set(POLICIES.map((p) => p.permission));
    for (const m of MODULES) for (const p of m.permissions ?? []) expect(permissions.has(p), p).toBe(true);
    for (const p of permissions) expect(MODULES.some((m) => m.permissions?.includes(p)), p).toBe(true);
  });
});
