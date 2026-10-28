/**
 * F12.S02.M01 enforcement: moderator decisions on cases. Each decision cites a policy clause and a
 * reason, adds a graduated strike, calls the owning features through SubjectActionsPort and notifies
 * the subject. Bans and minor-safety decisions are executed only after a second moderator approves.
 */
import type { CommandContext, EventInput } from '@classrup/kernel';
import { assertTransition, assertVersion, conflict, DAY, forbidden, MINUTE, parse, precondition, runCommand, schemas, z } from '@classrup/kernel';
import { contentHash } from '@classrup/security';
import { authorize, event, inTenant, operation, pageOf } from '../common';
import type { Env } from '../common';
import { insertSignal, revokeBySource, signalEvent } from '../antifraud/signals';
import { CASE_TRANSITIONS, saveCase } from '../reporting/cases';
import { appendEvidence } from '../reporting/evidence';
import type { CaseRecord, EnforcementAction, EnforcementRecord, EnforcementStatus, RestrictionFeature, SubjectType } from '../types';
import { ENFORCEMENT_ACTIONS, RESTRICTION_FEATURES } from '../types';
import { activeRestrictions, activeStrikes, hasOtherActiveSuspension, SUSPENSION_RECOMMENDATION_STRIKES } from './strikes';

export const APPEAL_WINDOW_MS = 14 * DAY;
export const MAX_ACTION_DURATION_MS = 365 * DAY;

export const ACTION_SEVERITY: Readonly<Record<EnforcementAction, number>> = { dismiss: 0, warn: 1, remove_content: 2, restrict: 3, suspend: 4, ban: 5 };

/** Signal weight a sustained report adds to the subject's risk profile. */
const SIGNAL_WEIGHT: Readonly<Record<EnforcementAction, number>> = { dismiss: 0, warn: 10, remove_content: 15, restrict: 20, suspend: 30, ban: 50 };

export const ENFORCEMENT_TRANSITIONS: Readonly<Record<EnforcementStatus, readonly EnforcementStatus[]>> = {
  pending_approval: ['active', 'dismissed', 'rejected'],
  active: ['expired', 'reversed'],
  expired: ['reversed'],
  rejected: [],
  dismissed: [],
  reversed: [],
};

const ACCOUNT_ACTIONS: ReadonlySet<EnforcementAction> = new Set<EnforcementAction>(['warn', 'restrict', 'suspend', 'ban']);
const POLICY_CLAUSE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,39}$/;

export const actionShape = {
  action: z.enum(ENFORCEMENT_ACTIONS),
  durationMs: z.number().int().min(MINUTE).max(MAX_ACTION_DURATION_MS).optional(),
  restriction: z.enum(RESTRICTION_FEATURES).optional(),
};

export interface ActionSpec {
  readonly action: EnforcementAction;
  readonly durationMs?: number | undefined;
  readonly restriction?: RestrictionFeature | undefined;
}

/** Cross-field rules of an action spec; shared with appeal modifications. */
export function actionSpecIssues(v: ActionSpec): { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = [];
  if (v.action === 'suspend' && v.durationMs === undefined) issues.push({ path: 'durationMs', message: 'suspend requires a duration' });
  if (v.action === 'restrict' && v.restriction === undefined) issues.push({ path: 'restriction', message: 'restrict requires the restricted feature' });
  if (v.action !== 'suspend' && v.action !== 'restrict' && v.durationMs !== undefined) issues.push({ path: 'durationMs', message: 'duration only applies to suspend and restrict' });
  if (v.action !== 'restrict' && v.restriction !== undefined) issues.push({ path: 'restriction', message: 'restriction only applies to restrict' });
  return issues;
}

const refineSpec = (v: ActionSpec, ctx: z.RefinementCtx): void => {
  for (const i of actionSpecIssues(v)) ctx.addIssue({ code: 'custom', path: [i.path], message: i.message });
};

const decideSchema = z
  .object({
    caseId: schemas.id('mcase'),
    expectedVersion: z.number().int().positive().optional(),
    ...actionShape,
    policyClause: z.string().regex(POLICY_CLAUSE_RE),
    reason: schemas.text(3, 1000),
    /** Account that owns the subject when the relay could not resolve it; required for account-level actions. */
    subjectAccountId: schemas.text(1, 64).optional(),
  })
  .superRefine(refineSpec);
const approvalSchema = z.object({ enforcementId: schemas.id('enf') });
const rejectSchema = approvalSchema.extend({ reason: schemas.text(3, 500) });
const listSchema = z.object({
  status: z.enum(['pending_approval', 'active', 'expired', 'reversed', 'rejected', 'dismissed']).default('pending_approval'),
  caseId: schemas.id('mcase').optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});
const mineSchema = z.object({ limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).default(0) });

export type DecideInput = z.input<typeof decideSchema>;

/** Moderator view. */
export interface EnforcementStaffDto {
  readonly id: string;
  readonly caseId: string;
  readonly subjectType: SubjectType;
  readonly subjectId: string;
  readonly subjectAccountId?: string;
  readonly action: EnforcementAction;
  readonly policyClause: string;
  readonly reason: string;
  readonly durationMs?: number;
  readonly restriction?: RestrictionFeature;
  readonly status: EnforcementStatus;
  readonly deciderId: string;
  readonly approverId?: string;
  readonly decidedAt: number;
  readonly appliedAt?: number;
  readonly expiresAt?: number;
  readonly appealDeadline?: number;
  readonly appealId?: string;
  readonly suspensionRecommended: boolean;
  readonly requiresApproval: boolean;
}

/** Subject view: what was decided and how to appeal; no moderator or reporter identities. */
export interface EnforcementNoticeDto {
  readonly id: string;
  readonly action: EnforcementAction;
  readonly policyClause: string;
  readonly reason: string;
  readonly subjectType: SubjectType;
  readonly subjectId: string;
  readonly durationMs?: number;
  readonly restriction?: RestrictionFeature;
  readonly status: EnforcementStatus;
  readonly appliedAt?: number;
  readonly expiresAt?: number;
  readonly appealDeadline?: number;
  readonly appealable: boolean;
  readonly appealId?: string;
}

const optional = <K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> =>
  (value === undefined ? {} : { [key]: value }) as Partial<Record<K, V>>;

export const staffDto = (e: EnforcementRecord): EnforcementStaffDto => ({
  id: e.id,
  caseId: e.caseId,
  subjectType: e.subjectType,
  subjectId: e.subjectId,
  ...optional('subjectAccountId', e.subjectAccountId),
  action: e.action,
  policyClause: e.policyClause,
  reason: e.reason,
  ...optional('durationMs', e.durationMs),
  ...optional('restriction', e.restriction),
  status: e.status,
  deciderId: e.deciderId,
  ...optional('approverId', e.approverId),
  decidedAt: e.decidedAt,
  ...optional('appliedAt', e.appliedAt),
  ...optional('expiresAt', e.expiresAt),
  ...optional('appealDeadline', e.appealDeadline),
  ...optional('appealId', e.appealId),
  suspensionRecommended: e.suspensionRecommended,
  requiresApproval: e.requiresApproval,
});

export const noticeDto = (e: EnforcementRecord): EnforcementNoticeDto => ({
  id: e.id,
  action: e.action,
  policyClause: e.policyClause,
  reason: e.reason,
  subjectType: e.subjectType,
  subjectId: e.subjectId,
  ...optional('durationMs', e.durationMs),
  ...optional('restriction', e.restriction),
  status: e.status,
  ...optional('appliedAt', e.appliedAt),
  ...optional('expiresAt', e.expiresAt),
  ...optional('appealDeadline', e.appealDeadline),
  appealable: e.appealable && e.status !== 'reversed' && e.appealId === undefined,
  ...optional('appealId', e.appealId),
});

/** Bans and every decision on a case that alleges minor-safety harm need a second moderator. */
const needsApproval = (action: EnforcementAction, c: CaseRecord): boolean => action === 'ban' || (c.reasonCounts.minor_safety ?? 0) > 0;

export interface Activation {
  readonly saved: EnforcementRecord;
  readonly events: EventInput<unknown>[];
}

export function createEnforcement(env: Env) {
  const loadCase = (ctx: CommandContext, caseId: string): CaseRecord => inTenant(env.cols.cases.get(caseId), ctx.actor, 'MODERATION.CASE_NOT_FOUND', 'case');
  const loadEnforcement = (ctx: CommandContext, id: string): EnforcementRecord =>
    inTenant(env.cols.enforcements.get(id), ctx.actor, 'MODERATION.ENFORCEMENT_NOT_FOUND', 'enforcement');

  /** Runs the side effects of a decision on other features. Every call is idempotent on the port side. */
  function runPortEffect(e: EnforcementRecord, now: number): void {
    const actions = env.ports.subjectActions;
    if (e.action === 'remove_content') actions.removeContent(e.subjectType, e.subjectId, e.reason);
    else if (e.action === 'suspend' && e.subjectAccountId !== undefined) actions.suspendAccount(e.subjectAccountId, now + (e.durationMs ?? 0), e.reason);
    else if (e.action === 'ban' && e.subjectAccountId !== undefined) actions.suspendAccount(e.subjectAccountId, null, e.reason);
  }

  function notifySubject(e: EnforcementRecord): void {
    if (e.action === 'dismiss' || e.subjectAccountId === undefined) return;
    const accountId = e.subjectAccountId;
    env.deps.store.afterCommit(() =>
      env.ports.notify.notify({
        tenantId: e.tenantId,
        recipientId: accountId,
        topic: 'moderation.enforcement',
        template: 'moderation.action_taken',
        data: { enforcementId: e.id, action: e.action, policyClause: e.policyClause, reason: e.reason, appealDeadline: e.appealDeadline ?? 0 },
        dedupKey: e.id,
        priority: 'high',
      }),
    );
  }

  /** Makes a pending enforcement effective: port calls, strike, risk signal, subject notification. */
  function activate(pending: EnforcementRecord, approverId?: string): Activation {
    const now = env.deps.clock.now();
    assertTransition('MODERATION', pending.status, pending.action === 'dismiss' ? 'dismissed' : 'active', ENFORCEMENT_TRANSITIONS);
    runPortEffect(pending, now);
    const strikeAccount = pending.action === 'dismiss' ? undefined : pending.subjectAccountId;
    const strikesAfter = strikeAccount === undefined ? 0 : activeStrikes(env, strikeAccount, now).length + 1;
    const recommended = strikesAfter >= SUSPENSION_RECOMMENDATION_STRIKES && ['warn', 'remove_content', 'restrict'].includes(pending.action);
    const saved = env.cols.enforcements.put(
      {
        ...pending,
        status: pending.action === 'dismiss' ? 'dismissed' : 'active',
        ...optional('approverId', approverId),
        appliedAt: now,
        ...(pending.durationMs !== undefined ? { expiresAt: now + pending.durationMs } : {}),
        ...(pending.action !== 'dismiss' && pending.appealable ? { appealDeadline: now + APPEAL_WINDOW_MS } : {}),
        suspensionRecommended: recommended,
      },
      pending.version,
    );
    const events: EventInput<unknown>[] = [
      event('moderation.enforcement.applied', 'enforcement', saved.id, saved.version, {
        enforcementId: saved.id,
        caseId: saved.caseId,
        action: saved.action,
        policyClause: saved.policyClause,
        subjectType: saved.subjectType,
        subjectId: saved.subjectId,
        ...optional('subjectAccountId', saved.subjectAccountId),
        ...optional('expiresAt', saved.expiresAt),
      }),
    ];
    if (strikeAccount !== undefined) {
      const signal = insertSignal(env, { tenantId: saved.tenantId, accountId: strikeAccount, kind: 'report_upheld', weight: SIGNAL_WEIGHT[saved.action], sourceRef: saved.id });
      events.push(signalEvent(signal));
      if (strikesAfter >= SUSPENSION_RECOMMENDATION_STRIKES) {
        const payload = { accountId: strikeAccount, activeStrikes: strikesAfter, suspensionRecommended: recommended };
        events.push(event('moderation.strike.threshold_reached', 'enforcement', saved.id, saved.version, payload));
      }
    }
    notifySubject(saved);
    return { saved, events };
  }

  function recordReporterOutcomes(c: CaseRecord, upheld: boolean): void {
    for (const reporterId of c.reporterIds) {
      const id = `${c.tenantId}|${reporterId}`;
      const stats = env.cols.reporterStats.get(id);
      env.cols.reporterStats.put(
        { id, upheld: (stats?.upheld ?? 0) + (upheld ? 1 : 0), dismissed: (stats?.dismissed ?? 0) + (upheld ? 0 : 1) },
        stats?.version ?? 0,
      );
    }
  }

  function notifyReporters(c: CaseRecord, upheld: boolean): void {
    env.deps.store.afterCommit(() => {
      for (const reporterId of c.reporterIds) {
        env.ports.notify.notify({
          tenantId: c.tenantId,
          recipientId: reporterId,
          topic: 'moderation.report',
          template: 'moderation.report_closed',
          data: { outcome: upheld ? 'actioned' : 'dismissed' },
          dedupKey: `${c.id}:${reporterId}`,
          priority: 'low',
        });
      }
    });
  }

  /** Resolves the case once its decision is effective; reports close and reporter trust is updated. */
  function closeCase(c: CaseRecord, e: EnforcementRecord, deciderId: string): { saved: CaseRecord; events: EventInput<unknown>[] } {
    assertTransition('MODERATION', c.status, 'resolved', CASE_TRANSITIONS);
    const now = env.deps.clock.now();
    const saved = saveCase(env, c, { status: 'resolved', resolvedAt: now, resolution: e.action });
    for (const r of env.cols.reports.list((x) => x.caseId === c.id && x.status === 'open')) env.cols.reports.put({ ...r, status: 'closed', updatedAt: now }, r.version);
    const upheld = e.action !== 'dismiss';
    recordReporterOutcomes(c, upheld);
    notifyReporters(c, upheld);
    appendEvidence(env, {
      caseId: c.id,
      kind: 'decision',
      contentHash: contentHash({ action: e.action, policyClause: e.policyClause, reason: e.reason }),
      ref: e.id,
      addedBy: deciderId,
    });
    return { saved, events: [event('moderation.case.resolved', 'case', saved.id, saved.version, { caseId: saved.id, resolution: e.action })] };
  }

  function decide(ctx: CommandContext, input: DecideInput): EnforcementStaffDto {
    authorize(env, ctx, 'moderation.enforcement:decide', 'case');
    const v = parse(decideSchema, input);
    return runCommand(env.deps, ctx, { name: 'moderation.enforcement.decide', flag: 'moderation.enforcement', request: v }, () => {
      const c = loadCase(ctx, v.caseId);
      assertVersion('case', c.version, v.expectedVersion);
      if (c.status !== 'claimed') throw conflict('MODERATION.CASE_NOT_CLAIMED', 'a case must be claimed before it can be decided', { status: c.status });
      if (c.assigneeId !== ctx.actor.id) throw forbidden('MODERATION.NOT_ASSIGNEE', 'only the assigned moderator can decide this case');
      if (v.action === 'remove_content' && c.subjectType === 'account') {
        throw precondition('MODERATION.ACTION_NOT_APPLICABLE', 'accounts have no content to remove; use warn, restrict, suspend or ban');
      }
      const accountId = c.subjectAccountId ?? v.subjectAccountId;
      if (ACCOUNT_ACTIONS.has(v.action) && accountId === undefined) {
        throw precondition('MODERATION.SUBJECT_ACCOUNT_REQUIRED', 'the owning account of this subject is unknown; supply subjectAccountId');
      }
      const now = env.deps.clock.now();
      const pending = env.cols.enforcements.put(
        {
          id: env.deps.ids.next('enf'),
          tenantId: c.tenantId,
          caseId: c.id,
          subjectType: c.subjectType,
          subjectId: c.subjectId,
          ...optional('subjectAccountId', accountId),
          action: v.action,
          policyClause: v.policyClause,
          reason: v.reason,
          ...optional('durationMs', v.durationMs),
          ...optional('restriction', v.restriction),
          status: 'pending_approval',
          deciderId: ctx.actor.id,
          decidedAt: now,
          appealable: true,
          requiresApproval: needsApproval(v.action, c),
          suspensionRecommended: false,
        },
        0,
      );
      const patch: Partial<CaseRecord> = accountId !== undefined && c.subjectAccountId === undefined ? { subjectAccountId: accountId } : {};
      if (pending.requiresApproval) {
        assertTransition('MODERATION', c.status, 'pending_approval', CASE_TRANSITIONS);
        saveCase(env, c, { ...patch, status: 'pending_approval' });
        const payload = { enforcementId: pending.id, caseId: c.id, action: pending.action };
        return {
          result: staffDto(pending),
          events: [event('moderation.enforcement.pending_approval', 'enforcement', pending.id, pending.version, payload)],
        };
      }
      const { saved, events } = activate(pending);
      const closed = closeCase(saveCase(env, c, patch), saved, ctx.actor.id);
      return { result: staffDto(saved), events: [...events, ...closed.events] };
    });
  }

  function approve(ctx: CommandContext, input: z.input<typeof approvalSchema>): EnforcementStaffDto {
    authorize(env, ctx, 'moderation.enforcement:approve', 'enforcement');
    const v = parse(approvalSchema, input);
    return runCommand(env.deps, ctx, { name: 'moderation.enforcement.approve', flag: 'moderation.enforcement', request: v }, () => {
      const pending = loadEnforcement(ctx, v.enforcementId);
      assertTransition('MODERATION', pending.status, pending.action === 'dismiss' ? 'dismissed' : 'active', ENFORCEMENT_TRANSITIONS);
      if (pending.deciderId === ctx.actor.id) throw forbidden('MODERATION.FOUR_EYES_REQUIRED', 'a different moderator must approve this decision');
      if (pending.subjectAccountId === ctx.actor.id) throw forbidden('MODERATION.CONFLICT_OF_INTEREST', 'a moderator cannot approve a decision about themselves');
      const { saved, events } = activate(pending, ctx.actor.id);
      const closed = closeCase(loadCase(ctx, saved.caseId), saved, pending.deciderId);
      return { result: staffDto(saved), events: [...events, ...closed.events] };
    });
  }

  function reject(ctx: CommandContext, input: z.input<typeof rejectSchema>): EnforcementStaffDto {
    authorize(env, ctx, 'moderation.enforcement:approve', 'enforcement');
    const v = parse(rejectSchema, input);
    return runCommand(env.deps, ctx, { name: 'moderation.enforcement.reject', flag: 'moderation.enforcement', request: v }, () => {
      const pending = loadEnforcement(ctx, v.enforcementId);
      assertTransition('MODERATION', pending.status, 'rejected', ENFORCEMENT_TRANSITIONS);
      if (pending.deciderId === ctx.actor.id) throw forbidden('MODERATION.FOUR_EYES_REQUIRED', 'a different moderator must review this decision');
      const c = loadCase(ctx, pending.caseId);
      assertTransition('MODERATION', c.status, 'claimed', CASE_TRANSITIONS);
      saveCase(env, c, { status: 'claimed' });
      const saved = env.cols.enforcements.put({ ...pending, status: 'rejected', rejectionReason: v.reason }, pending.version);
      const payload = { enforcementId: saved.id, caseId: saved.caseId };
      return { result: staffDto(saved), events: [event('moderation.enforcement.approval_rejected', 'enforcement', saved.id, saved.version, payload)] };
    });
  }

  /** Undoes an effective enforcement (appeal overturned/modified): content restored, account reinstated, strike and signals dropped. */
  function reverse(enforcement: EnforcementRecord, reason: string): Activation {
    assertTransition('MODERATION', enforcement.status, 'reversed', ENFORCEMENT_TRANSITIONS);
    const now = env.deps.clock.now();
    const actions = env.ports.subjectActions;
    const accountId = enforcement.subjectAccountId;
    if (enforcement.action === 'remove_content') actions.restoreContent(enforcement.subjectType, enforcement.subjectId, reason);
    if ((enforcement.action === 'suspend' || enforcement.action === 'ban') && accountId !== undefined) {
      if (!hasOtherActiveSuspension(env, accountId, enforcement.id, now)) actions.reinstateAccount(accountId);
    }
    revokeBySource(env, enforcement.id);
    const saved = env.cols.enforcements.put({ ...enforcement, status: 'reversed' }, enforcement.version);
    const payload = { enforcementId: saved.id, caseId: saved.caseId, action: saved.action };
    return { saved, events: [event('moderation.enforcement.reversed', 'enforcement', saved.id, saved.version, payload)] };
  }

  /** Applies a milder replacement decided on appeal. The case is already resolved, so only the enforcement side runs. */
  function applyReplacement(original: EnforcementRecord, spec: ActionSpec, policyClause: string, reason: string, reviewerId: string): Activation {
    const pending = env.cols.enforcements.put(
      {
        id: env.deps.ids.next('enf'),
        tenantId: original.tenantId,
        caseId: original.caseId,
        subjectType: original.subjectType,
        subjectId: original.subjectId,
        ...optional('subjectAccountId', original.subjectAccountId),
        action: spec.action,
        policyClause,
        reason,
        ...optional('durationMs', spec.durationMs),
        ...optional('restriction', spec.restriction),
        status: 'pending_approval',
        deciderId: reviewerId,
        decidedAt: env.deps.clock.now(),
        appealable: false,
        requiresApproval: false,
        replacesId: original.id,
        suspensionRecommended: false,
      },
      0,
    );
    return activate(pending);
  }

  function list(ctx: CommandContext, input: z.input<typeof listSchema>): EnforcementStaffDto[] {
    authorize(env, ctx, 'moderation.enforcement:read', 'enforcement');
    const v = parse(listSchema, input);
    const rows = env.cols.enforcements
      .list((e) => e.tenantId === ctx.actor.tenantId && e.status === v.status && (v.caseId === undefined || e.caseId === v.caseId))
      .sort((a, b) => a.decidedAt - b.decidedAt || a.id.localeCompare(b.id));
    return pageOf(rows, v.offset, v.limit).map(staffDto);
  }

  function mine(ctx: CommandContext, input: z.input<typeof mineSchema>): EnforcementNoticeDto[] {
    authorize(env, ctx, 'moderation.enforcement:read_own', 'enforcement');
    const v = parse(mineSchema, input);
    const visible: readonly EnforcementStatus[] = ['active', 'expired', 'reversed'];
    const rows = env.cols.enforcements
      .list((e) => e.tenantId === ctx.actor.tenantId && e.subjectAccountId === ctx.actor.id && visible.includes(e.status))
      .sort((a, b) => (b.appliedAt ?? 0) - (a.appliedAt ?? 0) || b.id.localeCompare(a.id));
    return pageOf(rows, v.offset, v.limit).map(noticeDto);
  }

  /** System sweeper: ends suspensions and restrictions whose duration ran out. */
  function expireDue(ctx: CommandContext): { expired: number } {
    authorize(env, ctx, 'moderation.enforcement:expire', 'enforcement');
    return runCommand(env.deps, ctx, { name: 'moderation.enforcement.expire_due', flag: 'moderation.enforcement', request: null }, () => {
      const now = env.deps.clock.now();
      const due = env.cols.enforcements.list((e) => e.tenantId === ctx.actor.tenantId && e.status === 'active' && e.expiresAt !== undefined && e.expiresAt <= now);
      const events: EventInput<unknown>[] = [];
      for (const e of due) {
        assertTransition('MODERATION', e.status, 'expired', ENFORCEMENT_TRANSITIONS);
        const saved = env.cols.enforcements.put({ ...e, status: 'expired' }, e.version);
        if (e.action === 'suspend' && e.subjectAccountId !== undefined && !hasOtherActiveSuspension(env, e.subjectAccountId, e.id, now)) {
          env.ports.subjectActions.reinstateAccount(e.subjectAccountId);
        }
        events.push(event('moderation.enforcement.expired', 'enforcement', saved.id, saved.version, { enforcementId: saved.id, action: saved.action }));
      }
      return { result: { expired: due.length }, events };
    });
  }

  /** Features restricted for an account right now; the relay checks this before publishing, messaging, bidding... */
  const restrictionsOf = (accountId: string): RestrictionFeature[] => {
    const features = activeRestrictions(env, accountId, env.deps.clock.now()).flatMap((e) => (e.restriction ? [e.restriction] : []));
    return [...new Set(features)].sort();
  };

  function assertNotRestricted(accountId: string, feature: RestrictionFeature): void {
    if (restrictionsOf(accountId).includes(feature)) throw forbidden('MODERATION.RESTRICTED', `${feature} is restricted for this account`, { feature });
  }

  const operations = [
    operation('moderation.enforcement.decide', 'command', 'moderation.enforcement', 'Decide a claimed case (ban/minor-safety need approval)', decide),
    operation('moderation.enforcement.approve', 'command', 'moderation.enforcement', 'Second moderator approves a pending decision', approve),
    operation('moderation.enforcement.reject', 'command', 'moderation.enforcement', 'Second moderator rejects a pending decision', reject),
    operation('moderation.enforcement.list', 'query', 'moderation.enforcement', 'List enforcements by status (staff)', list),
    operation('moderation.enforcement.mine', 'query', 'moderation.enforcement', 'List decisions affecting the caller', mine),
    operation('moderation.enforcement.expire_due', 'command', 'moderation.enforcement', 'End elapsed suspensions and restrictions (system)', expireDue),
  ];
  return { decide, approve, reject, list, mine, expireDue, restrictionsOf, assertNotRestricted, reverse, applyReplacement, loadEnforcement, operations };
}

export type EnforcementService = ReturnType<typeof createEnforcement>;
