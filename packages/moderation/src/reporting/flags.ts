/** F12.S01.M01 flags: user reports on subjects, merged per reporter and aggregated into one case per subject. */
import type { CommandContext, EventInput, RateLimitPort } from '@classrup/kernel';
import { parse, runCommand, schemas, validationError, z } from '@classrup/kernel';
import { contentHash } from '@classrup/security';
import { anonymized, authorize, event, inTenant, operation, pageOf } from '../common';
import type { Env } from '../common';
import { harassmentPattern } from '../policy/abuse';
import type { CaseRecord, ReportReason, ReportRecord, ReportStatus, SubjectType } from '../types';
import { REPORT_REASONS, SUBJECT_TYPES } from '../types';
import { activeCaseFor, activeCasesOfAccount, saveCase } from './cases';
import { appendEvidence } from './evidence';
import { slaDue } from './priority';

const submitSchema = z
  .object({
    subjectType: z.enum(SUBJECT_TYPES),
    subjectId: schemas.text(1, 100),
    reason: z.enum(REPORT_REASONS),
    details: schemas.text(0, 2000).default(''),
    /** Decrypted by the reporter on their own device: the relay never decrypts message content. */
    excerpt: schemas.text(1, 2000).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.subjectType === 'message' && v.excerpt === undefined) {
      ctx.addIssue({ code: 'custom', path: ['excerpt'], message: 'message reports must include the excerpt decrypted by the reporter' });
    }
    if (v.subjectType !== 'message' && v.excerpt !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['excerpt'], message: 'excerpt is only accepted for message reports' });
    }
  });
const listSchema = z.object({ caseId: schemas.id('mcase'), limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) });
const mineSchema = z.object({ limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).default(0) });

export type SubmitReportInput = z.input<typeof submitSchema>;

/** What the reporter gets back. It never reveals who else reported or what moderators decided internally. */
export interface ReportReceipt {
  readonly reportId: string;
  readonly subjectType: SubjectType;
  readonly subjectId: string;
  readonly reason: ReportReason;
  readonly status: ReportStatus;
  readonly submissions: number;
  readonly merged: boolean;
  readonly createdAt: number;
}

export interface StaffReportDto extends ReportReceipt {
  readonly caseId: string;
  readonly reporterId: string;
  readonly details: string;
  readonly excerpt?: string;
}

const receipt = (r: ReportRecord, merged: boolean): ReportReceipt => ({
  reportId: r.id,
  subjectType: r.subjectType,
  subjectId: r.subjectId,
  reason: r.reason,
  status: r.status,
  submissions: r.submissions,
  merged,
  createdAt: r.createdAt,
});

const staffDto = (r: ReportRecord): StaffReportDto => ({
  ...receipt(r, false),
  caseId: r.caseId,
  reporterId: r.reporterId,
  details: r.details,
  ...(r.excerpt !== undefined ? { excerpt: r.excerpt } : {}),
});

export function createFlags(env: Env, rateLimiter: RateLimitPort) {
  const subjectAccountOf = (subjectType: SubjectType, subjectId: string): string | undefined =>
    subjectType === 'account' ? subjectId : env.ports.subjectOwner.ownerOf(subjectType, subjectId);

  function openCase(tenantId: string, v: z.output<typeof submitSchema>, subjectAccountId: string | undefined, now: number): CaseRecord {
    return env.cols.cases.put(
      {
        id: env.deps.ids.next('mcase'),
        tenantId,
        subjectType: v.subjectType,
        subjectId: v.subjectId,
        ...(subjectAccountId !== undefined ? { subjectAccountId } : {}),
        status: 'open',
        priority: 0,
        escalated: false,
        reasonCounts: {},
        reporterIds: [],
        submissionCount: 0,
        openedAt: now,
        slaDueAt: slaDue(now, 0),
        updatedAt: now,
      },
      0,
    );
  }

  /** Raises every open case about an account that is the target of a harassment pattern. Returns events for newly escalated cases. */
  function escalateAccountCases(tenantId: string, accountId: string): EventInput<unknown>[] {
    const events: EventInput<unknown>[] = [];
    for (const c of activeCasesOfAccount(env, tenantId, accountId)) {
      if (c.escalated) continue;
      const saved = saveCase(env, c, { escalated: true });
      events.push(event('moderation.case.escalated', 'case', saved.id, saved.version, { caseId: saved.id, priority: saved.priority, cause: 'harassment_pattern' }));
    }
    return events;
  }

  function addToCase(c: CaseRecord, report: ReportRecord): CaseRecord {
    const counts = { ...c.reasonCounts, [report.reason]: (c.reasonCounts[report.reason] ?? 0) + 1 };
    return saveCase(env, c, {
      reasonCounts: counts,
      reporterIds: [...c.reporterIds, report.reporterId],
      submissionCount: c.submissionCount + 1,
      ...(c.subjectAccountId === undefined && report.subjectAccountId !== undefined ? { subjectAccountId: report.subjectAccountId } : {}),
    });
  }

  function recordReportEvidence(caseId: string, report: ReportRecord): void {
    const reportHash = contentHash({ reason: report.reason, details: report.details, excerpt: report.excerpt ?? null });
    appendEvidence(env, { caseId, kind: 'report', contentHash: reportHash, ref: report.id, addedBy: 'system' });
    if (report.excerpt !== undefined) {
      appendEvidence(env, { caseId, kind: 'message_excerpt', contentHash: contentHash(report.excerpt), ref: report.id, addedBy: 'system' });
    }
  }

  function mergeDuplicate(existing: ReportRecord, now: number): { result: ReportReceipt; events: EventInput<unknown>[] } {
    const saved = env.cols.reports.put({ ...existing, submissions: existing.submissions + 1, updatedAt: now }, existing.version);
    const c = env.cols.cases.require(saved.caseId);
    env.cols.cases.put({ ...c, submissionCount: c.submissionCount + 1, updatedAt: now }, c.version);
    const payload = { reportId: saved.id, caseId: saved.caseId, submissions: saved.submissions };
    return { result: receipt(saved, true), events: [event('moderation.report.merged', 'report', saved.id, saved.version, payload)] };
  }

  function submit(ctx: CommandContext, input: SubmitReportInput): ReportReceipt {
    authorize(env, ctx, 'moderation.report:create', 'report');
    const v = parse(submitSchema, input);
    // The event log must not tie a report to its author: run under a neutral actor, keep the author in the staff-only record.
    return runCommand(env.deps, anonymized(ctx), { name: 'moderation.report.submit', flag: 'moderation.flags', request: { by: ctx.actor.id, ...v } }, () => {
      const tenantId = ctx.actor.tenantId;
      const now = env.deps.clock.now();
      const subjectAccountId = subjectAccountOf(v.subjectType, v.subjectId);
      if (subjectAccountId === ctx.actor.id) throw validationError('MODERATION.SELF_REPORT', 'you cannot report your own account or content');
      rateLimiter.consume(`report:${ctx.actor.id}`);

      const duplicate = env.cols.reports.list(
        (r) => r.tenantId === tenantId && r.reporterId === ctx.actor.id && r.subjectType === v.subjectType && r.subjectId === v.subjectId && r.status === 'open',
      )[0];
      if (duplicate) return mergeDuplicate(duplicate, now);

      const existingCase = activeCaseFor(env, tenantId, v.subjectType, v.subjectId);
      const baseCase = existingCase ?? openCase(tenantId, v, subjectAccountId, now);
      const report = env.cols.reports.put(
        {
          id: env.deps.ids.next('rpt'),
          tenantId,
          reporterId: ctx.actor.id,
          subjectType: v.subjectType,
          subjectId: v.subjectId,
          ...(subjectAccountId !== undefined ? { subjectAccountId } : {}),
          reason: v.reason,
          details: v.details,
          ...(v.excerpt !== undefined ? { excerpt: v.excerpt } : {}),
          caseId: baseCase.id,
          submissions: 1,
          status: 'open',
          createdAt: now,
          updatedAt: now,
        },
        0,
      );
      const saved = addToCase(baseCase, report);
      recordReportEvidence(saved.id, report);

      const events: EventInput<unknown>[] = [];
      if (!existingCase) events.push(event('moderation.case.opened', 'case', saved.id, saved.version, { caseId: saved.id, subjectType: saved.subjectType, subjectId: saved.subjectId }));
      events.push(event('moderation.report.submitted', 'report', report.id, report.version, { reportId: report.id, caseId: saved.id, reason: report.reason }));
      if (subjectAccountId !== undefined && harassmentPattern(env, subjectAccountId, now)) events.push(...escalateAccountCases(tenantId, subjectAccountId));
      return { result: receipt(report, false), events };
    });
  }

  function forCase(ctx: CommandContext, input: z.input<typeof listSchema>): StaffReportDto[] {
    authorize(env, ctx, 'moderation.report:read', 'report');
    const v = parse(listSchema, input);
    inTenant(env.cols.cases.get(v.caseId), ctx.actor, 'MODERATION.CASE_NOT_FOUND', 'case');
    const reports = env.cols.reports.list((r) => r.caseId === v.caseId).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    return pageOf(reports, v.offset, v.limit).map(staffDto);
  }

  function mine(ctx: CommandContext, input: z.input<typeof mineSchema>): ReportReceipt[] {
    authorize(env, ctx, 'moderation.report:read_own', 'report');
    const v = parse(mineSchema, input);
    const own = env.cols.reports
      .list((r) => r.tenantId === ctx.actor.tenantId && r.reporterId === ctx.actor.id)
      .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
    return pageOf(own, v.offset, v.limit).map((r) => receipt(r, false));
  }

  const operations = [
    operation('moderation.report.submit', 'command', 'moderation.flags', 'Report a subject (rate limited, duplicates merged)', submit),
    operation('moderation.report.list', 'query', 'moderation.flags', 'List the reports of a case (staff)', forCase),
    operation('moderation.report.mine', 'query', 'moderation.flags', 'List the caller own reports', mine),
  ];
  return { submit, forCase, mine, operations };
}
