import { describe, expect, it } from 'vitest';
import { createTestKernel } from '@classrup/kernel/testing';
import { locationDefinitions, locationSettingRepo, locationUpdated, type LocationView } from './index.ts';

function fixture() {
  const k = createTestKernel();
  const principal = k.actor.kind === 'user' ? k.actor.id : '';
  k.registry.add(...locationDefinitions({ localPrincipal: () => principal }).all);
  const call = { actor: k.actor, tenantId: principal };
  const set = (cell5 = 'u4pru', expectedRevision = 0, extra: object = {}) => k.cmd('discovery.location.set_home',
    { cell5, publicLevel: 'L1', entryMode: 'map_tile', expectedRevision, ...extra }, call);
  const get = async (includeHomeCell = false) => value<LocationView>(await k.ask('discovery.location.get_own', { includeHomeCell }, call));
  return { k, principal, call, set, get };
}
function value<T>(result: { ok: boolean; value?: { value: unknown }; error?: unknown }): T {
  if (!result.ok) throw new Error(JSON.stringify(result.error)); return result.value!.value as T;
}
const code = (result: { ok: boolean; error?: { code: string } }) => result.ok ? 'ok' : result.error?.code;

describe('PS-048 local coarse location preferences', () => {
  it('starts hidden, stores only the coarse home and emits only the chosen public precision', async () => {
    const f = fixture();
    expect(await f.get(true)).toEqual({ publicLevel: 'L0' });
    const created = value<LocationView>(await f.set('u4pru', 0, { entryMode: 'device_gps_once', fromGpsOnce: true }));
    expect(created).toMatchObject({ publicLevel: 'L1', publicCell: 'u4pr', revision: 1 });
    expect(created).not.toHaveProperty('homeCell5');
    expect(await f.get()).not.toHaveProperty('homeCell5');
    expect(await f.get(true)).toMatchObject({ homeCell5: 'u4pru', publicCell: 'u4pr' });
    expect(f.k.events).toHaveLength(1);
    expect(locationUpdated.payload.safeParse(f.k.events[0]?.payload).success).toBe(true);
    const exposed = JSON.stringify([f.k.events, f.k.logs.records(), f.k.audit]);
    expect(exposed).not.toContain('u4pru'); expect(exposed).not.toContain('latitude'); expect(exposed).not.toContain('longitude');
    expect(await f.k.storage.read(tx => tx.sync.list({ tenant: f.principal, limit: 10 }))).toEqual([]);
  });

  it('rejects too-fine cells, public levels, coordinate fields and inconsistent GPS provenance atomically', async () => {
    const f = fixture();
    for (const extra of [{ cell5: 'u4pruy' }, { cell5: 'u4pruydqqvj' }, { publicLevel: 'L3' }, { cell5: 'U4PRU' }, { cell5: undefined }]) {
      expect(code(await f.set('u4pru', 0, extra))).toBe('DISCOVERY_PRECISION_FORBIDDEN');
    }
    for (const extra of [{ latitude: 57.64911 }, { longitude: 10.40744 }, { address: 'private road' }, { fromGpsOnce: true }]) {
      expect(code(await f.set('u4pru', 0, extra))).toBe('VALIDATION_FAILED');
    }
    expect(await f.get(true)).toEqual({ publicLevel: 'L0' }); expect(f.k.events).toHaveLength(0);
  });

  it('enforces actor and tenant ownership even under an allow-all capability harness', async () => {
    const f = fixture(); await f.set();
    for (const call of [{ actor: f.k.user(), tenantId: f.principal }, { actor: f.k.actor, tenantId: 'other-vault' }]) {
      expect(code(await f.k.ask('discovery.location.get_own', { includeHomeCell: true }, call))).toBe('FORBIDDEN');
      expect(code(await f.k.cmd('discovery.location.set_home', { cell5: 'c2b2q', publicLevel: 'L2', entryMode: 'map_tile', expectedRevision: 1 }, call))).toBe('FORBIDDEN');
      expect(code(await f.k.cmd('discovery.location.clear_home', { expectedRevision: 1 }, call))).toBe('FORBIDDEN');
    }
    expect((await f.get(true)).homeCell5).toBe('u4pru');
  });

  it('requires exact revisions for updates, handles identical saves without new events and preserves idempotency', async () => {
    const f = fixture(); const key = f.k.ids.next();
    const input = { cell5: 'u4pru', publicLevel: 'L1', entryMode: 'map_tile' };
    const first = await f.k.cmd('discovery.location.set_home', input, { ...f.call, idempotencyKey: key });
    const replay = await f.k.cmd('discovery.location.set_home', input, { ...f.call, idempotencyKey: key });
    expect(value(first)).toEqual(value(replay)); expect(replay.ok && replay.value.replayed).toBe(true);
    expect(code(await f.set('c2b2q', 0))).toBe('CONFLICT_REVISION');
    expect(code(await f.k.cmd('discovery.location.set_home', input, f.call))).toBe('CONFLICT_REVISION');
    expect(value<LocationView>(await f.set('u4pru', 1)).revision).toBe(1);
    expect(f.k.events).toHaveLength(1);
    const changes = await Promise.all([f.set('c2b2q', 1), f.set('dr5ru', 1)]);
    expect(changes.map(code).sort()).toEqual(['CONFLICT_REVISION', 'ok']);
    expect((await f.get()).revision).toBe(2);
  });

  it('enforces a sliding 24-hour limit while hiding and clearing remain available without resetting it', async () => {
    const f = fixture(); await f.set();
    f.k.clock.advance(3_600_000); await f.set('c2b2q', 1);
    f.k.clock.advance(3_600_000); await f.set('dr5ru', 2);
    expect(code(await f.set('s0000', 3))).toBe('DISCOVERY_HOME_CHANGE_LIMIT');
    const hidden = value<LocationView>(await f.set('dr5ru', 3, { publicLevel: 'L0' }));
    expect(hidden).toMatchObject({ publicLevel: 'L0', revision: 4 }); expect(hidden).not.toHaveProperty('publicCell');
    expect(f.k.events.at(-1)?.payload).not.toHaveProperty('publicCell');
    expect(code(await f.k.cmd('discovery.location.clear_home', { expectedRevision: 4 }, f.call))).toBe('ok');
    expect(await f.get(true)).not.toHaveProperty('homeCell5');
    expect(code(await f.set('s0000', 5))).toBe('DISCOVERY_HOME_CHANGE_LIMIT');
    f.k.clock.advance(22 * 3_600_000 - 1);
    expect(code(await f.set('s0000', 5))).toBe('DISCOVERY_HOME_CHANGE_LIMIT');
    f.k.clock.advance(1);
    expect(code(await f.set('s0000', 5))).toBe('ok');
    const row = await f.k.storage.read(tx => tx.records.get(f.principal, locationSettingRepo.type, f.principal));
    expect((row?.data as { changeTimes: unknown[] }).changeTimes).toHaveLength(3);
  });

  it('does not clear the change window when the clock moves backward', async () => {
    const f = fixture(); await f.set(); f.k.clock.advance(1000); await f.set('c2b2q', 1);
    f.k.clock.advance(1000); await f.set('dr5ru', 2); f.k.clock.set('2026-11-04T09:00:00.000Z');
    expect(code(await f.set('s0000', 3))).toBe('DISCOVERY_HOME_CHANGE_LIMIT');
    expect((await f.get(true)).homeCell5).toBe('dr5ru');
  });

  it('clears once with revision checks and never exports an old home in its new event', async () => {
    const f = fixture(); expect(code(await f.k.cmd('discovery.location.clear_home', { expectedRevision: 1 }, f.call))).toBe('NOT_FOUND');
    await f.set(); expect(code(await f.k.cmd('discovery.location.clear_home', { expectedRevision: 2 }, f.call))).toBe('CONFLICT_REVISION');
    const cleared = value<LocationView>(await f.k.cmd('discovery.location.clear_home', { expectedRevision: 1 }, f.call));
    expect(cleared).toEqual({ settingId: cleared.settingId, revision: 2, publicLevel: 'L0' });
    expect(code(await f.k.cmd('discovery.location.clear_home', { expectedRevision: 2 }, f.call))).toBe('ok');
    expect(f.k.events).toHaveLength(2);
  });
});
