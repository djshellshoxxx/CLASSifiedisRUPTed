// Pure rule evaluation: deterministic, literal matching, strictest action wins, never returns matched text.
import { sha256Hex } from '@classrup/kernel';
import { MAX_MATCHES, SEVERITY, expired, type KeywordHashes, type RuleAction, type RuleData } from './model.ts';
import { buildHaystack, matchesPhrase, ngrams, type Haystack } from './normalize.ts';

export interface RuleMatch {
  readonly ruleKey: string;
  readonly action: RuleAction;
  readonly reasonKey: string;
  readonly noticeId?: string;
}
export interface Evaluation {
  readonly verdict: RuleAction | 'allow';
  readonly matches: readonly RuleMatch[];
}
export interface EvaluationInput {
  readonly kind: string;
  /** Ids from the root category to the (alias-resolved) listing category. */
  readonly categoryPath: ReadonlySet<string>;
  readonly profiles: ReadonlySet<string>;
  readonly fields: readonly string[];
  readonly nowMs: number;
}

export type RuleLike = Pick<RuleData, 'status' | 'ruleKey' | 'categoryIds' | 'keywords' | 'keywordHashes' | 'matchMode' | 'action' | 'kinds' | 'jurisdictionProfileIds' | 'noticeId' | 'reasonKey' | 'emergencyUntil'>;

/** True when the rule's category, kind and jurisdiction scope covers the listing (keywords not considered). */
export function inScope(rule: RuleLike, input: Pick<EvaluationInput, 'kind' | 'categoryPath' | 'profiles' | 'nowMs'>, resolveScope: (categoryId: string) => string | undefined): boolean {
  if (rule.status !== 'active' || expired(rule, input.nowMs)) return false;
  if (rule.kinds.length > 0 && !(rule.kinds as readonly string[]).includes(input.kind)) return false;
  if (rule.jurisdictionProfileIds.length > 0 && !rule.jurisdictionProfileIds.some((p) => input.profiles.has(p))) return false;
  if (rule.categoryIds.length > 0 && !rule.categoryIds.some((id) => { const r = resolveScope(id); return r !== undefined && input.categoryPath.has(r); })) return false;
  return true;
}

async function hashesMatch(h: Haystack, spec: KeywordHashes, cache: Map<string, string>): Promise<boolean> {
  const wanted = new Set(spec.hashes);
  for (const n of spec.wordCounts) {
    for (const gram of ngrams(h, n)) {
      const key = `${spec.salt}:${gram}`;
      let digest = cache.get(key);
      if (digest === undefined) { digest = await sha256Hex(key); cache.set(key, digest); }
      if (wanted.has(digest)) return true;
    }
  }
  return false;
}

export async function evaluateRules(rules: readonly RuleLike[], input: EvaluationInput, resolveScope: (categoryId: string) => string | undefined): Promise<Evaluation> {
  const h = buildHaystack(input.fields);
  const cache = new Map<string, string>();
  const best = new Map<string, RuleMatch>();
  for (const rule of rules) {
    if (!inScope(rule, input, resolveScope)) continue;
    let hit: boolean;
    if (rule.keywords.length > 0) hit = rule.keywords.some((k) => matchesPhrase(h, k, rule.matchMode));
    else if (rule.keywordHashes) hit = await hashesMatch(h, rule.keywordHashes, cache);
    else hit = true; // category-only rule: the scope is the match
    if (!hit) continue;
    const match: RuleMatch = { ruleKey: rule.ruleKey, action: rule.action, reasonKey: rule.reasonKey, ...(rule.noticeId ? { noticeId: rule.noticeId } : {}) };
    const prior = best.get(rule.ruleKey);
    if (!prior || SEVERITY[match.action] > SEVERITY[prior.action]) best.set(rule.ruleKey, match);
  }
  const all = [...best.values()].sort((a, b) => SEVERITY[b.action] - SEVERITY[a.action] || (a.ruleKey < b.ruleKey ? -1 : a.ruleKey > b.ruleKey ? 1 : 0));
  return { verdict: all[0]?.action ?? 'allow', matches: all.slice(0, MAX_MATCHES) };
}
