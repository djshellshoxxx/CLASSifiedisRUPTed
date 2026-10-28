import { describe, expect, it } from 'vitest';
import { isValidEventType, MODULE_ID_RE } from '@classrup/kernel';
import { PolicyAuthorizer } from '@classrup/security';
import { DEFAULT_FLAGS, MODULES, PERM, POLICIES } from '../src/index';
import { admin, anonymous, errorCode, harness, member, operator, support, TENANT } from './helpers';

describe('package contract', () => {
  const h = harness();
  const ops = h.platform.operations;

  it('exposes valid, unique operations gated by catalogued flags', () => {
    const flagKeys = new Set(DEFAULT_FLAGS.map((f) => f.key));
    expect(new Set(ops.map((o) => o.name)).size).toBe(ops.length);
    expect(ops.length).toBeGreaterThanOrEqual(40);
    for (const o of ops) {
      expect(o.name.startsWith('platform.'), o.name).toBe(true);
      expect(flagKeys.has(o.flag), `${o.name} flag ${o.flag}`).toBe(true);
      expect(['command', 'query']).toContain(o.kind);
    }
  });

  it('declares one module per hierarchy module with catalogued flags and well-formed names', () => {
    const ids = MODULES.map((m) => m.id).sort();
    expect(ids).toEqual(['F15.S01.M01', 'F15.S01.M02', 'F15.S01.M03', 'F15.S03.M01', 'F15.S03.M02', 'F15.S03.M03', 'F15.S04.M01', 'F15.S04.M02', 'F15.S04.M03', 'F16.S03.M01', 'F16.S03.M02', 'F16.S03.M03']);
    const flagKeys = new Set(DEFAULT_FLAGS.map((f) => f.key));
    for (const m of MODULES) {
      expect(MODULE_ID_RE.test(m.id)).toBe(true);
      expect(flagKeys.has(m.flag)).toBe(true);
      for (const e of m.events ?? []) expect(isValidEventType(e) && e.startsWith('platform.')).toBe(true);
      for (const c of m.collections ?? []) expect(c.startsWith('platform_')).toBe(true);
    }
  });

  it('has a policy for every declared permission and denies everything else by default', () => {
    const authz = new PolicyAuthorizer(POLICIES);
    const granted = new Set(authz.permissions());
    for (const m of MODULES) for (const p of m.permissions ?? []) expect(granted.has(p), p).toBe(true);
    for (const p of Object.values(PERM)) expect(granted.has(p), p).toBe(true);
    expect(authz.can(operator(), 'platform.unknown:action')).toBe(false);
    expect(authz.can(admin(), 'bazaar.listing:publish')).toBe(false);
  });

  it('allows anonymous callers only the anonymous-safe reads', () => {
    const publicPerms = POLICIES.filter((p) => p.public).map((p) => p.permission).sort();
    expect(publicPerms).toEqual([PERM.healthCheck, PERM.moduleList, PERM.pwaCachePolicy, PERM.pwaManifest].sort());
    const authz = new PolicyAuthorizer(POLICIES);
    for (const p of Object.values(PERM)) expect(authz.can(anonymous(), p), p).toBe(publicPerms.includes(p));
    for (const o of ops.filter((x) => x.public)) expect(['platform.module.list', 'platform.health.check', 'platform.pwa.manifest', 'platform.pwa.cache_policy']).toContain(o.name);
  });

  it('members and moderators hold no platform administration permission', () => {
    const authz = new PolicyAuthorizer(POLICIES);
    const memberAllowed = Object.values(PERM).filter((p) => authz.can(member(), p));
    expect(memberAllowed.sort()).toEqual([PERM.healthCheck, PERM.moduleList, PERM.pwaCachePolicy, PERM.pwaManifest].sort());
    expect(authz.can(support(), PERM.incidentManage)).toBe(false);
    expect(authz.can(support(), PERM.tenantCreate)).toBe(false);
  });

  it('names sweepers with suffixes the relay scheduler recognises', () => {
    const sweepers = ops.filter((o) => o.name.endsWith('_due')).map((o) => o.name).sort();
    expect(sweepers).toEqual(['platform.backup.purge_due', 'platform.incident.escalate_due']);
  });

  it('every command rejects calls when its feature flag is disabled for the tenant', () => {
    const local = harness();
    local.call('platform.flag.set_override', admin(), { key: 'platform.assurance', tenantId: TENANT, enabled: false });
    expect(errorCode(() => local.call('platform.incident.report', support(), { title: 'abc', summary: 'a longer summary', severity: 'SEV4', category: 'other' }))).toBe('FEATURE.DISABLED');
    expect(errorCode(() => local.call('platform.threat.review', admin(), { threatRef: 'T-001', status: 'partial', note: 'blocked by flag' }))).toBe('FEATURE.DISABLED');
    local.call('platform.flag.set_override', admin(), { key: 'platform.assurance', tenantId: TENANT, enabled: true });
    expect(local.call('platform.incident.report', support(), { title: 'abc', summary: 'a longer summary', severity: 'SEV4', category: 'other' })).toMatchObject({ status: 'detected' });
  });

  it('commands without a key still work and operations return JSON-safe data', () => {
    const local = harness();
    const result = local.call('platform.tenant.create', operator(), {
      name: 'Alpha', defaultCurrency: 'USD', defaultLocale: 'en', jurisdiction: 'US', limits: {}, operatorAccountId: 'acct_01J00000000000000000000000',
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
