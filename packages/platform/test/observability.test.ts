import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DAY, HOUR, ManualClock, MINUTE, notFound } from '@classrup/kernel';
import {
  errorBudget, escapeLabelValue, HealthRegistry, JsonLogger, MetricsRegistry, sanitizeMetricName, SloTracker,
} from '../src/index';
import { admin, anonymous, errorCode, harness, member, operator, support } from './helpers';

const START = Date.UTC(2026, 5, 1);

describe('structured logger', () => {
  const make = (minLevel?: 'debug' | 'info' | 'warn' | 'error') => {
    const lines: string[] = [];
    const clock = new ManualClock(START);
    const logger = new JsonLogger({ sink: (l) => lines.push(l), clock, ...(minLevel ? { minLevel } : {}), base: { service: 'relay' } });
    return { lines, logger, clock };
  };

  it('writes one JSON object per line with timestamp, level and base fields', () => {
    const { lines, logger } = make();
    logger.log('info', 'started', { port: 8080 });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string)).toEqual({ ts: '2026-06-01T00:00:00.000Z', level: 'info', msg: 'started', service: 'relay', port: 8080 });
  });

  it('redacts private fields at any depth and never lets fields override reserved keys', () => {
    const { lines, logger } = make();
    logger.log('warn', 'login', { token: 'abc', nested: { address: '1 Main St', lat: 1.5, ok: 'yes' }, level: 'debug', msg: 'spoofed', ts: 'x' });
    const out = JSON.parse(lines[0] as string);
    expect(out.token).toBe('[REDACTED]');
    expect(out.nested).toEqual({ address: '[REDACTED]', lat: '[REDACTED]', ok: 'yes' });
    expect([out.level, out.msg]).toEqual(['warn', 'login']);
    expect(lines[0]).not.toContain('1 Main St');
  });

  it('applies the level threshold and merges child fields', () => {
    const { lines, logger } = make('warn');
    logger.log('info', 'dropped');
    logger.child({ requestId: 'r1' }).log('error', 'kept', { id: 7n });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string)).toMatchObject({ requestId: 'r1', service: 'relay', id: '7' });
  });

  it('never throws on unserializable fields', () => {
    const { lines, logger } = make();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => logger.log('info', 'odd', { value: Symbol('x'), cyclic: { a: () => 1 } })).not.toThrow();
    expect(lines).toHaveLength(1);
  });
});

describe('metrics', () => {
  it('accumulates counters and gauges per label set and sanitizes names', () => {
    const m = new MetricsRegistry();
    m.increment('command.ok', 1, { command: 'a.b.c' });
    m.increment('command.ok', 2, { command: 'a.b.c' });
    m.increment('command.ok', 1, { command: 'x.y.z' });
    m.gauge('queue.depth', 5);
    m.gauge('queue.depth', 3);
    expect(m.value('command.ok', { command: 'a.b.c' })).toBe(3);
    expect(m.value('queue.depth')).toBe(3);
    expect(sanitizeMetricName('9a.b-c')).toBe('_9a_b_c');
  });

  it('renders Prometheus text with cumulative histogram buckets and escaped labels', () => {
    const m = new MetricsRegistry({ buckets: [10, 100] });
    m.increment('hits', 2, { path: 'a"b\\c\nd' });
    m.observe('latency_ms', 5);
    m.observe('latency_ms', 50);
    m.observe('latency_ms', 500);
    const text = m.render();
    expect(text).toContain('# TYPE classrup_hits_total counter');
    expect(text).toContain('classrup_hits_total{path="a\\"b\\\\c\\nd"} 2');
    expect(text).toContain('classrup_latency_ms_bucket{le="10"} 1');
    expect(text).toContain('classrup_latency_ms_bucket{le="100"} 2');
    expect(text).toContain('classrup_latency_ms_bucket{le="+Inf"} 3');
    expect(text).toContain('classrup_latency_ms_sum 555');
    expect(text).toContain('classrup_latency_ms_count 3');
    expect(text.endsWith('\n')).toBe(true);
    expect(escapeLabelValue('"\\\n')).toBe('\\"\\\\\\n');
  });

  it('drops invalid samples, kind clashes and series beyond the cardinality cap instead of throwing', () => {
    const m = new MetricsRegistry({ maxSeriesPerMetric: 2 });
    m.increment('c', -1);
    m.increment('c', Number.NaN);
    m.observe('h', Number.POSITIVE_INFINITY);
    m.increment('x');
    m.observe('x', 1);
    for (const id of ['1', '2', '3']) m.increment('many', 1, { id });
    expect(m.droppedSamples).toBe(5);
    expect(m.render()).toContain('classrup_metrics_dropped_samples_total 5');
    expect(m.value('many', { id: '3' })).toBe(0);
  });

  it('property: histogram buckets are cumulative, +Inf equals count and sum matches', () => {
    fc.assert(
      fc.property(fc.array(fc.double({ min: 0, max: 20_000, noNaN: true }), { maxLength: 60 }), (values) => {
        const m = new MetricsRegistry();
        for (const v of values) m.observe('d', v);
        const lines = m.render().split('\n').filter((l) => l.startsWith('classrup_d_bucket'));
        const counts = lines.map((l) => Number(l.split(' ')[1]));
        const sorted = counts.every((c, i) => i === 0 || c >= (counts[i - 1] as number));
        return values.length === 0 ? lines.length === 0 : sorted && counts[counts.length - 1] === values.length && m.histogram('d')?.count === values.length;
      }),
    );
  });

  it('is usable as the kernel Metrics port during command execution', () => {
    const metrics = new MetricsRegistry();
    const h = harness({ metrics });
    const deps = { ...h.deps, metrics };
    expect(deps.metrics).toBe(metrics);
    expect(() => h.call('platform.metrics.export', operator())).not.toThrow();
  });
});

describe('health checks', () => {
  it('separates liveness from readiness and degrades on non-critical failures', () => {
    const clock = new ManualClock(START);
    const health = new HealthRegistry(clock);
    health.register({ name: 'process', kind: 'liveness', critical: true, timeoutMs: 100, run: () => ({ ok: true }) });
    health.register({ name: 'storage', kind: 'readiness', critical: true, timeoutMs: 100, run: () => ({ ok: true }) });
    health.register({ name: 'mailer', kind: 'readiness', critical: false, timeoutMs: 100, run: () => ({ ok: false, message: 'queue backlog' }) });
    expect(health.run('liveness')).toMatchObject({ status: 'pass', checks: [{ name: 'process' }] });
    const ready = health.run('readiness');
    expect(ready.status).toBe('warn');
    expect(ready.checks.map((c) => c.status)).toEqual(['pass', 'pass', 'warn']);
  });

  it('fails on throw (no message leak) and on timeout measured with the injected clock', () => {
    const clock = new ManualClock(START);
    const health = new HealthRegistry(clock);
    health.register({
      name: 'db',
      kind: 'readiness',
      critical: true,
      timeoutMs: 50,
      run: () => {
        throw notFound('DB.GONE', 'connection string secret=hunter2');
      },
    });
    health.register({
      name: 'slow',
      kind: 'readiness',
      critical: false,
      timeoutMs: 50,
      run: () => {
        clock.advance(80);
        return { ok: true };
      },
    });
    const r = health.run('readiness');
    expect(r.status).toBe('fail');
    expect(r.checks[0]).toMatchObject({ name: 'db', status: 'fail', message: 'DB.GONE' });
    expect(JSON.stringify(r)).not.toContain('hunter2');
    expect(r.checks[1]).toMatchObject({ name: 'slow', status: 'warn', durationMs: 80, message: 'timeout after 50ms' });
  });

  it('validates registrations', () => {
    const health = new HealthRegistry(new ManualClock());
    const check = { name: 'a-b', kind: 'liveness' as const, critical: true, timeoutMs: 10, run: () => ({ ok: true }) };
    health.register(check);
    expect(() => health.register(check)).toThrow(/duplicate/);
    expect(() => health.register({ ...check, name: 'Bad Name' })).toThrow(/invalid/);
    expect(() => health.register({ ...check, name: 'zero', timeoutMs: 0 })).toThrow(RangeError);
  });

  it('exposes status publicly and details only to staff', () => {
    const h = harness();
    h.platform.health.register({ name: 'storage', kind: 'readiness', critical: true, timeoutMs: 100, run: () => ({ ok: false, message: 'disk full' }) });
    expect(h.call('platform.health.check', anonymous(), { kind: 'readiness' })).toEqual({ kind: 'readiness', status: 'fail' });
    expect(h.call('platform.health.check', anonymous())).toEqual({ kind: 'readiness', status: 'fail' });
    expect(errorCode(() => h.call('platform.health.report', member()))).toBe('AUTHZ.FORBIDDEN');
    const report = h.call('platform.health.report', support()) as { readiness: { checks: { message: string }[] }; slos: unknown[] };
    expect(report.readiness.checks[0]?.message).toBe('disk full');
    expect(errorCode(() => h.call('platform.metrics.export', admin()))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.metrics.export', operator()))).toBe('METRICS.NOT_CONFIGURED');
  });
});

describe('SLO error budget', () => {
  it('computes SLI, burn rate and exhaustion', () => {
    const half = errorBudget(0.99, 995, 1000);
    expect(half.allowedBad).toBeCloseTo(10);
    expect(half.actualBad).toBe(5);
    expect(half.budgetRemaining).toBeCloseTo(0.5);
    expect(half.exhausted).toBe(false);
    expect(errorBudget(0.99, 980, 1000)).toMatchObject({ exhausted: true });
    expect(errorBudget(0.99, 0, 0)).toMatchObject({ sli: 1, budgetRemaining: 1, exhausted: false });
    expect(() => errorBudget(1, 1, 1)).toThrow(RangeError);
    expect(() => errorBudget(0.9, 5, 3)).toThrow(RangeError);
  });

  it('property: remaining budget falls monotonically as bad events increase', () => {
    fc.assert(
      fc.property(fc.double({ min: 0.5, max: 0.9999, noNaN: true }), fc.integer({ min: 1, max: 10_000 }), fc.nat(10_000), fc.nat(10_000), (objective, total, a, b) => {
        const [lo, hi] = [Math.min(a, b, total), Math.min(Math.max(a, b), total)];
        const s1 = errorBudget(objective, total - lo, total);
        const s2 = errorBudget(objective, total - hi, total);
        return s2.budgetRemaining <= s1.budgetRemaining + 1e-9 && (!s1.exhausted || s2.exhausted);
      }),
    );
  });

  it('tracks events in a sliding window with the injected clock and raises burn alerts', () => {
    const clock = new ManualClock(START);
    const slo = new SloTracker({ name: 'availability', objective: 0.99, windowMs: 2 * HOUR }, clock);
    for (let i = 0; i < 80; i++) slo.record(true);
    for (let i = 0; i < 20; i++) slo.record(false);
    expect(slo.status()).toMatchObject({ name: 'availability', sli: 0.8, exhausted: true });
    expect(slo.alerts().length).toBe(2);
    clock.advance(3 * HOUR);
    expect(slo.counts()).toEqual({ good: 0, total: 0 });
    expect(slo.status()).toMatchObject({ budgetRemaining: 1, exhausted: false });
    expect(slo.alerts()).toEqual([]);
    clock.advance(MINUTE);
    slo.record(true);
    expect(slo.counts(30 * MINUTE)).toEqual({ good: 1, total: 1 });
    expect(() => new SloTracker({ name: 'x', objective: 2, windowMs: DAY }, clock)).toThrow(RangeError);
  });
});
