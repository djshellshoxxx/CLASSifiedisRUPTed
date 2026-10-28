import { describe, expect, it } from 'vitest';
import { DAY } from '@classrup/kernel';
import { APPEAL_WINDOW_MS } from '../src/index';
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

const STATEMENT = 'I did not do this, here is my receipt';
const seller = () => ctxFor(member('acct_seller'));
const reviewer = (id = 'acct_mod3') => ctxFor(moderator(id));

function enforced(over: Record<string, unknown> = {}) {
  const h = setup();
  h.owners.set('listing:lst_1', 'acct_seller');
  const c = h.claimedCase();
  const enf = h.decide(c.id, { action: 'remove_content', ...over });
  return { h, c, enf };
}

const appeal = (h: Harness, enforcementId: string, key?: string) => h.mod.appeals.submit(ctxFor(member('acct_seller'), key), { enforcementId, statement: STATEMENT });

function inReview(h: Harness, enforcementId: string) {
  const a = appeal(h, enforcementId);
  h.mod.appeals.claim(reviewer(), { appealId: a.id });
  return a;
}

describe('F12.S01.M03 appeals', () => {
  it('lets the subject appeal once per decision', () => {
    const { h, enf } = enforced();
    const a = appeal(h, enf.id);
    expect(a).toMatchObject({ status: 'submitted', enforcementId: enf.id, statement: STATEMENT });
    expect(h.mod.enforcement.mine(seller(), {})[0]).toMatchObject({ appealable: false, appealId: a.id });
    expect(code(() => appeal(h, enf.id))).toBe('MODERATION.APPEAL_EXISTS');
    expect(h.mod.appeals.mine(seller(), {})).toHaveLength(1);
    expect(h.mod.appeals.mine(ctxFor(member('acct_other')), {})).toHaveLength(0);
    expect(h.events.at(-1)?.type).toBe('moderation.appeal.submitted');
  });

  it('hides decisions about other people and rejects invalid input', () => {
    const { h, enf } = enforced();
    expect(code(() => h.mod.appeals.submit(ctxFor(member('acct_other')), { enforcementId: enf.id, statement: STATEMENT }))).toBe('MODERATION.ENFORCEMENT_NOT_FOUND');
    expect(code(() => h.mod.appeals.submit(seller(), { enforcementId: enf.id, statement: 'no' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.mod.appeals.submit(seller(), { enforcementId: 'enf_bad', statement: STATEMENT }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.mod.appeals.submit(ctxFor({ kind: 'anonymous', id: 'anonymous', roles: [], tenantId: 'tnt_default' }), { enforcementId: enf.id, statement: STATEMENT }))).toBe('AUTH.REQUIRED');
  });

  it('closes the window after 14 days but not a moment earlier', () => {
    const early = enforced();
    early.h.clock.advance(APPEAL_WINDOW_MS);
    expect(appeal(early.h, early.enf.id).status).toBe('submitted');
    const late = enforced();
    late.h.clock.advance(APPEAL_WINDOW_MS + 1);
    expect(code(() => appeal(late.h, late.enf.id))).toBe('MODERATION.APPEAL_WINDOW_CLOSED');
    expect(late.h.mod.enforcement.mine(seller(), {})[0]?.appealDeadline).toBe((late.h.mod.enforcement.mine(seller(), {})[0]?.appliedAt ?? 0) + 14 * DAY);
  });

  it('does not allow appealing dismissals or replays of a reversed decision', () => {
    const { h, enf } = enforced({ action: 'dismiss' });
    expect(code(() => appeal(h, enf.id))).toBe('MODERATION.NOT_APPEALABLE');
    const o = enforced();
    inReview(o.h, o.enf.id);
    const id = o.h.mod.appeals.list(reviewer(), { status: 'in_review' })[0]?.id ?? '';
    o.h.mod.appeals.decide(reviewer(), { appealId: id, outcome: 'overturned', note: 'content was fine' });
    expect(code(() => appeal(o.h, o.enf.id))).toBe('MODERATION.APPEAL_EXISTS');
  });

  it('requires a reviewer who took no part in the decision', () => {
    const { h, enf } = enforced({ action: 'ban' });
    const approved = h.mod.enforcement.approve(reviewer('acct_mod2'), { enforcementId: enf.id });
    const a = appeal(h, approved.id);
    expect(code(() => h.mod.appeals.claim(reviewer('acct_mod1'), { appealId: a.id }))).toBe('MODERATION.REVIEWER_CONFLICT');
    expect(code(() => h.mod.appeals.claim(reviewer('acct_mod2'), { appealId: a.id }))).toBe('MODERATION.REVIEWER_CONFLICT');
    expect(code(() => h.mod.appeals.claim(ctxFor(member('acct_seller')), { appealId: a.id }))).toBe('AUTHZ.FORBIDDEN');
    expect(h.mod.appeals.claim(reviewer(), { appealId: a.id })).toMatchObject({ status: 'in_review', reviewerId: 'acct_mod3' });
    expect(code(() => h.mod.appeals.claim(reviewer('acct_mod4'), { appealId: a.id }))).toBe('MODERATION.INVALID_TRANSITION');
  });

  it('only the claiming reviewer decides, and only after claiming', () => {
    const { h, enf } = enforced();
    const a = appeal(h, enf.id);
    const decide = (ctx = reviewer()) => h.mod.appeals.decide(ctx, { appealId: a.id, outcome: 'upheld', note: 'decision stands' });
    expect(code(() => decide())).toBe('MODERATION.INVALID_TRANSITION');
    h.mod.appeals.claim(reviewer(), { appealId: a.id });
    expect(code(() => decide(reviewer('acct_mod4')))).toBe('MODERATION.NOT_ASSIGNEE');
    expect(decide().status).toBe('decided');
    expect(code(() => decide())).toBe('MODERATION.INVALID_TRANSITION');
  });

  it('upholding changes nothing', () => {
    const { h, enf } = enforced();
    const a = inReview(h, enf.id);
    const done = h.mod.appeals.decide(reviewer(), { appealId: a.id, outcome: 'upheld', note: 'the listing is prohibited' });
    expect(done).toMatchObject({ status: 'decided', outcome: 'upheld' });
    expect(h.actions.calls.map((x) => x.call)).toEqual(['removeContent']);
    expect(h.mod.enforcement.list(reviewer(), { status: 'active' })).toHaveLength(1);
    expect(h.notifier.sent.at(-1)).toMatchObject({ recipientId: 'acct_seller', template: 'moderation.appeal_decided', data: { outcome: 'upheld' } });
  });

  it('overturning restores content, drops the strike and the risk signal, and retains history', () => {
    const { h, c, enf } = enforced();
    const a = inReview(h, enf.id);
    const done = h.mod.appeals.decide(reviewer(), { appealId: a.id, outcome: 'overturned', note: 'seller proved ownership' });
    expect(done.outcome).toBe('overturned');
    expect(h.actions.calls.at(-1)).toMatchObject({ call: 'restoreContent', subjectType: 'listing', subjectId: 'lst_1' });
    expect(h.mod.enforcement.list(reviewer(), { status: 'reversed' })).toHaveLength(1);
    expect(h.mod.signals.list(reviewer(), { accountId: 'acct_seller' })[0]?.revoked).toBe(true);
    expect(h.mod.riskScoring.baseScore('acct_seller')).toBe(0);
    expect(h.mod.evidence.list(reviewer(), { caseId: c.id }).map((e) => e.kind)).toEqual(['report', 'decision', 'appeal_outcome']);
    expect(h.mod.verifyEvidenceChain(c.id).valid).toBe(true);
    expect(done.history.map((x) => x.to)).toEqual(['submitted', 'in_review', 'decided']);
    expect(done.reviewerId).toBe('acct_mod3');
    const notice = h.mod.appeals.mine(seller(), {})[0];
    expect(notice?.outcome).toBe('overturned');
    expect(JSON.stringify(notice)).not.toContain('acct_mod3');
    expect(h.mod.enforcement.mine(seller(), {})[0]).toMatchObject({ status: 'reversed', appealable: false });
  });

  it('overturning a ban reinstates the account', () => {
    const { h, enf } = enforced({ action: 'ban' });
    const approved = h.mod.enforcement.approve(reviewer('acct_mod2'), { enforcementId: enf.id });
    const a = inReview(h, approved.id);
    h.mod.appeals.decide(reviewer(), { appealId: a.id, outcome: 'overturned', note: 'mistaken identity' });
    expect(h.actions.calls.map((x) => x.call)).toEqual(['suspendAccount', 'reinstateAccount']);
  });

  it('replaces a decision with a milder one when modified', () => {
    const { h, enf } = enforced({ action: 'suspend', durationMs: 7 * DAY });
    const a = inReview(h, enf.id);
    const done = h.mod.appeals.decide(reviewer(), {
      appealId: a.id,
      outcome: 'modified',
      note: 'first offence, warning is enough',
      modified: { action: 'warn' },
    });
    expect(done.outcome).toBe('modified');
    expect(h.actions.calls.map((x) => x.call)).toEqual(['suspendAccount', 'reinstateAccount']);
    const active = h.mod.enforcement.list(reviewer(), { status: 'active' });
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({ id: done.replacementId, action: 'warn', policyClause: 'TOS-4.2', deciderId: 'acct_mod3' });
    const notice = h.mod.enforcement.mine(seller(), {}).find((n) => n.id === done.replacementId);
    expect(notice?.appealable).toBe(false);
    expect(h.events.map((e) => e.type)).toEqual(expect.arrayContaining(['moderation.enforcement.reversed', 'moderation.appeal.decided']));
  });

  it('rejects malformed or non-milder modifications', () => {
    const { h, enf } = enforced({ action: 'suspend', durationMs: 7 * DAY });
    const a = inReview(h, enf.id);
    const decide = (over: Record<string, unknown>) => h.mod.appeals.decide(reviewer(), { appealId: a.id, note: 'reviewed carefully', ...over } as never);
    expect(code(() => decide({ outcome: 'modified', modified: { action: 'suspend', durationMs: DAY } }))).toBe('MODERATION.MODIFICATION_NOT_MILDER');
    expect(code(() => decide({ outcome: 'modified' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => decide({ outcome: 'upheld', modified: { action: 'warn' } }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => decide({ outcome: 'modified', modified: { action: 'suspend' } }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => decide({ outcome: 'modified', modified: { action: 'ban' } }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => decide({ outcome: 'maybe' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(h.mod.appeals.list(reviewer(), { status: 'in_review' })[0]?.status).toBe('in_review');
    expect(h.mod.enforcement.list(reviewer(), { status: 'active' })).toHaveLength(1);
  });

  it('is idempotent per key and rejects key reuse with a different request', () => {
    const { h, enf } = enforced();
    const a = appeal(h, enf.id, 'key-appeal-01');
    const b = appeal(h, enf.id, 'key-appeal-01');
    expect(b).toEqual(a);
    expect(h.deps.store.collection('moderation_appeals').count()).toBe(1);
    expect(code(() => h.mod.appeals.submit(ctxFor(member('acct_seller'), 'key-appeal-01'), { enforcementId: enf.id, statement: 'a different statement entirely' }))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('lists appeals for reviewers only', () => {
    const { h, enf } = enforced();
    appeal(h, enf.id);
    expect(h.mod.appeals.list(reviewer(), { status: 'submitted' })).toHaveLength(1);
    expect(code(() => h.mod.appeals.list(seller(), {}))).toBe('AUTHZ.FORBIDDEN');
  });
});
