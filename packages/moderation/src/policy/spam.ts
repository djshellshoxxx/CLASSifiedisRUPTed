/** F12.S02.M02 spam: explainable heuristics the relay runs before publishing user content. */
import type { CommandContext } from '@classrup/kernel';
import { DAY, HOUR, MINUTE, parse, runCommand, schemas, z } from '@classrup/kernel';
import { authorize, event, operation } from '../common';
import type { Env } from '../common';
import { insertSignal, signalEvent } from '../antifraud/signals';

export const REVIEW_THRESHOLD = 40;
export const BLOCK_THRESHOLD = 70;
export const FINGERPRINT_WINDOW_MS = 7 * DAY;
export const MAX_TRACKED_ACCOUNTS = 50;
export const MAX_TRACKED_POSTS = 50;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;

export type SpamReason = 'duplicate_content' | 'link_density' | 'posting_velocity' | 'new_account_burst';
export type SpamDecision = 'allow' | 'review' | 'block';

export interface SpamAssessment {
  readonly score: number;
  readonly decision: SpamDecision;
  readonly reasons: readonly SpamReason[];
}

export interface AssessContentInput {
  readonly accountId: string;
  readonly accountAgeMs: number;
  /** Hash of the normalised text, computed by the caller (the same text must always yield the same hash). */
  readonly textHash: string;
  readonly text: string;
}

const assessSchema = z.object({
  accountId: schemas.text(1, 64),
  accountAgeMs: z.number().int().nonnegative(),
  textHash: schemas.text(8, 128),
  text: z.string().max(20_000),
});

interface Finding {
  readonly points: number;
  readonly reason: SpamReason;
}

const duplicateFinding = (otherAccounts: number): Finding[] => {
  if (otherAccounts >= 6) return [{ points: 60, reason: 'duplicate_content' }];
  if (otherAccounts >= 3) return [{ points: 40, reason: 'duplicate_content' }];
  return otherAccounts >= 1 ? [{ points: 15, reason: 'duplicate_content' }] : [];
};

export function linkStats(text: string): { links: number; density: number } {
  const links = text.match(URL_RE)?.length ?? 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return { links, density: links / Math.max(1, words) };
}

const linkFinding = (text: string): Finding[] => {
  const { links, density } = linkStats(text);
  const points = (links >= 5 ? 25 : links >= 2 ? 10 : 0) + (links >= 2 && density > 0.2 ? 20 : 0);
  return points > 0 ? [{ points, reason: 'link_density' }] : [];
};

const velocityFinding = (stamps: readonly number[], now: number): Finding[] => {
  const recent = stamps.filter((t) => now - t <= 10 * MINUTE).length;
  if (recent > 10) return [{ points: 40, reason: 'posting_velocity' }];
  return recent > 5 ? [{ points: 20, reason: 'posting_velocity' }] : [];
};

const burstFinding = (accountAgeMs: number, stamps: readonly number[], now: number): Finding[] =>
  accountAgeMs < DAY && stamps.filter((t) => now - t <= HOUR).length >= 3 ? [{ points: 30, reason: 'new_account_burst' }] : [];

export const decisionForScore = (score: number): SpamDecision => (score >= BLOCK_THRESHOLD ? 'block' : score >= REVIEW_THRESHOLD ? 'review' : 'allow');

export function combine(findings: readonly Finding[]): SpamAssessment {
  const score = Math.min(100, findings.reduce((sum, f) => sum + f.points, 0));
  return { score, decision: decisionForScore(score), reasons: findings.map((f) => f.reason) };
}

export function createSpam(env: Env) {
  /** Records the attempt (hash by account, posting time) and scores it; the text itself is never stored. */
  function observe(input: AssessContentInput): SpamAssessment {
    const now = env.deps.clock.now();
    const fp = env.cols.fingerprints.get(input.textHash);
    const live = fp !== undefined && now - fp.lastSeenAt <= FINGERPRINT_WINDOW_MS ? fp.accountIds : [];
    const others = live.filter((a) => a !== input.accountId).length;
    const accountIds = live.includes(input.accountId) ? live : [...live, input.accountId].slice(-MAX_TRACKED_ACCOUNTS);
    env.cols.fingerprints.put({ id: input.textHash, accountIds, firstSeenAt: fp?.firstSeenAt ?? now, lastSeenAt: now }, fp?.version ?? 0);

    const activity = env.cols.postActivity.get(input.accountId);
    const stamps = [...(activity?.stamps ?? []).filter((t) => now - t <= HOUR), now].slice(-MAX_TRACKED_POSTS);
    env.cols.postActivity.put({ id: input.accountId, stamps }, activity?.version ?? 0);

    return combine([
      ...duplicateFinding(others),
      ...linkFinding(input.text),
      ...velocityFinding(stamps, now),
      ...burstFinding(input.accountAgeMs, stamps, now),
    ]);
  }

  /** Direct in-process entry point for the relay; each call counts as one posting attempt. */
  function assessContent(input: AssessContentInput): SpamAssessment {
    const v = parse(assessSchema, input);
    return env.deps.store.transaction(() => observe(v));
  }

  function assess(ctx: CommandContext, input: AssessContentInput): SpamAssessment {
    authorize(env, ctx, 'moderation.spam:assess', 'spam');
    const v = parse(assessSchema, input);
    const request = { accountId: v.accountId, accountAgeMs: v.accountAgeMs, textHash: v.textHash };
    return runCommand(env.deps, ctx, { name: 'moderation.spam.assess', flag: 'moderation.spam', request }, () => {
      const result = observe(v);
      if (result.decision === 'allow') return { result };
      const flagged = event('moderation.spam.flagged', 'spam', v.textHash, 1, { accountId: v.accountId, decision: result.decision, score: result.score });
      if (result.decision === 'review') return { result, events: [flagged] };
      const signal = insertSignal(env, { tenantId: ctx.actor.tenantId, accountId: v.accountId, kind: 'spam_detected', sourceRef: v.textHash });
      return { result, events: [flagged, signalEvent(signal)] };
    });
  }

  const operations = [operation('moderation.spam.assess', 'command', 'moderation.spam', 'Score content for spam before publishing (system)', assess)];
  return { assessContent, assess, operations };
}
