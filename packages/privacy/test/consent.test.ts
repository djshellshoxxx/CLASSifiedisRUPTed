import { describe, expect, it } from 'vitest';
import { DomainError, staticFlags, createTestDeps } from '@classrup/kernel';
import { PolicyAuthorizer } from '@classrup/security';
import { createPrivacy, CONSENT_PURPOSES, POLICIES } from '../src/index';
import { anon, ctx, eventsOfType, makeWorld, user } from './helpers';

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

describe('F10.S01.M01 consent', () => {
  it('grants and withdraws per purpose and answers hasConsent for other features', () => {
    const w = makeWorld();
    const alice = user('alice');
    expect(w.privacy.consent.hasConsent(alice.id, 'analytics')).toBe(false);
    const granted = w.privacy.consent.grant(ctx(alice), { purpose: 'analytics', policyVersion: '2026-01' });
    expect(granted).toEqual({ purpose: 'analytics', granted: true, policyVersion: '2026-01', since: w.deps.clock.now() });
    expect(w.privacy.consent.hasConsent(alice.id, 'analytics')).toBe(true);
    expect(w.privacy.consent.hasConsent(alice.id, 'analytics', '2026-01')).toBe(true);
    expect(w.privacy.consent.hasConsent(alice.id, 'analytics', '2025-12')).toBe(false);
    expect(w.privacy.consent.hasConsent(alice.id, 'marketing')).toBe(false);
    w.deps.clock.advance(1000);
    const withdrawn = w.privacy.consent.withdraw(ctx(alice), { purpose: 'analytics' });
    expect(withdrawn).toMatchObject({ granted: false, policyVersion: null });
    expect(w.privacy.consent.hasConsent(alice.id, 'analytics')).toBe(false);
  });

  it('keeps an append-only history and records re-consent for a new policy version', () => {
    const w = makeWorld();
    const alice = user('alice');
    w.privacy.consent.grant(ctx(alice), { purpose: 'federation', policyVersion: 'v1' });
    w.deps.clock.advance(10);
    w.privacy.consent.grant(ctx(alice), { purpose: 'federation', policyVersion: 'v1' });
    w.privacy.consent.grant(ctx(alice), { purpose: 'federation', policyVersion: 'v2' });
    w.deps.clock.advance(10);
    w.privacy.consent.withdraw(ctx(alice), { purpose: 'federation' });
    w.privacy.consent.withdraw(ctx(alice), { purpose: 'federation' });
    const history = w.privacy.consent.history(ctx(alice));
    expect(history.map((h) => `${h.decision}:${h.policyVersion}`)).toEqual(['withdrawn:v2', 'granted:v2', 'granted:v1']);
    expect(w.deps.store.collection('privacy_consent_entries').list().every((e) => e.version === 1)).toBe(true);
    expect(w.privacy.consent.history(ctx(alice), { purpose: 'marketing' })).toEqual([]);
    expect(w.privacy.consent.listMine(ctx(alice))).toHaveLength(CONSENT_PURPOSES.length);
    expect(eventsOfType(w, 'privacy.consent.granted')).toHaveLength(2);
    expect(eventsOfType(w, 'privacy.consent.withdrawn')).toHaveLength(1);
  });

  it('keeps accounts isolated and rejects invalid input', () => {
    const w = makeWorld();
    const alice = user('alice');
    const bob = user('bob');
    w.privacy.consent.grant(ctx(alice), { purpose: 'marketing', policyVersion: 'v1' });
    expect(w.privacy.consent.hasConsent(bob.id, 'marketing')).toBe(false);
    expect(w.privacy.consent.listMine(ctx(bob)).every((s) => !s.granted)).toBe(true);
    expect(codeOf(() => w.privacy.consent.grant(ctx(alice), { purpose: 'telepathy' as never, policyVersion: 'v1' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.privacy.consent.grant(ctx(alice), { purpose: 'analytics', policyVersion: '' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.privacy.consent.grant(ctx(alice), { purpose: 'analytics', policyVersion: 'v1', accountId: 'acct_bob' } as never))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('denies anonymous callers and replays idempotently', () => {
    const w = makeWorld();
    const alice = user('alice');
    expect(codeOf(() => w.privacy.consent.grant(anon(), { purpose: 'analytics', policyVersion: 'v1' }))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.privacy.consent.listMine(anon()))).toBe('AUTH.REQUIRED');
    const a = w.privacy.consent.grant(ctx(alice, 'consent-key-1'), { purpose: 'analytics', policyVersion: 'v1' });
    w.deps.clock.advance(5000);
    expect(w.privacy.consent.grant(ctx(alice, 'consent-key-1'), { purpose: 'analytics', policyVersion: 'v1' })).toEqual(a);
    expect(codeOf(() => w.privacy.consent.grant(ctx(alice, 'consent-key-1'), { purpose: 'marketing', policyVersion: 'v1' }))).toBe('IDEMPOTENCY.KEY_REUSED');
    expect(w.deps.store.collection('privacy_consent_entries').count()).toBe(1);
  });

  it('can be disabled by flag and emits events with ids and purposes only', () => {
    const deps = createTestDeps({ authz: new PolicyAuthorizer(POLICIES), flags: staticFlags(['privacy.consent']) });
    const disabled = createPrivacy(deps);
    expect(codeOf(() => disabled.consent.grant(ctx(user('alice')), { purpose: 'analytics', policyVersion: 'v1' }))).toBe('FEATURE.DISABLED');
    const w = makeWorld();
    w.privacy.consent.grant(ctx(user('alice')), { purpose: 'analytics', policyVersion: 'v1' });
    expect(eventsOfType(w, 'privacy.consent.granted')[0]?.payload).toEqual({
      consentId: expect.stringMatching(/^cns_/),
      accountId: 'acct_alice',
      purpose: 'analytics',
      policyVersion: 'v1',
    });
  });
});
