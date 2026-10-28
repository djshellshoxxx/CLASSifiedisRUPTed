/**
 * F10.S01.M04 deletion. Flow: requested -> grace (7 days, cancellable) -> executing -> completed,
 * or blocked_by_hold while a legal hold covers the account, or failed (retried by the sweeper).
 * Erasure itself is delegated to the erasers each owning feature registered; the report says what
 * was erased and what was deliberately retained and why (commerce evidence is kept for its policy
 * period, pseudonymised by its owner).
 */
import type { CommandContext, RetentionClass } from '@classrup/kernel';
import { assertTransition, conflict, DAY, isDomainError, notFound, parse, precondition, runCommand, schemas, z } from '@classrup/kernel';
import type { PrivacyEnv } from '../env';
import { authorize, checkFlag, EVENTS, event, FLAGS, ownerRef } from '../env';
import type { DeletionRecord, DeletionReport, DeletionStatus, RetainedItem } from '../records';
import type { RetentionService } from '../retention/retention';
import { describeRule } from '../retention/retention';

export const DELETION_GRACE_MS = 7 * DAY;

export const DELETION_TRANSITIONS: Readonly<Record<DeletionStatus, readonly DeletionStatus[]>> = {
  requested: ['grace', 'cancelled'],
  grace: ['executing', 'blocked_by_hold', 'failed', 'cancelled'],
  blocked_by_hold: ['executing', 'failed', 'cancelled'],
  executing: ['completed', 'failed'],
  // `failed` is recorded after an execution attempt rolled back, so it can follow the pre-execution states and itself.
  failed: ['executing', 'failed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const CLASSES: readonly RetentionClass[] = ['ephemeral', 'session', 'content', 'commerce_evidence', 'moderation', 'audit', 'legal_hold'];
const OPEN: readonly DeletionStatus[] = ['requested', 'grace', 'executing', 'blocked_by_hold', 'failed'];

export interface DeletionDto {
  readonly id: string;
  readonly status: DeletionStatus;
  readonly requestedAt: number;
  readonly graceEndsAt: number;
  readonly completedAt?: number;
  readonly cancelledAt?: number;
  readonly blockedByHoldCount?: number;
  readonly failedArea?: string;
  readonly report?: DeletionReport;
  readonly version: number;
}

const toDto = (d: DeletionRecord): DeletionDto => ({
  id: d.id,
  status: d.status,
  requestedAt: d.requestedAt,
  graceEndsAt: d.graceEndsAt,
  ...(d.completedAt !== undefined ? { completedAt: d.completedAt } : {}),
  ...(d.cancelledAt !== undefined ? { cancelledAt: d.cancelledAt } : {}),
  ...(d.blockedByHoldIds !== undefined ? { blockedByHoldCount: d.blockedByHoldIds.length } : {}),
  ...(d.failedArea !== undefined ? { failedArea: d.failedArea } : {}),
  ...(d.report !== undefined ? { report: d.report } : {}),
  version: d.version,
});

const cancelSchema = z.object({ deletionId: schemas.id('ddel') }).strict();

/** Raised inside the execution transaction so the driver can record which eraser failed after the rollback. */
class EraserFailure extends Error {
  constructor(
    readonly area: string,
    readonly code: string,
  ) {
    super('eraser failed');
  }
}

function failureOf(e: unknown): { area: string; code: string } | undefined {
  if (e instanceof EraserFailure) return { area: e.area, code: e.code };
  return isDomainError(e) ? { area: 'workflow', code: e.code } : undefined;
}

export interface ProcessSummary {
  readonly completed: number;
  readonly blocked: number;
  readonly failed: number;
}

export interface DeletionService {
  request(ctx: CommandContext): DeletionDto;
  status(ctx: CommandContext): DeletionDto[];
  cancel(ctx: CommandContext, input: z.input<typeof cancelSchema>): DeletionDto;
  /**
   * Sweeper entry point (system actor). Runs each due request in its own transaction so one failing
   * eraser cannot undo another person's completed erasure. The idempotency key is not propagated.
   */
  processDue(ctx: CommandContext): ProcessSummary;
}

function describeRetained(area: string, raw: string, retention: RetentionService, tenantId: string): RetainedItem {
  const sep = raw.indexOf(':');
  const prefix = sep > 0 ? raw.slice(0, sep) : '';
  const klass = CLASSES.find((c) => c === prefix);
  if (!klass) return { area, item: raw, retentionClass: null, reason: 'retained by the owning feature under its own policy' };
  const rule = retention.table(tenantId)[klass];
  return { area, item: raw.slice(sep + 1).trim(), retentionClass: klass, reason: `${klass} policy: ${describeRule(rule)}` };
}

export function createDeletionService(env: PrivacyEnv, retention: RetentionService): DeletionService {
  const { deps, stores, ports, registry } = env;

  const ownerResource = (ctx: CommandContext, id?: string) => ownerRef('deletion', ctx.actor.id, ctx.actor.tenantId, id);

  function transition(record: DeletionRecord, to: DeletionStatus, patch: Partial<DeletionRecord>): DeletionRecord {
    assertTransition('PRIVACY', record.status, to, DELETION_TRANSITIONS);
    return stores.deletions.put({ ...record, ...patch, status: to }, record.version);
  }

  function execute(ctx: CommandContext, deletionId: string): DeletionDto {
    return runCommand(deps, { ...ctx, idempotencyKey: undefined }, { name: 'privacy.deletion.execute', flag: FLAGS.delete }, () => {
      const record = stores.deletions.require(deletionId);
      const now = deps.clock.now();
      if (record.status === 'grace' && now < record.graceEndsAt) throw precondition('PRIVACY.GRACE_NOT_ELAPSED', 'grace period has not ended');
      const holds = retention.activeHolds(record.tenantId, 'account', record.accountId);
      if (holds.length > 0) {
        if (record.status === 'blocked_by_hold') return { result: toDto(record) };
        const blocked = transition(record, 'blocked_by_hold', { blockedByHoldIds: holds });
        return {
          result: toDto(blocked),
          events: [event(EVENTS.deletionBlocked, 'deletion', record.id, blocked.version, { deletionId: record.id, accountId: record.accountId, holds: holds.length })],
        };
      }
      const executing = transition(record, 'executing', { startedAt: now, blockedByHoldIds: undefined, failedArea: undefined, failureCode: undefined });
      const areas: { area: string; erased: number; retained: readonly string[] }[] = [];
      for (const [area, eraser] of registry.erasers()) {
        try {
          const r = eraser(record.accountId);
          areas.push({ area, erased: r.erased, retained: [...r.retained] });
        } catch (e) {
          throw new EraserFailure(area, isDomainError(e) ? e.code : 'PRIVACY.ERASER_FAILED');
        }
      }
      const retained = areas.flatMap((a) => a.retained.map((raw) => describeRetained(a.area, raw, retention, record.tenantId)));
      const done = transition(executing, 'completed', { completedAt: now, report: { areas, retained } });
      return {
        result: toDto(done),
        events: [
          event(EVENTS.deletionCompleted, 'deletion', record.id, done.version, {
            deletionId: record.id,
            accountId: record.accountId,
            areas: areas.map((a) => ({ area: a.area, erased: a.erased })),
            retainedCount: retained.length,
          }),
        ],
      };
    });
  }

  function markFailed(ctx: CommandContext, deletionId: string, area: string, code: string): void {
    runCommand(deps, { ...ctx, idempotencyKey: undefined }, { name: 'privacy.deletion.fail', flag: FLAGS.delete }, () => {
      const record = stores.deletions.require(deletionId);
      const failed = transition(record, 'failed', { failedArea: area, failureCode: code });
      return {
        result: undefined,
        events: [event(EVENTS.deletionFailed, 'deletion', record.id, failed.version, { deletionId: record.id, accountId: record.accountId, area, code })],
      };
    });
  }

  return {
    request(ctx) {
      authorize(env, ctx, 'privacy.deletion:request', ownerResource(ctx));
      return runCommand(deps, ctx, { name: 'privacy.deletion.request', flag: FLAGS.delete }, () => {
        const open = stores.deletions.list((d) => d.accountId === ctx.actor.id && OPEN.includes(d.status));
        if (open.length > 0) throw conflict('PRIVACY.DELETION_ACTIVE', 'a deletion request is already open', { deletionId: open[0]?.id ?? '' });
        const now = deps.clock.now();
        const id = deps.ids.next('ddel');
        const requested = stores.deletions.put(
          { id, tenantId: ctx.actor.tenantId, accountId: ctx.actor.id, status: 'requested', requestedAt: now, graceEndsAt: now + DELETION_GRACE_MS },
          0,
        );
        const grace = transition(requested, 'grace', {});
        deps.store.afterCommit(() =>
          ports.notifier.notify({
            tenantId: ctx.actor.tenantId,
            recipientId: ctx.actor.id,
            topic: 'privacy.deletion',
            template: 'privacy.deletion_scheduled',
            data: { graceEndsAt: grace.graceEndsAt },
            priority: 'high',
          }),
        );
        return {
          result: toDto(grace),
          events: [event(EVENTS.deletionRequested, 'deletion', id, grace.version, { deletionId: id, accountId: ctx.actor.id, graceEndsAt: grace.graceEndsAt })],
        };
      });
    },

    status(ctx) {
      authorize(env, ctx, 'privacy.deletion:read', ownerResource(ctx));
      checkFlag(env, ctx, FLAGS.delete);
      return stores.deletions.list((d) => d.accountId === ctx.actor.id).sort((a, b) => b.requestedAt - a.requestedAt).map(toDto);
    },

    cancel(ctx, input) {
      const i = parse(cancelSchema, input);
      const found = stores.deletions.get(i.deletionId);
      if (!found || found.tenantId !== ctx.actor.tenantId) throw notFound('PRIVACY.DELETION_NOT_FOUND', 'deletion request not found');
      authorize(env, ctx, 'privacy.deletion:cancel', ownerResource(ctx, found.id));
      if (found.accountId !== ctx.actor.id) throw notFound('PRIVACY.DELETION_NOT_FOUND', 'deletion request not found');
      return runCommand(deps, ctx, { name: 'privacy.deletion.cancel', flag: FLAGS.delete, request: i }, () => {
        const record = stores.deletions.require(i.deletionId);
        const cancelled = transition(record, 'cancelled', { cancelledAt: deps.clock.now() });
        return {
          result: toDto(cancelled),
          events: [event(EVENTS.deletionCancelled, 'deletion', record.id, cancelled.version, { deletionId: record.id, accountId: record.accountId })],
        };
      });
    },

    processDue(ctx) {
      authorize(env, ctx, 'privacy.deletion:process', { type: 'deletion', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.delete);
      const now = deps.clock.now();
      const due = stores.deletions.list(
        (d) => d.tenantId === ctx.actor.tenantId && ((d.status === 'grace' && d.graceEndsAt <= now) || d.status === 'blocked_by_hold' || d.status === 'failed'),
      );
      let completed = 0;
      let blocked = 0;
      let failed = 0;
      for (const d of due) {
        try {
          const result = execute(ctx, d.id);
          if (result.status === 'completed') completed++;
          else blocked++;
        } catch (e) {
          const failure = failureOf(e);
          if (!failure) throw e;
          failed++;
          markFailed(ctx, d.id, failure.area, failure.code);
        }
      }
      return { completed, blocked, failed };
    },
  };
}
