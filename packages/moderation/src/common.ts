/** Wiring shared by every moderation module: typed collections, authorization and event helpers. */
import type { Actor, Collection, CommandContext, Deps, EventInput, Operation, OperationKind, Permission } from '@classrup/kernel';
import { notFound } from '@classrup/kernel';
import type { ResolvedPorts } from './ports';
import type {
  AppealRecord,
  BlockIndexRecord,
  BlockRecord,
  BucketRecord,
  CaseRecord,
  EnforcementRecord,
  EvidenceHeadRecord,
  EvidenceRecord,
  FingerprintRecord,
  PostActivityRecord,
  ReporterStatsRecord,
  ReportRecord,
  SignalRecord,
} from './types';

export interface Cols {
  readonly reports: Collection<ReportRecord>;
  readonly cases: Collection<CaseRecord>;
  readonly reporterStats: Collection<ReporterStatsRecord>;
  readonly evidence: Collection<EvidenceRecord>;
  readonly evidenceHeads: Collection<EvidenceHeadRecord>;
  readonly enforcements: Collection<EnforcementRecord>;
  readonly appeals: Collection<AppealRecord>;
  readonly fingerprints: Collection<FingerprintRecord>;
  readonly postActivity: Collection<PostActivityRecord>;
  readonly blocks: Collection<BlockRecord>;
  readonly blockIndex: Collection<BlockIndexRecord>;
  readonly signals: Collection<SignalRecord>;
  readonly buckets: Collection<BucketRecord>;
}

export interface Env {
  readonly deps: Deps;
  readonly ports: ResolvedPorts;
  readonly cols: Cols;
}

export function collectionsOf(deps: Deps): Cols {
  const c = deps.store.collection.bind(deps.store);
  return {
    reports: c<ReportRecord>('moderation_reports'),
    cases: c<CaseRecord>('moderation_cases'),
    reporterStats: c<ReporterStatsRecord>('moderation_reporter_stats'),
    evidence: c<EvidenceRecord>('moderation_evidence'),
    evidenceHeads: c<EvidenceHeadRecord>('moderation_evidence_heads'),
    enforcements: c<EnforcementRecord>('moderation_enforcements'),
    appeals: c<AppealRecord>('moderation_appeals'),
    fingerprints: c<FingerprintRecord>('moderation_content_fingerprints'),
    postActivity: c<PostActivityRecord>('moderation_post_activity'),
    blocks: c<BlockRecord>('moderation_blocks'),
    blockIndex: c<BlockIndexRecord>('moderation_block_index'),
    signals: c<SignalRecord>('moderation_signals'),
    buckets: c<BucketRecord>('moderation_buckets'),
  };
}

/** Deny-by-default authorization with a tenant-scoped resource reference. */
export function authorize(env: Env, ctx: CommandContext, permission: Permission, resourceType: string, resourceId?: string): void {
  env.deps.authz.authorize(ctx.actor, permission, {
    type: resourceType,
    tenantId: ctx.actor.tenantId,
    ...(resourceId !== undefined ? { id: resourceId } : {}),
  });
}

/** Records of another tenant are indistinguishable from missing ones. */
export function inTenant<T extends { readonly tenantId: string }>(record: T | undefined, actor: Actor, code: string, what: string): T {
  if (!record || record.tenantId !== actor.tenantId) throw notFound(code, `${what} not found`);
  return record;
}

export function event<P>(type: string, aggregateType: string, aggregateId: string, revision: number, payload: P): EventInput<P> {
  return { type, aggregateType, aggregateId, revision, payload };
}

/**
 * Context whose actor is a neutral system principal. Commands that must not tie a private act
 * (reporting, blocking) to its author in the event log run under it; the author stays in the
 * staff-only or owner-only record. Idempotency keys stay scoped per real actor.
 */
export function anonymized(ctx: CommandContext): CommandContext {
  return {
    ...ctx,
    actor: { kind: 'system', id: 'moderation.anonymous', roles: ['system'], tenantId: ctx.actor.tenantId },
    ...(ctx.idempotencyKey !== undefined ? { idempotencyKey: `${ctx.actor.id}:${ctx.idempotencyKey}` } : {}),
  };
}

/** The only place an untyped operation payload is narrowed: every service method validates it with zod first. */
export function operation<I, O>(
  name: string,
  kind: OperationKind,
  flag: string,
  summary: string,
  fn: (ctx: CommandContext, input: I) => O,
): Operation {
  return { name, kind, flag, summary, handler: (ctx, input) => fn(ctx, input as I) };
}

export const isStaff = (actor: Actor): boolean => actor.roles.includes('moderator') || actor.roles.includes('admin');

export function pageOf<T>(items: readonly T[], offset: number, limit: number): T[] {
  return items.slice(offset, offset + limit);
}
