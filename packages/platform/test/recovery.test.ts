import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { DomainEvent } from '@classrup/kernel';
import { DAY, InMemoryDataStore, ManualClock, MINUTE, conflict } from '@classrup/kernel';
import {
  MemoryCheckpointStore, redeliverOutbox, rebuildProjection, replayEvents, RUNBOOKS, StoreCheckpointStore,
} from '../src/index';
import { admin, errorCode, eventTypes, expectDeclaredEvents, harness, member, support } from './helpers';

const event = (n: number): DomainEvent => ({
  eventId: `evt_${n}`,
  type: 'bazaar.listing.created',
  schemaVersion: 1,
  aggregateType: 'listing',
  aggregateId: `lst_${n}`,
  revision: 1,
  tenantId: 'tnt_default',
  actorId: 'acct_1',
  occurredAt: n,
  correlationId: `cor_${n}`,
  provenance: { origin: 'local' },
  payload: {},
});

const logOf = (n: number): InMemoryDataStore => {
  const store = new InMemoryDataStore();
  store.events.append(Array.from({ length: n }, (_, i) => event(i + 1)));
  return store;
};

describe('event replay', () => {
  it('replays from the checkpoint and resumes where it stopped', () => {
    const store = logOf(10);
    const cp = new MemoryCheckpointStore();
    const seen: number[] = [];
    const first = replayEvents(store.events, (_e, pos) => { if (pos <= 4) seen.push(pos); else throw conflict('X.FAIL', 'boom'); }, cp, { name: 'p' });
    expect(first).toMatchObject({ processed: 4, lastPosition: 4, caughtUp: false, failure: { position: 5, code: 'X.FAIL' } });
    expect(cp.get('p')).toBe(4);
    const rest: number[] = [];
    const second = replayEvents(store.events, (_e, pos) => rest.push(pos), cp, { name: 'p' });
    expect(second).toMatchObject({ processed: 6, lastPosition: 10, caughtUp: true });
    expect(rest).toEqual([5, 6, 7, 8, 9, 10]);
    expect(replayEvents(store.events, () => undefined, cp, { name: 'p' })).toMatchObject({ processed: 0, caughtUp: true });
  });

  it('property: every event is delivered exactly once, in order, for any batch and checkpoint size', () => {
    fc.assert(
      fc.property(fc.nat(60), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 12 }), (n, batchSize, checkpointEvery) => {
        const store = logOf(n);
        const cp = new MemoryCheckpointStore();
        const seen: number[] = [];
        const result = replayEvents(store.events, (_e, pos) => seen.push(pos), cp, { name: 'p', batchSize, checkpointEvery });
        return seen.length === n && seen.every((p, i) => p === i + 1) && cp.get('p') === n && result.caughtUp && result.processed === n;
      }),
    );
  });

  it('outbox redelivery resumes at the failed event with a durable checkpoint', () => {
    const store = logOf(6);
    const cp = new StoreCheckpointStore(store);
    let down = true;
    const delivered: number[] = [];
    const send = (_e: DomainEvent, pos: number): void => {
      if (down && pos === 3) throw new Error('peer unreachable');
      delivered.push(pos);
    };
    expect(redeliverOutbox(store.events, send, cp, 'outbox.fed')).toMatchObject({ processed: 2, failure: { position: 3, code: 'RECOVERY.HANDLER_ERROR' } });
    expect(new StoreCheckpointStore(store).get('outbox.fed')).toBe(2);
    down = false;
    expect(redeliverOutbox(store.events, send, new StoreCheckpointStore(store), 'outbox.fed').caughtUp).toBe(true);
    expect(delivered).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('rebuilds a projection from scratch and fails loudly when replay stops', () => {
    const store = logOf(5);
    const cp = new MemoryCheckpointStore();
    cp.set('proj', 5);
    let state: string[] = ['stale'];
    const projection = { name: 'proj', reset: () => { state = []; }, apply: (e: DomainEvent) => { state.push(e.eventId); } };
    const result = rebuildProjection(store.events, projection, cp);
    expect(state).toEqual(['evt_1', 'evt_2', 'evt_3', 'evt_4', 'evt_5']);
    expect(result.processed).toBe(5);
    const broken = { ...projection, apply: (e: DomainEvent) => { if (e.eventId === 'evt_3') throw new Error('bad'); } };
    expect(errorCode(() => rebuildProjection(store.events, broken, cp))).toBe('RECOVERY.REPLAY_FAILED');
    expect(cp.get('proj')).toBe(2);
  });

  it('is exposed through the platform recovery helpers using the data store log', () => {
    const h = harness();
    h.deps.store.events.append([event(1), event(2)]);
    const seen: string[] = [];
    expect(h.platform.recovery.replay('t', (e) => seen.push(e.eventId)).processed).toBe(2);
    expect(h.platform.recovery.redeliver('t', () => seen.push('again')).processed).toBe(0);
    expect(h.platform.recovery.rebuild({ name: 't', reset: () => seen.splice(0), apply: (e) => seen.push(e.eventId) }).processed).toBe(2);
    expect(seen).toEqual(['evt_1', 'evt_2']);
  });
});

describe('runbooks', () => {
  it('cover relay loss, data corruption and key compromise with unique steps and sane objectives', () => {
    expect(RUNBOOKS.map((r) => r.key).sort()).toEqual(['data_corruption', 'key_compromise', 'relay_loss']);
    for (const r of RUNBOOKS) {
      expect(new Set(r.steps.map((s) => s.id)).size).toBe(r.steps.length);
      expect(r.steps.length).toBeGreaterThanOrEqual(5);
      expect(r.rtoMinutes).toBeGreaterThan(0);
      expect(r.rpoMinutes).toBeGreaterThanOrEqual(0);
      expect(r.steps.every((s) => s.verify.length > 0)).toBe(true);
    }
  });

  it('lists runbooks for staff only', () => {
    const h = harness();
    expect(errorCode(() => h.call('platform.runbook.list', member()))).toBe('AUTHZ.FORBIDDEN');
    expect(h.call('platform.runbook.list', support()) as unknown[]).toHaveLength(3);
  });
});

describe('drills', () => {
  const finishAll = (h: ReturnType<typeof harness>, id: string, key: string, version: number): number => {
    const rb = RUNBOOKS.find((r) => r.key === key);
    let v = version;
    for (const step of rb?.steps ?? []) v = (h.call('platform.drill.complete_step', admin(), { drillId: id, stepId: step.id, expectedVersion: v }) as { version: number }).version;
    return v;
  };

  it('runs a drill from schedule to a passing finish within the RTO', () => {
    const h = harness();
    const a = admin();
    const planned = h.call('platform.drill.schedule', a, { runbookKey: 'relay_loss', scheduledFor: 1 }, 'key-drill-001') as { id: string; version: number; status: string };
    expect(planned).toMatchObject({ status: 'planned', version: 1 });
    expect(h.call('platform.drill.schedule', a, { runbookKey: 'relay_loss', scheduledFor: 1 }, 'key-drill-001')).toEqual(planned);
    const started = h.call('platform.drill.start', a, { drillId: planned.id, expectedVersion: 1 }) as { version: number };
    (h.deps.clock as ManualClock).advance(90 * MINUTE);
    const v = finishAll(h, planned.id, 'relay_loss', started.version);
    const done = h.call('platform.drill.finish', a, { drillId: planned.id, outcome: 'pass', expectedVersion: v }) as { status: string; outcome: string; durationMinutes: number; withinRto: boolean };
    expect(done).toMatchObject({ status: 'completed', outcome: 'pass', durationMinutes: 90, withinRto: true });
    expect(eventTypes(h.deps)[0]).toBe('platform.drill.scheduled');
    expect(eventTypes(h.deps).at(-1)).toBe('platform.drill.completed');
    expectDeclaredEvents(h.deps);
  });

  it('refuses invalid transitions, pending steps, unknown steps, duplicates and stale versions', () => {
    const h = harness();
    const a = admin();
    expect(errorCode(() => h.call('platform.drill.schedule', a, { runbookKey: 'nope', scheduledFor: 1 }))).toBe('DRILL.UNKNOWN_RUNBOOK');
    const d = h.call('platform.drill.schedule', a, { runbookKey: 'key_compromise', scheduledFor: 1 }) as { id: string };
    expect(errorCode(() => h.call('platform.drill.complete_step', a, { drillId: d.id, stepId: 'freeze', expectedVersion: 1 }))).toBe('DRILL.NOT_RUNNING');
    expect(errorCode(() => h.call('platform.drill.finish', a, { drillId: d.id, outcome: 'pass', expectedVersion: 1 }))).toBe('DRILL.INVALID_TRANSITION');
    expect(errorCode(() => h.call('platform.drill.start', a, { drillId: d.id, expectedVersion: 7 }))).toBe('STORE.VERSION_CONFLICT');
    h.call('platform.drill.start', a, { drillId: d.id, expectedVersion: 1 });
    expect(errorCode(() => h.call('platform.drill.start', a, { drillId: d.id, expectedVersion: 2 }))).toBe('DRILL.INVALID_TRANSITION');
    expect(errorCode(() => h.call('platform.drill.complete_step', a, { drillId: d.id, stepId: 'bogus', expectedVersion: 2 }))).toBe('DRILL.UNKNOWN_STEP');
    h.call('platform.drill.complete_step', a, { drillId: d.id, stepId: 'freeze', note: 'done', expectedVersion: 2 });
    expect(errorCode(() => h.call('platform.drill.complete_step', a, { drillId: d.id, stepId: 'freeze', expectedVersion: 3 }))).toBe('DRILL.STEP_DONE');
    expect(errorCode(() => h.call('platform.drill.finish', a, { drillId: d.id, outcome: 'pass', expectedVersion: 3 }))).toBe('DRILL.STEPS_PENDING');
  });

  it('cannot report a pass after overrunning the RTO and requires findings for failures', () => {
    const h = harness();
    const a = admin();
    const d = h.call('platform.drill.schedule', a, { runbookKey: 'key_compromise', scheduledFor: 1 }) as { id: string };
    const s = h.call('platform.drill.start', a, { drillId: d.id, expectedVersion: 1 }) as { version: number };
    (h.deps.clock as ManualClock).advance(3 * 60 * MINUTE);
    const v = finishAll(h, d.id, 'key_compromise', s.version);
    expect(errorCode(() => h.call('platform.drill.finish', a, { drillId: d.id, outcome: 'fail', expectedVersion: v }))).toBe('DRILL.FINDINGS_REQUIRED');
    const done = h.call('platform.drill.finish', a, { drillId: d.id, outcome: 'pass', expectedVersion: v }) as { outcome: string; withinRto: boolean; findings: string[] };
    expect(done).toMatchObject({ outcome: 'fail', withinRto: false });
    expect(done.findings[0]).toContain('RTO exceeded');
  });

  it('aborts and reports overdue runbooks', () => {
    const h = harness();
    const a = admin();
    const clock = h.deps.clock as ManualClock;
    const status = () => h.call('platform.drill.status', support()) as { runbookKey: string; overdue: boolean; lastPassedAt?: number }[];
    expect(status().every((s) => s.overdue)).toBe(true);
    const d = h.call('platform.drill.schedule', a, { runbookKey: 'relay_loss', scheduledFor: 1 }) as { id: string };
    const aborted = h.call('platform.drill.abort', a, { drillId: d.id, reason: 'staff unavailable', expectedVersion: 1 }) as { status: string; abortReason: string };
    expect(aborted).toMatchObject({ status: 'aborted', abortReason: 'staff unavailable' });
    expect(errorCode(() => h.call('platform.drill.start', a, { drillId: d.id, expectedVersion: 2 }))).toBe('DRILL.INVALID_TRANSITION');
    const p = h.call('platform.drill.schedule', a, { runbookKey: 'relay_loss', scheduledFor: 1 }) as { id: string };
    const s = h.call('platform.drill.start', a, { drillId: p.id, expectedVersion: 1 }) as { version: number };
    const v = finishAll(h, p.id, 'relay_loss', s.version);
    h.call('platform.drill.finish', a, { drillId: p.id, outcome: 'pass', expectedVersion: v });
    expect(status().find((x) => x.runbookKey === 'relay_loss')?.overdue).toBe(false);
    clock.advance(181 * DAY);
    expect(status().find((x) => x.runbookKey === 'relay_loss')?.overdue).toBe(true);
  });

  it('enforces authorization and tenant isolation', () => {
    const h = harness();
    const d = h.call('platform.drill.schedule', admin(), { runbookKey: 'relay_loss', scheduledFor: 1 }) as { id: string };
    expect(errorCode(() => h.call('platform.drill.schedule', member(), { runbookKey: 'relay_loss', scheduledFor: 1 }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.drill.start', support(), { drillId: d.id, expectedVersion: 1 }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.drill.start', admin('tnt_other'), { drillId: d.id, expectedVersion: 1 }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.drill.get', admin('tnt_other'), { drillId: d.id }))).toBe('AUTHZ.FORBIDDEN');
    expect(h.call('platform.drill.get', support(), { drillId: d.id })).toMatchObject({ id: d.id });
    expect(errorCode(() => h.call('platform.drill.schedule', admin(), { runbookKey: 'relay_loss', scheduledFor: -1 }))).toBe('VALIDATION.INVALID_INPUT');
  });
});
