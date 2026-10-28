import { describe, expect, it } from 'vitest';
import { DAY, DomainError, HOUR } from '@classrup/kernel';
import { contentHash } from '@classrup/security';
import { EXPORT_TTL_MS } from '../src/index';
import { adminActor, anon, ctx, eventsOfType, makeWorld, sys, user } from './helpers';
import type { World } from './helpers';

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

function worldWithExporters(): World {
  const w = makeWorld();
  w.privacy.registerExporter('identity', (id) => ({ pseudonym: `name-of-${id}`, devices: 2 }));
  w.privacy.registerExporter('bazaar', (id) => [{ listing: 'lst_1', owner: id }]);
  return w;
}

describe('F10.S01.M03 export', () => {
  it('builds a bundle with a manifest of per-section hashes and notifies the owner', () => {
    const w = worldWithExporters();
    const alice = user('alice');
    w.privacy.consent.grant(ctx(alice), { purpose: 'analytics', policyVersion: 'v1' });
    const requested = w.privacy.exports.request(ctx(alice));
    expect(requested).toMatchObject({ status: 'available', downloads: 0, availableUntil: w.deps.clock.now() + EXPORT_TTL_MS, version: 2 });
    expect(requested.manifest?.sections.map((s) => s.area)).toEqual(['bazaar', 'identity', 'privacy']);
    expect(w.notifier.sent.map((n) => n.template)).toEqual(['privacy.export_ready']);

    const bundle = w.privacy.exports.download(ctx(alice), { exportId: requested.id });
    expect(Object.keys(bundle.sections)).toEqual(['bazaar', 'identity', 'privacy']);
    for (const entry of bundle.manifest.sections) expect(contentHash(bundle.sections[entry.area])).toBe(entry.contentHash);
    expect(bundle.manifest.bundleHash).toBe(contentHash(bundle.manifest.sections));
    expect(bundle.sections.identity).toEqual({ pseudonym: 'name-of-acct_alice', devices: 2 });
    expect(JSON.stringify(bundle.sections.privacy)).toContain('analytics');
    expect(w.privacy.exports.status(ctx(alice))[0]).toMatchObject({ status: 'available', downloads: 1 });
  });

  it('is owner-only: nobody else can request for you or download your bundle', () => {
    const w = worldWithExporters();
    const alice = user('alice');
    const mallory = user('mallory');
    const exp = w.privacy.exports.request(ctx(alice));
    expect(codeOf(() => w.privacy.exports.download(ctx(mallory), { exportId: exp.id }))).toBe('PRIVACY.EXPORT_NOT_FOUND');
    expect(codeOf(() => w.privacy.exports.download(ctx(adminActor()), { exportId: exp.id }))).toBe('PRIVACY.EXPORT_NOT_FOUND');
    expect(codeOf(() => w.privacy.exports.download(anon(), { exportId: exp.id }))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.privacy.exports.request(anon()))).toBe('AUTH.REQUIRED');
    expect(w.privacy.exports.status(ctx(mallory))).toEqual([]);
    expect(codeOf(() => w.privacy.exports.expireDue(ctx(alice)))).toBe('AUTHZ.FORBIDDEN');
    expect(codeOf(() => w.privacy.exports.download(ctx(alice), { exportId: 'nope' as never }))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('allows one live export at a time and expires bundles after seven days', () => {
    const w = worldWithExporters();
    const alice = user('alice');
    const first = w.privacy.exports.request(ctx(alice));
    expect(codeOf(() => w.privacy.exports.request(ctx(alice)))).toBe('PRIVACY.EXPORT_ACTIVE');
    w.deps.clock.advance(7 * DAY - HOUR);
    expect(w.privacy.exports.download(ctx(alice), { exportId: first.id }).manifest.exportId).toBe(first.id);
    w.deps.clock.advance(HOUR);
    expect(codeOf(() => w.privacy.exports.download(ctx(alice), { exportId: first.id }))).toBe('PRIVACY.EXPORT_EXPIRED');
    expect(w.privacy.exports.expireDue(sys())).toEqual({ expired: 1 });
    expect(w.privacy.exports.expireDue(sys())).toEqual({ expired: 0 });
    const stored = w.deps.store.collection<{ id: string; version: number; status: string; sections?: unknown; manifest?: unknown }>('privacy_exports').require(first.id);
    expect(stored.status).toBe('expired');
    expect(stored.sections).toBeUndefined();
    expect(stored.manifest).toBeDefined();
    expect(eventsOfType(w, 'privacy.export.expired')).toHaveLength(1);
    expect(w.privacy.exports.request(ctx(alice)).status).toBe('available');
  });

  it('fails instead of delivering an incomplete bundle when an exporter throws', () => {
    const w = worldWithExporters();
    w.privacy.registerExporter('comms', () => {
      throw new Error('storage offline');
    });
    const alice = user('alice');
    const failed = w.privacy.exports.request(ctx(alice));
    expect(failed).toMatchObject({ status: 'failed', failedAreas: ['comms'] });
    expect(failed.manifest).toBeUndefined();
    expect(codeOf(() => w.privacy.exports.download(ctx(alice), { exportId: failed.id }))).toBe('PRIVACY.EXPORT_NOT_READY');
    expect(eventsOfType(w, 'privacy.export.failed')).toHaveLength(1);
    expect(w.notifier.sent).toHaveLength(0);
  });

  it('replays idempotently, never stores bundles in the idempotency store and keeps events payload-free', () => {
    const w = worldWithExporters();
    const alice = user('alice');
    const a = w.privacy.exports.request(ctx(alice, 'export-key-01'));
    expect(w.privacy.exports.request(ctx(alice, 'export-key-01'))).toEqual(a);
    expect(w.deps.store.collection('privacy_exports').count()).toBe(1);
    w.privacy.exports.download(ctx(alice, 'dl-key-0001'), { exportId: a.id });
    w.privacy.exports.download(ctx(alice, 'dl-key-0001'), { exportId: a.id });
    expect(w.privacy.exports.status(ctx(alice))[0]?.downloads).toBe(2);
    const events = JSON.stringify(w.deps.store.events.read());
    expect(events).not.toContain('name-of-acct_alice');
    expect(events).not.toContain('lst_1');
  });

  it('rejects duplicate and malformed exporter registrations', () => {
    const w = makeWorld();
    expect(() => w.privacy.registerExporter('privacy', () => null)).toThrow(/already registered/);
    expect(() => w.privacy.registerExporter('Bad Area', () => null)).toThrow(/invalid exporter area/);
  });
});
