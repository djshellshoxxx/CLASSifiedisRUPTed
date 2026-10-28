import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DAY, HOUR, staticFlags } from '@classrup/kernel';
import type { EvidenceRecord } from '../src/index';
import { computePriority, GENESIS_HASH, REASON_SEVERITY, reporterTrust } from '../src/index';
import { slaDue, slaWindowMs } from '../src/reporting/priority';
import { admin, ctxFor, member, moderator, setup, system } from './fixtures';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
};

describe('F12.S01.M01 reports and cases', () => {
  it('files a report and opens one prioritised case', () => {
    const h = setup();
    const r = h.report('acct_a', { details: 'looks like a scam' });
    expect(r).toMatchObject({ subjectType: 'listing', subjectId: 'lst_1', reason: 'scam_fraud', status: 'open', submissions: 1, merged: false });
    const [c] = h.queue();
    expect(c).toMatchObject({ status: 'open', reportCount: 1, priority: REASON_SEVERITY.scam_fraud, slaBreached: false });
    expect(c?.slaDueAt).toBe((c?.openedAt ?? 0) + 24 * HOUR);
    expect(h.events.map((e) => e.type)).toEqual(['moderation.case.opened', 'moderation.report.submitted']);
  });

  it('merges a repeat report by the same reporter and counts it', () => {
    const h = setup();
    const first = h.report('acct_a');
    const again = h.report('acct_a', { reason: 'spam', details: 'second try' });
    expect(again).toMatchObject({ reportId: first.reportId, merged: true, submissions: 2, reason: 'scam_fraud' });
    const [c] = h.queue();
    expect(c).toMatchObject({ reportCount: 1, submissionCount: 2 });
    expect(h.deps.store.collection('moderation_reports').count()).toBe(1);
    expect(h.events.at(-1)?.type).toBe('moderation.report.merged');
  });

  it('aggregates distinct reporters into one case and raises priority', () => {
    const h = setup();
    h.report('acct_a', { reason: 'spam' });
    const single = h.queue()[0]?.priority ?? 0;
    h.report('acct_b', { reason: 'spam' });
    h.report('acct_c', { reason: 'scam_fraud' });
    const cases = h.queue();
    expect(cases).toHaveLength(1);
    expect(cases[0]?.reportCount).toBe(3);
    expect(cases[0]?.reasonCounts).toEqual({ spam: 2, scam_fraud: 1 });
    expect(cases[0]?.priority).toBeGreaterThan(single);
    expect(cases[0]?.priority).toBe(computePriority({ reasons: ['spam', 'scam_fraud'], reporterTrust: [0.5, 0.5, 0.5], escalated: false }));
  });

  it('keeps a separate case per subject and orders the queue by priority then age', () => {
    const h = setup();
    h.report('acct_a', { subjectId: 'lst_low', reason: 'spam' });
    h.clock.advance(1000);
    h.report('acct_b', { subjectId: 'lst_high', reason: 'minor_safety' });
    h.clock.advance(1000);
    h.report('acct_c', { subjectId: 'lst_mid', reason: 'scam_fraud' });
    expect(h.queue().map((c) => c.subjectId)).toEqual(['lst_high', 'lst_mid', 'lst_low']);
    expect(h.queue()[0]?.slaDueAt).toBe((h.queue()[0]?.openedAt ?? 0) + 4 * HOUR);
  });

  it('validates input', () => {
    const h = setup();
    const bad = (over: Record<string, unknown>) => code(() => h.mod.reports.submit(ctxFor(member('acct_a')), { subjectType: 'listing', subjectId: 'lst_1', reason: 'spam', ...over }));
    expect(bad({ reason: 'dislike' })).toBe('VALIDATION.INVALID_INPUT');
    expect(bad({ subjectType: 'planet' })).toBe('VALIDATION.INVALID_INPUT');
    expect(bad({ details: 'x'.repeat(2001) })).toBe('VALIDATION.INVALID_INPUT');
    expect(bad({ subjectId: '' })).toBe('VALIDATION.INVALID_INPUT');
    expect(bad({ excerpt: 'only for messages' })).toBe('VALIDATION.INVALID_INPUT');
    expect(bad({ subjectType: 'message' })).toBe('VALIDATION.INVALID_INPUT');
    expect(h.deps.store.collection('moderation_reports').count()).toBe(0);
  });

  it('requires message reporters to attach the decrypted excerpt, which only staff can read', () => {
    const h = setup();
    const r = h.report('acct_a', { subjectType: 'message', subjectId: 'msg_1', reason: 'harassment', excerpt: 'you will regret this' });
    expect(JSON.stringify(r)).not.toContain('regret');
    expect(JSON.stringify(h.mod.reports.mine(ctxFor(member('acct_a')), {}))).not.toContain('regret');
    const c = h.queue()[0];
    const staff = h.mod.reports.forCase(ctxFor(moderator('acct_m')), { caseId: c?.id ?? '' });
    expect(staff[0]?.excerpt).toBe('you will regret this');
    const chain = h.mod.evidence.list(ctxFor(moderator('acct_m')), { caseId: c?.id ?? '' });
    expect(chain.map((e) => e.kind)).toEqual(['report', 'message_excerpt']);
    expect(JSON.stringify(chain)).not.toContain('regret');
  });

  it('rate limits reporters and recovers with time', () => {
    const h = setup();
    for (let i = 0; i < 5; i++) h.report('acct_spammy', { subjectId: `lst_${i}` });
    let error: { code: string; details: { retryAfterMs: number } } | undefined;
    try {
      h.report('acct_spammy', { subjectId: 'lst_9' });
    } catch (e) {
      error = e as typeof error;
    }
    expect(error?.code).toBe('RATE.LIMITED');
    expect(error?.details.retryAfterMs).toBe(HOUR);
    expect(h.queue()).toHaveLength(5);
    h.clock.advance(HOUR);
    expect(h.report('acct_spammy', { subjectId: 'lst_9' }).merged).toBe(false);
    expect(code(() => h.report('acct_other', { subjectId: 'lst_9' }))).toBeUndefined();
  });

  it('rejects reporting your own account or content', () => {
    const h = setup();
    h.owners.set('listing:lst_mine', 'acct_a');
    expect(code(() => h.report('acct_a', { subjectType: 'account', subjectId: 'acct_a' }))).toBe('MODERATION.SELF_REPORT');
    expect(code(() => h.report('acct_a', { subjectId: 'lst_mine' }))).toBe('MODERATION.SELF_REPORT');
  });

  it('denies anonymous callers and non-staff on staff queries', () => {
    const h = setup();
    h.report('acct_a');
    const anon = { kind: 'anonymous', id: 'anonymous', roles: [], tenantId: 'tnt_default' } as const;
    expect(code(() => h.mod.reports.submit(ctxFor(anon), { subjectType: 'listing', subjectId: 'lst_1', reason: 'spam' }))).toBe('AUTH.REQUIRED');
    expect(code(() => h.mod.cases.list(ctxFor(member('acct_a')), {}))).toBe('AUTHZ.FORBIDDEN');
    const caseId = h.queue()[0]?.id ?? '';
    expect(code(() => h.mod.reports.forCase(ctxFor(member('acct_a')), { caseId }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => h.mod.cases.claim(ctxFor(member('acct_a')), { caseId }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => h.mod.cases.assign(ctxFor(moderator('acct_m')), { caseId, assigneeId: 'acct_m' }))).toBe('AUTHZ.FORBIDDEN');
  });

  it('is idempotent per key and rejects key reuse with a different request', () => {
    const h = setup();
    const input = { subjectType: 'listing', subjectId: 'lst_1', reason: 'spam' } as const;
    const a = h.mod.reports.submit(ctxFor(member('acct_a'), 'key-report-1'), input);
    const b = h.mod.reports.submit(ctxFor(member('acct_a'), 'key-report-1'), input);
    expect(b).toEqual(a);
    expect(h.deps.store.collection('moderation_reports').count()).toBe(1);
    expect(h.queue()[0]?.submissionCount).toBe(1);
    expect(code(() => h.mod.reports.submit(ctxFor(member('acct_a'), 'key-report-1'), { ...input, reason: 'hate' }))).toBe('IDEMPOTENCY.KEY_REUSED');
    // The same key from another reporter is a different request scope.
    expect(code(() => h.mod.reports.submit(ctxFor(member('acct_b'), 'key-report-1'), input))).toBeUndefined();
  });

  it('hides reporter identity from events and staff case views', () => {
    const h = setup();
    h.report('acct_reporter_secret');
    const c = h.queue()[0];
    const blob = JSON.stringify([h.events, c, h.mod.cases.get(ctxFor(moderator('acct_m')), { caseId: c?.id ?? '' })]);
    expect(blob).not.toContain('acct_reporter_secret');
    expect(h.events.every((e) => e.actorId === 'moderation.anonymous')).toBe(true);
    expect(h.mod.reports.mine(ctxFor(member('acct_reporter_secret')), {})).toHaveLength(1);
    expect(h.mod.reports.mine(ctxFor(member('acct_someone_else')), {})).toHaveLength(0);
    expect(h.mod.reports.forCase(ctxFor(moderator('acct_m')), { caseId: c?.id ?? '' })[0]?.reporterId).toBe('acct_reporter_secret');
  });

  it('respects the feature flag', () => {
    const h = setup({ flags: staticFlags(['moderation.flags']) });
    expect(code(() => h.report('acct_a'))).toBe('FEATURE.DISABLED');
  });
});

describe('harassment pattern', () => {
  const harass = (h: ReturnType<typeof setup>, reporter: string) => h.report(reporter, { subjectType: 'account', subjectId: 'acct_bully', reason: 'harassment' });

  it('escalates when three distinct reporters report an account within seven days', () => {
    const h = setup();
    harass(h, 'acct_r1');
    harass(h, 'acct_r2');
    expect(h.queue()[0]?.escalated).toBe(false);
    const before = h.queue()[0]?.priority ?? 0;
    harass(h, 'acct_r3');
    const c = h.queue()[0];
    expect(c?.escalated).toBe(true);
    expect(c?.priority).toBe(computePriority({ reasons: ['harassment'], reporterTrust: [0.5, 0.5, 0.5], escalated: true }));
    expect(c?.priority).toBeGreaterThan(before);
    expect(h.events.filter((e) => e.type === 'moderation.case.escalated')).toHaveLength(1);
  });

  it('also raises open cases about the same account made through content reports', () => {
    const h = setup();
    h.owners.set('listing:lst_bully', 'acct_bully');
    h.report('acct_r1', { subjectId: 'lst_bully', reason: 'spam' });
    harass(h, 'acct_r2');
    harass(h, 'acct_r3');
    harass(h, 'acct_r4');
    const byType = Object.fromEntries(h.queue().map((c) => [c.subjectType, c]));
    expect(byType.listing?.escalated).toBe(true);
    expect(byType.account?.escalated).toBe(true);
  });

  it('does not escalate when the reports fall outside the window or come from one reporter', () => {
    const h = setup();
    harass(h, 'acct_r1');
    h.clock.advance(8 * DAY);
    harass(h, 'acct_r2');
    harass(h, 'acct_r3');
    expect(h.queue()[0]?.escalated).toBe(false);
    harass(h, 'acct_r3');
    expect(h.queue()[0]?.escalated).toBe(false);
  });

  it('ignores non-interpersonal reasons', () => {
    const h = setup();
    for (const r of ['acct_r1', 'acct_r2', 'acct_r3']) h.report(r, { subjectType: 'account', subjectId: 'acct_seller', reason: 'spam' });
    expect(h.queue()[0]?.escalated).toBe(false);
  });
});

describe('case queue', () => {
  it('claims, assigns, releases and enforces the transition table', () => {
    const h = setup();
    h.report('acct_a');
    const id = h.queue()[0]?.id ?? '';
    const claimed = h.mod.cases.claim(ctxFor(moderator('acct_m1')), { caseId: id });
    expect(claimed).toMatchObject({ status: 'claimed', assigneeId: 'acct_m1' });
    expect(code(() => h.mod.cases.claim(ctxFor(moderator('acct_m2')), { caseId: id }))).toBe('MODERATION.INVALID_TRANSITION');
    expect(code(() => h.mod.cases.release(ctxFor(moderator('acct_m2')), { caseId: id }))).toBe('MODERATION.NOT_ASSIGNEE');
    const reassigned = h.mod.cases.assign(ctxFor(admin('acct_boss')), { caseId: id, assigneeId: 'acct_m2' });
    expect(reassigned.assigneeId).toBe('acct_m2');
    const released = h.mod.cases.release(ctxFor(moderator('acct_m2')), { caseId: id });
    expect(released).toMatchObject({ status: 'open' });
    expect(released.assigneeId).toBeUndefined();
    expect(h.events.map((e) => e.type)).toEqual(
      expect.arrayContaining(['moderation.case.claimed', 'moderation.case.assigned', 'moderation.case.released']),
    );
  });

  it('keeps moderators with a conflict of interest away from the case', () => {
    const h = setup();
    h.report('acct_m1');
    const id = h.queue()[0]?.id ?? '';
    expect(code(() => h.mod.cases.claim(ctxFor(moderator('acct_m1')), { caseId: id }))).toBe('MODERATION.CONFLICT_OF_INTEREST');
    h.report('acct_a', { subjectType: 'account', subjectId: 'acct_m9' });
    const own = h.queue().find((c) => c.subjectId === 'acct_m9')?.id ?? '';
    expect(code(() => h.mod.cases.claim(ctxFor(moderator('acct_m9')), { caseId: own }))).toBe('MODERATION.CONFLICT_OF_INTEREST');
  });

  it('detects stale versions and unknown cases', () => {
    const h = setup();
    h.report('acct_a');
    const c = h.queue()[0];
    expect(code(() => h.mod.cases.claim(ctxFor(moderator('acct_m1')), { caseId: c?.id ?? '', expectedVersion: (c?.version ?? 0) + 5 }))).toBe('STORE.VERSION_CONFLICT');
    expect(code(() => h.mod.cases.get(ctxFor(moderator('acct_m1')), { caseId: 'mcase_00000000000000000000000000' }))).toBe('MODERATION.CASE_NOT_FOUND');
    expect(code(() => h.mod.cases.get(ctxFor(moderator('acct_m1')), { caseId: 'nope' }))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('flags SLA breaches as time passes', () => {
    const h = setup();
    h.report('acct_a', { reason: 'spam' });
    expect(h.queue()[0]?.slaBreached).toBe(false);
    h.clock.advance(72 * HOUR + 1);
    expect(h.queue()[0]?.slaBreached).toBe(true);
  });

  it('isolates tenants', () => {
    const h = setup();
    h.report('acct_a');
    const outsider = { ...moderator('acct_m'), tenantId: 'tnt_other' };
    expect(h.mod.cases.list(ctxFor(outsider), {})).toHaveLength(0);
    expect(code(() => h.mod.cases.get(ctxFor(outsider), { caseId: h.queue()[0]?.id ?? '' }))).toBe('MODERATION.CASE_NOT_FOUND');
  });
});

describe('priority and SLA properties', () => {
  const reasons = fc.constantFrom(...(Object.keys(REASON_SEVERITY) as (keyof typeof REASON_SEVERITY)[]));
  const trusts = fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { maxLength: 30 });

  it('is bounded and monotonic in report count, severity and escalation', () => {
    fc.assert(
      fc.property(fc.array(reasons, { minLength: 1, maxLength: 5 }), trusts, reasons, fc.double({ min: 0, max: 1, noNaN: true }), (rs, ts, extraReason, extraTrust) => {
        const base = computePriority({ reasons: rs, reporterTrust: ts, escalated: false });
        const moreReports = computePriority({ reasons: rs, reporterTrust: [...ts, extraTrust], escalated: false });
        const moreReasons = computePriority({ reasons: [...rs, extraReason], reporterTrust: ts, escalated: false });
        const escalated = computePriority({ reasons: rs, reporterTrust: ts, escalated: true });
        return base >= 0 && base <= 100 && escalated <= 100 && moreReports >= base && moreReasons >= base && escalated >= base;
      }),
    );
  });

  it('trusted reporters weigh at least as much as distrusted ones', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), fc.integer({ min: 1, max: 12 }), (a, b, n) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const low = computePriority({ reasons: ['spam'], reporterTrust: Array(n).fill(lo), escalated: false });
        const high = computePriority({ reasons: ['spam'], reporterTrust: Array(n).fill(hi), escalated: false });
        return high >= low;
      }),
    );
    expect(reporterTrust(0, 0)).toBe(0.5);
    expect(reporterTrust(8, 0)).toBeGreaterThan(reporterTrust(0, 8));
  });

  it('only ever tightens the SLA deadline', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e12 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), (openedAt, p1, p2) => {
        const first = slaDue(openedAt, p1);
        const second = slaDue(openedAt, p2, first);
        return second <= first && second === Math.min(first, openedAt + slaWindowMs(p2));
      }),
    );
  });
});

describe('F12.S01.M02 evidence chain', () => {
  const evidenceCol = (h: ReturnType<typeof setup>) => h.deps.store.collection<EvidenceRecord>('moderation_evidence');

  function caseWithEvidence() {
    const h = setup();
    h.report('acct_a');
    const caseId = h.queue()[0]?.id ?? '';
    const ctx = () => ctxFor(moderator('acct_m'));
    h.mod.evidence.add(ctx(), { caseId, kind: 'screenshot_ref', ref: 'blob:shot1', content: 'pixels' });
    h.mod.evidence.add(ctx(), { caseId, kind: 'note', ref: 'note:1', contentHash: `sha256:${'A'.repeat(43)}` });
    return { h, caseId, ctx };
  }

  it('links items into a verifiable hash chain starting at genesis', () => {
    const { h, caseId, ctx } = caseWithEvidence();
    const chain = h.mod.evidence.list(ctx(), { caseId });
    expect(chain.map((e) => e.seq)).toEqual([1, 2, 3]);
    expect(chain[0]?.prevHash).toBe(GENESIS_HASH);
    expect(chain[1]?.prevHash).toBe(chain[0]?.hash);
    expect(chain[2]?.prevHash).toBe(chain[1]?.hash);
    expect(h.mod.evidence.verify(ctx(), { caseId })).toEqual({ caseId, valid: true, length: 3 });
    expect(h.mod.verifyEvidenceChain(caseId).valid).toBe(true);
    expect(JSON.stringify(chain)).not.toContain('pixels');
  });

  it('detects altered content, rewritten links, gaps and truncation', () => {
    const edit = (mutate: (items: EvidenceRecord[], h: ReturnType<typeof setup>) => void) => {
      const { h, caseId, ctx } = caseWithEvidence();
      mutate(evidenceCol(h).list().sort((a, b) => a.seq - b.seq), h);
      return h.mod.evidence.verify(ctx(), { caseId });
    };
    const col = (h: ReturnType<typeof setup>) => evidenceCol(h);
    expect(edit((i, h) => col(h).put({ ...i[1]!, contentHash: `sha256:${'B'.repeat(43)}` }, i[1]!.version))).toMatchObject({ valid: false, brokenAtSeq: 2, reason: 'hash_mismatch' });
    expect(edit((i, h) => col(h).put({ ...i[2]!, prevHash: GENESIS_HASH }, i[2]!.version))).toMatchObject({ valid: false, brokenAtSeq: 3, reason: 'prev_hash_mismatch' });
    expect(edit((i, h) => col(h).delete(i[1]!.id, i[1]!.version))).toMatchObject({ valid: false, brokenAtSeq: 3, reason: 'sequence_gap' });
    expect(edit((i, h) => col(h).delete(i[2]!.id, i[2]!.version))).toMatchObject({ valid: false, reason: 'head_mismatch' });
  });

  it('validates input and authorization and replays idempotently', () => {
    const { h, caseId, ctx } = caseWithEvidence();
    expect(code(() => h.mod.evidence.add(ctx(), { caseId, kind: 'note', ref: 'r' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.mod.evidence.add(ctx(), { caseId, kind: 'note', ref: 'r', content: 'x', contentHash: `sha256:${'A'.repeat(43)}` }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.mod.evidence.add(ctx(), { caseId, kind: 'note', ref: 'r', contentHash: 'md5:abc' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.mod.evidence.add(ctx(), { caseId, kind: 'decision', ref: 'r', content: 'x' } as never))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.mod.evidence.add(ctxFor(member('acct_a')), { caseId, kind: 'note', ref: 'r', content: 'x' }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => h.mod.evidence.list(ctxFor(member('acct_a')), { caseId }))).toBe('AUTHZ.FORBIDDEN');
    const input = { caseId, kind: 'note', ref: 'r', content: 'x' } as const;
    const a = h.mod.evidence.add(ctxFor(moderator('acct_m'), 'key-evid-001'), input);
    const b = h.mod.evidence.add(ctxFor(moderator('acct_m'), 'key-evid-001'), input);
    expect(b).toEqual(a);
    expect(h.mod.evidence.list(ctx(), { caseId })).toHaveLength(4);
    expect(code(() => h.mod.evidence.add(ctxFor(moderator('acct_m'), 'key-evid-001'), { ...input, ref: 'other' }))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('has no update or delete operation: the surface is append-only', () => {
    const h = setup();
    const names = h.mod.operations.filter((o) => o.name.startsWith('moderation.evidence.')).map((o) => o.name);
    expect(names.sort()).toEqual(['moderation.evidence.add', 'moderation.evidence.list', 'moderation.evidence.verify']);
  });

  it('verifies for any sequence of appended items (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1, maxLength: 40 }), { minLength: 0, maxLength: 12 }), (contents) => {
        const h = setup();
        h.report('acct_a');
        const caseId = h.queue()[0]?.id ?? '';
        for (const [i, content] of contents.entries()) {
          if (content.trim().length === 0) continue;
          h.clock.advance(i);
          h.mod.evidence.add(ctxFor(moderator('acct_m')), { caseId, kind: 'note', ref: `n:${i}`, content });
        }
        return h.mod.verifyEvidenceChain(caseId).valid;
      }),
      { numRuns: 30 },
    );
  });

  it('records system actors only through the permitted paths', () => {
    const h = setup();
    h.report('acct_a');
    const caseId = h.queue()[0]?.id ?? '';
    expect(code(() => h.mod.evidence.add(ctxFor(system()), { caseId, kind: 'note', ref: 'r', content: 'x' }))).toBe('AUTHZ.FORBIDDEN');
  });
});
