/** Operations for F16.S03.M02 (incidents) and F16.S03.M03 (response playbooks and execution tracking). */
import type { Deps, Operation } from '@classrup/kernel';
import { assertTransition, assertVersion, conflict, notFound, precondition, runCommand, schemas, z } from '@classrup/kernel';
import type { Permission } from '@classrup/kernel';
import { PERM } from '../policies';
import { authorize, operation, platformEvent, sortBy } from '../support';
import type { IncidentRecord, IncidentStatus, PlaybookRun, Postmortem, RunStep, SlaKind } from './incidents';
import { appendTimeline, INCIDENT_TRANSITIONS, isClosed, SEVERITIES, slaStatus } from './incidents';
import { PLAYBOOKS, playbookByKey } from './playbooks';

const FLAG = 'platform.assurance';
export const INCIDENTS_COLLECTION = 'platform_incidents';

const incidentId = z.string().regex(/^inc_[0-9A-HJKMNP-TV-Z]{26}$/);
const version = z.number().int().nonnegative();
const severity = z.enum(SEVERITIES as [string, ...string[]]);
const category = z.enum(['key_compromise', 'data_exposure', 'relay_compromise', 'fraud_wave', 'other']);
const note = schemas.text(3, 2000);
const STATUSES = ['triaged', 'contained', 'eradicated', 'recovered', 'postmortem_done', 'dismissed'] as const;

const reportSchema = z.strictObject({ title: schemas.text(3, 120), summary: schemas.text(10, 2000), severity, category });
const advanceSchema = z
  .strictObject({
    incidentId,
    to: z.enum(STATUSES),
    note: note.optional(),
    postmortem: z.strictObject({ summary: schemas.text(20, 2000), rootCause: schemas.text(10, 1000), actionItems: z.array(schemas.text(3, 300)).min(1).max(20) }).optional(),
    expectedVersion: version,
  })
  .refine((v) => (v.to === 'postmortem_done') === (v.postmortem !== undefined), 'postmortem is required for, and only allowed with, postmortem_done')
  .refine((v) => v.to !== 'dismissed' || v.note !== undefined, 'dismissing needs a reason in note');
const severitySchema = z.strictObject({ incidentId, severity, reason: note, expectedVersion: version.optional() });
const noteSchema = z.strictObject({ incidentId, text: note, expectedVersion: version.optional() });
const getSchema = z.strictObject({ incidentId });
const listSchema = z.strictObject({ status: z.enum(['detected', ...STATUSES]).optional(), openOnly: z.boolean().optional() });
const startSchema = z.strictObject({ incidentId, playbookKey: z.string().min(1).max(40), expectedVersion: version.optional() });
const stepSchema = z.strictObject({
  incidentId,
  runId: z.string().regex(/^run-\d{1,4}$/),
  stepId: z.string().min(1).max(40),
  status: z.enum(['done', 'skipped']),
  note: note.optional(),
  expectedVersion: version.optional(),
});
const emptySchema = z.strictObject({});

export function incidentDto(i: IncidentRecord, now: number): Record<string, unknown> {
  return {
    id: i.id,
    title: i.title,
    summary: i.summary,
    severity: i.severity,
    category: i.category,
    status: i.status,
    reportedBy: i.reportedBy,
    detectedAt: i.detectedAt,
    ...(i.triagedAt !== undefined ? { triagedAt: i.triagedAt } : {}),
    ...(i.containedAt !== undefined ? { containedAt: i.containedAt } : {}),
    ...(i.recoveredAt !== undefined ? { recoveredAt: i.recoveredAt } : {}),
    ...(i.closedAt !== undefined ? { closedAt: i.closedAt } : {}),
    sla: slaStatus(i, now),
    timeline: i.timeline.map((t) => ({ ...t })),
    playbookRuns: i.playbookRuns.map((r) => ({ ...r, steps: r.steps.map((s) => ({ ...s })) })),
    ...(i.postmortem ? { postmortem: { ...i.postmortem, actionItems: [...i.postmortem.actionItems] } } : {}),
    updatedAt: i.updatedAt,
    version: i.version,
  };
}

const summaryDto = (i: IncidentRecord, now: number): Record<string, unknown> => ({
  id: i.id,
  title: i.title,
  severity: i.severity,
  category: i.category,
  status: i.status,
  detectedAt: i.detectedAt,
  breached: slaStatus(i, now).filter((s) => s.state === 'breached').map((s) => s.kind),
  version: i.version,
});

const ref = (i: IncidentRecord): { type: string; id: string; tenantId: string } => ({ type: 'incident', id: i.id, tenantId: i.tenantId });

const hasOpenSteps = (runs: readonly PlaybookRun[]): boolean => runs.some((r) => r.steps.some((s) => s.status === 'pending'));

export function incidentOperations(deps: Deps): readonly Operation[] {
  const incidents = deps.store.collection<IncidentRecord>(INCIDENTS_COLLECTION);

  const load = (id: string): IncidentRecord => {
    const i = incidents.get(id);
    if (!i) throw notFound('INCIDENT.NOT_FOUND', 'incident not found', { incidentId: id });
    return i;
  };

  const assertOpen = (i: IncidentRecord): void => {
    if (isClosed(i.status)) throw precondition('INCIDENT.CLOSED', 'incident is closed', { status: i.status });
  };

  /** Authorize against the stored incident, then re-read it inside the command so the version check sees committed state. */
  const mutate = <S extends z.ZodType<{ incidentId: string; expectedVersion?: number }>>(
    name: string,
    summary: string,
    schema: S,
    permission: (input: z.output<S>) => Permission,
    change: (i: IncidentRecord, input: z.output<S>, ctx: { actorId: string; now: number }) => { next: IncidentRecord; events: ReturnType<typeof platformEvent>[] },
  ): Operation =>
    operation({ name, kind: 'command', flag: FLAG, summary }, schema, (ctx, input) => {
      authorize(deps, ctx, permission(input), ref(load(input.incidentId)));
      return runCommand(deps, ctx, { name, flag: FLAG, request: input }, () => {
        const current = load(input.incidentId);
        assertVersion('incident', current.version, input.expectedVersion);
        const out = change(current, input, { actorId: ctx.actor.id, now: deps.clock.now() });
        const stored = incidents.put({ ...out.next, updatedAt: deps.clock.now() }, current.version);
        return { result: incidentDto(stored, deps.clock.now()), events: out.events.map((e) => ({ ...e, revision: stored.version })) };
      });
    });

  const ev = (type: string, id: string, payload: Record<string, unknown>): ReturnType<typeof platformEvent> =>
    platformEvent(type, 'incident', id, 0, { incidentId: id, ...payload });

  return [
    operation({ name: 'platform.incident.report', kind: 'command', flag: FLAG, summary: 'Open a security incident' }, reportSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.incidentReport, { type: 'incident', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'platform.incident.report', flag: FLAG, request: input }, () => {
        const now = deps.clock.now();
        const id = deps.ids.next('inc');
        const stored = incidents.put(
          {
            id,
            tenantId: ctx.actor.tenantId,
            title: input.title,
            summary: input.summary,
            severity: input.severity as IncidentRecord['severity'],
            category: input.category,
            status: 'detected',
            reportedBy: ctx.actor.id,
            detectedAt: now,
            timeline: [{ seq: 1, at: now, actorId: ctx.actor.id, kind: 'reported', to: 'detected' }],
            playbookRuns: [],
            breaches: [],
            updatedAt: now,
          },
          0,
        );
        const payload = { incidentId: id, severity: stored.severity, category: stored.category };
        return { result: incidentDto(stored, now), events: [platformEvent('platform.incident.reported', 'incident', id, stored.version, payload)] };
      });
    }),

    mutate(
      'platform.incident.advance',
      'Move an incident to its next response phase',
      advanceSchema,
      (input) => (input.to === 'triaged' || input.to === 'dismissed' ? PERM.incidentTriage : PERM.incidentManage),
      (i, input, { actorId, now }) => {
        assertTransition('INCIDENT', i.status, input.to as IncidentStatus, INCIDENT_TRANSITIONS);
        if (input.to === 'recovered' && hasOpenSteps(i.playbookRuns)) {
          throw precondition('INCIDENT.PLAYBOOK_INCOMPLETE', 'a started playbook still has pending steps');
        }
        let timeline = appendTimeline(i, { at: now, actorId, kind: 'status_changed', from: i.status, to: input.to, ...(input.note !== undefined ? { text: input.note } : {}) });
        let postmortem: Postmortem | undefined;
        if (input.postmortem) {
          postmortem = { ...input.postmortem, recordedAt: now, recordedBy: actorId };
          timeline = [...timeline, { seq: timeline.length + 1, at: now, actorId, kind: 'postmortem_recorded' }];
        }
        const stamps: Partial<Record<IncidentStatus, Partial<IncidentRecord>>> = {
          triaged: { triagedAt: now },
          contained: { containedAt: now },
          recovered: { recoveredAt: now },
          postmortem_done: { closedAt: now },
          dismissed: { closedAt: now },
        };
        const next: IncidentRecord = { ...i, ...stamps[input.to as IncidentStatus], status: input.to as IncidentStatus, timeline, ...(postmortem ? { postmortem } : {}) };
        return { next, events: [ev('platform.incident.status_changed', i.id, { from: i.status, to: input.to, severity: i.severity })] };
      },
    ),

    mutate(
      'platform.incident.set_severity',
      'Change incident severity (response targets follow)',
      severitySchema,
      () => PERM.incidentTriage,
      (i, input, { actorId, now }) => {
        assertOpen(i);
        if (input.severity === i.severity) throw conflict('INCIDENT.SEVERITY_UNCHANGED', 'incident already has this severity');
        const timeline = appendTimeline(i, { at: now, actorId, kind: 'severity_changed', from: i.severity, to: input.severity, text: input.reason });
        return {
          next: { ...i, severity: input.severity as IncidentRecord['severity'], timeline },
          events: [ev('platform.incident.severity_changed', i.id, { from: i.severity, to: input.severity })],
        };
      },
    ),

    mutate(
      'platform.incident.add_note',
      'Append a note to the incident timeline',
      noteSchema,
      () => PERM.incidentAnnotate,
      (i, input, { actorId, now }) => {
        assertOpen(i);
        const timeline = appendTimeline(i, { at: now, actorId, kind: 'note', text: input.text });
        // The note text stays out of the event: events are broadcast, the timeline is staff-only.
        return { next: { ...i, timeline }, events: [ev('platform.incident.note_added', i.id, { seq: timeline.length })] };
      },
    ),

    operation({ name: 'platform.incident.get', kind: 'query', flag: FLAG, summary: 'Read an incident with timeline and SLA state' }, getSchema, (ctx, input) => {
      const i = load(input.incidentId);
      authorize(deps, ctx, PERM.incidentRead, ref(i));
      return incidentDto(i, deps.clock.now());
    }),

    operation({ name: 'platform.incident.list', kind: 'query', flag: FLAG, summary: 'List incidents of the caller tenant' }, listSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.incidentRead, { type: 'incident', tenantId: ctx.actor.tenantId });
      const now = deps.clock.now();
      const matching = incidents.list(
        (i) => i.tenantId === ctx.actor.tenantId && (input.status === undefined || i.status === input.status) && (!input.openOnly || !isClosed(i.status)),
      );
      return sortBy(matching, (i) => -i.detectedAt).map((i) => summaryDto(i, now));
    }),

    operation({ name: 'platform.incident.escalate_due', kind: 'command', flag: FLAG, summary: 'Flag incidents that missed a response target' }, emptySchema, (ctx, input) => {
      authorize(deps, ctx, PERM.incidentSweep, { type: 'incident', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'platform.incident.escalate_due', flag: FLAG, request: input }, () => {
        const now = deps.clock.now();
        const flagged: { id: string; kind: SlaKind }[] = [];
        const events: ReturnType<typeof platformEvent>[] = [];
        for (const open of incidents.list((i) => i.tenantId === ctx.actor.tenantId && !isClosed(i.status))) {
          const fresh = slaStatus(open, now).filter((s) => s.state === 'breached' && !open.breaches.includes(s.kind));
          if (fresh.length === 0) continue;
          let timeline = open.timeline;
          for (const s of fresh) timeline = [...timeline, { seq: timeline.length + 1, at: now, actorId: ctx.actor.id, kind: 'sla_breached' as const, to: s.kind }];
          const stored = incidents.put({ ...open, timeline, breaches: [...open.breaches, ...fresh.map((s) => s.kind)], updatedAt: now }, open.version);
          for (const s of fresh) {
            flagged.push({ id: open.id, kind: s.kind });
            events.push(platformEvent('platform.incident.sla_breached', 'incident', open.id, stored.version, { incidentId: open.id, kind: s.kind, severity: open.severity }));
          }
        }
        return { result: { flagged }, events };
      });
    }),

    operation({ name: 'platform.playbook.list', kind: 'query', flag: FLAG, summary: 'Response playbooks' }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.playbookRead);
      return PLAYBOOKS.map((p) => structuredClone(p));
    }),

    mutate(
      'platform.incident.start_playbook',
      'Start tracking a response playbook on an incident',
      startSchema,
      () => PERM.incidentManage,
      (i, input, { actorId, now }) => {
        assertOpen(i);
        const playbook = playbookByKey(input.playbookKey);
        if (!playbook) throw notFound('PLAYBOOK.NOT_FOUND', 'unknown playbook', { playbookKey: input.playbookKey });
        if (i.playbookRuns.some((r) => r.playbookKey === playbook.key && r.completedAt === undefined)) {
          throw conflict('PLAYBOOK.ALREADY_RUNNING', 'this playbook is already running on the incident', { playbookKey: playbook.key });
        }
        const run: PlaybookRun = {
          runId: `run-${i.playbookRuns.length + 1}`,
          playbookKey: playbook.key,
          startedAt: now,
          startedBy: actorId,
          steps: playbook.steps.map((s) => ({ stepId: s.id, status: 'pending' as const })),
        };
        const timeline = appendTimeline(i, { at: now, actorId, kind: 'playbook_started', to: playbook.key });
        const payload = { runId: run.runId, playbookKey: playbook.key };
        return { next: { ...i, playbookRuns: [...i.playbookRuns, run], timeline }, events: [ev('platform.incident.playbook_started', i.id, payload)] };
      },
    ),

    mutate(
      'platform.incident.complete_step',
      'Mark a playbook step done or skipped',
      stepSchema,
      () => PERM.incidentManage,
      (i, input, { actorId, now }) => {
        assertOpen(i);
        const run = i.playbookRuns.find((r) => r.runId === input.runId);
        const step = run?.steps.find((s) => s.stepId === input.stepId);
        if (!run || !step) throw notFound('PLAYBOOK.STEP_NOT_FOUND', 'playbook run or step not found', { runId: input.runId, stepId: input.stepId });
        if (step.status !== 'pending') throw conflict('PLAYBOOK.STEP_RESOLVED', 'step already resolved', { stepId: input.stepId });
        if (input.status === 'skipped' && input.note === undefined) throw precondition('PLAYBOOK.SKIP_NEEDS_NOTE', 'skipping a step needs a reason in note');
        const resolved: RunStep = { stepId: step.stepId, status: input.status, at: now, by: actorId, ...(input.note !== undefined ? { note: input.note } : {}) };
        const steps = run.steps.map((s) => (s.stepId === step.stepId ? resolved : s));
        const finished = steps.every((s) => s.status !== 'pending');
        const updatedRun: PlaybookRun = { ...run, steps, ...(finished ? { completedAt: now } : {}) };
        let timeline = appendTimeline(i, { at: now, actorId, kind: input.status === 'done' ? 'step_done' : 'step_skipped', to: step.stepId, ...(input.note !== undefined ? { text: input.note } : {}) });
        const events = [ev('platform.incident.playbook_step_completed', i.id, { runId: run.runId, stepId: step.stepId, status: input.status })];
        if (finished) {
          timeline = [...timeline, { seq: timeline.length + 1, at: now, actorId, kind: 'playbook_completed', to: run.playbookKey }];
          events.push(ev('platform.incident.playbook_completed', i.id, { runId: run.runId, playbookKey: run.playbookKey }));
        }
        return { next: { ...i, playbookRuns: i.playbookRuns.map((r) => (r.runId === run.runId ? updatedRun : r)), timeline }, events };
      },
    ),
  ];
}
