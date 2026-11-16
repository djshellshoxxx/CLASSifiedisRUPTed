import { describe, expect, it } from 'vitest';
import { createSystemClock } from '../clock/clock.ts';
import { createLogger, createRingBufferSink } from './logger.ts';
import { createMetricsRegistry } from './metrics.ts';

describe('observability overhead', () => {
  it('TEST-PS-121-09.T12 load: 10 000 redacted log lines and 100 000 metric updates complete in under 1 s', () => {
    const ring = createRingBufferSink(1000);
    const log = createLogger({ sink: ring.sink, clock: createSystemClock() });
    const m = createMetricsRegistry();
    const c = m.counter({ name: 'classrup_test_ops_total', help: 'ops', labels: ['module', 'outcome'] });
    const h = m.histogram({ name: 'classrup_test_op_duration_ms', help: 'd', labels: ['module'] });
    const t = performance.now();
    for (let i = 0; i < 10_000; i++) log.info('op', { correlationId: 'c', module: 'F01.S01.M01', listingId: `l${i}`, email: 'x@y.z', nested: { ip: '10.0.0.1' } });
    for (let i = 0; i < 50_000; i++) {
      c.inc({ module: 'F01.S01.M01', outcome: i % 2 ? 'ok' : 'rejected' });
      h.observe({ module: 'F01.S01.M01' }, i % 400);
    }
    expect(performance.now() - t).toBeLessThan(1000);
    expect(m.value('classrup_test_op_duration_ms', { module: 'F01.S01.M01' })).toBe(50_000);
  });
});
