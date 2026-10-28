/** F12.S01.M03 appeals: one appeal per enforcement within 14 days, decided by a moderator who took no part in the decision. */
import type { CommandContext, EventInput } from '@classrup/kernel';
import { assertTransition, conflict, forbidden, notFound, parse, precondition, runCommand, schemas, z } from '@classrup/kernel';
import { contentHash } from '@classrup/security';
import { authorize, event, inTenant, operation, pageOf } from '../common';
import type { Env } from '../common';
import { ACTION_SEVERITY, actionShape, actionSpecIssues } from '../policy/enforcement';
import type { EnforcementService } from '../policy/enforcement';
import type { AppealHistoryEntry, AppealOutcome, AppealRecord, AppealStatus } from '../types';
import { appendEvidence } from './evidence';

export const APPEAL_TRANSITIONS: Readonly<Record<AppealStatus, readonly AppealStatus[]>> = {
  submitted: ['in_review'],
  in_review: ['decided'],
  decided: [],
};

const submitSchema = z.object({ enforcementId: schemas.id('enf'), statement: schemas.text(10, 2000) });
const appealRef = z.object({ appealId: schemas.id('apl') });
const modifiedSchema = z.object({
  action: z.enum(['warn', 'remove_content', 'restrict', 'suspend']),
  durationMs: actionShape.durationMs,
  restriction: actionShape.restriction,
  policyClause: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{1,39}$/).optional(),
});
const decideSchema = appealRef
  .extend({ outcome: z.enum(['upheld', 'overturned', 'modified']), note: schemas.text(3, 1000), modified: modifiedSchema.optional() })
  .superRefine((v, ctx) => {
    if ((v.outcome === 'modified') !== (v.modified !== undefined)) {
      ctx.addIssue({ code: 'custom', path: ['modified'], message: 'provide the replacement action exactly when the outcome is modified' });
    }
    if (v.modified) for (const i of actionSpecIssues(v.modified)) ctx.addIssue({ code: 'custom', path: ['modified', i.path], message: i.message });
  });
const listSchema = z.object({
  status: z.enum(['submitted', 'in_review', 'decided']).default('submitted'),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});
const mineSchema = z.object({ limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).default(0) });

export type SubmitAppealInput = z.input<typeof submitSchema>;
export type DecideAppealInput = z.input<typeof decideSchema>;

/** Appellant view: no reviewer identity. */
export interface AppealNoticeDto {
  readonly id: string;
  readonly enforcementId: string;
  readonly status: AppealStatus;
  readonly statement: string;
  readonly outcome?: AppealOutcome;
  readonly decisionNote?: string;
  readonly createdAt: number;
  readonly decidedAt?: number;
  readonly history: readonly { readonly at: number; readonly status: AppealStatus }[];
}

export interface AppealStaffDto extends Omit<AppealNoticeDto, 'history'> {
  readonly caseId: string;
  readonly appellantId: string;
  readonly reviewerId?: string;
  readonly replacementId?: string;
  readonly history: readonly AppealHistoryEntry[];
}

const noticeDto = (a: AppealRecord): AppealNoticeDto => ({
  id: a.id,
  enforcementId: a.enforcementId,
  status: a.status,
  statement: a.statement,
  ...(a.outcome !== undefined ? { outcome: a.outcome } : {}),
  ...(a.decisionNote !== undefined ? { decisionNote: a.decisionNote } : {}),
  createdAt: a.createdAt,
  ...(a.decidedAt !== undefined ? { decidedAt: a.decidedAt } : {}),
  history: a.history.map((h) => ({ at: h.at, status: h.to })),
});

const staffDto = (a: AppealRecord): AppealStaffDto => ({
  ...noticeDto(a),
  caseId: a.caseId,
  appellantId: a.appellantId,
  ...(a.reviewerId !== undefined ? { reviewerId: a.reviewerId } : {}),
  ...(a.replacementId !== undefined ? { replacementId: a.replacementId } : {}),
  history: a.history,
});

export function createAppeals(env: Env, enforcement: EnforcementService) {
  const load = (ctx: CommandContext, appealId: string): AppealRecord =>
    inTenant(env.cols.appeals.get(appealId), ctx.actor, 'MODERATION.APPEAL_NOT_FOUND', 'appeal');

  const step = (a: AppealRecord, to: AppealStatus, actorId: string, patch: Partial<AppealRecord>, note?: string): AppealRecord => {
    assertTransition('MODERATION', a.status, to, APPEAL_TRANSITIONS);
    const entry: AppealHistoryEntry = { at: env.deps.clock.now(), actorId, from: a.status, to, ...(note !== undefined ? { note } : {}) };
    return env.cols.appeals.put({ ...a, ...patch, status: to, history: [...a.history, entry] }, a.version);
  };

  function submit(ctx: CommandContext, input: SubmitAppealInput): AppealNoticeDto {
    authorize(env, ctx, 'moderation.appeal:create', 'appeal');
    const v = parse(submitSchema, input);
    return runCommand(env.deps, ctx, { name: 'moderation.appeal.submit', flag: 'moderation.appeals', request: v }, () => {
      const now = env.deps.clock.now();
      const enf = env.cols.enforcements.get(v.enforcementId);
      // A decision about someone else is indistinguishable from a missing one.
      if (!enf || enf.tenantId !== ctx.actor.tenantId || enf.subjectAccountId !== ctx.actor.id) {
        throw notFound('MODERATION.ENFORCEMENT_NOT_FOUND', 'enforcement not found');
      }
      if (enf.appealId !== undefined) throw conflict('MODERATION.APPEAL_EXISTS', 'this decision was already appealed');
      if (!enf.appealable || enf.action === 'dismiss' || (enf.status !== 'active' && enf.status !== 'expired')) {
        throw precondition('MODERATION.NOT_APPEALABLE', 'this decision cannot be appealed');
      }
      if (enf.appealDeadline === undefined || now > enf.appealDeadline) {
        throw precondition('MODERATION.APPEAL_WINDOW_CLOSED', 'the 14-day appeal window has closed', { appealDeadline: enf.appealDeadline ?? 0 });
      }
      const appeal = env.cols.appeals.put(
        {
          id: env.deps.ids.next('apl'),
          tenantId: enf.tenantId,
          enforcementId: enf.id,
          caseId: enf.caseId,
          appellantId: ctx.actor.id,
          statement: v.statement,
          status: 'submitted',
          createdAt: now,
          history: [{ at: now, actorId: ctx.actor.id, from: null, to: 'submitted' }],
        },
        0,
      );
      env.cols.enforcements.put({ ...enf, appealId: appeal.id }, enf.version);
      const payload = { appealId: appeal.id, enforcementId: enf.id, caseId: enf.caseId };
      return { result: noticeDto(appeal), events: [event('moderation.appeal.submitted', 'appeal', appeal.id, appeal.version, payload)] };
    });
  }

  function claim(ctx: CommandContext, input: z.input<typeof appealRef>): AppealStaffDto {
    authorize(env, ctx, 'moderation.appeal:review', 'appeal');
    const v = parse(appealRef, input);
    return runCommand(env.deps, ctx, { name: 'moderation.appeal.claim', flag: 'moderation.appeals', request: v }, () => {
      const appeal = load(ctx, v.appealId);
      const enf = env.cols.enforcements.require(appeal.enforcementId);
      const involved = [enf.deciderId, enf.approverId, appeal.appellantId];
      if (involved.includes(ctx.actor.id)) {
        throw forbidden('MODERATION.REVIEWER_CONFLICT', 'the reviewer must not have taken part in the decision under appeal');
      }
      const saved = step(appeal, 'in_review', ctx.actor.id, { reviewerId: ctx.actor.id });
      const payload = { appealId: saved.id, enforcementId: saved.enforcementId };
      return { result: staffDto(saved), events: [event('moderation.appeal.claimed', 'appeal', saved.id, saved.version, payload)] };
    });
  }

  function decide(ctx: CommandContext, input: DecideAppealInput): AppealStaffDto {
    authorize(env, ctx, 'moderation.appeal:review', 'appeal');
    const v = parse(decideSchema, input);
    return runCommand(env.deps, ctx, { name: 'moderation.appeal.decide', flag: 'moderation.appeals', request: v }, () => {
      const appeal = load(ctx, v.appealId);
      if (appeal.status !== 'in_review') assertTransition('MODERATION', appeal.status, 'decided', APPEAL_TRANSITIONS);
      if (appeal.reviewerId !== ctx.actor.id) throw forbidden('MODERATION.NOT_ASSIGNEE', 'only the assigned reviewer can decide this appeal');
      const enf = env.cols.enforcements.require(appeal.enforcementId);
      const events: EventInput<unknown>[] = [];
      let replacementId: string | undefined;
      if (v.outcome !== 'upheld') {
        if (v.modified && ACTION_SEVERITY[v.modified.action] >= ACTION_SEVERITY[enf.action]) {
          throw precondition('MODERATION.MODIFICATION_NOT_MILDER', 'a modified decision must be milder than the original');
        }
        const reversed = enforcement.reverse(enf, v.note);
        events.push(...reversed.events);
        if (v.modified) {
          const replacement = enforcement.applyReplacement(reversed.saved, v.modified, v.modified.policyClause ?? enf.policyClause, v.note, ctx.actor.id);
          replacementId = replacement.saved.id;
          events.push(...replacement.events);
        }
      }
      const now = env.deps.clock.now();
      const saved = step(appeal, 'decided', ctx.actor.id, { outcome: v.outcome, decisionNote: v.note, decidedAt: now, ...(replacementId ? { replacementId } : {}) }, v.outcome);
      appendEvidence(env, {
        caseId: saved.caseId,
        kind: 'appeal_outcome',
        contentHash: contentHash({ outcome: v.outcome, note: v.note }),
        ref: saved.id,
        addedBy: ctx.actor.id,
      });
      env.deps.store.afterCommit(() =>
        env.ports.notify.notify({
          tenantId: saved.tenantId,
          recipientId: saved.appellantId,
          topic: 'moderation.appeal',
          template: 'moderation.appeal_decided',
          data: { appealId: saved.id, outcome: v.outcome },
          dedupKey: saved.id,
          priority: 'high',
        }),
      );
      events.push(event('moderation.appeal.decided', 'appeal', saved.id, saved.version, { appealId: saved.id, enforcementId: saved.enforcementId, outcome: v.outcome }));
      return { result: staffDto(saved), events };
    });
  }

  function list(ctx: CommandContext, input: z.input<typeof listSchema>): AppealStaffDto[] {
    authorize(env, ctx, 'moderation.appeal:review', 'appeal');
    const v = parse(listSchema, input);
    const rows = env.cols.appeals.list((a) => a.tenantId === ctx.actor.tenantId && a.status === v.status).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    return pageOf(rows, v.offset, v.limit).map(staffDto);
  }

  function mine(ctx: CommandContext, input: z.input<typeof mineSchema>): AppealNoticeDto[] {
    authorize(env, ctx, 'moderation.appeal:read_own', 'appeal');
    const v = parse(mineSchema, input);
    const rows = env.cols.appeals
      .list((a) => a.tenantId === ctx.actor.tenantId && a.appellantId === ctx.actor.id)
      .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
    return pageOf(rows, v.offset, v.limit).map(noticeDto);
  }

  const operations = [
    operation('moderation.appeal.submit', 'command', 'moderation.appeals', 'Appeal an enforcement within 14 days', submit),
    operation('moderation.appeal.claim', 'command', 'moderation.appeals', 'Claim an appeal for review (not the original decider)', claim),
    operation('moderation.appeal.decide', 'command', 'moderation.appeals', 'Decide an appeal: upheld, overturned or modified', decide),
    operation('moderation.appeal.list', 'query', 'moderation.appeals', 'List appeals by status (reviewers)', list),
    operation('moderation.appeal.mine', 'query', 'moderation.appeals', 'List the caller own appeals', mine),
  ];
  return { submit, claim, decide, list, mine, operations };
}
