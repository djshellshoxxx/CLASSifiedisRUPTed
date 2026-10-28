/** F16.S03.M02 incident model: state machine, response-time targets and SLA evaluation (pure). */
import type { Versioned } from '@classrup/kernel';
import { MINUTE } from '@classrup/kernel';
import type { PlaybookKey } from './playbooks';

export type Severity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
export type IncidentStatus = 'detected' | 'triaged' | 'contained' | 'eradicated' | 'recovered' | 'postmortem_done' | 'dismissed';
export type IncidentCategory = PlaybookKey | 'other';
export type SlaKind = 'acknowledge' | 'contain' | 'resolve';

export const SEVERITIES: readonly Severity[] = ['SEV1', 'SEV2', 'SEV3', 'SEV4'];

/** Forward-only response phases; an invalid report may be dismissed before containment starts. */
export const INCIDENT_TRANSITIONS: Readonly<Record<IncidentStatus, readonly IncidentStatus[]>> = {
  detected: ['triaged', 'dismissed'],
  triaged: ['contained', 'dismissed'],
  contained: ['eradicated'],
  eradicated: ['recovered'],
  recovered: ['postmortem_done'],
  postmortem_done: [],
  dismissed: [],
};

export const isClosed = (s: IncidentStatus): boolean => s === 'postmortem_done' || s === 'dismissed';

/** Minutes from detection: acknowledge = reach `triaged`, contain = reach `contained`, resolve = reach `recovered`. */
export const RESPONSE_TARGETS: Readonly<Record<Severity, Readonly<Record<SlaKind, number>>>> = {
  SEV1: { acknowledge: 15, contain: 60, resolve: 240 },
  SEV2: { acknowledge: 30, contain: 240, resolve: 1440 },
  SEV3: { acknowledge: 240, contain: 1440, resolve: 4320 },
  SEV4: { acknowledge: 1440, contain: 4320, resolve: 10080 },
};

export type TimelineKind =
  | 'reported'
  | 'status_changed'
  | 'severity_changed'
  | 'note'
  | 'sla_breached'
  | 'playbook_started'
  | 'step_done'
  | 'step_skipped'
  | 'playbook_completed'
  | 'postmortem_recorded';

/** Append-only: entries are never edited or removed. */
export interface TimelineEntry {
  readonly seq: number;
  readonly at: number;
  readonly actorId: string;
  readonly kind: TimelineKind;
  readonly from?: string;
  readonly to?: string;
  readonly text?: string;
}

export type StepStatus = 'pending' | 'done' | 'skipped';

export interface RunStep {
  readonly stepId: string;
  readonly status: StepStatus;
  readonly at?: number;
  readonly by?: string;
  readonly note?: string;
}

export interface PlaybookRun {
  readonly runId: string;
  readonly playbookKey: PlaybookKey;
  readonly startedAt: number;
  readonly startedBy: string;
  readonly steps: readonly RunStep[];
  readonly completedAt?: number;
}

export interface Postmortem {
  readonly summary: string;
  readonly rootCause: string;
  readonly actionItems: readonly string[];
  readonly recordedAt: number;
  readonly recordedBy: string;
}

export interface IncidentRecord extends Versioned {
  readonly tenantId: string;
  readonly title: string;
  readonly summary: string;
  readonly severity: Severity;
  readonly category: IncidentCategory;
  readonly status: IncidentStatus;
  readonly reportedBy: string;
  readonly detectedAt: number;
  readonly triagedAt?: number;
  readonly containedAt?: number;
  readonly recoveredAt?: number;
  readonly closedAt?: number;
  readonly timeline: readonly TimelineEntry[];
  readonly playbookRuns: readonly PlaybookRun[];
  /** SLA kinds already flagged, so the sweeper reports each breach once. */
  readonly breaches: readonly SlaKind[];
  readonly postmortem?: Postmortem;
  readonly updatedAt: number;
}

export type SlaState = 'pending' | 'met' | 'late' | 'breached';

export interface SlaEntry {
  readonly kind: SlaKind;
  readonly dueAt: number;
  readonly state: SlaState;
}

const REACHED_AT: Readonly<Record<SlaKind, (i: IncidentRecord) => number | undefined>> = {
  acknowledge: (i) => i.triagedAt,
  contain: (i) => i.containedAt,
  resolve: (i) => i.recoveredAt,
};

export const SLA_KINDS: readonly SlaKind[] = ['acknowledge', 'contain', 'resolve'];

/** Dismissed incidents have no response obligations. */
export function slaStatus(incident: IncidentRecord, now: number): SlaEntry[] {
  if (incident.status === 'dismissed') return [];
  return SLA_KINDS.map((kind) => {
    const dueAt = incident.detectedAt + RESPONSE_TARGETS[incident.severity][kind] * MINUTE;
    const reached = REACHED_AT[kind](incident);
    const state: SlaState = reached !== undefined ? (reached <= dueAt ? 'met' : 'late') : now > dueAt ? 'breached' : 'pending';
    return { kind, dueAt, state };
  });
}

export function appendTimeline(incident: IncidentRecord, entry: Omit<TimelineEntry, 'seq'>): readonly TimelineEntry[] {
  return [...incident.timeline, { ...entry, seq: incident.timeline.length + 1 }];
}
