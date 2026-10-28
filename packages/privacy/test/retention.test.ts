import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DAY, DomainError, HOUR } from '@classrup/kernel';
import { computeExpiry, DEFAULT_RETENTION, RETENTION_BOUNDS } from '../src/index';
import { adminActor, anon, ctx, eventsOfType, makeWorld, sys, user } from './helpers';

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

const YEAR = 365 * DAY;

describe('F10.S01.M02 retention policy', () => {
  it('has the documented defaults per class', () => {
    expect(DEFAULT_RETENTION).toEqual({
      ephemeral: { mode: 'fixed', ms: DAY },
      session: { mode: 'fixed', ms: 30 * DAY },
      content: { mode: 'until_deletion' },
      commerce_evidence: { mode: 'fixed', ms: 7 * YEAR },
      moderation: { mode: 'fixed', ms: 2 * YEAR },
      audit: { mode: 'fixed', ms: YEAR },
      legal_hold: { mode: 'frozen' },
    });
    const w = makeWorld();
    expect(w.privacy.retention.expiryFor('tnt_default', 'ephemeral', 1000)).toBe(1000 + DAY);
    expect(w.privacy.retention.expiryFor('tnt_default', 'content', 1000)).toBeUndefined();
    expect(w.privacy.retention.expiryFor('tnt_default', 'legal_hold', 1000)).toBeUndefined();
  });

  it('computes expiry as creation plus duration for every fixed rule (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 40 }), fc.integer({ min: 1, max: 20 * YEAR }), (createdAt, ms) => {
        const rule = { mode: 'fixed', ms } as const;
        const expiry = computeExpiry(rule, createdAt);
        return expiry === createdAt + ms && expiry > createdAt;
      }),
    );
  });

  it('lets admins tune fixed classes within bounds, versioned, per tenant', () => {
    const w = makeWorld();
    const admin = ctx(adminActor());
    expect(w.privacy.retention.policy(ctx(user('a'))).rules.audit).toMatchObject({ mode: 'fixed', ms: YEAR });
    const changed = w.privacy.retention.setPolicy(admin, { retentionClass: 'ephemeral', ms: 6 * HOUR });
    expect(changed.rules.ephemeral.ms).toBe(6 * HOUR);
    expect(changed.version).toBe(1);
    expect(w.privacy.retention.expiryFor('tnt_default', 'ephemeral', 0)).toBe(6 * HOUR);
    expect(w.privacy.retention.expiryFor('tnt_other', 'ephemeral', 0)).toBe(DAY);
    const bounds = RETENTION_BOUNDS.commerce_evidence;
    expect(codeOf(() => w.privacy.retention.setPolicy(admin, { retentionClass: 'commerce_evidence', ms: (bounds?.min ?? 0) - 1 }))).toBe('PRIVACY.RETENTION_OUT_OF_BOUNDS');
    expect(codeOf(() => w.privacy.retention.setPolicy(admin, { retentionClass: 'content' as never, ms: DAY }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.privacy.retention.setPolicy(admin, { retentionClass: 'audit', ms: 40 * DAY, expectedVersion: 0 }))).toBe('STORE.VERSION_CONFLICT');
    expect(w.privacy.retention.setPolicy(admin, { retentionClass: 'audit', ms: 40 * DAY, expectedVersion: 1 }).version).toBe(2);
    expect(eventsOfType(w, 'privacy.retention.policy_changed')).toHaveLength(2);
  });

  it('restricts policy changes to admins and reads to signed-in users', () => {
    const w = makeWorld();
    expect(codeOf(() => w.privacy.retention.setPolicy(ctx(user('a')), { retentionClass: 'audit', ms: 40 * DAY }))).toBe('AUTHZ.FORBIDDEN');
    expect(codeOf(() => w.privacy.retention.policy(anon()))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.privacy.retention.planSweep(ctx(adminActor()), { items: [] }))).toBe('AUTHZ.FORBIDDEN');
  });
});

describe('F10.S01.M02 legal holds and sweep planning', () => {
  it('places, rejects duplicates, lists and releases holds (admin only)', () => {
    const w = makeWorld();
    const admin = ctx(adminActor());
    const hold = w.privacy.retention.placeHold(admin, { subjectType: 'account', subjectId: 'acct_alice', reason: 'court order 123' });
    expect(hold).toMatchObject({ status: 'active', subjectId: 'acct_alice' });
    expect(codeOf(() => w.privacy.retention.placeHold(admin, { subjectType: 'account', subjectId: 'acct_alice', reason: 'again' }))).toBe('PRIVACY.HOLD_EXISTS');
    expect(codeOf(() => w.privacy.retention.placeHold(ctx(user('a')), { subjectType: 'account', subjectId: 'acct_bob', reason: 'nope nope' }))).toBe('AUTHZ.FORBIDDEN');
    expect(w.privacy.retention.activeHolds('tnt_default', 'account', 'acct_alice')).toEqual([hold.id]);
    expect(codeOf(() => w.privacy.retention.assertNotHeld('tnt_default', 'account', 'acct_alice'))).toBe('PRIVACY.LEGAL_HOLD');
    expect(() => w.privacy.retention.assertNotHeld('tnt_default', 'account', 'acct_bob')).not.toThrow();
    expect(w.privacy.retention.listHolds(admin)).toHaveLength(1);
    w.deps.clock.advance(1000);
    const released = w.privacy.retention.releaseHold(admin, { holdId: hold.id });
    expect(released).toMatchObject({ status: 'released', releasedAt: w.deps.clock.now() });
    expect(w.privacy.retention.releaseHold(admin, { holdId: hold.id }).version).toBe(released.version);
    expect(() => w.privacy.retention.assertNotHeld('tnt_default', 'account', 'acct_alice')).not.toThrow();
    expect(codeOf(() => w.privacy.retention.releaseHold(admin, { holdId: 'hold_00000000000000000000000000' }))).toBe('PRIVACY.HOLD_NOT_FOUND');
    expect(eventsOfType(w, 'privacy.hold.placed')).toHaveLength(1);
    expect(eventsOfType(w, 'privacy.hold.released')).toHaveLength(1);
  });

  it('plans sweeps: due vs held vs retained, never marking held or non-expiring items due', () => {
    const w = makeWorld();
    const admin = ctx(adminActor());
    w.privacy.retention.placeHold(admin, { subjectType: 'account', subjectId: 'acct_held', reason: 'investigation' });
    w.privacy.retention.placeHold(admin, { subjectType: 'record', subjectId: 'rec_held', reason: 'dispute' });
    w.deps.clock.advance(10 * DAY);
    const now = w.deps.clock.now();
    const items = [
      { type: 'nonce', id: 'n1', retentionClass: 'ephemeral', createdAt: now - 2 * DAY },
      { type: 'nonce', id: 'n2', retentionClass: 'ephemeral', createdAt: now - HOUR },
      { type: 'nonce', id: 'n3', retentionClass: 'ephemeral', createdAt: now - 2 * DAY, subjectAccountId: 'acct_held' },
      { type: 'log', id: 'rec_held', retentionClass: 'ephemeral', createdAt: now - 2 * DAY },
      { type: 'post', id: 'p1', retentionClass: 'content', createdAt: 0 },
      { type: 'case', id: 'h1', retentionClass: 'legal_hold', createdAt: 0 },
    ] as const;
    const plan = w.privacy.retention.planSweep(sys(), { items: [...items] });
    expect(plan.due.map((i) => i.id)).toEqual(['n1']);
    expect(plan.held.map((h) => h.item.id)).toEqual(['n3', 'rec_held']);
    expect(plan.retained).toBe(3);
  });

  it('never classifies an item as due and held at once, and counts add up (property)', () => {
    const w = makeWorld();
    w.privacy.retention.placeHold(ctx(adminActor()), { subjectType: 'account', subjectId: 'acct_h', reason: 'hold reason' });
    w.deps.clock.set(100 * DAY);
    const item = fc.record({
      type: fc.constant('thing'),
      id: fc.stringMatching(/^[a-z0-9]{3,8}$/),
      retentionClass: fc.constantFrom('ephemeral', 'session', 'content', 'commerce_evidence', 'moderation', 'audit', 'legal_hold'),
      createdAt: fc.integer({ min: 0, max: 100 * DAY }),
      subjectAccountId: fc.option(fc.constantFrom('acct_h', 'acct_free'), { nil: undefined }),
    });
    fc.assert(
      fc.property(fc.array(item, { maxLength: 40 }), (items) => {
        const plan = w.privacy.retention.planSweep(sys(), { items });
        const dueIds = new Set(plan.due.map((i) => i));
        const heldIds = new Set(plan.held.map((h) => h.item));
        return (
          plan.due.length + plan.held.length + plan.retained === items.length &&
          [...dueIds].every((i) => !heldIds.has(i)) &&
          plan.due.every((i) => i.subjectAccountId !== 'acct_h' && i.retentionClass !== 'content' && i.retentionClass !== 'legal_hold')
        );
      }),
    );
  });
});
