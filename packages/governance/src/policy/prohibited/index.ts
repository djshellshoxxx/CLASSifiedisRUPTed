// F18.S01.M02 Prohibited items (PS-146): signed rule packs, deterministic local evaluation and the
// publisher-side authoring commands. Rules are configuration, not a legal determination (ADR-0016).
import { appError, canonicalJson, codePointLength, defineCommand, defineQuery, err, isUuidV7, ok, sha256Hex, timestamp, z, type AppError, type CommandContext, type ReadScope, type Result } from '@classrup/kernel';
import { categoryRepo, collectAll, nodeOf, resolveIn, type TaxonomyView } from '../goods/index.ts';
import {
  applyRulePlan, expireEmergencyRules, loadPublisherState, planRulePack, receiveRulePack, rulesOf,
  type ApplyRulePackInput, type ApplyRulePackOutput, type ProhibitedOptions,
} from './pack.ts';
import {
  EMERGENCY_MAX_MS, KINDS, MAX_EMERGENCY_ACTIVE, MAX_EVAL_CODE_POINTS, MAX_PACK_BYTES, RULES_MODULE, RULE_PACK_TYPE, actionSchema, dataToEntry, expired, kindSchema, normalizeKeywords, publisherStateId, reasonKeySchema, ruleError,
  ruleKeySchema, ruleMachine, ruleRepo, stateRepo, utf8Length, wordCount, rulePayloadSchema,
  type RuleData, type RuleEntry,
} from './model.ts';
import { evaluateRules, inScope } from './evaluate.ts';

export * from './model.ts';
export { evaluateRules, inScope, type Evaluation, type EvaluationInput, type RuleLike, type RuleMatch } from './evaluate.ts';
export { buildHaystack, matchesPhrase, normalizeText } from './normalize.ts';
export { discardExpiredPendingPacks, expireEmergencyRules, receiveRulePack, type ApplyRulePackInput, type ApplyRulePackOutput, type ProhibitedOptions, type VerifiedRuleStatement } from './pack.ts';

const uuid = () => z.string().refine((v): boolean => isUuidV7(v), { params: { code: 'INVALID_UUIDV7' } });
const noticeSchema = z.string().regex(/^[a-z0-9_.]{3,120}$/);
const ENVELOPE = z.looseObject({ cid: z.string().min(1).max(200), type: z.string().min(1).max(200) });
const PROVENANCE = z.strictObject({ originRelay: z.string().max(200).optional(), receivedAt: timestamp() });
const nowIso = (ctx: CommandContext): string => new Date(ctx.clock.now()).toISOString();
const validation = (path: string, code: string): AppError => appError('VALIDATION_FAILED', { fields: [{ path, code }] });

/** Highest applied pack version over all publishers the vault applied; 0 when none. */
function rulesetVersionOf(tx: ReadScope): number {
  let max = 0;
  for (const r of collectAll(tx.repo(stateRepo))) if (r.id.startsWith('pub:')) max = Math.max(max, r.data.appliedVersion);
  return max;
}

export interface RuleSetView {
  readonly rulesetVersion: number;
  readonly rules: readonly RuleData[];
}
/** Snapshot of the active rules; the composition root caches it between governance.prohibited_rule.changed events. */
export function readRuleSetView(tx: ReadScope): RuleSetView {
  return { rulesetVersion: rulesetVersionOf(tx), rules: collectAll(tx.repo(ruleRepo), { status: 'active' }).map((r) => r.data) };
}

/**
 * Adapter for BazaarOptions.categoryAllowed: a category is allowed for new listings when the taxonomy allows it
 * and no active category-only block rule that applies to every kind covers it. Fails closed without a taxonomy.
 * Keyword rules are evaluated at publish time by governance.prohibited_rule.evaluate, not here.
 */
export function categoryPolicyFrom(o: {
  readonly taxonomy: () => TaxonomyView | undefined;
  readonly rules: () => RuleSetView | undefined;
  readonly now: () => number;
  readonly profileIds?: () => readonly string[];
}): (categoryId: string) => boolean {
  return (categoryId) => {
    const view = o.taxonomy();
    if (!view || !view.allowedForNewListing(categoryId)) return false;
    const resolved = view.resolve(categoryId);
    if (!resolved) return false;
    const path = new Set(resolved.path);
    const profiles = new Set(o.profileIds?.() ?? []);
    const nowMs = o.now();
    return !(o.rules()?.rules ?? []).some((r) =>
      r.action === 'block' && r.keywords.length === 0 && !r.keywordHashes && r.kinds.length === 0 && r.categoryIds.length > 0 &&
      inScope(r, { kind: '', categoryPath: path, profiles, nowMs }, (id) => view.resolve(id)?.resolvedId));
  };
}

export function prohibitedDefinitions(options: ProhibitedOptions) {
  const publisherOf = (ctx: CommandContext): Result<string, AppError> => {
    const publisher = options.localPublisherId();
    return ctx.actor.kind === 'user' && publisher !== undefined ? ok(publisher) : err(appError('FORBIDDEN'));
  };

  const draft = defineCommand({
    name: 'governance.prohibited_rule.draft', module: RULES_MODULE, capability: 'governance.prohibited_rule.author', idempotent: true,
    input: z.strictObject({
      ruleId: uuid().optional(), expectedRevision: z.int().min(1).optional(), ruleKey: ruleKeySchema,
      categoryIds: z.array(uuid()).max(20).default([]), keywords: z.array(z.string().max(400)).max(50).default([]),
      matchMode: z.enum(['whole_word', 'phrase']), action: actionSchema, kinds: z.array(kindSchema).max(KINDS.length).default([]),
      jurisdictionProfileIds: z.array(uuid()).max(10).default([]), noticeId: noticeSchema.optional(), reasonKey: reasonKeySchema,
      sensitive: z.boolean().optional(), emergencyUntil: timestamp().optional(),
    }),
    handler(ctx, input) {
      const who = publisherOf(ctx); if (!who.ok) return who;
      const keywords = normalizeKeywords(input.keywords);
      if (!keywords) return err(validation('keywords', 'PHRASE_LENGTH_OR_COUNT')); // V02
      if (input.categoryIds.length === 0 && keywords.length === 0) return err(validation('categoryIds', 'SCOPE_REQUIRED')); // V02
      if ((input.action === 'review' || input.action === 'allow_with_notice') && input.noticeId === undefined) return err(validation('noticeId', 'REQUIRED')); // V04
      const sensitive = input.sensitive ?? false;
      if (sensitive && (keywords.length === 0 || input.matchMode !== 'whole_word')) return err(validation('sensitive', 'REQUIRES_WHOLE_WORD_KEYWORDS'));
      const categories = ctx.tx.repo(categoryRepo);
      const get = (id: string) => { const r = categories.get(id); return r ? nodeOf(r.id, r.data) : undefined; };
      for (const id of input.categoryIds) if (!resolveIn(get, id)) return err(ruleError('GOVERNANCE_RULE_SCOPE_INVALID')); // V03
      if (input.emergencyUntil !== undefined) { // V06
        const until = Date.parse(input.emergencyUntil);
        if (input.action !== 'review' || until <= ctx.clock.now() || until > ctx.clock.now() + EMERGENCY_MAX_MS) return err(ruleError('GOVERNANCE_RULE_EMERGENCY_INVALID'));
      }
      const repo = ctx.tx.repo(ruleRepo);
      const now = nowIso(ctx);
      const same = collectAll(repo, { pubkey: `${who.value}|${input.ruleKey}` });
      const base = {
        tenantId: ctx.tenantId, publisherId: who.value, ruleKey: input.ruleKey, categoryIds: input.categoryIds, keywords, matchMode: input.matchMode, action: input.action, kinds: input.kinds,
        jurisdictionProfileIds: input.jurisdictionProfileIds, reasonKey: input.reasonKey, sensitive, status: 'draft' as const, updatedAt: now,
        ...(input.noticeId ? { noticeId: input.noticeId } : {}), ...(input.emergencyUntil ? { emergencyUntil: input.emergencyUntil } : {}),
      };
      if (input.ruleId !== undefined) {
        const record = same.find((r) => r.id === input.ruleId);
        if (!record) return err(appError('NOT_FOUND'));
        if (input.expectedRevision === undefined) return err(validation('expectedRevision', 'REQUIRED'));
        if (record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
        if (record.data.status !== 'draft') return err(appError('CONFLICT_STATE'));
        const saved = repo.put(record.id, { ...base, version: record.data.version, createdAt: record.data.createdAt }, { expectedRevision: input.expectedRevision });
        if (!saved.ok) return saved;
        return ok({ ruleId: record.id, revision: saved.value.revision, version: record.data.version, status: 'draft' as const });
      }
      if (same.some((r) => r.data.status === 'draft')) return err(appError('CONFLICT_STATE'));
      const version = same.reduce((m, r) => Math.max(m, r.data.version), 0) + 1;
      const ruleId = ctx.ids.next();
      const saved = repo.put(ruleId, { ...base, version, createdAt: now }, { expectedRevision: 0 });
      if (!saved.ok) return saved;
      return ok({ ruleId, revision: saved.value.revision, version, status: 'draft' as const });
    },
  });

  const retire = defineCommand({
    name: 'governance.prohibited_rule.retire', module: RULES_MODULE, capability: 'governance.prohibited_rule.author', idempotent: true,
    input: z.strictObject({ ruleKey: ruleKeySchema, expectedRevision: z.int().min(1) }),
    handler(ctx, input) {
      const who = publisherOf(ctx); if (!who.ok) return who;
      const repo = ctx.tx.repo(ruleRepo);
      const records = collectAll(repo, { pubkey: `${who.value}|${input.ruleKey}` });
      const active = records.find((r) => r.data.status === 'active');
      const draftRec = records.find((r) => r.data.status === 'draft');
      const target = active ?? draftRec;
      if (!target) return err(appError('NOT_FOUND'));
      if (target.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      const now = nowIso(ctx);
      if (active) {
        if (active.data.retirementStaged) return err(appError('CONFLICT_STATE'));
        const saved = repo.put(active.id, { ...active.data, retirementStaged: true, updatedAt: now }, { expectedRevision: input.expectedRevision });
        if (!saved.ok) return saved;
        return ok({ ruleKey: input.ruleKey, stagedRetirement: true as const });
      }
      const next = ruleMachine.next('draft', 'discard');
      if (!next.ok) return next;
      const saved = repo.put(target.id, { ...target.data, status: next.value, updatedAt: now }, { expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved;
      return ok({ ruleKey: input.ruleKey, stagedRetirement: true as const });
    },
  });

  async function entryFromDraft(ctx: CommandContext, d: RuleData, proposalId: string | undefined): Promise<RuleEntry> {
    const entry = dataToEntry(d);
    const withProposal = d.emergencyUntil === undefined && proposalId ? { ...entry, proposalId } : entry;
    if (!d.sensitive) return withProposal;
    const salt = ctx.ids.next();
    const hashes = [...new Set(await Promise.all(d.keywords.map((k) => sha256Hex(`${salt}:${k}`))))];
    return { ...withProposal, keywords: [], keywordHashes: { salt, wordCounts: [...new Set(d.keywords.map(wordCount))].sort((a, b) => a - b), hashes } };
  }

  const releasePack = defineCommand({
    name: 'governance.prohibited_rule.release_pack', module: RULES_MODULE, capability: 'governance.prohibited_rule.release', idempotent: true, deliveryEligible: true,
    input: z.strictObject({ expectedPackVersion: z.int().min(0), proposalId: uuid().optional(), changelogEntry: z.string().min(1).max(500), relayIds: z.array(z.string().min(1).max(200)).max(20) }),
    async handler(ctx, input) {
      const who = publisherOf(ctx); if (!who.ok) return who;
      const swept = expireEmergencyRules(ctx); if (!swept.ok) return swept;
      const state = loadPublisherState(ctx, who.value);
      if (state.data.appliedVersion !== input.expectedPackVersion) return err(appError('CONFLICT_REVISION'));
      const now = ctx.clock.now();
      const active = rulesOf(ctx, who.value, 'active');
      const drafts = rulesOf(ctx, who.value, 'draft');
      const draftKeys = new Set(drafts.map((d) => d.data.ruleKey));
      const retiring = active.filter((a) => a.data.retirementStaged && !draftKeys.has(a.data.ruleKey));
      if (drafts.length === 0 && retiring.length === 0) return err(appError('PRECONDITION_FAILED', { params: { reason: 'nothing_to_release' } }));
      for (const d of drafts) { // V06 re-checked at activation time
        if (d.data.emergencyUntil !== undefined && (d.data.action !== 'review' || Date.parse(d.data.emergencyUntil) <= now || Date.parse(d.data.emergencyUntil) > now + EMERGENCY_MAX_MS)) return err(ruleError('GOVERNANCE_RULE_EMERGENCY_INVALID'));
      }
      const needsProposal = drafts.filter((d) => d.data.emergencyUntil === undefined).map((d) => d.data.ruleKey); // V05
      if (needsProposal.length > 0) {
        let approved = false;
        try { approved = input.proposalId !== undefined && (await options.proposalApproved(input.proposalId, needsProposal)); } catch { approved = false; }
        if (!approved) return err(ruleError('GOVERNANCE_RULE_PROPOSAL_REQUIRED'));
      }
      const entries = new Map<string, RuleEntry>();
      for (const a of active) if (!retiring.includes(a) && !draftKeys.has(a.data.ruleKey) && !expired(a.data, now)) entries.set(a.data.ruleKey, dataToEntry(a.data));
      for (const d of drafts) entries.set(d.data.ruleKey, await entryFromDraft(ctx, d.data, input.proposalId));
      const payload = {
        publisherId: who.value, version: state.data.appliedVersion + 1, fullSnapshot: true, changelogEntry: input.changelogEntry, releasedAt: nowIso(ctx),
        ...(input.proposalId ? { proposalId: input.proposalId } : {}), rules: [...entries.values()].sort((a, b) => (a.ruleKey < b.ruleKey ? -1 : 1)),
      };
      const parsed = rulePayloadSchema.safeParse(payload);
      if (!parsed.success) return err(appError('VALIDATION_FAILED'));
      if (payload.rules.filter((r) => r.emergencyUntil !== undefined).length > MAX_EMERGENCY_ACTIVE) return err(ruleError('GOVERNANCE_RULE_EMERGENCY_INVALID'));
      const plan = planRulePack(ctx, parsed.data);
      if (!plan.ok) return plan;
      let envelope;
      try {
        envelope = structuredClone(await options.signPack(RULE_PACK_TYPE, parsed.data, payload.version, state.data.appliedCid ?? null));
        const verified = await options.verifyPack(envelope);
        if (verified.author !== who.value || verified.type !== RULE_PACK_TYPE || verified.cid !== envelope.cid || canonicalJson(verified.payload) !== canonicalJson(parsed.data)) return err(appError('FORBIDDEN'));
      } catch { return err(appError('VALIDATION_FAILED')); }
      if (utf8Length(envelope) > MAX_PACK_BYTES) return err(ruleError('GOVERNANCE_RULE_PACK_REJECTED'));
      const applied = await applyRulePlan(ctx, options, plan.value, { envelope, cid: envelope.cid, provenance: { receivedAt: nowIso(ctx) }, trustNow: false, enforceProposals: false });
      if (!applied.ok) return applied;
      for (const relay of new Set(input.relayIds)) ctx.tx.sync.enqueue(relay, envelope);
      return ok({ packVersion: payload.version, packCid: envelope.cid, activeRuleCount: plan.value.entries.length, syncState: 'prepared' as const });
    },
  });

  const applyPack = defineCommand({
    name: 'governance.prohibited_rule.apply_pack', module: RULES_MODULE, capability: 'governance.prohibited_rule.apply', idempotent: true,
    input: z.strictObject({ envelope: ENVELOPE, provenance: PROVENANCE, trustPublisher: z.boolean().optional() }),
    handler: (ctx, input) => receiveRulePack(ctx, options, input),
  });

  const evaluate = defineQuery({
    name: 'governance.prohibited_rule.evaluate', module: RULES_MODULE, capability: 'governance.prohibited_rule.evaluate',
    input: z.strictObject({
      kind: kindSchema, categoryId: uuid(), title: z.string().max(200_000), description: z.string().max(200_000).optional(),
      tags: z.array(z.string().max(200_000)).max(100).optional(), jurisdictionProfileIds: z.array(uuid()).max(10).optional(),
    }),
    async handler(ctx, input) {
      const tags = input.tags ?? [];
      const total = codePointLength(input.title) + codePointLength(input.description ?? '') + tags.reduce((n, t) => n + codePointLength(t), 0);
      if (total > MAX_EVAL_CODE_POINTS) return err(validation('title', 'INPUT_TOO_LARGE')); // V08, before any matching
      const categories = ctx.tx.repo(categoryRepo);
      const get = (id: string) => { const r = categories.get(id); return r ? nodeOf(r.id, r.data) : undefined; };
      const resolved = resolveIn(get, input.categoryId);
      if (!resolved) return err(appError('NOT_FOUND'));
      const memo = new Map<string, string | undefined>();
      const resolveScope = (id: string): string | undefined => { if (!memo.has(id)) memo.set(id, resolveIn(get, id)?.resolvedId); return memo.get(id); };
      const rules = collectAll(ctx.tx.repo(ruleRepo), { status: 'active' }).map((r) => r.data);
      const result = await evaluateRules(rules, {
        kind: input.kind, categoryPath: new Set(resolved.path), profiles: new Set(input.jurisdictionProfileIds ?? []), fields: [input.title, input.description ?? '', ...tags], nowMs: ctx.clock.now(),
      }, resolveScope);
      const rulesetVersion = rulesetVersionOf(ctx.tx);
      ctx.log.info('prohibited_rule.evaluated', { verdict: result.verdict, matchedCount: result.matches.length, rulesetVersion, correlationId: ctx.correlationId });
      return ok({ verdict: result.verdict, matches: result.matches.map((m) => ({ ...m })), rulesetVersion });
    },
  });

  const get = defineQuery({
    name: 'governance.prohibited_rule.get', module: RULES_MODULE, capability: 'governance.prohibited_rule.read', input: z.strictObject({ ruleKey: ruleKeySchema }),
    handler(ctx, input) {
      const rows = collectAll(ctx.tx.repo(ruleRepo), { ruleKey: input.ruleKey });
      const pick = rows.filter((r) => r.data.status === 'active' && !expired(r.data, ctx.clock.now())).sort((a, b) => (a.data.publisherId < b.data.publisherId ? -1 : 1))[0] ?? rows.find((r) => r.data.status === 'draft');
      return pick ? ok({ rule: { id: pick.id, revision: pick.revision, ...pick.data } }) : err(appError('NOT_FOUND'));
    },
  });

  const listActive = defineQuery({
    name: 'governance.prohibited_rule.list_active', module: RULES_MODULE, capability: 'governance.prohibited_rule.read',
    input: z.strictObject({ cursor: z.string().max(500).optional(), limit: z.int().min(1).max(200).default(50) }),
    handler(ctx, input) {
      const page = ctx.tx.repo(ruleRepo).query({ where: { status: 'active' }, limit: input.limit, ...(input.cursor ? { cursor: input.cursor } : {}) });
      if (!page.ok) return page;
      const now = ctx.clock.now();
      return ok({
        rulesetVersion: rulesetVersionOf(ctx.tx),
        items: page.value.items.filter((r) => !expired(r.data, now)).map((r) => ({ id: r.id, revision: r.revision, ...r.data })),
        ...(page.value.nextCursor ? { nextCursor: page.value.nextCursor } : {}),
      });
    },
  });

  /** Statement type to handler for the composition root's inbound router; runs inside a command transaction. */
  const statementHandlers = {
    [RULE_PACK_TYPE]: (ctx: CommandContext, statement: ApplyRulePackInput): Promise<Result<ApplyRulePackOutput, AppError>> => receiveRulePack(ctx, options, statement),
  } as const;

  return { draft, retire, releasePack, applyPack, evaluate, get, listActive, statementHandlers, all: [draft, retire, releasePack, applyPack, evaluate, get, listActive] as const };
}
