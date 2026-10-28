/** F15.S03.M03 disaster-recovery drill tracking: schedule -> run steps -> finish, measured against the runbook RTO. */
import type { CommandContext, Deps, Operation, Versioned } from '@classrup/kernel';
import { assertTransition, assertVersion, conflict, MINUTE, DAY, notFound, precondition, runCommand, z } from '@classrup/kernel';
import { PERM } from '../policies';
import { authorize, operation, platformEvent, sortBy } from '../support';
import type { Runbook } from './runbooks';
import { RUNBOOKS, runbookByKey } from './runbooks';

const FLAG = 'platform.operations';
export const DRILLS_COLLECTION = 'platform_drills';

/** A runbook not drilled successfully within this interval is reported overdue. */
export const DRILL_INTERVAL_MS = 180 * DAY;

export type DrillStatus = 'planned' | 'in_progress' | 'completed' | 'aborted';
export type DrillOutcome = 'pass' | 'fail';

export const DRILL_TRANSITIONS: Readonly<Record<DrillStatus, readonly DrillStatus[]>> = {
  planned: ['in_progress', 'aborted'],
  in_progress: ['completed', 'aborted'],
  completed: [],
  aborted: [],
};

export interface DrillStepRecord {
  readonly stepId: string;
  readonly at: number;
  readonly note?: string;
}

export interface DrillRecord extends Versioned {
  readonly tenantId: string;
  readonly runbookKey: string;
  readonly status: DrillStatus;
  readonly scheduledFor: number;
  readonly createdBy: string;
  readonly startedAt?: number;
  readonly finishedAt?: number;
  readonly steps: readonly DrillStepRecord[];
  readonly outcome?: DrillOutcome;
  readonly durationMinutes?: number;
  readonly withinRto?: boolean;
  readonly findings: readonly string[];
  readonly abortReason?: string;
  readonly createdAt: number;
}

export function drillDto(d: DrillRecord): Record<string, unknown> {
  return {
    id: d.id,
    runbookKey: d.runbookKey,
    status: d.status,
    scheduledFor: d.scheduledFor,
    ...(d.startedAt !== undefined ? { startedAt: d.startedAt } : {}),
    ...(d.finishedAt !== undefined ? { finishedAt: d.finishedAt } : {}),
    steps: d.steps.map((s) => ({ ...s })),
    ...(d.outcome !== undefined ? { outcome: d.outcome, durationMinutes: d.durationMinutes, withinRto: d.withinRto } : {}),
    findings: [...d.findings],
    ...(d.abortReason !== undefined ? { abortReason: d.abortReason } : {}),
    version: d.version,
  };
}

const drillId = z.string().regex(/^rbook_[0-9A-HJKMNP-TV-Z]{26}$/);
const version = z.number().int().nonnegative();
const note = z.string().trim().min(1).max(500);
const scheduleSchema = z.strictObject({ runbookKey: z.string().min(1).max(40), scheduledFor: z.number().int().nonnegative() });
const startSchema = z.strictObject({ drillId, expectedVersion: version });
const stepSchema = z.strictObject({ drillId, stepId: z.string().min(1).max(40), note: note.optional(), expectedVersion: version });
const finishSchema = z.strictObject({
  drillId,
  outcome: z.enum(['pass', 'fail']),
  findings: z.array(note).max(20).default([]),
  expectedVersion: version,
});
const abortSchema = z.strictObject({ drillId, reason: note, expectedVersion: version });
const getSchema = z.strictObject({ drillId });
const emptySchema = z.strictObject({});

export function drillOperations(deps: Deps): readonly Operation[] {
  const drills = deps.store.collection<DrillRecord>(DRILLS_COLLECTION);

  const requireRunbook = (key: string): Runbook => {
    const rb = runbookByKey(key);
    if (!rb) throw notFound('DRILL.UNKNOWN_RUNBOOK', 'unknown runbook', { runbookKey: key });
    return rb;
  };

  /** Loads the drill, authorizes against its tenant, then runs the transition inside the command pipeline. */
  const transition = <S extends z.ZodType<{ drillId: string; expectedVersion: number }>>(
    name: string,
    summary: string,
    schema: S,
    change: (drill: DrillRecord, input: z.output<S>, now: number) => { drill: DrillRecord; event: string; payload: Record<string, unknown> },
  ): Operation =>
    operation({ name, kind: 'command', flag: FLAG, summary }, schema, (ctx: CommandContext, input) => {
      const current = drills.require(input.drillId);
      authorize(deps, ctx, PERM.drillManage, { type: 'drill', id: current.id, tenantId: current.tenantId });
      return runCommand(deps, ctx, { name, flag: FLAG, request: input }, () => {
        const fresh = drills.require(input.drillId);
        assertVersion('drill', fresh.version, input.expectedVersion);
        const out = change(fresh, input, deps.clock.now());
        const stored = drills.put(out.drill, fresh.version);
        return { result: drillDto(stored), events: [platformEvent(out.event, 'drill', stored.id, stored.version, { drillId: stored.id, ...out.payload })] };
      });
    });

  return [
    operation({ name: 'platform.runbook.list', kind: 'query', flag: FLAG, summary: 'Disaster-recovery runbooks' }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.runbookRead);
      return RUNBOOKS.map((r) => structuredClone(r));
    }),

    operation({ name: 'platform.drill.schedule', kind: 'command', flag: FLAG, summary: 'Schedule a recovery drill' }, scheduleSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.drillManage, { type: 'drill', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'platform.drill.schedule', flag: FLAG, request: input }, () => {
        requireRunbook(input.runbookKey);
        const now = deps.clock.now();
        const id = deps.ids.next('rbook');
        const stored = drills.put(
          { id, tenantId: ctx.actor.tenantId, runbookKey: input.runbookKey, status: 'planned', scheduledFor: input.scheduledFor, createdBy: ctx.actor.id, steps: [], findings: [], createdAt: now },
          0,
        );
        const payload = { drillId: id, runbookKey: input.runbookKey };
        return { result: drillDto(stored), events: [platformEvent('platform.drill.scheduled', 'drill', id, stored.version, payload)] };
      });
    }),

    transition('platform.drill.start', 'Start a planned drill', startSchema, (d, _input, now) => {
      assertTransition('DRILL', d.status, 'in_progress', DRILL_TRANSITIONS);
      return { drill: { ...d, status: 'in_progress', startedAt: now }, event: 'platform.drill.started', payload: { runbookKey: d.runbookKey } };
    }),

    transition('platform.drill.complete_step', 'Record a completed runbook step', stepSchema, (d, input, now) => {
      if (d.status !== 'in_progress') throw conflict('DRILL.NOT_RUNNING', 'drill is not in progress', { status: d.status });
      if (!requireRunbook(d.runbookKey).steps.some((s) => s.id === input.stepId)) throw notFound('DRILL.UNKNOWN_STEP', 'step is not in the runbook', { stepId: input.stepId });
      if (d.steps.some((s) => s.stepId === input.stepId)) throw conflict('DRILL.STEP_DONE', 'step already completed', { stepId: input.stepId });
      const entry: DrillStepRecord = { stepId: input.stepId, at: now, ...(input.note !== undefined ? { note: input.note } : {}) };
      return { drill: { ...d, steps: [...d.steps, entry] }, event: 'platform.drill.step_completed', payload: { stepId: input.stepId } };
    }),

    transition('platform.drill.finish', 'Finish a drill and judge it against the RTO', finishSchema, (d, input, now) => {
      assertTransition('DRILL', d.status, 'completed', DRILL_TRANSITIONS);
      const runbook = requireRunbook(d.runbookKey);
      const pending = runbook.steps.filter((s) => !d.steps.some((done) => done.stepId === s.id)).map((s) => s.id);
      if (pending.length > 0) throw precondition('DRILL.STEPS_PENDING', 'runbook steps still pending', { pending });
      if (input.outcome === 'fail' && input.findings.length === 0) throw precondition('DRILL.FINDINGS_REQUIRED', 'a failed drill needs at least one finding');
      const durationMinutes = Math.ceil((now - (d.startedAt as number)) / MINUTE);
      const withinRto = durationMinutes <= runbook.rtoMinutes;
      // A drill that overran its RTO cannot be reported as a pass.
      const outcome: DrillOutcome = input.outcome === 'pass' && withinRto ? 'pass' : 'fail';
      const findings = withinRto ? input.findings : [...input.findings, `RTO exceeded: ${durationMinutes} min against ${runbook.rtoMinutes} min`];
      return {
        drill: { ...d, status: 'completed', finishedAt: now, outcome, durationMinutes, withinRto, findings },
        event: 'platform.drill.completed',
        payload: { runbookKey: d.runbookKey, outcome, withinRto },
      };
    }),

    transition('platform.drill.abort', 'Abort a planned or running drill', abortSchema, (d, input, now) => {
      assertTransition('DRILL', d.status, 'aborted', DRILL_TRANSITIONS);
      return { drill: { ...d, status: 'aborted', finishedAt: now, abortReason: input.reason }, event: 'platform.drill.aborted', payload: { runbookKey: d.runbookKey } };
    }),

    operation({ name: 'platform.drill.get', kind: 'query', flag: FLAG, summary: 'Read a drill record' }, getSchema, (ctx, input) => {
      const drill = drills.require(input.drillId);
      authorize(deps, ctx, PERM.drillRead, { type: 'drill', id: drill.id, tenantId: drill.tenantId });
      return drillDto(drill);
    }),

    operation({ name: 'platform.drill.status', kind: 'query', flag: FLAG, summary: 'Last successful drill and overdue flag per runbook' }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.drillRead, { type: 'drill', tenantId: ctx.actor.tenantId });
      const now = deps.clock.now();
      const mine = drills.list((d) => d.tenantId === ctx.actor.tenantId);
      return RUNBOOKS.map((r) => {
        const passed = sortBy(
          mine.filter((d) => d.runbookKey === r.key && d.outcome === 'pass'),
          (d) => -(d.finishedAt as number),
        )[0];
        const lastPassedAt = passed?.finishedAt;
        return { runbookKey: r.key, ...(lastPassedAt !== undefined ? { lastPassedAt } : {}), overdue: lastPassedAt === undefined || now - lastPassedAt > DRILL_INTERVAL_MS };
      });
    }),
  ];
}
