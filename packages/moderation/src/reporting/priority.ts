/** Case priority and SLA: pure functions so ordering rules are property-testable. */
import { HOUR } from '@classrup/kernel';
import type { ReportReason } from '../types';

/** 0..100 severity of what is alleged, independent of how often it is reported. */
export const REASON_SEVERITY: Readonly<Record<ReportReason, number>> = {
  minor_safety: 90,
  violence: 80,
  scam_fraud: 70,
  harassment: 60,
  hate: 60,
  privacy_violation: 60,
  sexual_content: 55,
  impersonation: 50,
  prohibited_item: 50,
  counterfeit: 45,
  spam: 25,
  other: 20,
};

/** Reasons that describe conduct towards a person; repeated reports of these form a harassment pattern. */
export const INTERPERSONAL_REASONS: ReadonlySet<ReportReason> = new Set<ReportReason>([
  'harassment',
  'hate',
  'violence',
  'sexual_content',
  'minor_safety',
  'impersonation',
  'privacy_violation',
]);

export const MAX_VOLUME_BONUS = 20;
export const ESCALATION_FLOOR = 60;
export const ESCALATION_BONUS = 20;

export interface PriorityInput {
  readonly reasons: readonly ReportReason[];
  /** One trust value in [0,1] per distinct reporter. */
  readonly reporterTrust: readonly number[];
  readonly escalated: boolean;
}

/** Laplace-smoothed share of a reporter's earlier reports that moderators upheld. */
export const reporterTrust = (upheld: number, dismissed: number): number => (upheld + 1) / (upheld + dismissed + 2);

export function computePriority(input: PriorityInput): number {
  const severity = input.reasons.reduce((max, r) => Math.max(max, REASON_SEVERITY[r]), 0);
  // A neutral reporter (trust 0.5) counts as 1, so the first report adds nothing and each further one adds 4.
  const weighted = input.reporterTrust.reduce((sum, t) => sum + 2 * t, 0);
  const volume = Math.min(MAX_VOLUME_BONUS, Math.floor(4 * Math.max(0, weighted - 1)));
  const base = Math.min(100, severity + volume);
  return input.escalated ? Math.min(100, Math.max(base, ESCALATION_FLOOR) + ESCALATION_BONUS) : base;
}

export function slaWindowMs(priority: number): number {
  if (priority >= 80) return 4 * HOUR;
  if (priority >= 50) return 24 * HOUR;
  return 72 * HOUR;
}

/** The SLA clock only ever tightens when a case becomes more urgent. */
export const slaDue = (openedAt: number, priority: number, current?: number): number => {
  const candidate = openedAt + slaWindowMs(priority);
  return current === undefined ? candidate : Math.min(current, candidate);
};
