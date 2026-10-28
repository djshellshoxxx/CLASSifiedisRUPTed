import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { ErrorCategory } from '@classrup/kernel';
import { createIdGenerator, DAY, ManualClock, seededRandom } from '@classrup/kernel';
import type { QueueItem, QueueStorage, SendRequest, SendResult, WebManifest } from '../src/index';
import {
  backoffDelay, buildManifest, cacheName, cachesToPurge, canShowInstallPrompt, cooldownRemainingMs, DEFAULT_CACHE_RULES, DEFAULT_ICONS, INSTALL_COOLDOWN_MS,
  initialInstallState, isCacheableResponse, MAX_ATTEMPTS, MemoryQueueStorage, OfflineQueue, reduceInstall, resolveCachePolicy, validateManifest,
} from '../src/index';
import { anonymous, asyncErrorCode, errorCode, harness, operator, TENANT } from './helpers';

const START = Date.UTC(2026, 5, 1);
const ok: SendResult = { ok: true };
const fail = (category: ErrorCategory, code = 'X.FAIL', extra: { retryAfterMs?: number } = {}): SendResult => ({ ok: false, error: { code, category, message: 'm' }, ...extra });

function make(opts: { storage?: QueueStorage; random?: () => number; maxItems?: number; clock?: ManualClock } = {}) {
  const clock = opts.clock ?? new ManualClock(START);
  const storage = opts.storage ?? new MemoryQueueStorage();
  const queue = new OfflineQueue({
    storage, clock, ids: createIdGenerator(clock, seededRandom(3)), random: opts.random ?? (() => 0.5), ...(opts.maxItems ? { maxItems: opts.maxItems } : {}),
  });
  return { queue, clock, storage };
}

const op = 'bazaar.listing.update';
const add = (q: OfflineQueue, aggregateKey: string, input: unknown = { n: 1 }) => q.enqueue({ op, input, aggregateKey });
const statuses = async (q: OfflineQueue): Promise<string[]> => (await q.list()).map((i) => i.status);

describe('offline queue: ordering and concurrency', () => {
  it('acknowledges in FIFO order and never has two items of one aggregate in flight', async () => {
    const { queue } = make();
    for (const [agg, n] of [['A', 1], ['A', 2], ['B', 1], ['A', 3], ['B', 2]] as const) await add(queue, agg, { agg, n });
    const inflight = new Map<string, number>();
    const sent: string[] = [];
    let overlap = 0;
    let crossAggregate = 0;
    const sender = async (req: SendRequest): Promise<SendResult> => {
      const { agg, n } = req.input as { agg: string; n: number };
      inflight.set(agg, (inflight.get(agg) ?? 0) + 1);
      if ((inflight.get(agg) as number) > 1) overlap++;
      if ([...inflight.values()].reduce((a, b) => a + b, 0) > 1) crossAggregate++;
      await Promise.resolve();
      await Promise.resolve();
      inflight.set(agg, (inflight.get(agg) as number) - 1);
      sent.push(`${agg}${n}`);
      return ok;
    };
    const summary = await queue.flush(sender);
    expect(summary).toMatchObject({ attempted: 5, acked: 5, retryScheduled: 0 });
    expect(overlap).toBe(0);
    expect(crossAggregate).toBeGreaterThan(0);
    expect(sent.filter((s) => s.startsWith('A'))).toEqual(['A1', 'A2', 'A3']);
    expect(sent.filter((s) => s.startsWith('B'))).toEqual(['B1', 'B2']);
    expect(await statuses(queue)).toEqual(Array(5).fill('acked'));
  });

  it('concurrent flush calls share one run', async () => {
    const { queue } = make();
    await add(queue, 'A');
    let calls = 0;
    const sender = async (): Promise<SendResult> => {
      calls++;
      return ok;
    };
    const [a, b] = await Promise.all([queue.flush(sender), queue.flush(sender)]);
    expect(a).toBe(b);
    expect(calls).toBe(1);
  });

  it('property: with random transient failures every aggregate is delivered in order, once acknowledged', async () => {
    const plan = fc.array(fc.record({ agg: fc.constantFrom('A', 'B', 'C'), failFirst: fc.boolean() }), { minLength: 1, maxLength: 14 });
    await fc.assert(
      fc.asyncProperty(plan, async (items) => {
        const { queue, clock } = make({ random: () => 0 });
        const failed = new Set<number>();
        for (const [i, it] of items.entries()) await add(queue, it.agg, { i, agg: it.agg });
        const acked: { agg: string; i: number }[] = [];
        const inflight = new Map<string, number>();
        let overlap = false;
        const sender = async (req: SendRequest): Promise<SendResult> => {
          const { i, agg } = req.input as { i: number; agg: string };
          inflight.set(agg, (inflight.get(agg) ?? 0) + 1);
          if ((inflight.get(agg) as number) > 1) overlap = true;
          await Promise.resolve();
          inflight.set(agg, (inflight.get(agg) as number) - 1);
          if (items[i]?.failFirst && !failed.has(i)) {
            failed.add(i);
            return fail('unavailable');
          }
          acked.push({ agg, i });
          return ok;
        };
        for (let round = 0; round < items.length * 2 + 2; round++) {
          await queue.flush(sender);
          clock.advance(10 * 60_000);
        }
        const perAgg = (a: string) => acked.filter((x) => x.agg === a).map((x) => x.i);
        const inOrder = ['A', 'B', 'C'].every((a) => perAgg(a).every((v, k, arr) => k === 0 || v > (arr[k - 1] as number)));
        return !overlap && inOrder && acked.length === items.length && (await statuses(queue)).every((s) => s === 'acked');
      }),
      { numRuns: 40 },
    );
  });
});

describe('offline queue: retries and classification', () => {
  it('keeps one idempotency key across retries and backs off with jitter', async () => {
    const { queue, clock } = make({ random: () => 0.5 });
    const item = await add(queue, 'A');
    const keys: string[] = [];
    const results: SendResult[] = [fail('unavailable'), fail('rate_limited'), ok];
    const sender = async (req: SendRequest): Promise<SendResult> => {
      keys.push(req.idempotencyKey);
      return results.shift() as SendResult;
    };
    expect(await queue.flush(sender)).toMatchObject({ attempted: 1, retryScheduled: 1, nextAttemptAt: START + 500 });
    expect(await queue.flush(sender)).toMatchObject({ attempted: 0 });
    clock.advance(500);
    expect(await queue.flush(sender)).toMatchObject({ retryScheduled: 1, nextAttemptAt: clock.now() + 1000 });
    clock.advance(1000);
    expect(await queue.flush(sender)).toMatchObject({ acked: 1 });
    expect(new Set(keys)).toEqual(new Set([item.idempotencyKey]));
    expect(keys).toHaveLength(3);
    const [done] = await queue.list();
    expect(done).toMatchObject({ status: 'acked', attempts: 2 });
    expect(done?.lastError).toBeUndefined();
  });

  it('honours retryAfterMs and treats a thrown sender as a network failure', async () => {
    const { queue, clock } = make({ random: () => 0 });
    await add(queue, 'A');
    await queue.flush(async () => fail('rate_limited', 'RATE.LIMITED', { retryAfterMs: 30_000 }));
    expect((await queue.list())[0]?.nextAttemptAt).toBe(START + 30_000);
    clock.advance(30_000);
    await queue.flush(() => Promise.reject(new Error('offline')));
    expect((await queue.list())[0]).toMatchObject({ status: 'pending', attempts: 2, lastError: { code: 'OFFLINE.NETWORK' } });
  });

  it('gives up after the maximum number of attempts', async () => {
    const { queue } = make({ random: () => 0 });
    await add(queue, 'A');
    await add(queue, 'A', { n: 2 });
    for (let i = 0; i < MAX_ATTEMPTS + 2; i++) await queue.flush(async () => fail('unavailable'));
    const [first, second] = await queue.list();
    expect(MAX_ATTEMPTS).toBe(8);
    expect(first).toMatchObject({ status: 'failed_permanent', attempts: 8, lastError: { code: 'OFFLINE.MAX_ATTEMPTS' } });
    expect(second?.status).toBe('pending');
  });

  it.each([
    ['validation', 'failed_permanent'],
    ['forbidden', 'failed_permanent'],
    ['not_found', 'failed_permanent'],
    ['precondition', 'failed_permanent'],
    ['disabled', 'failed_permanent'],
    ['internal', 'failed_permanent'],
    ['conflict', 'conflict'],
    ['unavailable', 'pending'],
    ['rate_limited', 'pending'],
  ] as const)('classifies %s as %s', async (category, expected) => {
    const { queue } = make();
    await add(queue, 'A');
    await queue.flush(async () => fail(category));
    expect((await queue.list())[0]?.status).toBe(expected);
  });

  it('a conflict is surfaced, blocks its aggregate and is never overwritten automatically', async () => {
    const { queue, clock } = make();
    const first = await add(queue, 'A', { v: 1 });
    await add(queue, 'A', { v: 2 });
    await add(queue, 'B', { v: 9 });
    const seen: unknown[] = [];
    const sender = async (req: SendRequest): Promise<SendResult> => {
      seen.push(req.input);
      return (req.input as { v: number }).v === 1 ? fail('conflict', 'STORE.VERSION_CONFLICT') : ok;
    };
    expect(await queue.flush(sender)).toMatchObject({ conflicts: 1, acked: 1 });
    clock.advance(DAY);
    await queue.flush(sender);
    expect(seen).toEqual([{ v: 1 }, { v: 9 }]);
    expect(await queue.uxState(true)).toBe('needs_attention');
    expect(await statuses(queue)).toEqual(['conflict', 'pending', 'acked']);

    await queue.revise(first.id, { v: 1, expectedVersion: 5 });
    const revised = (await queue.list())[0] as QueueItem;
    expect(revised.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(revised.status).toBe('pending');
    await queue.flush(async () => ok);
    expect(await statuses(queue)).toEqual(['acked', 'acked', 'acked']);
  });

  it('retry keeps the key; discard unblocks the aggregate; invalid actions are refused', async () => {
    const { queue } = make();
    const a = await add(queue, 'A');
    await add(queue, 'A', { n: 2 });
    await queue.flush(async () => fail('validation', 'VALIDATION.INVALID_INPUT'));
    expect(await asyncErrorCode(() => queue.discard('oq_missing'))).toBe('OFFLINE.NOT_DISCARDABLE');
    await queue.retry(a.id);
    expect((await queue.list())[0]).toMatchObject({ status: 'pending', attempts: 0, idempotencyKey: a.idempotencyKey });
    expect(await asyncErrorCode(() => queue.retry(a.id))).toBe('OFFLINE.INVALID_STATE');
    await queue.flush(async () => fail('forbidden'));
    await queue.discard(a.id);
    await queue.flush(async () => ok);
    expect(await statuses(queue)).toEqual(['acked']);
    const acked = (await queue.list())[0]?.id as string;
    expect(await asyncErrorCode(() => queue.discard(acked))).toBe('OFFLINE.NOT_DISCARDABLE');
  });

  it('pauses on an expired session without burning attempts and resumes after sign-in', async () => {
    const { queue } = make();
    await add(queue, 'A');
    await add(queue, 'B');
    const summary = await queue.flush(async () => fail('unauthenticated', 'AUTH.REQUIRED'));
    expect(summary.authRequired).toBe(true);
    expect((await queue.list()).map((i) => i.attempts)).toEqual([0, 0]);
    expect(await queue.uxState(true)).toBe('needs_attention');
    expect((await queue.flush(async () => ok)).attempted).toBe(0);
    queue.resumeAfterAuth();
    expect((await queue.flush(async () => ok)).acked).toBe(2);
    expect(await queue.uxState(true)).toBe('online');
  });
});

describe('offline queue: persistence and UX', () => {
  it('survives reload and resets requests that were in flight when the page died', async () => {
    const { queue, storage, clock } = make();
    const a = await add(queue, 'A');
    await add(queue, 'A', { n: 2 });
    void queue.flush(() => new Promise<SendResult>(() => undefined));
    await new Promise((r) => setTimeout(r, 0));
    expect((await storage.load()).map((i) => i.status)).toEqual(['sending', 'pending']);

    const reloaded = new OfflineQueue({ storage, clock, ids: createIdGenerator(clock, seededRandom(9)), random: () => 0.5 });
    expect((await reloaded.list()).map((i) => i.status)).toEqual(['pending', 'pending']);
    const keys: string[] = [];
    await reloaded.flush(async (r) => {
      keys.push(r.idempotencyKey);
      return ok;
    });
    expect(keys[0]).toBe(a.idempotencyKey);
    const third = await reloaded.enqueue({ op, input: {}, aggregateKey: 'A' });
    expect(third.seq).toBe(3);
  });

  it('validates input at enqueue and enforces the queue size', async () => {
    const { queue } = make({ maxItems: 2 });
    expect(await asyncErrorCode(() => queue.enqueue({ op: 'bad op', input: {}, aggregateKey: 'A' }))).toBe('OFFLINE.INVALID_OP');
    expect(await asyncErrorCode(() => queue.enqueue({ op, input: { n: 1n }, aggregateKey: 'A' }))).toBe('OFFLINE.INPUT_NOT_JSON');
    expect(await asyncErrorCode(() => queue.enqueue({ op, input: {}, aggregateKey: '' }))).toBe('OFFLINE.INVALID_AGGREGATE');
    await add(queue, 'A');
    await add(queue, 'A');
    expect(await asyncErrorCode(() => add(queue, 'A'))).toBe('OFFLINE.QUEUE_FULL');
  });

  it('collapses repeated actions that share an idempotency key', async () => {
    const { queue } = make();
    const one = await queue.enqueue({ op, input: { n: 1 }, aggregateKey: 'A', idempotencyKey: 'user-tap-0001' });
    const two = await queue.enqueue({ op, input: { n: 1 }, aggregateKey: 'A', idempotencyKey: 'user-tap-0001' });
    expect(two.id).toBe(one.id);
    expect(await queue.list()).toHaveLength(1);
  });

  it('refuses new work when it cannot be saved and surfaces later save failures', async () => {
    let failing = false;
    const memory = new MemoryQueueStorage();
    const storage: QueueStorage = {
      load: () => memory.load(),
      save: (items) => (failing ? Promise.reject(new Error('quota')) : memory.save(items)),
    };
    const { queue } = make({ storage });
    failing = true;
    expect(await asyncErrorCode(() => add(queue, 'A'))).toBe('OFFLINE.STORAGE_FAILED');
    expect(await queue.list()).toEqual([]);
    failing = false;
    await add(queue, 'A');
    failing = true;
    await queue.flush(async () => ok);
    expect((await queue.stats()).persistenceFailed).toBe(true);
    expect(await queue.uxState(true)).toBe('needs_attention');
    failing = false;
    expect(await queue.purgeAcked()).toBe(1);
    expect((await queue.stats()).persistenceFailed).toBe(false);
  });

  it('reports offline, syncing and online states and clears everything on logout', async () => {
    const { queue } = make();
    expect(await queue.uxState(true)).toBe('online');
    expect(await queue.uxState(false)).toBe('offline');
    await add(queue, 'A');
    expect(await queue.uxState(true)).toBe('syncing');
    expect(await queue.uxState(false)).toBe('offline');
    await queue.clear();
    expect(await queue.list()).toEqual([]);
    expect(await queue.uxState(true)).toBe('online');
  });

  it('property: backoff delay stays within [0, min(cap, base * 2^(n-1))]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), fc.double({ min: 0, max: 0.999999, noNaN: true }), (attempt, r) => {
        const d = backoffDelay(attempt, () => r);
        return d >= 0 && d <= Math.min(300_000, 1000 * 2 ** (attempt - 1));
      }),
    );
  });
});

describe('cache policy', () => {
  const req = (path: string, extra: Partial<Parameters<typeof resolveCachePolicy>[0]> = {}) => resolveCachePolicy({ method: 'GET', path, hasCredentials: false, ...extra });

  it('maps static assets, shell and public data to strategies and keeps the private API network-only', () => {
    expect(req('/')).toMatchObject({ strategy: 'network_first', persist: true, cacheKind: 'shell' });
    expect(req('/assets/app.3f2a.js')).toMatchObject({ strategy: 'cache_first', cacheKind: 'assets', maxAgeSeconds: 31_536_000 });
    expect(req('/locales/de.json')).toMatchObject({ strategy: 'stale_while_revalidate' });
    expect(req('/v1/public/regions?x=1')).toMatchObject({ strategy: 'stale_while_revalidate', cacheKind: 'public', persist: true });
    expect(req('/v1/ops/bazaar.listing.get')).toMatchObject({ strategy: 'network_only', persist: false, ruleId: 'private-api' });
    expect(req('/v1/anything')).toMatchObject({ strategy: 'network_only', persist: false });
  });

  it('never persists writes, credentialed requests or unknown paths and falls back to the shell for navigations', () => {
    expect(resolveCachePolicy({ method: 'POST', path: '/assets/x.js', hasCredentials: false })).toMatchObject({ strategy: 'network_only', persist: false });
    expect(req('/assets/x.js', { hasCredentials: true })).toMatchObject({ strategy: 'network_only', persist: false, ruleId: 'credentials' });
    expect(req('/something-else')).toMatchObject({ strategy: 'network_only', persist: false, ruleId: 'default' });
    expect(req('/listing/lst_1', { navigation: true })).toMatchObject({ strategy: 'network_first', persist: false, offlineFallback: '/index.html' });
  });

  it('property: private API paths, writes and credentials are never persisted', () => {
    fc.assert(
      fc.property(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'get'), fc.string({ maxLength: 20 }), fc.boolean(), fc.boolean(), (method, tail, hasCredentials, navigation) => {
        const path = `/v1/ops/${tail.replace(/\?/g, '')}`;
        const decision = resolveCachePolicy({ method, path, hasCredentials, navigation });
        return !decision.persist && decision.strategy === 'network_only';
      }),
    );
    fc.assert(
      fc.property(fc.constantFrom(...DEFAULT_CACHE_RULES.map((r) => r.pattern.replace('*', 'x'))), fc.constantFrom('POST', 'PATCH'), (path, method) => !resolveCachePolicy({ method, path, hasCredentials: false }).persist),
    );
  });

  it('refuses to store sensitive or opaque responses', () => {
    const base = { status: 200, hasSetCookie: false };
    expect(isCacheableResponse(base)).toBe(true);
    expect(isCacheableResponse({ ...base, cacheControl: 'public, max-age=60' })).toBe(true);
    expect(isCacheableResponse({ ...base, cacheControl: 'no-store' })).toBe(false);
    expect(isCacheableResponse({ ...base, cacheControl: 'max-age=60, Private' })).toBe(false);
    expect(isCacheableResponse({ ...base, hasSetCookie: true })).toBe(false);
    expect(isCacheableResponse({ ...base, vary: '*' })).toBe(false);
    expect(isCacheableResponse({ ...base, type: 'opaque' })).toBe(false);
    expect(isCacheableResponse({ status: 500, hasSetCookie: false })).toBe(false);
  });

  it('versions caches and purges stale ones on activation and user data on logout', () => {
    const existing = ['classrup-shell-v1', 'classrup-assets-v1', 'classrup-public-v1', 'classrup-shell-v2', 'classrup-assets-v2', 'classrup-public-v2', 'workbox-other', 'classrup-misc-v2'];
    expect(cacheName('shell', '7')).toBe('classrup-shell-v7');
    expect(() => cacheName('shell', 'bad version')).toThrow(TypeError);
    expect(cachesToPurge(existing, '2', 'activate')).toEqual(['classrup-shell-v1', 'classrup-assets-v1', 'classrup-public-v1', 'classrup-misc-v2']);
    expect(cachesToPurge(existing, '2', 'logout')).toEqual(['classrup-shell-v1', 'classrup-assets-v1', 'classrup-public-v1', 'classrup-public-v2', 'classrup-misc-v2']);
  });
});

describe('web app manifest and install prompt', () => {
  const input = { name: 'ClassRup Springfield', shortName: 'ClassRup', description: 'Local trade', themeColor: '#0f766e', backgroundColor: '#fff' };
  const manifest = (): WebManifest => buildManifest(input);

  it('builds a valid installable manifest with defaults', () => {
    const m = manifest();
    expect(m).toMatchObject({ display: 'standalone', start_url: '/', scope: '/', lang: 'en', dir: 'ltr', short_name: 'ClassRup' });
    expect(m.icons.some((i) => i.sizes === '192x192')).toBe(true);
    expect(m.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    expect(validateManifest(m)).toEqual([]);
  });

  it('reports every problem without echoing values', () => {
    const bad: WebManifest = { ...manifest(), name: '', short_name: 'WayTooLongName', display: 'browser', scope: 'app', start_url: '/x', theme_color: 'red', lang: 'EN_us', dir: 'up' as 'ltr', icons: [{ src: '//evil.example/i.png', sizes: '48x48', type: 'image/gif' }] };
    const paths = validateManifest(bad).map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'short_name', 'display', 'scope', 'start_url', 'theme_color', 'lang', 'dir', 'icons', 'icons.0.src', 'icons.0.type']));
    expect(validateManifest({ ...manifest(), icons: DEFAULT_ICONS.filter((i) => i.purpose !== 'maskable') }).map((i) => i.message)).toContain('a maskable icon is required');
    expect(validateManifest({ ...manifest(), scope: '/app/', start_url: '/other' }).map((i) => i.path)).toContain('start_url');
    expect(errorCode(() => buildManifest({ ...input, shortName: 'ThirteenChars!' }))).toBe('MANIFEST.INVALID');
    expect(() => buildManifest({ ...input, startUrl: '/app/', scope: '/app/', lang: 'ar', dir: 'rtl' })).not.toThrow();
  });

  it('walks the install-prompt state machine with a 14 day cooldown', () => {
    let s = initialInstallState();
    expect(s.phase).toBe('unsupported');
    expect(canShowInstallPrompt(s)).toBe(false);
    s = reduceInstall(s, { type: 'prompt_available' }, 0);
    expect(canShowInstallPrompt(s)).toBe(true);
    s = reduceInstall(s, { type: 'prompt_shown' }, 1);
    expect(s.phase).toBe('prompted');
    s = reduceInstall(s, { type: 'choice', outcome: 'dismissed' }, 1000);
    expect(s).toEqual({ phase: 'dismissed', dismissedAt: 1000 });
    expect(cooldownRemainingMs(s, 1000 + DAY)).toBe(INSTALL_COOLDOWN_MS - DAY);
    expect(reduceInstall(s, { type: 'prompt_available' }, 1000 + 13 * DAY)).toBe(s);
    s = reduceInstall(s, { type: 'prompt_available' }, 1000 + 14 * DAY);
    expect(s.phase).toBe('available');
    s = reduceInstall(reduceInstall(s, { type: 'prompt_shown' }, 5), { type: 'choice', outcome: 'accepted' }, 6);
    expect(s).toEqual({ phase: 'accepted', acceptedAt: 6 });
    expect(reduceInstall(s, { type: 'installed' }, 9)).toBe(s);
    expect(reduceInstall(s, { type: 'prompt_available' }, 9)).toBe(s);
  });

  it('rejects out-of-order install events and detects installs from any phase', () => {
    const fresh = initialInstallState();
    expect(errorCode(() => reduceInstall(fresh, { type: 'prompt_shown' }, 0))).toBe('INSTALL.INVALID_TRANSITION');
    expect(errorCode(() => reduceInstall(fresh, { type: 'choice', outcome: 'accepted' }, 0))).toBe('INSTALL.INVALID_TRANSITION');
    expect(reduceInstall(fresh, { type: 'installed' }, 4)).toEqual({ phase: 'accepted', acceptedAt: 4 });
    expect(reduceInstall({ phase: 'dismissed', dismissedAt: 1 }, { type: 'installed' }, 4).phase).toBe('accepted');
  });
});

describe('pwa operations', () => {
  it('serves a tenant-aware manifest and the cache policy publicly', () => {
    const h = harness({ cacheVersion: '42' });
    h.call('platform.tenant.create', operator(), {
      id: TENANT, name: 'Springfield Market', defaultCurrency: 'USD', defaultLocale: 'es-MX', jurisdiction: 'MX', limits: {}, operatorAccountId: 'acct_01J00000000000000000000000',
    });
    const m = h.call('platform.pwa.manifest', anonymous()) as WebManifest;
    expect(m).toMatchObject({ name: 'Springfield Market', lang: 'es', short_name: 'ClassRup' });
    const policy = h.call('platform.pwa.cache_policy', anonymous()) as { version: string; rules: unknown[]; caches: string[] };
    expect(policy.version).toBe('42');
    expect(policy.caches).toEqual(['classrup-shell-v42', 'classrup-assets-v42', 'classrup-public-v42']);
    expect(policy.rules).toHaveLength(DEFAULT_CACHE_RULES.length);
    expect((harness().call('platform.pwa.manifest', anonymous()) as WebManifest).name).toBe('ClassRup');
  });
});
