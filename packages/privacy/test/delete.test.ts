import { describe, expect, it } from 'vitest';
import { DAY, DomainError, HOUR } from '@classrup/kernel';
import { DELETION_GRACE_MS, DELETION_TRANSITIONS } from '../src/index';
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

function worldWithErasers(): { w: World; erased: string[] } {
  const w = makeWorld();
  const erased: string[] = [];
  w.privacy.registerEraser('identity', (id) => {
    erased.push(`identity:${id}`);
    return { erased: 4, retained: [] };
  });
  w.privacy.registerEraser('commerce', (id) => {
    erased.push(`commerce:${id}`);
    return { erased: 2, retained: ['commerce_evidence:payment receipts with counterparties pseudonymised'] };
  });
  return { w, erased };
}

describe('F10.S01.M04 deletion', () => {
  it('runs request -> grace -> executing -> completed and reports erased and retained data with reasons', () => {
    const { w, erased } = worldWithErasers();
    const alice = user('alice');
    w.privacy.consent.grant(ctx(alice), { purpose: 'analytics', policyVersion: 'v1' });
    const req = w.privacy.deletion.request(ctx(alice));
    expect(req).toMatchObject({ status: 'grace', graceEndsAt: w.deps.clock.now() + DELETION_GRACE_MS });
    expect(w.notifier.sent.map((n) => n.template)).toEqual(['privacy.deletion_scheduled']);

    w.deps.clock.advance(DELETION_GRACE_MS - HOUR);
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 0, blocked: 0, failed: 0 });
    expect(erased).toEqual([]);

    w.deps.clock.advance(HOUR);
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 1, blocked: 0, failed: 0 });
    expect(erased).toEqual(['identity:acct_alice', 'commerce:acct_alice']);
    const done = w.privacy.deletion.status(ctx(alice))[0];
    expect(done?.status).toBe('completed');
    expect(done?.report?.areas.map((a) => [a.area, a.erased])).toEqual([['privacy', 1], ['identity', 4], ['commerce', 2]]);
    const commerce = done?.report?.retained.find((r) => r.area === 'commerce');
    expect(commerce).toMatchObject({ retentionClass: 'commerce_evidence', item: 'payment receipts with counterparties pseudonymised' });
    expect(commerce?.reason).toContain('7 years');
    expect(done?.report?.retained.some((r) => r.area === 'privacy' && r.retentionClass === 'audit')).toBe(true);
    expect(w.deps.store.collection('privacy_consent_states').count()).toBe(0);
    expect(eventsOfType(w, 'privacy.deletion.completed')[0]?.payload).toMatchObject({ retainedCount: 3 });
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 0, blocked: 0, failed: 0 });
  });

  it('lets the owner cancel during grace; later transitions are invalid', () => {
    const { w, erased } = worldWithErasers();
    const alice = user('alice');
    const req = w.privacy.deletion.request(ctx(alice));
    expect(codeOf(() => w.privacy.deletion.request(ctx(alice)))).toBe('PRIVACY.DELETION_ACTIVE');
    expect(codeOf(() => w.privacy.deletion.cancel(ctx(user('mallory')), { deletionId: req.id }))).toBe('PRIVACY.DELETION_NOT_FOUND');
    const cancelled = w.privacy.deletion.cancel(ctx(alice), { deletionId: req.id });
    expect(cancelled.status).toBe('cancelled');
    expect(codeOf(() => w.privacy.deletion.cancel(ctx(alice), { deletionId: req.id }))).toBe('PRIVACY.INVALID_TRANSITION');
    w.deps.clock.advance(8 * DAY);
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 0, blocked: 0, failed: 0 });
    expect(erased).toEqual([]);
    expect(w.privacy.deletion.request(ctx(alice)).status).toBe('grace');

    const bob = user('bob');
    const second = w.privacy.deletion.request(ctx(bob));
    w.deps.clock.advance(8 * DAY);
    w.privacy.deletion.processDue(sys());
    expect(codeOf(() => w.privacy.deletion.cancel(ctx(bob), { deletionId: second.id }))).toBe('PRIVACY.INVALID_TRANSITION');
  });

  it('is blocked while a legal hold covers the account and completes after release', () => {
    const { w, erased } = worldWithErasers();
    const admin = ctx(adminActor());
    const alice = user('alice');
    const hold = w.privacy.retention.placeHold(admin, { subjectType: 'account', subjectId: alice.id, reason: 'regulator request' });
    w.privacy.deletion.request(ctx(alice));
    w.deps.clock.advance(8 * DAY);
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 0, blocked: 1, failed: 0 });
    expect(w.privacy.deletion.status(ctx(alice))[0]).toMatchObject({ status: 'blocked_by_hold', blockedByHoldCount: 1 });
    expect(erased).toEqual([]);
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 0, blocked: 1, failed: 0 });
    expect(eventsOfType(w, 'privacy.deletion.blocked')).toHaveLength(1);
    w.privacy.retention.releaseHold(admin, { holdId: hold.id });
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 1, blocked: 0, failed: 0 });
    expect(erased).toHaveLength(2);
    expect(w.privacy.deletion.status(ctx(alice))[0]?.status).toBe('completed');
  });

  it('records a failing eraser atomically and retries to completion', () => {
    const w = makeWorld();
    let healthy = false;
    const calls: string[] = [];
    w.privacy.registerEraser('first', () => {
      calls.push('first');
      return { erased: 1, retained: [] };
    });
    w.privacy.registerEraser('flaky', () => {
      calls.push('flaky');
      if (!healthy) throw new Error('db down');
      return { erased: 1, retained: [] };
    });
    const alice = user('alice');
    w.privacy.consent.grant(ctx(alice), { purpose: 'marketing', policyVersion: 'v1' });
    w.privacy.deletion.request(ctx(alice));
    w.deps.clock.advance(8 * DAY);
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 0, blocked: 0, failed: 1 });
    expect(w.privacy.deletion.status(ctx(alice))[0]).toMatchObject({ status: 'failed', failedArea: 'flaky' });
    expect(w.deps.store.collection('privacy_consent_states').count()).toBe(1);
    healthy = true;
    expect(w.privacy.deletion.processDue(sys())).toEqual({ completed: 1, blocked: 0, failed: 0 });
    expect(w.privacy.deletion.status(ctx(alice))[0]?.status).toBe('completed');
    expect(w.deps.store.collection('privacy_consent_states').count()).toBe(0);
    expect(eventsOfType(w, 'privacy.deletion.failed')).toHaveLength(1);
  });

  it('has an explicit transition table with terminal completed and cancelled states', () => {
    expect(DELETION_TRANSITIONS.completed).toEqual([]);
    expect(DELETION_TRANSITIONS.cancelled).toEqual([]);
    expect(DELETION_TRANSITIONS.grace).toContain('blocked_by_hold');
    expect(DELETION_TRANSITIONS.completed).not.toContain('grace');
  });

  it('enforces authorization, owner scope and idempotency', () => {
    const { w } = worldWithErasers();
    const alice = user('alice');
    expect(codeOf(() => w.privacy.deletion.request(anon()))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.privacy.deletion.processDue(ctx(alice)))).toBe('AUTHZ.FORBIDDEN');
    expect(codeOf(() => w.privacy.deletion.processDue(ctx(adminActor())))).toBe('AUTHZ.FORBIDDEN');
    const a = w.privacy.deletion.request(ctx(alice, 'delete-key-01'));
    expect(w.privacy.deletion.request(ctx(alice, 'delete-key-01'))).toEqual(a);
    expect(w.deps.store.collection('privacy_deletions').count()).toBe(1);
    expect(w.privacy.deletion.status(ctx(user('bob')))).toEqual([]);
    expect(eventsOfType(w, 'privacy.deletion.requested')).toHaveLength(1);
  });

  it('rejects duplicate eraser registrations', () => {
    const w = makeWorld();
    w.privacy.registerEraser('identity', () => ({ erased: 0, retained: [] }));
    expect(() => w.privacy.registerEraser('identity', () => ({ erased: 0, retained: [] }))).toThrow(/already registered/);
  });
});
