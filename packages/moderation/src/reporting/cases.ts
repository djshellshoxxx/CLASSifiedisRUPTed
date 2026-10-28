/** F12.S01.M01 (cases): one case per reported subject, a priority queue for moderators with SLA timestamps. */
import type { CommandContext } from '@classrup/kernel';
import { assertTransition, assertVersion, forbidden, parse, runCommand, schemas, z } from '@classrup/kernel';
import { authorize, event, inTenant, operation, pageOf } from '../common';
import type { Env } from '../common';
import type { CaseRecord, CaseStatus, EnforcementAction, ReportReason, SubjectType } from '../types';
import { computePriority, reporterTrust, slaDue } from './priority';

export const CASE_TRANSITIONS: Readonly<Record<CaseStatus, readonly CaseStatus[]>> = {
  open: ['claimed'],
  claimed: ['open', 'pending_approval', 'resolved'],
  pending_approval: ['claimed', 'resolved'],
  resolved: [],
};

const idSchema = z.object({ caseId: schemas.id('mcase'), expectedVersion: z.number().int().positive().optional() });
const assignSchema = idSchema.extend({ assigneeId: schemas.text(1, 64) });
const getSchema = z.object({ caseId: schemas.id('mcase') });
const listSchema = z.object({
  status: z.enum(['open', 'claimed', 'pending_approval', 'resolved', 'active']).default('active'),
  minPriority: z.number().int().min(0).max(100).default(0),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});

export interface CaseDto {
  readonly id: string;
  readonly subjectType: SubjectType;
  readonly subjectId: string;
  readonly subjectAccountId?: string;
  readonly status: CaseStatus;
  readonly priority: number;
  readonly escalated: boolean;
  readonly reportCount: number;
  readonly submissionCount: number;
  readonly reasonCounts: Readonly<Partial<Record<ReportReason, number>>>;
  readonly assigneeId?: string;
  readonly openedAt: number;
  readonly slaDueAt: number;
  readonly slaBreached: boolean;
  readonly claimedAt?: number;
  readonly resolvedAt?: number;
  readonly resolution?: EnforcementAction;
  readonly version: number;
}

/** Staff view. Reporter identities are intentionally absent: only the report records carry them. */
export function caseDto(c: CaseRecord, now: number): CaseDto {
  return {
    id: c.id,
    subjectType: c.subjectType,
    subjectId: c.subjectId,
    ...(c.subjectAccountId !== undefined ? { subjectAccountId: c.subjectAccountId } : {}),
    status: c.status,
    priority: c.priority,
    escalated: c.escalated,
    reportCount: c.reporterIds.length,
    submissionCount: c.submissionCount,
    reasonCounts: c.reasonCounts,
    ...(c.assigneeId !== undefined ? { assigneeId: c.assigneeId } : {}),
    openedAt: c.openedAt,
    slaDueAt: c.slaDueAt,
    slaBreached: c.status !== 'resolved' && now > c.slaDueAt,
    ...(c.claimedAt !== undefined ? { claimedAt: c.claimedAt } : {}),
    ...(c.resolvedAt !== undefined ? { resolvedAt: c.resolvedAt } : {}),
    ...(c.resolution !== undefined ? { resolution: c.resolution } : {}),
    version: c.version,
  };
}

export function trustOf(env: Env, tenantId: string, reporterId: string): number {
  const s = env.cols.reporterStats.get(`${tenantId}|${reporterId}`);
  return reporterTrust(s?.upheld ?? 0, s?.dismissed ?? 0);
}

export function priorityOf(env: Env, c: Pick<CaseRecord, 'tenantId' | 'reasonCounts' | 'reporterIds' | 'escalated'>): number {
  return computePriority({
    reasons: Object.keys(c.reasonCounts) as ReportReason[],
    reporterTrust: c.reporterIds.map((r) => trustOf(env, c.tenantId, r)),
    escalated: c.escalated,
  });
}

export const activeCaseFor = (env: Env, tenantId: string, subjectType: SubjectType, subjectId: string): CaseRecord | undefined =>
  env.cols.cases.list((c) => c.tenantId === tenantId && c.subjectType === subjectType && c.subjectId === subjectId && c.status !== 'resolved')[0];

export const activeCasesOfAccount = (env: Env, tenantId: string, accountId: string): CaseRecord[] =>
  env.cols.cases.list((c) => c.tenantId === tenantId && c.subjectAccountId === accountId && c.status !== 'resolved');

/** Applies a patch and keeps priority and the (only ever tightening) SLA deadline consistent with the case content. */
export function saveCase(env: Env, c: CaseRecord, patch: Partial<CaseRecord>): CaseRecord {
  const next = { ...c, ...patch };
  const priority = priorityOf(env, next);
  return env.cols.cases.put({ ...next, priority, slaDueAt: slaDue(next.openedAt, priority, c.slaDueAt), updatedAt: env.deps.clock.now() }, c.version);
}

/** Moderators must never handle a case about themselves or one they reported. */
function assertNoConflict(c: CaseRecord, moderatorId: string): void {
  if (c.subjectAccountId === moderatorId || c.reporterIds.includes(moderatorId)) {
    throw forbidden('MODERATION.CONFLICT_OF_INTEREST', 'a moderator cannot handle a case they are involved in');
  }
}

export function createCases(env: Env) {
  const load = (ctx: CommandContext, caseId: string): CaseRecord =>
    inTenant(env.cols.cases.get(caseId), ctx.actor, 'MODERATION.CASE_NOT_FOUND', 'case');

  function list(ctx: CommandContext, input: z.input<typeof listSchema>): CaseDto[] {
    authorize(env, ctx, 'moderation.case:read', 'case');
    const v = parse(listSchema, input);
    const now = env.deps.clock.now();
    const wanted = (c: CaseRecord): boolean => (v.status === 'active' ? c.status !== 'resolved' : c.status === v.status);
    const queue = env.cols.cases
      .list((c) => c.tenantId === ctx.actor.tenantId && wanted(c) && c.priority >= v.minPriority)
      .sort((a, b) => b.priority - a.priority || a.openedAt - b.openedAt || a.id.localeCompare(b.id));
    return pageOf(queue, v.offset, v.limit).map((c) => caseDto(c, now));
  }

  function get(ctx: CommandContext, input: z.input<typeof getSchema>): CaseDto {
    authorize(env, ctx, 'moderation.case:read', 'case');
    const v = parse(getSchema, input);
    return caseDto(load(ctx, v.caseId), env.deps.clock.now());
  }

  function move(ctx: CommandContext, name: string, v: z.output<typeof idSchema>, apply: (c: CaseRecord) => Partial<CaseRecord>, eventType: string): CaseDto {
    return runCommand(env.deps, ctx, { name, flag: 'moderation.flags', request: v }, () => {
      const c = load(ctx, v.caseId);
      assertVersion('case', c.version, v.expectedVersion);
      const saved = saveCase(env, c, apply(c));
      const payload = { caseId: saved.id, status: saved.status, ...(saved.assigneeId !== undefined ? { assigneeId: saved.assigneeId } : {}) };
      return { result: caseDto(saved, env.deps.clock.now()), events: [event(eventType, 'case', saved.id, saved.version, payload)] };
    });
  }

  function claim(ctx: CommandContext, input: z.input<typeof idSchema>): CaseDto {
    authorize(env, ctx, 'moderation.case:claim', 'case');
    const v = parse(idSchema, input);
    return move(
      ctx,
      'moderation.case.claim',
      v,
      (c) => {
        assertNoConflict(c, ctx.actor.id);
        assertTransition('MODERATION', c.status, 'claimed', CASE_TRANSITIONS);
        return { status: 'claimed', assigneeId: ctx.actor.id, claimedAt: env.deps.clock.now() };
      },
      'moderation.case.claimed',
    );
  }

  function assign(ctx: CommandContext, input: z.input<typeof assignSchema>): CaseDto {
    authorize(env, ctx, 'moderation.case:assign', 'case');
    const v = parse(assignSchema, input);
    return move(
      ctx,
      'moderation.case.assign',
      v,
      (c) => {
        assertNoConflict(c, v.assigneeId);
        if (c.status === 'claimed') return { assigneeId: v.assigneeId };
        assertTransition('MODERATION', c.status, 'claimed', CASE_TRANSITIONS);
        return { status: 'claimed', assigneeId: v.assigneeId, claimedAt: env.deps.clock.now() };
      },
      'moderation.case.assigned',
    );
  }

  function release(ctx: CommandContext, input: z.input<typeof idSchema>): CaseDto {
    authorize(env, ctx, 'moderation.case:claim', 'case');
    const v = parse(idSchema, input);
    return move(
      ctx,
      'moderation.case.release',
      v,
      (c) => {
        if (c.assigneeId !== ctx.actor.id && !ctx.actor.roles.includes('admin')) throw forbidden('MODERATION.NOT_ASSIGNEE', 'only the assignee can release a case');
        assertTransition('MODERATION', c.status, 'open', CASE_TRANSITIONS);
        return { status: 'open', assigneeId: undefined, claimedAt: undefined };
      },
      'moderation.case.released',
    );
  }

  const operations = [
    operation('moderation.case.list', 'query', 'moderation.flags', 'Moderator queue ordered by priority', list),
    operation('moderation.case.get', 'query', 'moderation.flags', 'Read one case', get),
    operation('moderation.case.claim', 'command', 'moderation.flags', 'Claim an open case', claim),
    operation('moderation.case.assign', 'command', 'moderation.flags', 'Assign a case to a moderator (admin)', assign),
    operation('moderation.case.release', 'command', 'moderation.flags', 'Release a claimed case back to the queue', release),
  ];
  return { list, get, claim, assign, release, operations };
}
