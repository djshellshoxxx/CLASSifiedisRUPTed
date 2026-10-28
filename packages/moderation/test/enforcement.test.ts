import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { DAY, HOUR } from '@classrup/kernel';
import { STRIKE_DECAY_MS } from '../src/index';
import { ctxFor, member, moderator, setup } from './fixtures';
import type { Harness } from './fixtures';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
};

const withSeller = (): Harness => {
  const h = setup();
  h.owners.set('listing:lst_1', 'acct_seller');
  return h;
};
const staffCtx = (id = 'acct_mod2') => ctxFor(moderator(id));

describe('F12.S02.M01 enforcement', () => {
  it('applies a warning: strike, notice, risk signal, evidence, closed reports', () => {
    const h = withSeller();
    const c = h.claimedCase();
    const e = h.decide(c.id);
    expect(e).toMatchObject({ action: 'warn', status: 'active', policyClause: 'TOS-4.2', subjectAccountId: 'acct_seller', deciderId: 'acct_mod1', requiresApproval: false });
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id })).toMatchObject({ status: 'resolved', resolution: 'warn' });
    expect(h.mod.reports.mine(ctxFor(member('acct_rep1')), {})[0]?.status).toBe('closed');
    const toSubject = h.notifier.sent.filter((n) => n.recipientId === 'acct_seller');
    expect(toSubject).toHaveLength(1);
    expect(toSubject[0]).toMatchObject({ template: 'moderation.action_taken', data: { action: 'warn', policyClause: 'TOS-4.2', reason: 'listing violates the policy' } });
    expect(h.notifier.sent.find((n) => n.recipientId === 'acct_rep1')?.data).toEqual({ outcome: 'actioned' });
    expect(h.mod.signals.list(staffCtx(), { accountId: 'acct_seller' })[0]).toMatchObject({ kind: 'report_upheld', weight: 10 });
    expect(h.mod.evidence.list(staffCtx(), { caseId: c.id }).map((x) => x.kind)).toEqual(['report', 'decision']);
    expect(h.mod.verifyEvidenceChain(c.id).valid).toBe(true);
    expect(h.actions.calls).toEqual([]);
    expect(h.events.map((x) => x.type)).toEqual(expect.arrayContaining(['moderation.enforcement.applied', 'moderation.case.resolved', 'moderation.signal.recorded']));
  });

  it('removes content through the port and refuses it for accounts', () => {
    const h = withSeller();
    const c = h.claimedCase();
    h.decide(c.id, { action: 'remove_content', reason: 'prohibited item listed' });
    expect(h.actions.calls).toEqual([{ call: 'removeContent', subjectType: 'listing', subjectId: 'lst_1', reason: 'prohibited item listed' }]);
    const acct = h.claimedCase({ subjectType: 'account', subjectId: 'acct_x' });
    expect(code(() => h.decide(acct.id, { action: 'remove_content' }))).toBe('MODERATION.ACTION_NOT_APPLICABLE');
  });

  it('restricts a feature for a duration and lifts it by time and by the sweeper', () => {
    const h = withSeller();
    const c = h.claimedCase();
    h.decide(c.id, { action: 'restrict', restriction: 'publishing', durationMs: 2 * DAY });
    expect(h.mod.restrictionsOf('acct_seller')).toEqual(['publishing']);
    expect(code(() => h.mod.assertNotRestricted('acct_seller', 'publishing'))).toBe('MODERATION.RESTRICTED');
    expect(code(() => h.mod.assertNotRestricted('acct_seller', 'messaging'))).toBeUndefined();
    expect(h.mod.enforcement.mine(ctxFor(member('acct_seller')), {})[0]).toMatchObject({ restriction: 'publishing', status: 'active' });
    h.clock.advance(2 * DAY);
    expect(h.mod.restrictionsOf('acct_seller')).toEqual([]);
    expect(h.mod.enforcement.expireDue(ctxFor({ kind: 'system', id: 'system', roles: ['system'], tenantId: 'tnt_default' }))).toEqual({ expired: 1 });
    expect(h.mod.enforcement.list(staffCtx(), { status: 'expired' })).toHaveLength(1);
  });

  it('suspends for a duration and reinstates when it elapses', () => {
    const h = withSeller();
    const sys = ctxFor({ kind: 'system', id: 'system', roles: ['system'], tenantId: 'tnt_default' });
    h.decide(h.claimedCase().id, { action: 'suspend', durationMs: 3 * DAY });
    const until = h.clock.now() + 3 * DAY;
    expect(h.actions.calls).toEqual([{ call: 'suspendAccount', accountId: 'acct_seller', until, reason: 'listing violates the policy' }]);
    h.clock.advance(3 * DAY - 1);
    expect(h.mod.enforcement.expireDue(sys)).toEqual({ expired: 0 });
    h.clock.advance(1);
    expect(h.mod.enforcement.expireDue(sys)).toEqual({ expired: 1 });
    expect(h.actions.calls.at(-1)).toEqual({ call: 'reinstateAccount', accountId: 'acct_seller' });
    expect(h.mod.enforcement.expireDue(sys)).toEqual({ expired: 0 });
  });

  it('does not reinstate while another suspension is still running', () => {
    const h = withSeller();
    h.owners.set('listing:lst_2', 'acct_seller');
    const sys = ctxFor({ kind: 'system', id: 'system', roles: ['system'], tenantId: 'tnt_default' });
    h.decide(h.claimedCase().id, { action: 'suspend', durationMs: DAY });
    h.decide(h.claimedCase({ subjectId: 'lst_2' }).id, { action: 'suspend', durationMs: 5 * DAY });
    h.clock.advance(DAY);
    h.mod.enforcement.expireDue(sys);
    expect(h.actions.calls.filter((c) => c.call === 'reinstateAccount')).toHaveLength(0);
    h.clock.advance(4 * DAY);
    h.mod.enforcement.expireDue(sys);
    expect(h.actions.calls.filter((c) => c.call === 'reinstateAccount')).toHaveLength(1);
  });

  it('requires a second moderator for a ban and executes it only after approval', () => {
    const h = withSeller();
    const c = h.claimedCase();
    const pending = h.decide(c.id, { action: 'ban', reason: 'repeated fraud' });
    expect(pending).toMatchObject({ status: 'pending_approval', requiresApproval: true });
    expect(h.actions.calls).toEqual([]);
    expect(h.notifier.sent.filter((n) => n.recipientId === 'acct_seller')).toHaveLength(0);
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id }).status).toBe('pending_approval');
    expect(h.mod.enforcement.list(staffCtx(), {})).toHaveLength(1);

    expect(code(() => h.mod.enforcement.approve(staffCtx('acct_mod1'), { enforcementId: pending.id }))).toBe('MODERATION.FOUR_EYES_REQUIRED');
    expect(code(() => h.mod.enforcement.approve(ctxFor(member('acct_x')), { enforcementId: pending.id }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => h.decide(c.id, {}))).toBe('MODERATION.CASE_NOT_CLAIMED');

    const approved = h.mod.enforcement.approve(staffCtx('acct_mod2'), { enforcementId: pending.id });
    expect(approved).toMatchObject({ status: 'active', approverId: 'acct_mod2', action: 'ban' });
    expect(h.actions.calls).toEqual([{ call: 'suspendAccount', accountId: 'acct_seller', until: null, reason: 'repeated fraud' }]);
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id })).toMatchObject({ status: 'resolved', resolution: 'ban' });
    expect(h.notifier.sent.filter((n) => n.recipientId === 'acct_seller')).toHaveLength(1);
    expect(code(() => h.mod.enforcement.approve(staffCtx('acct_mod3'), { enforcementId: pending.id }))).toBe('MODERATION.INVALID_TRANSITION');
  });

  it('returns the case to the assignee when the approval is rejected', () => {
    const h = withSeller();
    const c = h.claimedCase();
    const pending = h.decide(c.id, { action: 'ban' });
    expect(code(() => h.mod.enforcement.reject(staffCtx('acct_mod1'), { enforcementId: pending.id, reason: 'changed my mind' }))).toBe('MODERATION.FOUR_EYES_REQUIRED');
    const rejected = h.mod.enforcement.reject(staffCtx('acct_mod2'), { enforcementId: pending.id, reason: 'too severe for a first offence' });
    expect(rejected.status).toBe('rejected');
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id }).status).toBe('claimed');
    expect(h.actions.calls).toEqual([]);
    expect(h.decide(c.id, { action: 'warn' }).status).toBe('active');
  });

  it('treats every decision on a minor-safety case as needing approval, including dismissal', () => {
    const h = withSeller();
    const c = h.claimedCase({ reason: 'minor_safety' });
    const pending = h.decide(c.id, { action: 'dismiss', reason: 'no evidence of harm found' });
    expect(pending).toMatchObject({ status: 'pending_approval', requiresApproval: true });
    const done = h.mod.enforcement.approve(staffCtx(), { enforcementId: pending.id });
    expect(done.status).toBe('dismissed');
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id })).toMatchObject({ status: 'resolved', resolution: 'dismiss' });
    expect(h.notifier.sent.filter((n) => n.recipientId === 'acct_seller')).toHaveLength(0);
    expect(h.deps.store.collection('moderation_reporter_stats').get('tnt_default|acct_rep1')).toMatchObject({ upheld: 0, dismissed: 1 });
    expect(h.notifier.sent.find((n) => n.recipientId === 'acct_rep1')?.data).toEqual({ outcome: 'dismissed' });
  });

  it('validates decisions', () => {
    const h = withSeller();
    const c = h.claimedCase();
    expect(code(() => h.decide(c.id, { action: 'suspend' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.decide(c.id, { action: 'restrict' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.decide(c.id, { action: 'warn', durationMs: DAY }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.decide(c.id, { action: 'warn', restriction: 'publishing' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.decide(c.id, { action: 'suspend', durationMs: 400 * DAY }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.decide(c.id, { policyClause: 'x' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.decide(c.id, { reason: 'no' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.decide(c.id, { action: 'delete_everything' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(h.mod.enforcement.list(staffCtx(), { status: 'active' })).toHaveLength(0);
  });

  it('needs the owning account for account-level actions', () => {
    const h = setup();
    const c = h.claimedCase({ subjectId: 'lst_unowned' });
    expect(code(() => h.decide(c.id, { action: 'warn' }))).toBe('MODERATION.SUBJECT_ACCOUNT_REQUIRED');
    expect(h.decide(c.id, { action: 'warn', subjectAccountId: 'acct_resolved_by_moderator' })).toMatchObject({ subjectAccountId: 'acct_resolved_by_moderator' });
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id }).subjectAccountId).toBe('acct_resolved_by_moderator');
  });

  it('enforces case state and assignee', () => {
    const h = withSeller();
    h.report('acct_a');
    const open = h.queue()[0]?.id ?? '';
    expect(code(() => h.decide(open))).toBe('MODERATION.CASE_NOT_CLAIMED');
    const c = h.claimedCase({ subjectId: 'lst_2' });
    expect(code(() => h.decide(c.id, {}, 'acct_mod2'))).toBe('MODERATION.NOT_ASSIGNEE');
    expect(code(() => h.mod.enforcement.decide(ctxFor(member('acct_seller')), { caseId: c.id, action: 'dismiss', policyClause: 'TOS-1', reason: 'because' }))).toBe('AUTHZ.FORBIDDEN');
  });

  it('is idempotent per key, detects key reuse and stale case versions', () => {
    const h = withSeller();
    const c = h.claimedCase();
    const input = { caseId: c.id, action: 'warn', policyClause: 'TOS-4.2', reason: 'listing violates the policy' } as const;
    const a = h.mod.enforcement.decide(ctxFor(moderator('acct_mod1'), 'key-decide-1'), input);
    const b = h.mod.enforcement.decide(ctxFor(moderator('acct_mod1'), 'key-decide-1'), input);
    expect(b).toEqual(a);
    expect(h.deps.store.collection('moderation_enforcements').count()).toBe(1);
    expect(h.notifier.sent.filter((n) => n.recipientId === 'acct_seller')).toHaveLength(1);
    expect(code(() => h.mod.enforcement.decide(ctxFor(moderator('acct_mod1'), 'key-decide-1'), { ...input, action: 'dismiss' }))).toBe('IDEMPOTENCY.KEY_REUSED');
    const d = h.claimedCase({ subjectId: 'lst_3' });
    expect(code(() => h.decide(d.id, { expectedVersion: d.version + 3 }))).toBe('STORE.VERSION_CONFLICT');
  });

  it('rolls back everything when a port call fails', () => {
    const h = withSeller();
    const c = h.claimedCase();
    const spy = vi.spyOn(h.actions, 'removeContent').mockImplementation(() => {
      throw new Error('bazaar unavailable');
    });
    expect(() => h.decide(c.id, { action: 'remove_content' })).toThrow('bazaar unavailable');
    spy.mockRestore();
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id }).status).toBe('claimed');
    expect(h.deps.store.collection('moderation_enforcements').count()).toBe(0);
    expect(h.notifier.sent.filter((n) => n.recipientId === 'acct_seller')).toHaveLength(0);
    expect(h.mod.verifyEvidenceChain(c.id).length).toBe(1);
  });

  it('shows the subject a notice without moderator or reporter identities', () => {
    const h = withSeller();
    const c = h.claimedCase();
    h.decide(c.id);
    const notice = h.mod.enforcement.mine(ctxFor(member('acct_seller')), {});
    expect(notice).toHaveLength(1);
    expect(notice[0]).toMatchObject({ action: 'warn', appealable: true });
    const blob = JSON.stringify([notice, h.notifier.sent.filter((n) => n.recipientId === 'acct_seller'), h.events]);
    expect(blob).not.toMatch(/acct_rep\d/);
    expect(JSON.stringify(notice)).not.toContain('acct_mod1');
    expect(h.mod.enforcement.mine(ctxFor(member('acct_other')), {})).toEqual([]);
  });
});

describe('strikes', () => {
  it('recommends suspension at three active strikes and forgets them after 180 days', () => {
    const h = setup();
    const decideOn = (i: number) => {
      h.owners.set(`listing:lst_${i}`, 'acct_seller');
      return h.decide(h.claimedCase({ subjectId: `lst_${i}` }).id);
    };
    expect([1, 2].map((i) => decideOn(i).suspensionRecommended)).toEqual([false, false]);
    const third = decideOn(3);
    expect(third.suspensionRecommended).toBe(true);
    const threshold = h.events.filter((e) => e.type === 'moderation.strike.threshold_reached');
    expect(threshold).toHaveLength(1);
    expect(threshold[0]?.payload).toMatchObject({ accountId: 'acct_seller', activeStrikes: 3 });
    h.clock.advance(STRIKE_DECAY_MS + 1);
    expect(decideOn(4).suspensionRecommended).toBe(false);
    expect(h.events.filter((e) => e.type === 'moderation.strike.threshold_reached')).toHaveLength(1);
  });

  it('matches a sliding-window model for any spacing of warnings (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 120 }), { minLength: 3, maxLength: 7 }), (gapsDays) => {
        const h = setup();
        const times: number[] = [];
        const flags: boolean[] = [];
        for (const [i, gap] of gapsDays.entries()) {
          h.clock.advance(gap * DAY);
          h.owners.set(`listing:lst_${i}`, 'acct_seller');
          flags.push(h.decide(h.claimedCase({ subjectId: `lst_${i}` }).id).suspensionRecommended);
          times.push(h.clock.now());
        }
        const expected = times.map((t, i) => times.slice(0, i + 1).filter((s) => t - s < STRIKE_DECAY_MS).length >= 3);
        return JSON.stringify(flags) === JSON.stringify(expected);
      }),
      { numRuns: 20 },
    );
  });
});

describe('queue sweeps with the clock', () => {
  it('lets cases wait without time passing changing decisions', () => {
    const h = withSeller();
    const c = h.claimedCase();
    h.clock.advance(30 * HOUR);
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id }).slaBreached).toBe(true);
    expect(h.decide(c.id).status).toBe('active');
    expect(h.mod.cases.get(staffCtx(), { caseId: c.id }).slaBreached).toBe(false);
  });
});
