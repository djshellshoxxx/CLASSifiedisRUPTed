import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSystemClock } from '../clock/clock.ts';
import { createUuidV7Generator } from '../ids/uuidv7.ts';
import { createMetricsRegistry } from '../observability/metrics.ts';
import { openSqliteStorage } from '../storage/sqlite.ts';
import { sampleDefinitions } from '../testing/sample-module.ts';
import { createBus } from './bus.ts';
import { createRegistry } from './define.ts';
import { allowAllAuthz, createMemoryAudit } from './ports.ts';

describe('bus performance budget (OBS-4)', () => {
  it('TEST-PS-117-09.T22 load: 500 sequential idempotent commands on SQLite WAL complete with p95 ≤ 50 ms', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'classrup-perf-'));
    const storage = openSqliteStorage({ path: join(dir, 'perf.db') });
    const ids = createUuidV7Generator();
    const metrics = createMetricsRegistry();
    const bus = createBus({ registry: createRegistry().add(...sampleDefinitions().all), storage, clock: createSystemClock(), ids, authz: allowAllAuthz, audit: createMemoryAudit(), metrics });
    const actor = { kind: 'user' as const, id: 'did:key:z6MkPerf', roles: ['member'] };
    const samples: number[] = [];
    for (let i = 0; i < 500; i++) {
      const t = performance.now();
      const r = await bus.dispatch({ actor, tenantId: 'perf' }, 'sample.item.create', { itemId: ids.next(), name: `n${i}` }, { idempotencyKey: ids.next() });
      samples.push(performance.now() - t);
      expect(r.ok).toBe(true);
    }
    samples.sort((a, b) => a - b);
    expect(samples[Math.floor(samples.length * 0.95)]).toBeLessThanOrEqual(50);
    expect(metrics.value('classrup_command_duration_ms', { module: 'F99.S01.M01', outcome: 'ok' })).toBe(500);
    await storage.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
