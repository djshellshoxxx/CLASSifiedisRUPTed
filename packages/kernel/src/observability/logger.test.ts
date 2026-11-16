import { describe, expect, it } from 'vitest';
import { createFakeClock } from '../index.ts';
import { createLogger, createRingBufferSink } from '../index.ts';

describe('structured logger (CTR-OBS-001)', () => {
  it('TEST-PS-121-09.T03 JSON lines start with ts, level, msg, then correlationId, module, code, durationMs; child bindings propagate', () => {
    const clock = createFakeClock('2026-11-04T10:15:30.123Z');
    const ring = createRingBufferSink();
    const log = createLogger({ sink: ring.sink, clock }).child({ module: 'F01.S04.M01' }).child({ correlationId: 'c-1' });
    log.info('offer.accepted', { offerId: 'o1', durationMs: 12, code: 'OK', note: 'secret note' });
    const [line] = ring.lines();
    expect(line).toBe('{"ts":"2026-11-04T10:15:30.123Z","level":"info","msg":"offer.accepted","correlationId":"c-1","module":"F01.S04.M01","code":"OK","durationMs":12,"offerId":"o1"}');
  });

  it('TEST-PS-121-09.T04 levels below the threshold are discarded, invalid levels rejected, and a throwing sink never fails the caller', () => {
    const clock = createFakeClock();
    const ring = createRingBufferSink();
    const log = createLogger({ sink: ring.sink, clock, level: 'warn' });
    log.debug('d');
    log.info('i');
    log.warn('w');
    log.error('e');
    expect(ring.records().map((r) => r['level'])).toEqual(['warn', 'error']);
    expect(() => createLogger({ sink: ring.sink, clock, level: 'loud' as never })).toThrow('invalid log level');
    const broken = createLogger({ sink: () => { throw new Error('disk full'); }, clock });
    expect(() => broken.error('x')).not.toThrow();
    broken.child({ module: 'm' }).info('y');
    expect(broken.dropped()).toBe(2);
  });

  it('TEST-PS-121-09.T11 the vault ring buffer is bounded and exports redacted JSON Lines on request only', () => {
    const clock = createFakeClock();
    const ring = createRingBufferSink(3);
    const log = createLogger({ sink: ring.sink, clock });
    for (let i = 0; i < 5; i++) log.info(`m${i}`, { email: 'a@b.c', i });
    expect(ring.records().map((r) => r['msg'])).toEqual(['m2', 'm3', 'm4']);
    const jsonl = ring.exportJsonl();
    expect(jsonl.split('\n').filter(Boolean)).toHaveLength(3);
    expect(jsonl).not.toContain('a@b.c');
    ring.clear();
    expect(ring.exportJsonl()).toBe('');
    expect(() => createRingBufferSink(0)).toThrow();
  });
});
