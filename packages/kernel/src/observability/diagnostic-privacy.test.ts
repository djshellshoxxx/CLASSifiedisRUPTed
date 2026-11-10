import { describe, expect, it } from 'vitest';
import { createFakeClock } from '../index.ts';
import { createLogger, createRingBufferSink } from './logger.ts';

describe('CTR-OBS-001 diagnostic output privacy regression', () => {
  it('does not export identifying or credential-like data embedded in an unstructured log message', () => {
    const ring = createRingBufferSink();
    const log = createLogger({ sink: ring.sink, clock: createFakeClock() });
    log.warn('contact synthetic-user@example.test from 203.0.113.77 using bearer=synthetic-token-value', { code: 'RETRY', durationMs: 1 });
    const exported = ring.exportJsonl();
    expect(exported).not.toContain('synthetic-user@example.test');
    expect(exported).not.toContain('203.0.113.77');
    expect(exported).not.toContain('synthetic-token-value');
    expect(ring.records()[0]).toMatchObject({ level: 'warn', code: 'RETRY', durationMs: 1 });
  });

  it('does not export unstructured private strings in Error messages or stacks', () => {
    const ring = createRingBufferSink();
    const log = createLogger({ sink: ring.sink, clock: createFakeClock() });
    const error = new Error('contact synthetic-user@example.test; token=synthetic-token-value');
    error.stack = 'Error: token=synthetic-token-value\\n    at synthetic-user@example.test:1:2';
    log.error('sync.pass_failed', { code: 'INTERNAL', error });
    const exported = ring.exportJsonl();
    expect(exported).not.toContain('synthetic-user@example.test');
    expect(exported).not.toContain('synthetic-token-value');
    expect(ring.records()[0]).toMatchObject({ level: 'error', msg: 'sync.pass_failed', code: 'INTERNAL' });
  });
});
