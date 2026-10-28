/** F12.S03.M01 risk: explainable score from decayed signals scaled by how sensitive the attempted action is. */
import type { CommandContext, RiskDecision, RiskInput, RiskPort } from '@classrup/kernel';
import { parse, schemas, z } from '@classrup/kernel';
import { authorize, operation } from '../common';
import type { Env } from '../common';
import { decayedWeight, liveSignals } from './signals';

export const CHALLENGE_THRESHOLD = 40;
export const DENY_THRESHOLD = 75;

export type Sensitivity = 'low' | 'standard' | 'high';
const SENSITIVITY_PERCENT: Readonly<Record<Sensitivity, number>> = { low: 60, standard: 100, high: 150 };

/** Longest matching prefix wins; unlisted actions are `standard`. */
export const ACTION_SENSITIVITY: readonly (readonly [prefix: string, level: Sensitivity])[] = [
  ['commerce.payment', 'high'],
  ['commerce.settlement', 'high'],
  ['auctions.bid', 'high'],
  ['auctions.auction.create', 'high'],
  ['mutiny.cycle', 'high'],
  ['rentals.deposit', 'high'],
  ['comms.', 'low'],
  ['discovery.', 'low'],
];

export function sensitivityFor(action: string): Sensitivity {
  let best: Sensitivity = 'standard';
  let bestLen = -1;
  for (const [prefix, level] of ACTION_SENSITIVITY) {
    if (action.startsWith(prefix) && prefix.length > bestLen) {
      best = level;
      bestLen = prefix.length;
    }
  }
  return best;
}

export const decisionFor = (score: number): RiskDecision['decision'] =>
  score >= DENY_THRESHOLD ? 'deny' : score >= CHALLENGE_THRESHOLD ? 'challenge' : 'allow';

export interface ScoredSignal {
  readonly kind: string;
  readonly weight: number;
  readonly at: number;
}

export interface RiskScore {
  readonly score: number;
  readonly rawScore: number;
  readonly contributions: readonly (readonly [kind: string, points: number])[];
}

/** Pure scoring: monotonic in every signal weight and non-increasing as `now` advances. */
export function scoreSignals(signals: readonly ScoredSignal[], now: number, percent: number): RiskScore {
  const byKind = new Map<string, number>();
  for (const s of signals) byKind.set(s.kind, (byKind.get(s.kind) ?? 0) + decayedWeight(s.weight, now - s.at));
  const raw = [...byKind.values()].reduce((a, b) => a + b, 0);
  const contributions = [...byKind.entries()]
    .map(([kind, w]) => [kind, Math.round((w * percent) / 100)] as const)
    .filter(([, points]) => points > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { score: Math.min(100, Math.round((raw * percent) / 100)), rawScore: Math.min(100, Math.round(raw)), contributions };
}

const assessSchema = z.object({ accountId: schemas.text(1, 64), action: schemas.text(3, 100), subjectId: schemas.text(1, 100).optional() });

export function createRisk(env: Env) {
  /** Decayed signal total for an account regardless of action (0..100). Used for trust tiers. */
  const baseScore = (accountId: string): number => {
    const now = env.deps.clock.now();
    return scoreSignals(liveSignals(env, accountId, now), now, 100).rawScore;
  };

  const port: RiskPort = {
    assess(input: RiskInput): RiskDecision {
      const now = env.deps.clock.now();
      const level = sensitivityFor(input.action);
      const scored = scoreSignals(liveSignals(env, input.actor.id, now), now, SENSITIVITY_PERCENT[level]);
      const reasons = scored.contributions.slice(0, 5).map(([kind, points]) => `signal:${kind}:+${points}`);
      reasons.push(`sensitivity:${level}:x${SENSITIVITY_PERCENT[level] / 100}`);
      if (scored.contributions.length === 0) reasons.push('no_active_signals');
      return { decision: decisionFor(scored.score), score: scored.score, reasons };
    },
  };

  function assess(ctx: CommandContext, input: z.input<typeof assessSchema>): RiskDecision {
    authorize(env, ctx, 'moderation.risk:assess', 'risk');
    const v = parse(assessSchema, input);
    const actor = { kind: 'user', id: v.accountId, roles: ['member'], tenantId: ctx.actor.tenantId } as const;
    return port.assess({ actor, action: v.action, ...(v.subjectId !== undefined ? { subjectId: v.subjectId } : {}) });
  }

  const operations = [operation('moderation.risk.assess', 'query', 'moderation.risk', 'Explain the risk decision for an account and action (staff/system)', assess)];
  return { port, assess, baseScore, operations };
}
