import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AccountSnapshot, Actor } from '@classrup/kernel';
import { ANONYMOUS, DAY } from '@classrup/kernel';
import { PolicyAuthorizer } from '@classrup/security';
import { MODULES, POLICIES } from '../src/index';
import { admin, ctxFor, member, moderator, setup, system } from './fixtures';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

describe('package contract', () => {
  it('maps every F12 hierarchy module of INDEX.md to a descriptor with an existing directory', () => {
    const index = readFileSync(`${repoRoot}INDEX.md`, 'utf8');
    const listed = [...index.matchAll(/\[(F12\.S\d{2}\.M\d{2}) (mod_\w+)\]\((12_Moderation\/[^/]+\/mod_\w+)\/SPEC\.md\)/g)].map((m) => [m[1], m[3]]);
    expect(listed).toHaveLength(10);
    expect(MODULES.map((m) => [m.id, m.path])).toEqual(listed);
    for (const m of MODULES) expect(existsSync(`${repoRoot}${m.path}`)).toBe(true);
  });

  it('uses the naming registry for operations, collections and flags', () => {
    const h = setup();
    const flags = new Set(MODULES.map((m) => m.flag));
    expect(h.mod.operations).toHaveLength(31);
    for (const op of h.mod.operations) {
      expect(op.name).toMatch(/^moderation\.[a-z]+\.[a-z_]+$/);
      expect(flags.has(op.flag)).toBe(true);
    }
    for (const m of MODULES) {
      expect(m.flag).toMatch(/^moderation\.[a-z]+$/);
      for (const c of m.collections ?? []) expect(c).toMatch(/^moderation_[a-z_]+$/);
      for (const e of m.events ?? []) expect(e).toMatch(/^moderation\.[a-z]+\.[a-z_]+$/);
    }
  });

  it('declares exactly the permissions the policies grant, none of them public', () => {
    const declared = new Set(MODULES.flatMap((m) => m.permissions ?? []));
    const granted = new Set(POLICIES.map((p) => p.permission));
    expect([...declared].sort()).toEqual([...granted].sort());
    expect(POLICIES.every((p) => p.public !== true)).toBe(true);
  });

  it('denies by default and grants by role', () => {
    const authz = new PolicyAuthorizer(POLICIES);
    const allowedFor = (actor: Actor) => POLICIES.map((p) => p.permission).filter((p) => authz.can(actor, p));
    expect(allowedFor(ANONYMOUS('tnt_default'))).toEqual([]);
    expect(authz.can(member('acct_a'), 'moderation.case:delete')).toBe(false);
    const memberPerms = allowedFor(member('acct_a')).sort();
    expect(memberPerms).toEqual(
      [
        'moderation.report:create',
        'moderation.report:read_own',
        'moderation.enforcement:read_own',
        'moderation.appeal:create',
        'moderation.appeal:read_own',
        'moderation.block:create',
        'moderation.block:remove',
        'moderation.block:read_own',
        'moderation.limits:read_own',
      ].sort(),
    );
    expect(allowedFor(moderator('acct_m'))).not.toContain('moderation.case:assign');
    expect(allowedFor(admin('acct_boss'))).toContain('moderation.case:assign');
    expect(allowedFor(system())).toEqual(
      expect.arrayContaining(['moderation.signal:record', 'moderation.spam:assess', 'moderation.enforcement:expire', 'moderation.limits:check']),
    );
    expect(allowedFor(system())).not.toContain('moderation.enforcement:decide');
  });

  it('rejects malformed input at every operation boundary without echoing it', () => {
    const h = setup();
    const everything: Actor = { kind: 'user', id: 'acct_all', roles: ['moderator', 'admin', 'system'], tenantId: 'tnt_default' };
    const optionalOnly = new Set([
      'moderation.report.mine',
      'moderation.case.list',
      'moderation.enforcement.list',
      'moderation.enforcement.mine',
      'moderation.enforcement.expire_due',
      'moderation.appeal.list',
      'moderation.appeal.mine',
      'moderation.block.list',
      'moderation.limits.mine',
    ]);
    for (const op of h.mod.operations.filter((o) => !optionalOnly.has(o.name))) {
      let error: { code?: string; details?: { issues?: string[] } } | undefined;
      try {
        op.handler(ctxFor(everything), { unexpected: 'SECRET-VALUE' });
      } catch (e) {
        error = e as typeof error;
      }
      expect(error?.code, op.name).toBe('VALIDATION.INVALID_INPUT');
      expect(JSON.stringify(error?.details), op.name).not.toContain('SECRET-VALUE');
    }
  });
});

describe('end-to-end through the operation surface', () => {
  it('exercises every operation, returns JSON-safe DTOs and emits only declared events', () => {
    const accounts = new Map<string, AccountSnapshot>();
    const h = setup({ accounts });
    accounts.set('acct_seller', { id: 'acct_seller', tenantId: 'tnt_default', pseudonym: 'seller', status: 'active', signingKeyIds: [], boxKeyIds: [], createdAt: h.clock.now() - 10 * DAY });
    for (const [i, owner] of [[1, 'acct_seller'], [2, 'acct_seller'], [3, 'acct_seller'], [4, 'acct_other'], [5, 'acct_third']] as const) h.owners.set(`listing:lst_${i}`, owner);
    const called = new Set<string>();
    const call = <T = Record<string, unknown>>(name: string, actor: Actor, input: unknown = {}): T => {
      called.add(name);
      const op = h.mod.operations.find((o) => o.name === name);
      if (!op) throw new Error(`unknown operation ${name}`);
      const out = op.handler(ctxFor(actor), input);
      expect(JSON.parse(JSON.stringify(out)), name).toEqual(out);
      return out as T;
    };
    const [mod1, mod2, mod3, boss, sys] = [moderator('acct_mod1'), moderator('acct_mod2'), moderator('acct_mod3'), admin('acct_boss'), system()];

    // reporting, queue, evidence
    const submit = { subjectType: 'listing', subjectId: 'lst_1', reason: 'scam_fraud' };
    call('moderation.report.submit', member('acct_r1'), submit);
    call('moderation.report.submit', member('acct_r1'), submit);
    const caseId = call<{ id: string }[]>('moderation.case.list', mod1)[0]?.id ?? '';
    call('moderation.case.claim', mod1, { caseId });
    call('moderation.case.release', mod1, { caseId });
    call('moderation.case.assign', boss, { caseId, assigneeId: 'acct_mod1' });
    call('moderation.case.get', mod1, { caseId });
    call('moderation.evidence.add', mod1, { caseId, kind: 'note', ref: 'n1', content: 'seen it' });
    call('moderation.evidence.list', mod1, { caseId });
    expect(call<{ valid: boolean }>('moderation.evidence.verify', mod1, { caseId }).valid).toBe(true);
    for (const r of ['acct_r2', 'acct_r3', 'acct_r4']) {
      call('moderation.report.submit', member(r), { subjectType: 'account', subjectId: 'acct_bully', reason: 'harassment' });
    }
    call('moderation.report.list', mod1, { caseId });
    call('moderation.report.mine', member('acct_r1'));

    // enforcement: warning, strikes, rejected ban, suspension and its expiry, approved ban
    const warn = call<{ id: string }>('moderation.enforcement.decide', mod1, { caseId, action: 'warn', policyClause: 'TOS-1.1', reason: 'misleading listing' });
    for (const i of [2, 3]) h.decide(h.claimedCase({ subjectId: `lst_${i}` }).id);
    const banCase = h.claimedCase({ subjectId: 'lst_4' });
    const pendingBan = call<{ id: string }>('moderation.enforcement.decide', mod1, { caseId: banCase.id, action: 'ban', policyClause: 'TOS-9', reason: 'repeat fraud' });
    call('moderation.enforcement.list', mod2, {});
    call('moderation.enforcement.reject', mod2, { enforcementId: pendingBan.id, reason: 'start with a suspension' });
    call('moderation.enforcement.decide', mod1, { caseId: banCase.id, action: 'suspend', durationMs: DAY, policyClause: 'TOS-9', reason: 'one day cool-off' });
    const banCase2 = h.claimedCase({ subjectId: 'lst_5' });
    const ban = call<{ id: string }>('moderation.enforcement.decide', mod1, { caseId: banCase2.id, action: 'ban', policyClause: 'TOS-9', reason: 'repeat fraud' });
    call('moderation.enforcement.approve', mod2, { enforcementId: ban.id });
    h.clock.advance(DAY);
    call('moderation.enforcement.expire_due', sys);
    call('moderation.enforcement.mine', member('acct_seller'));

    // appeals
    const appeal = call<{ id: string }>('moderation.appeal.submit', member('acct_seller'), { enforcementId: warn.id, statement: 'the listing was accurate, see photos' });
    call('moderation.appeal.list', mod3);
    call('moderation.appeal.claim', mod3, { appealId: appeal.id });
    call('moderation.appeal.decide', mod3, { appealId: appeal.id, outcome: 'overturned', note: 'photos confirm the item' });
    call('moderation.appeal.mine', member('acct_seller'));

    // abuse, spam, signals, risk, limits
    call('moderation.block.create', member('acct_a'), { accountId: 'acct_b' });
    call('moderation.block.list', member('acct_a'));
    call('moderation.block.remove', member('acct_a'), { accountId: 'acct_b' });
    for (const a of ['s1', 's2', 's3', 's4', 's5', 's6']) h.mod.assessContent({ accountId: a, accountAgeMs: 30 * DAY, textHash: 'hash-wave-e2e', text: 'cheap pills' });
    const spam = call<{ decision: string }>('moderation.spam.assess', sys, {
      accountId: 's7',
      accountAgeMs: 30 * DAY,
      textHash: 'hash-wave-e2e',
      text: 'http://a.io http://b.io http://c.io http://d.io http://e.io buy',
    });
    expect(spam.decision).toBe('block');
    call('moderation.signal.record', sys, { accountId: 'acct_seller', kind: 'payment_failed' });
    call('moderation.signal.list', mod1, { accountId: 'acct_seller' });
    call('moderation.risk.assess', mod1, { accountId: 'acct_seller', action: 'commerce.payment.claim' });
    call('moderation.limits.mine', member('acct_seller'));
    call('moderation.limits.check', sys, { accountId: 'acct_seller', accountAgeMs: 10 * DAY, kind: 'open_offers', used: 1 });

    expect([...called].sort()).toEqual(h.mod.operations.map((o) => o.name).sort());
    const declared = new Set(MODULES.flatMap((m) => m.events ?? []));
    const emitted = new Set(h.events.map((e) => e.type));
    expect([...emitted].filter((t) => !declared.has(t))).toEqual([]);
    expect([...declared].filter((t) => !emitted.has(t))).toEqual([]);
  });
});
