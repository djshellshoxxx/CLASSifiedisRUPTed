import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { ModuleDescriptor } from '@classrup/kernel';
import { InMemoryDataStore, ManualClock } from '@classrup/kernel';
import type { FlagDefinition } from '../src/index';
import { DEFAULT_FLAGS, FlagService, ModuleRegistry, PROTECTED_FLAGS, validateFlagGraph } from '../src/index';
import { ACCT, admin, anonymous, errorCode, expectDeclaredEvents, eventTypes, harness, member, OTHER_TENANT, operator, TENANT } from './helpers';

const def = (key: string, dependsOn: string[] = [], over: Partial<FlagDefinition> = {}): FlagDefinition => ({
  key,
  description: key,
  default: true,
  dependsOn,
  killSwitch: false,
  ...over,
});

const REQUIRED_FLAGS = [
  'bazaar.listings', 'bazaar.listing_types', 'bazaar.inventory', 'bazaar.pricing', 'bazaar.promotion', 'mutiny.trade_proposals',
  'mutiny.cycle_matching', 'mutiny.cycle_execution', 'mutiny.value_balancing', 'services.catalog', 'services.booking', 'auctions.lifecycle',
  'auctions.integrity', 'rentals.catalog', 'rentals.lifecycle', 'discovery.search', 'discovery.geoprivacy', 'discovery.ranking',
  'identity.accounts', 'identity.profiles', 'identity.trust', 'comms.messaging', 'comms.negotiation', 'comms.meetups', 'commerce.payments',
  'commerce.settlement', 'commerce.valuation', 'privacy.data_controls', 'federation.protocol', 'federation.relay_sync', 'federation.interop',
  'moderation.reporting', 'moderation.policy', 'moderation.antifraud', 'notifications.delivery', 'notifications.preferences',
  'governance.policy', 'governance.community', 'platform.operations', 'platform.configuration',
];

describe('flag catalog and graph validation', () => {
  it('ships every required flag, valid and acyclic, with federation opt-in', () => {
    expect(() => validateFlagGraph(DEFAULT_FLAGS)).not.toThrow();
    const keys = new Set(DEFAULT_FLAGS.map((f) => f.key));
    for (const k of REQUIRED_FLAGS) expect(keys.has(k), k).toBe(true);
    for (const f of DEFAULT_FLAGS.filter((d) => d.key.startsWith('federation.'))) expect(f.default).toBe(false);
    expect(DEFAULT_FLAGS.filter((d) => !d.key.startsWith('federation.')).every((d) => d.default)).toBe(true);
  });

  it('rejects cycles, self dependency, unknown dependency, duplicates and bad keys', () => {
    expect(() => validateFlagGraph([def('a.x', ['a.y']), def('a.y', ['a.x'])])).toThrow(/cycle/);
    expect(() => validateFlagGraph([def('a.x', ['a.x'])])).toThrow(/cycle/);
    expect(() => validateFlagGraph([def('a.x', ['a.nope'])])).toThrow(/unknown flag/);
    expect(() => validateFlagGraph([def('a.x'), def('a.x')])).toThrow(/duplicate/);
    expect(() => validateFlagGraph([def('NoDot')])).toThrow(/invalid flag key/);
  });

  it('define() validates the extended graph', () => {
    const flags = new FlagService(new InMemoryDataStore(), [def('a.x')]);
    flags.define(def('a.y', ['a.x']));
    expect(flags.has('a.y')).toBe(true);
    expect(() => flags.define(def('a.z', ['a.missing']))).toThrow(/unknown flag/);
    expect(() => flags.define(def('a.x'))).toThrow(/duplicate/);
  });
});

describe('flag evaluation', () => {
  const build = (): FlagService =>
    new FlagService(new InMemoryDataStore(), [
      def('a.base'),
      def('a.child', ['a.base']),
      def('a.off', [], { default: false }),
      def('a.dead', [], { killSwitch: true }),
      def('platform.configuration'),
    ]);

  it('follows defaults, unknown flags are off, static kill switch wins', () => {
    const f = build();
    expect(f.isEnabled('a.base', TENANT)).toBe(true);
    expect(f.isEnabled('a.off', TENANT)).toBe(false);
    expect(f.isEnabled('a.unknown', TENANT)).toBe(false);
    expect(f.decide('a.dead', TENANT)).toEqual({ enabled: false, reason: 'kill_switch' });
    f.setOverride('a.dead', TENANT, true, 1);
    expect(f.isEnabled('a.dead', TENANT)).toBe(false);
  });

  it('tenant overrides are isolated and the cache is invalidated on change', () => {
    const f = build();
    expect(f.isEnabled('a.off', TENANT)).toBe(false);
    f.setOverride('a.off', TENANT, true, 1);
    expect(f.isEnabled('a.off', TENANT)).toBe(true);
    expect(f.isEnabled('a.off', OTHER_TENANT)).toBe(false);
    f.clearOverride('a.off', TENANT, 2);
    expect(f.isEnabled('a.off', TENANT)).toBe(false);
  });

  it('runtime kill overrides tenant overrides; a disabled dependency disables dependents', () => {
    const f = build();
    f.setOverride('a.base', TENANT, true, 1);
    f.setKilled('a.base', true, 'incident', 2);
    expect(f.decide('a.base', TENANT).reason).toBe('runtime_kill');
    expect(f.decide('a.child', TENANT)).toEqual({ enabled: false, reason: 'dependency_off', via: 'a.base' });
    f.setKilled('a.base', false, '', 3);
    expect(f.isEnabled('a.child', TENANT)).toBe(true);
  });

  it('protects the admin flag and rejects unknown flags and missing overrides', () => {
    const f = build();
    expect(PROTECTED_FLAGS.has('platform.configuration')).toBe(true);
    expect(errorCode(() => f.setOverride('platform.configuration', TENANT, false, 1))).toBe('FLAG.PROTECTED');
    expect(errorCode(() => f.setKilled('platform.configuration', true, 'x', 1))).toBe('FLAG.PROTECTED');
    expect(errorCode(() => f.setOverride('a.nope', TENANT, true, 1))).toBe('FLAG.UNKNOWN');
    expect(errorCode(() => f.clearOverride('a.base', TENANT, 1))).toBe('FLAG.OVERRIDE_NOT_FOUND');
  });

  it('property: an enabled flag always has every dependency enabled and killed flags are never enabled', () => {
    const graph = fc.integer({ min: 2, max: 8 }).chain((n) =>
      fc.tuple(
        fc.array(fc.array(fc.nat({ max: 7 }), { maxLength: 3 }), { minLength: n, maxLength: n }),
        fc.array(fc.boolean(), { minLength: n, maxLength: n }),
        fc.array(fc.option(fc.boolean(), { nil: undefined }), { minLength: n, maxLength: n }),
        fc.array(fc.boolean(), { minLength: n, maxLength: n }),
      ),
    );
    fc.assert(
      fc.property(graph, ([deps, defaults, overrides, killed]) => {
        const defs = deps.map((d, i) => def(`p.f${i}`, [...new Set(d.filter((x) => x < i))].map((x) => `p.f${x}`), { default: defaults[i] as boolean }));
        const f = new FlagService(new InMemoryDataStore(), defs);
        overrides.forEach((o, i) => o !== undefined && f.setOverride(`p.f${i}`, TENANT, o, 1));
        killed.forEach((k, i) => k && f.setKilled(`p.f${i}`, true, 'r', 1));
        return defs.every((d, i) => {
          const on = f.isEnabled(d.key, TENANT);
          return (!on || d.dependsOn.every((x) => f.isEnabled(x, TENANT))) && (!killed[i] || !on);
        });
      }),
    );
  });
});

describe('flag operations', () => {
  it('tenant admin manages own overrides with audit events, idempotently', () => {
    const h = harness();
    const a = admin();
    const first = h.call('platform.flag.set_override', a, { key: 'federation.protocol', tenantId: TENANT, enabled: true }, 'key-flag-0001') as { version: number };
    const replay = h.call('platform.flag.set_override', a, { key: 'federation.protocol', tenantId: TENANT, enabled: true }, 'key-flag-0001');
    expect(replay).toEqual(first);
    expect(h.deps.store.events.lastPosition()).toBe(1);
    expect(h.deps.flags.isEnabled('federation.protocol', TENANT)).toBe(true);
    expect(errorCode(() => h.call('platform.flag.set_override', a, { key: 'federation.protocol', tenantId: TENANT, enabled: false }, 'key-flag-0001'))).toBe(
      'IDEMPOTENCY.KEY_REUSED',
    );
    h.call('platform.flag.clear_override', a, { key: 'federation.protocol', tenantId: TENANT });
    expect(h.deps.flags.isEnabled('federation.protocol', TENANT)).toBe(false);
    expect(eventTypes(h.deps)).toEqual(['platform.flag.override_set', 'platform.flag.override_cleared']);
    expectDeclaredEvents(h.deps);
  });

  it('enforces authorization: other tenants, members, anonymous and kill switch scope', () => {
    const h = harness();
    expect(errorCode(() => h.call('platform.flag.set_override', admin(), { key: 'federation.protocol', tenantId: OTHER_TENANT, enabled: true }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.flag.set_override', member(), { key: 'federation.protocol', tenantId: TENANT, enabled: true }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.flag.list', anonymous(), {}))).toBe('AUTH.REQUIRED');
    expect(errorCode(() => h.call('platform.flag.set_kill', admin(), { key: 'commerce.payments', engaged: true, reason: 'fraud wave' }))).toBe('AUTHZ.FORBIDDEN');
    h.call('platform.flag.set_override', operator(), { key: 'federation.protocol', tenantId: OTHER_TENANT, enabled: true });
    expect(h.deps.flags.isEnabled('federation.protocol', OTHER_TENANT)).toBe(true);
  });

  it('kill switch overrides tenant overrides and reports the reason in the listing', () => {
    const h = harness();
    h.call('platform.flag.set_override', admin(), { key: 'commerce.payments', tenantId: TENANT, enabled: true });
    h.call('platform.flag.set_kill', operator(), { key: 'commerce.payments', engaged: true, reason: 'chain reorg incident' });
    const listing = h.call('platform.flag.list', admin(), {}) as { key: string; enabled: boolean; reason: string; killed: boolean }[];
    const payments = listing.find((f) => f.key === 'commerce.payments');
    const settlement = listing.find((f) => f.key === 'commerce.settlement');
    expect(payments).toMatchObject({ enabled: false, reason: 'runtime_kill', killed: true });
    expect(settlement).toMatchObject({ enabled: false, reason: 'dependency_off' });
    h.call('platform.flag.set_kill', operator(), { key: 'commerce.payments', engaged: false, reason: 'resolved incident' });
    expect(h.deps.flags.isEnabled('commerce.settlement', TENANT)).toBe(true);
    expect(eventTypes(h.deps)).toContain('platform.flag.kill_released');
  });

  it('validates input and detects version conflicts', () => {
    const h = harness();
    expect(errorCode(() => h.call('platform.flag.set_override', admin(), { key: 'Bad', tenantId: TENANT, enabled: true }))).toBe('VALIDATION.INVALID_INPUT');
    expect(errorCode(() => h.call('platform.flag.set_override', admin(), { key: 'bazaar.pricing', tenantId: TENANT, enabled: true, extra: 1 }))).toBe(
      'VALIDATION.INVALID_INPUT',
    );
    h.call('platform.flag.set_override', admin(), { key: 'bazaar.pricing', tenantId: TENANT, enabled: false });
    expect(errorCode(() => h.call('platform.flag.set_override', admin(), { key: 'bazaar.pricing', tenantId: TENANT, enabled: true, expectedVersion: 0 }))).toBe(
      'STORE.VERSION_CONFLICT',
    );
    expect(errorCode(() => h.call('platform.flag.set_override', admin(), { key: 'platform.configuration', tenantId: TENANT, enabled: false }))).toBe('FLAG.PROTECTED');
  });

  it('a disabled flag blocks the command pipeline for that tenant', () => {
    const h = harness();
    h.call('platform.flag.set_override', admin(), { key: 'bazaar.listings', tenantId: TENANT, enabled: false });
    expect(h.deps.flags.isEnabled('bazaar.listings', TENANT)).toBe(false);
    expect(h.deps.flags.isEnabled('bazaar.pricing', TENANT)).toBe(false);
  });
});

describe('module registry', () => {
  const mod = (id: string, flag: string, extra: Partial<ModuleDescriptor> = {}): ModuleDescriptor => ({ id, path: `x/${id}`, flag, summary: id, ...extra });
  const registry = (): { flags: FlagService; reg: ModuleRegistry } => {
    const flags = new FlagService(new InMemoryDataStore());
    return { flags, reg: new ModuleRegistry(flags) };
  };

  it('registers, lists enabled state per tenant and reports dependencies', () => {
    const { flags, reg } = registry();
    reg.register('bazaar', [mod('F01.S01.M01', 'bazaar.listings'), mod('F01.S04.M01', 'bazaar.promotion')]);
    reg.register('commerce', [mod('F09.S01.M01', 'commerce.payments')]);
    flags.setOverride('commerce.payments', OTHER_TENANT, false, 1);
    const listing = reg.list(TENANT);
    expect(listing.map((m) => m.id)).toEqual(['F01.S01.M01', 'F01.S04.M01', 'F09.S01.M01']);
    expect(listing.every((m) => m.enabled)).toBe(true);
    expect(reg.list(OTHER_TENANT).find((m) => m.id === 'F01.S04.M01')?.enabled).toBe(false);
    const report = reg.dependencyReport();
    const promotion = report.modules.find((m) => m.id === 'F01.S04.M01');
    expect(promotion?.requiresFlags).toEqual(['bazaar.listings', 'bazaar.pricing', 'commerce.payments']);
    expect(promotion?.requiresModules).toEqual(['F01.S01.M01', 'F09.S01.M01']);
    expect(report.unusedFlags).toContain('federation.protocol');
    expect(reg.listPublic(TENANT)[0]).toEqual({ id: 'F01.S01.M01', flag: 'bazaar.listings', summary: 'F01.S01.M01', enabled: true });
  });

  it('rejects duplicate ids, unknown flags, bad ids and foreign ownership atomically', () => {
    const { reg } = registry();
    reg.register('bazaar', [mod('F01.S01.M01', 'bazaar.listings', { events: ['bazaar.listing.created'], collections: ['bazaar_listings'] })]);
    expect(() => reg.register('mutiny', [mod('F01.S01.M01', 'mutiny.trade_proposals')])).toThrow(/duplicate/);
    expect(() => reg.register('mutiny', [mod('F02.S01.M01', 'mutiny.nope')])).toThrow(/unknown flag/);
    expect(() => reg.register('mutiny', [mod('bad', 'mutiny.trade_proposals')])).toThrow(/invalid module id/);
    expect(() => reg.register('mutiny', [mod('F02.S01.M01', 'mutiny.trade_proposals', { events: ['bazaar.listing.created'] })])).toThrow(/already owned/);
    expect(() => reg.register('mutiny', [mod('F02.S01.M01', 'mutiny.trade_proposals', { collections: ['bazaar_listings'] })])).toThrow(/already owned/);
    expect(() => reg.register('mutiny', [mod('F02.S01.M01', 'mutiny.trade_proposals', { events: ['Bad'] })])).toThrow(/invalid event/);
    expect(() => reg.register('mutiny', [mod('F02.S01.M02', 'mutiny.trade_proposals'), mod('F02.S01.M01', 'mutiny.nope')])).toThrow();
    expect(reg.get('F02.S01.M02')).toBeUndefined();
    expect(reg.all()).toHaveLength(1);
  });

  it('exposes a public listing without internals and a full report to admins only', () => {
    const h = harness({ moduleSources: { demo: [{ id: 'F99.S01.M01', path: 'x', flag: 'bazaar.listings', summary: 'demo', permissions: ['demo.thing:read'] }] } });
    const pub = h.call('platform.module.list', anonymous()) as Record<string, unknown>[];
    expect(pub.find((m) => m.id === 'F99.S01.M01')).toEqual({ id: 'F99.S01.M01', flag: 'bazaar.listings', summary: 'demo', enabled: true });
    expect(pub).toHaveLength(13);
    expect(errorCode(() => h.call('platform.module.report', member()))).toBe('AUTHZ.FORBIDDEN');
    const report = h.call('platform.module.report', admin()) as { modules: unknown[]; dependencies: { modules: unknown[] } };
    expect(report.modules).toHaveLength(13);
  });
});

describe('tenants', () => {
  const create = {
    name: 'Springfield Market',
    defaultCurrency: 'USD',
    defaultLocale: 'en-US',
    jurisdiction: 'US-IL',
    limits: { 'listings.max_active': 50 },
    operatorAccountId: ACCT,
  };

  it('creates, updates, suspends and reactivates with events and optimistic concurrency', () => {
    const h = harness();
    const op = operator();
    const t = h.call('platform.tenant.create', op, { id: 'tnt_springfield', ...create }, 'key-tenant-01') as { id: string; version: number; status: string };
    expect(t).toMatchObject({ id: 'tnt_springfield', status: 'active', version: 1 });
    expect(h.call('platform.tenant.create', op, { id: 'tnt_springfield', ...create }, 'key-tenant-01')).toEqual(t);
    expect(errorCode(() => h.call('platform.tenant.create', op, { id: 'tnt_springfield', ...create }))).toBe('TENANT.EXISTS');
    const updated = h.call('platform.tenant.update', op, { id: t.id, expectedVersion: 1, defaultCurrency: 'EUR', limits: { 'listings.max_active': 10 } }) as { version: number };
    expect(updated.version).toBe(2);
    expect(errorCode(() => h.call('platform.tenant.update', op, { id: t.id, expectedVersion: 1, name: 'Late' }))).toBe('STORE.VERSION_CONFLICT');
    const suspended = h.call('platform.tenant.suspend', op, { id: t.id, reason: 'abuse report', expectedVersion: 2 }) as { status: string; suspendedReason: string };
    expect(suspended).toMatchObject({ status: 'suspended', suspendedReason: 'abuse report' });
    expect(errorCode(() => h.platform.assertTenantActive(t.id))).toBe('TENANT.SUSPENDED');
    expect(errorCode(() => h.call('platform.tenant.suspend', op, { id: t.id, reason: 'again please', expectedVersion: 3 }))).toBe('TENANT.INVALID_TRANSITION');
    const back = h.call('platform.tenant.reactivate', op, { id: t.id, expectedVersion: 3 }) as Record<string, unknown>;
    expect(back.status).toBe('active');
    expect('suspendedReason' in back).toBe(false);
    expect(h.platform.assertTenantActive(t.id).defaultCurrency).toBe('EUR');
    expect(h.platform.tenants.limit(t.id, 'listings.max_active', 99)).toBe(10);
    expect(h.platform.tenants.limit(t.id, 'other', 99)).toBe(99);
    expect(eventTypes(h.deps)).toEqual(['platform.tenant.created', 'platform.tenant.updated', 'platform.tenant.suspended', 'platform.tenant.reactivated']);
    expectDeclaredEvents(h.deps);
  });

  it('validates input and authorizes: only operators write, tenant admins read their own', () => {
    const h = harness();
    expect(errorCode(() => h.call('platform.tenant.create', operator(), { ...create, defaultCurrency: 'usd' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(errorCode(() => h.call('platform.tenant.create', operator(), { ...create, operatorAccountId: 'acct_bad' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(errorCode(() => h.call('platform.tenant.create', operator(), { ...create, jurisdiction: 'usa' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(errorCode(() => h.call('platform.tenant.create', admin(), create))).toBe('AUTHZ.FORBIDDEN');
    h.call('platform.tenant.create', operator(), { id: TENANT, ...create });
    h.call('platform.tenant.create', operator(), { id: OTHER_TENANT, ...create });
    expect((h.call('platform.tenant.get', admin(), { id: TENANT }) as { id: string }).id).toBe(TENANT);
    expect(errorCode(() => h.call('platform.tenant.get', admin(), { id: OTHER_TENANT }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.tenant.list', admin()))).toBe('AUTHZ.FORBIDDEN');
    expect((h.call('platform.tenant.list', operator()) as unknown[]).length).toBe(2);
    expect(errorCode(() => h.platform.assertTenantActive('tnt_missing'))).toBe('TENANT.NOT_FOUND');
  });

  it('generates a tenant id when none is supplied', () => {
    const h = harness();
    const t = h.call('platform.tenant.create', operator(), create) as { id: string };
    expect(t.id).toMatch(/^tnt_[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});

describe('fixtures sanity', () => {
  it('ManualClock-driven timestamps are stored on records', () => {
    const h = harness();
    (h.deps.clock as ManualClock).set(5_000);
    const flag = h.call('platform.flag.set_override', admin(), { key: 'bazaar.pricing', tenantId: TENANT, enabled: false }) as { updatedAt: number };
    expect(flag.updatedAt).toBe(5_000);
  });
});
