/**
 * @classrup/moderation (F12): reports, cases, evidence, appeals, enforcement, spam/abuse controls and antifraud.
 *
 * Provided ports (wired by the relay): `blocks` (BlockPort), `risk` (RiskPort), `rateLimiter` (RateLimitPort).
 * Consumed ports: SubjectActionsPort, NotifyPort, SubjectOwnerPort, AccountLookup (see ports.ts); all default to no-ops.
 *
 * Hooks the relay calls (this package never subscribes to other features):
 * - `assessContent(...)` before publishing listings/messages; `recordSignal(...)` when payments fail, disputes are lost, etc.
 * - `restrictionsOf(accountId)` / `assertNotRestricted(accountId, feature)` before publishing, messaging, bidding.
 * - `limitFor` / `checkLimit` before accepting new listings, offers, trades, messages, auctions.
 * - Schedule `moderation.enforcement.expire_due` (system actor) to end elapsed suspensions and restrictions.
 */
import type { CommandContext, Deps } from '@classrup/kernel';
import { defineOperations } from '@classrup/kernel';
import { collectionsOf } from './common';
import type { Env } from './common';
import { createLimits } from './antifraud/limits';
import { createRateLimiter } from './antifraud/rate';
import type { RatePolicy } from './antifraud/rate';
import { createRisk } from './antifraud/risk';
import { createSignals } from './antifraud/signals';
import type { RecordSignalInput, SignalDto } from './antifraud/signals';
import { createAbuse } from './policy/abuse';
import { createEnforcement } from './policy/enforcement';
import { createSpam } from './policy/spam';
import { resolvePorts } from './ports';
import type { ModerationPorts } from './ports';
import { createAppeals } from './reporting/appeals';
import { createCases } from './reporting/cases';
import { createEvidence, verifyChain } from './reporting/evidence';
import { createFlags } from './reporting/flags';

export interface ModerationOptions {
  /** Overrides the default per-prefix token bucket policies. Must contain a default (empty prefix) policy. */
  readonly ratePolicies?: readonly RatePolicy[];
}

export function createModeration(deps: Deps, ports: ModerationPorts = {}, options: ModerationOptions = {}) {
  const env: Env = { deps, ports: resolvePorts(ports), cols: collectionsOf(deps) };
  const rateLimiter = createRateLimiter(deps, env.cols, options.ratePolicies);
  const signals = createSignals(env);
  const riskScoring = createRisk(env);
  const limits = createLimits(env, riskScoring);
  const reports = createFlags(env, rateLimiter);
  const cases = createCases(env);
  const evidence = createEvidence(env);
  const enforcement = createEnforcement(env);
  const appeals = createAppeals(env, enforcement);
  const spam = createSpam(env);
  const abuse = createAbuse(env);

  const operations = defineOperations([
    ...reports.operations,
    ...cases.operations,
    ...evidence.operations,
    ...enforcement.operations,
    ...appeals.operations,
    ...spam.operations,
    ...abuse.operations,
    ...signals.operations,
    ...riskScoring.operations,
    ...limits.operations,
  ]);

  return {
    // Port implementations consumed by other features.
    blocks: abuse.blocks,
    risk: riskScoring.port,
    rateLimiter,
    // Services per hierarchy module.
    reports,
    cases,
    evidence,
    enforcement,
    appeals,
    spam,
    abuse,
    signals,
    riskScoring,
    limits,
    // Direct entry points for in-process callers.
    assessContent: spam.assessContent,
    recordSignal: (ctx: CommandContext, input: RecordSignalInput): SignalDto => signals.record(ctx, input),
    restrictionsOf: enforcement.restrictionsOf,
    assertNotRestricted: enforcement.assertNotRestricted,
    limitFor: limits.limitFor,
    checkLimit: limits.checkLimit,
    verifyEvidenceChain: (caseId: string) => verifyChain(env, caseId),
    operations,
  };
}

export type Moderation = ReturnType<typeof createModeration>;

export { MODULES } from './modules';
export { POLICIES } from './policies';
export { RecordingSubjectActions, noSubjectActions, noSubjectOwner } from './ports';
export type { ModerationPorts, SubjectActionCall, SubjectActionsPort, SubjectOwnerPort } from './ports';
export { DEFAULT_RATE_POLICIES } from './antifraud/rate';
export type { RatePolicy, RateLimiter } from './antifraud/rate';
export { TIER_LIMITS } from './antifraud/limits';
export type { CountLimitKind, LimitKind, TrustTier } from './antifraud/limits';
export { CHALLENGE_THRESHOLD, DENY_THRESHOLD, scoreSignals, sensitivityFor } from './antifraud/risk';
export { DEFAULT_SIGNAL_WEIGHTS, HALF_LIFE_MS, decayedWeight } from './antifraud/signals';
export { computePriority, reporterTrust, REASON_SEVERITY } from './reporting/priority';
export { GENESIS_HASH } from './reporting/evidence';
export type { ChainVerification } from './reporting/evidence';
export { STRIKE_DECAY_MS } from './policy/strikes';
export { APPEAL_WINDOW_MS } from './policy/enforcement';
export type { AssessContentInput, SpamAssessment } from './policy/spam';
export * from './types';
