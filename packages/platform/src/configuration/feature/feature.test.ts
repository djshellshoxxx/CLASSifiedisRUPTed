import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { ANONYMOUS, createFakeClock, createFixedWindowRateLimiter, createRegistry, type AppError, type Result } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import {
  buildRegistry, buildRegistryBody, contentDigest, deepFreeze, diffRegistry, finalizeRegistry, getDependencies,
  getOrder, isKnownKey, listFeatures, registryManifestEntry, surfaceOf, textDigest, topologicalOrder, verifyHash,
} from './rules.ts';
import { FEATURE_PORTS } from './ports.ts';
import { FEATURE_QUERY_RATE, READ_REGISTRY, featureQueries } from './commands.ts';
import { registry } from './registry.ts';
import { FEATURE_MODULE_ID, type CatalogInput, type CatalogModule, type Registry } from './schema.ts';
import { moduleDef } from './index.ts';

const DIGEST = `sha256-${'A'.repeat(43)}`;
const A = 'F01.S01.M01';
const B = 'F01.S01.M02';
const C = 'F02.S01.M01';
const D = 'F02.S01.M02';
const CORE = 'F15.S04.M01';

function value<T>(result: Result<T, AppError>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${JSON.stringify(result.error.params)}`);
  return result.value;
}

function errorCode(result: Result<unknown, AppError>): string {
  if (result.ok) throw new Error('Expected a rejected registry');
  return result.error.code;
}

function module(id: string, dependencies: string[] = [], scope = 'MVP', code = 'packages/test/src'): CatalogModule {
  return { id, title: `Module ${id}`, code, path: `specs/${id}`, spec: { scope, dependsOn: dependencies } };
}

function catalog(modules: readonly CatalogModule[] = [
  module(A), module(B, [A, 'CTR-TEST-001'], 'MVP', 'apps/pwa/src'),
  module(C, [B, A], 'MVP', 'apps/relay/src'), module(D, [C], 'FUTURE'), module(CORE, [A]),
]): CatalogInput {
  return {
    features: [...new Set(modules.map(m => m.id.slice(0, 3)))].map(id => ({ id, title: `Feature ${id}`, slug: id.toLowerCase() })),
    modules, sourceDigest: DIGEST,
  };
}

const fixture = async (): Promise<Registry> => value(await buildRegistry(catalog(), { strict: true }));

/** Enumerate all permutations, independently of the implementation's Kahn/ready-set algorithm. */
function permutations(ids: readonly string[]): string[][] {
  if (!ids.length) return [[]];
  return ids.flatMap((id, i) => permutations([...ids.slice(0, i), ...ids.slice(i + 1)]).map(tail => [id, ...tail]));
}

/** JSON.stringify's sorted property whitelist gives an independent canonical encoder for these JSON fixtures. */
function referenceDigest(input: unknown): string {
  const keys = new Set<string>();
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === 'object') for (const [key, child] of Object.entries(item)) { keys.add(key); visit(child); }
  };
  visit(input);
  return `sha256-${createHash('sha256').update(JSON.stringify(input, [...keys].sort())).digest('base64url')}`;
}

describe('feature catalog validation and dependency ordering', () => {
  it('matches a brute-force ordering oracle for arbitrary small directed graphs', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 5 }).chain(size => fc.tuple(fc.constant(size), fc.array(fc.boolean(), { minLength: size * size, maxLength: size * size }))),
      ([size, matrix]) => {
        const ids = Array.from({ length: size }, (_, i) => `F01.S01.M${String(i + 1).padStart(2, '0')}`);
        const dependencies = new Map(ids.map((id, i) => [id, ids.filter((_, j) => i !== j && matrix[i * size + j])]));
        const valid = permutations(ids).filter(order => ids.every(id => dependencies.get(id)!.every(dep => order.indexOf(dep) < order.indexOf(id))));
        const result = buildRegistryBody(catalog(ids.map(id => module(id, dependencies.get(id)!))));
        if (!valid.length) {
          expect(errorCode(result)).toBe('PLATFORM_FEATURE_CYCLE');
          if (result.ok) return;
          const cycle = result.error.params['cycle'] as string[];
          expect(cycle.length).toBeGreaterThan(2);
          expect(cycle.at(-1)).toBe(cycle[0]);
          expect(cycle.slice(0, -1).every((id, i) => dependencies.get(id)?.includes(cycle[i + 1]!))).toBe(true);
        } else {
          const ordered = valid.sort((left, right) => left.join(',').localeCompare(right.join(',')))[0];
          expect(value(result).order).toEqual(ordered);
          expect(topologicalOrder([...ids].reverse(), id => dependencies.get(id)!)).toEqual({ order: ordered, cyclic: [] });
        }
      },
    ), { numRuns: 120, seed: 20261117 });
  });

  it('normalizes duplicate dependency tokens, separates contracts and indexes reverse dependencies', () => {
    const body = value(buildRegistryBody(catalog([module(A), module(B, [` ${A} `, A, 'CTR-TEST-001', 'CTR-TEST-001'])])));
    expect(body.order).toEqual([A, B]);
    expect(body.modules.find(m => m.id === B)).toMatchObject({ dependsOn: [A], contracts: ['CTR-TEST-001'] });
    expect(body.modules.find(m => m.id === A)?.dependents).toEqual([B]);
  });

  it.each([
    ['invalid feature ID', { features: [{ id: 'feature1', slug: 'one', title: 'One' }], modules: [] }],
    ['duplicate feature ID', { features: [{ id: 'F01', slug: 'one', title: 'One' }, { id: 'F01', slug: 'two', title: 'Two' }], modules: [module(A)] }],
    ['invalid module ID', { modules: [module('F01.BAD')] }],
    ['duplicate module ID', { modules: [module(A), module(A)] }],
    ['module of unknown feature', { modules: [module(C)] }],
  ])('rejects %s', (_label, changes) => {
    expect(errorCode(buildRegistryBody({ ...catalog([module(A)]), ...changes }))).toBe('VALIDATION_FAILED');
  });

  it.each([A, 'F99.S01.M01', 'F01', 'unrecognized'])('rejects self or unknown module dependency %s', dependency => {
    expect(errorCode(buildRegistryBody(catalog([module(A, [dependency])])))).toBe('PLATFORM_FEATURE_UNKNOWN_DEPENDENCY');
  });

  it.each(['', '/absolute/path', '../outside', 'packages//test', 'packages/../test', 'packages/./test', 'C:\\outside', 'packages\\test'])('rejects invalid relative POSIX code path %s', code => {
    expect(surfaceOf(code)).toBeUndefined();
    expect(errorCode(buildRegistryBody(catalog([module(A, [], 'MVP', code)])))).toBe('VALIDATION_FAILED');
  });

  it('derives surfaces from path segments and rejects declared mismatches', () => {
    expect(surfaceOf('apps/pwa')).toBe('vault');
    expect(surfaceOf('apps/relay/src')).toBe('relay');
    expect(surfaceOf('apps/pwa-other/src')).toBe('both');
    expect(errorCode(buildRegistryBody(catalog([{ ...module(A), surface: 'relay' }])))).toBe('VALIDATION_FAILED');
  });

  it('keeps FUTURE and unknown-spec catalog entries off and rejects missing specifications in strict mode', () => {
    const input = catalog([module(A), module(B, [A], 'FUTURE'), { ...module(C), spec: undefined }]);
    const body = value(buildRegistryBody(input));
    expect(body.modules.find(m => m.id === A)).toMatchObject({ defaultState: 'on', registered: true, dependsOnKnown: true });
    expect(body.modules.find(m => m.id === B)).toMatchObject({ defaultState: 'off', registered: false, scope: 'FUTURE' });
    expect(body.modules.find(m => m.id === C)).toMatchObject({ defaultState: 'off', registered: false, dependsOnKnown: false });
    expect(errorCode(buildRegistryBody(input, { strict: true }))).toBe('PLATFORM_FEATURE_SPEC_MISSING');
  });

  it('refuses enabled modules depending on disabled modules, and core modules defaulting off', () => {
    expect(errorCode(buildRegistryBody(catalog([module(A, [], 'FUTURE'), module(B, [A])])))).toBe('PLATFORM_FEATURE_DEFAULT_VIOLATION');
    expect(errorCode(buildRegistryBody(catalog([module(CORE, [], 'FUTURE')])))).toBe('PLATFORM_FEATURE_DEFAULT_VIOLATION');
    expect(errorCode(buildRegistryBody(catalog([{ ...module(CORE), spec: undefined }])))).toBe('PLATFORM_FEATURE_DEFAULT_VIOLATION');
    expect(value(buildRegistryBody(catalog([module(CORE)]))).modules[0]?.core).toBe(true);
  });

  it('rejects malformed scope and dependency lists without silently dropping them', () => {
    for (const spec of [{ scope: 'UNKNOWN', dependsOn: [] }, { scope: 'MVP', dependsOn: 'F01.S01.M01' }, { scope: 'MVP', dependsOn: [null] }]) {
      expect(errorCode(buildRegistryBody(catalog([{ ...module(A), spec }])))).toBe('VALIDATION_FAILED');
    }
  });
});

describe('registry hashes, ownership and read-only views', () => {
  it('hashes deterministic normalized catalog content using independently checked SHA-256', async () => {
    const source = catalog();
    const first = value(await buildRegistry(source));
    const second = value(await buildRegistry({ ...source, features: [...source.features].reverse(), modules: [...source.modules].reverse() }));
    expect(second).toEqual(first);
    const { hash, ...body } = first;
    expect(hash).toBe(referenceDigest(body));
    expect(await textDigest('ClassRup registry\n')).toBe(`sha256-${createHash('sha256').update('ClassRup registry\n').digest('base64url')}`);
    expect(await contentDigest({ b: [1, 'test'], a: { z: true, x: null } })).toBe(referenceDigest({ b: [1, 'test'], a: { z: true, x: null } }));
    const changed = value(await buildRegistry({ ...source, modules: source.modules.map(m => m.id === A ? { ...m, title: 'Revised title' } : m) }));
    expect(changed.hash).not.toBe(hash);
  });

  it('detaches before asynchronous hashing and deeply freezes the final registry', async () => {
    const body = value(buildRegistryBody(catalog()));
    const pending = finalizeRegistry(body);
    body.features[0]!.title = 'Mutated while hashing';
    body.modules[0]!.dependsOn.push('F99.S01.M01');
    body.order.reverse();
    const frozen = await pending;
    expect(frozen.features[0]!.title).not.toBe('Mutated while hashing');
    expect(frozen.modules[0]!.dependsOn).not.toContain('F99.S01.M01');
    expect(frozen.order[0]).toBe(A);
    expect(() => { frozen.modules[0]!.title = 'mutated'; }).toThrow();
    expect(() => frozen.modules[0]!.contracts.push('CTR-TEST-999')).toThrow();
    expect(() => frozen.order.pop()).toThrow();
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it('deep-freezes nested values even when a caller has already frozen only the root', () => {
    const nested = { items: [{ name: 'original' }] };
    Object.freeze(nested);
    deepFreeze(nested);
    expect(Object.isFrozen(nested.items)).toBe(true);
    expect(Object.isFrozen(nested.items[0])).toBe(true);
  });

  it('returns detached query views while preserving registry hashes and nested arrays', async () => {
    const local = await fixture();
    const before = JSON.stringify(local);
    const list = value(listFeatures(local, { includeFuture: true }));
    list.features[0]!.title = 'client edit';
    list.modules[0]!.title = 'client edit';
    list.modules[0]!.contracts.push('CTR-TEST-999');
    list.modules[0]!.dependsOn.push(D);
    list.modules[0]!.dependents.length = 0;
    getOrder(local).order.reverse();
    value(getDependencies(local, { key: C, transitive: true })).dependsOn.length = 0;
    expect(JSON.stringify(local)).toBe(before);
    expect(getOrder(local).order[0]).toBe(A);
  });

  it('filters surfaces and FUTURE modules and returns exact feature/module dependency closures', async () => {
    const local = await fixture();
    expect(value(listFeatures(local, { includeFuture: false, surface: 'vault' })).modules.map(m => m.id)).toEqual([A, B, CORE]);
    expect(value(listFeatures(local, { includeFuture: true, featureId: 'F02' })).modules.map(m => m.id)).toEqual([C, D]);
    expect(value(getDependencies(local, { key: D, transitive: false })).dependsOn).toEqual([C]);
    expect(value(getDependencies(local, { key: D, transitive: true })).dependsOn).toEqual([A, B, C]);
    expect(value(getDependencies(local, { key: A, transitive: true })).dependents).toEqual([B, C, D, CORE]);
    expect(value(getDependencies(local, { key: 'F02', transitive: true })).dependsOn).toEqual([A, B]);
    expect(value(getDependencies(local, { key: B, transitive: true })).contracts).toEqual(['CTR-TEST-001']);
    expect(errorCode(getDependencies(local, { key: 'F99', transitive: true }))).toBe('NOT_FOUND');
    expect(errorCode(listFeatures(local, { includeFuture: true, featureId: 'F99' }))).toBe('NOT_FOUND');
    expect(isKnownKey(local, A)).toBe(true);
    expect(isKnownKey(local, 'F99')).toBe(false);
  });

  it('reports drift and unknown remote modules without changing local policy', async () => {
    const local = await fixture();
    expect(verifyHash(local, local.hash)).toEqual({ match: true, localHash: local.hash });
    expect(verifyHash(local, DIGEST)).toEqual({ match: false, localHash: local.hash });
    expect(diffRegistry(local, { hash: DIGEST, modules: [A, 'F99.S01.M01'] })).toEqual({
      match: false, unknownModules: ['F99.S01.M01'], missingModules: [B, C, D, CORE],
    });
    expect(registryManifestEntry(local)).toEqual({ version: 1, hash: local.hash });
  });

  it('keeps the generated catalog immutable without mounting specification-only runtime features', () => {
    expect(Object.isFrozen(registry)).toBe(true);
    expect(registry.modules.length).toBeGreaterThan(0);
    for (const item of registry.modules) { expect(Object.isFrozen(item)).toBe(true); expect(Object.isFrozen(item.dependsOn)).toBe(true); }
    const runtime = createRegistry();
    expect(runtime.commands()).toEqual([]);
    expect(runtime.queries()).toEqual([]);
    runtime.add(...featureQueries);
    expect(runtime.queries().map(q => q.name)).toEqual(featureQueries.map(q => q.name));
    expect(runtime.commands()).toEqual([]);
    expect(runtime.subscribers()).toEqual([]);
    expect(moduleDef.commands).toEqual([]);
    expect(moduleDef.events).toEqual([]);
    expect(moduleDef.consumers).toEqual([]);
  });
});

describe('registry queries through the kernel authorization and read boundaries', () => {
  it('executes all four queries locally and remotely with read transactions and no emitted events', async () => {
    const local = await fixture();
    const kernel = createTestKernel({ definitions: featureQueries, ports: { [FEATURE_PORTS.registry]: local }, authz: { [READ_REGISTRY]: ['anonymous'] } });
    const transactions = vi.spyOn(kernel.storage, 'transaction');
    const requests = [
      ['platform.feature.list_features', {}, value(listFeatures(local, { includeFuture: false }))],
      ['platform.feature.get_dependencies', { key: D }, value(getDependencies(local, { key: D, transitive: true }))],
      ['platform.feature.get_order', {}, getOrder(local)],
      ['platform.feature.verify_hash', { hash: local.hash }, { match: true, localHash: local.hash }],
    ] as const;
    for (const [name, input, expected] of requests) {
      expect(value(await kernel.ask(name, input)).value).toEqual(expected);
      expect(value(await kernel.bus.query({ actor: ANONYMOUS, tenantId: kernel.tenantId, origin: 'remote' }, name, input)).value).toEqual(expected);
    }
    expect(transactions.mock.calls).toHaveLength(8);
    expect(transactions.mock.calls.every(call => call[1]?.mode === 'read')).toBe(true);
    expect(kernel.events).toEqual([]);
    expect(kernel.audit).toEqual([]);
    await kernel.storage.close();
  });

  it('requires the configured capability even for public queries and respects disabled-module gates', async () => {
    const kernel = createTestKernel({ definitions: featureQueries, authz: { [READ_REGISTRY]: ['catalog-reader'] } });
    expect(errorCode(await kernel.ask('platform.feature.get_order', {}, { actor: ANONYMOUS }))).toBe('UNAUTHENTICATED');
    expect(errorCode(await kernel.ask('platform.feature.get_order', {}))).toBe('FORBIDDEN');
    const reader = kernel.user(['catalog-reader']);
    expect((await kernel.ask('platform.feature.get_order', {}, { actor: reader })).ok).toBe(true);
    kernel.flags.set(FEATURE_MODULE_ID, false);
    expect(errorCode(await kernel.ask('platform.feature.get_order', {}, { actor: reader }))).toBe('FEATURE_DISABLED');
    await kernel.storage.close();
  });

  it('enforces an explicitly supplied host rate policy and recovers at the next window', async () => {
    const clock = createFakeClock();
    const limiter = createFixedWindowRateLimiter({ ...FEATURE_QUERY_RATE, clock });
    const kernel = createTestKernel({ definitions: featureQueries, rateLimit: limiter });
    for (let i = 0; i < FEATURE_QUERY_RATE.limit; i++) expect((await kernel.ask('platform.feature.get_order', {})).ok).toBe(true);
    const limited = await kernel.ask('platform.feature.get_order', {});
    expect(errorCode(limited)).toBe('RATE_LIMITED');
    if (!limited.ok) expect(limited.error.retryAfterMs).toBe(FEATURE_QUERY_RATE.windowMs);
    expect((await kernel.ask('platform.feature.get_order', {}, { actor: kernel.user() })).ok).toBe(true);
    clock.advance(FEATURE_QUERY_RATE.windowMs);
    expect((await kernel.ask('platform.feature.get_order', {})).ok).toBe(true);
    await kernel.storage.close();
  });

  it.each([
    ['platform.feature.list_features', { featureId: '../secret' }],
    ['platform.feature.list_features', { includeFuture: 'true' }],
    ['platform.feature.get_dependencies', { key: 'arbitrary' }],
    ['platform.feature.get_order', { write: true }],
    ['platform.feature.verify_hash', { hash: 'sha256-invalid' }],
  ])('rejects malformed query input for %s', async (name, input) => {
    const kernel = createTestKernel({ definitions: featureQueries });
    expect(errorCode(await kernel.ask(name, input))).toBe('VALIDATION_FAILED');
    expect(kernel.events).toEqual([]);
    await kernel.storage.close();
  });

  it.each(['histogram', 'observe'])('keeps query success and expected errors when optional metrics %s throws', async stage => {
    const local = await fixture();
    const metrics = { histogram() {
      if (stage === 'histogram') throw new Error('private diagnostic details');
      return { observe() { throw new Error('private diagnostic details'); } };
    } };
    const kernel = createTestKernel({ definitions: featureQueries, ports: { [FEATURE_PORTS.registry]: local, [FEATURE_PORTS.metrics]: metrics } });
    expect(value(await kernel.ask('platform.feature.get_order', {})).value).toEqual(getOrder(local));
    const missing = await kernel.ask('platform.feature.get_dependencies', { key: 'F99' });
    expect(errorCode(missing)).toBe('NOT_FOUND');
    expect(JSON.stringify(missing)).not.toContain('private diagnostic details');
    await kernel.storage.close();
  });
});
