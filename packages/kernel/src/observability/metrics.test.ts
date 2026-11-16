import { describe, expect, it } from 'vitest';
import { createMetricsRegistry, DEFAULT_MS_BUCKETS } from './metrics.ts';

describe('metrics registry (CTR-OBS-001 OBS-2/OBS-3)', () => {
  it('TEST-PS-121-09.T05 names and labels are validated; identical re-registration is idempotent, conflicting throws', () => {
    const m = createMetricsRegistry();
    expect(() => m.counter({ name: 'offers_total', help: 'x' })).toThrow('classrup_');
    expect(() => m.counter({ name: 'classrup_total', help: 'x' })).toThrow();
    expect(() => m.counter({ name: 'classrup_bazaar_offers_count', help: 'x' })).toThrow();
    expect(() => m.counter({ name: 'classrup_bazaar_offers_total', help: 'x', labels: ['userId' as never] })).toThrow('label userId not allowed');
    const a = m.counter({ name: 'classrup_bazaar_offers_total', help: 'Offers.', labels: ['outcome'] });
    const b = m.counter({ name: 'classrup_bazaar_offers_total', help: 'Offers.', labels: ['outcome'] });
    a.inc({ outcome: 'made' });
    b.inc({ outcome: 'made' });
    expect(m.value('classrup_bazaar_offers_total', { outcome: 'made' })).toBe(2);
    expect(() => m.gauge({ name: 'classrup_bazaar_offers_total', help: 'x' })).toThrow('different definition');
    expect(() => a.inc({ tenant: 't' })).toThrow('unexpected label');
    expect(() => a.inc({}, -1)).toThrow();
    expect(() => m.histogram({ name: 'classrup_x_y_ms', help: 'x', buckets: [5, 5] })).toThrow('buckets');
  });

  it('TEST-PS-121-09.T06 series per metric are capped and dropped combinations are counted', () => {
    const m = createMetricsRegistry({ maxSeriesPerMetric: 2 });
    const c = m.counter({ name: 'classrup_test_hits_total', help: 'h', labels: ['tenant'] });
    for (const t of ['a', 'b', 'c', 'd']) c.inc({ tenant: t });
    expect(m.value('classrup_test_hits_total', { tenant: 'c' })).toBeUndefined();
    expect(m.value('classrup_metrics_dropped_series_total', { module: 'classrup_test_hits_total' })).toBe(2);
  });

  it('TEST-PS-121-09.T07 Prometheus text: HELP/TYPE, sorted series, escaping and cumulative histogram buckets', () => {
    const m = createMetricsRegistry();
    m.counter({ name: 'classrup_bazaar_offers_total', help: 'Offers by outcome.\nSecond line', labels: ['outcome', 'code'] }).inc({ outcome: 'made', code: 'a"b\\c' }, 3);
    m.gauge({ name: 'classrup_outbox_lag_ms', help: 'Lag.', labels: ['module'] }).set({ module: 'F01.S04.M01' }, 42);
    const h = m.histogram({ name: 'classrup_command_duration_ms', help: 'Duration.', labels: ['module'], buckets: [10, 100] });
    for (const v of [5, 50, 500]) h.observe({ module: 'm' }, v);
    expect(m.render()).toBe(
      [
        '# HELP classrup_bazaar_offers_total Offers by outcome.\\nSecond line',
        '# TYPE classrup_bazaar_offers_total counter',
        'classrup_bazaar_offers_total{outcome="made",code="a\\"b\\\\c"} 3',
        '# HELP classrup_command_duration_ms Duration.',
        '# TYPE classrup_command_duration_ms histogram',
        'classrup_command_duration_ms_bucket{module="m",le="10"} 1',
        'classrup_command_duration_ms_bucket{module="m",le="100"} 2',
        'classrup_command_duration_ms_bucket{module="m",le="+Inf"} 3',
        'classrup_command_duration_ms_sum{module="m"} 555',
        'classrup_command_duration_ms_count{module="m"} 3',
        '# HELP classrup_metrics_dropped_series_total Label combinations dropped by the per-metric series cap.',
        '# TYPE classrup_metrics_dropped_series_total counter',
        '# HELP classrup_outbox_lag_ms Lag.',
        '# TYPE classrup_outbox_lag_ms gauge',
        'classrup_outbox_lag_ms{module="F01.S04.M01"} 42',
        '',
      ].join('\n'),
    );
    expect(DEFAULT_MS_BUCKETS).toEqual(expect.arrayContaining([150, 300]));
  });
});
