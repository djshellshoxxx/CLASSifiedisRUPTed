// Verifying and applying rule packs, rule lifecycle and emergency expiry, inside the caller's transaction.
import { appError, err, ok, type AppError, type CommandContext, type Result, type SignedEnvelope } from '@classrup/kernel';
import { collectAll } from '../goods/index.ts';
import {
  DAY_MS, EMERGENCY_MAX_MS, KEEP_PACKS, MAX_APPLIES_PER_DAY, MAX_EMERGENCY_ACTIVE, MAX_PACK_BYTES, MAX_PENDING_PACKS, MAX_RULES, MAX_TRUSTED_PUBLISHERS, PENDING_TTL_MS, RULE_PACK_TYPE, VAULT_STATE_ID,
  dataToEntry, entryComparable, expired, normalizeKeywords, packRepo, publisherStateId, ruleChanged, ruleError, ruleMachine, rulePayloadSchema, ruleRepo, stateRepo, trustRepo, utf8Length,
  type RuleData, type RuleEntry, type RulePayload, type RuleState,
} from './model.ts';

export interface VerifiedRuleStatement {
  readonly type: string;
  /** did:key that signed the statement. */
  readonly author: string;
  readonly cid: string;
  readonly payload: unknown;
}
export interface ProhibitedOptions {
  /** did:key of the publisher key this vault holds, or undefined when the vault is not a publisher. */
  readonly localPublisherId: () => string | undefined;
  /** Signs a statement with the publisher key (Ed25519 over JCS); never implemented in this module. */
  readonly signPack: (type: string, payload: unknown, version: number, previousCid: string | null) => Promise<SignedEnvelope>;
  /** Verifies signature and envelope integrity; throws when invalid. */
  readonly verifyPack: (envelope: unknown) => Promise<VerifiedRuleStatement>;
  /** Port to F18.S02.M01: is `proposalId` an approved decision that covers activating these rule keys? */
  readonly proposalApproved: (proposalId: string, ruleKeys: readonly string[]) => boolean | Promise<boolean>;
}
export interface ApplyRulePackInput {
  readonly envelope: { readonly cid: string; readonly type: string; readonly [field: string]: unknown };
  readonly provenance: { readonly originRelay?: string | undefined; readonly receivedAt: string };
  readonly trustPublisher?: boolean | undefined;
}
export interface ApplyRulePackOutput {
  readonly applied: boolean;
  readonly packVersion: number;
  readonly changedRuleKeys: string[];
  readonly pendingReason?: string;
}

const nowIso = (ctx: CommandContext): string => new Date(ctx.clock.now()).toISOString();
type Rec = { readonly id: string; readonly revision: number; readonly data: RuleData };

export function loadVaultState(ctx: CommandContext): { data: RuleState; revision: number } {
  const r = ctx.tx.repo(stateRepo).get(VAULT_STATE_ID);
  return r ? { data: r.data, revision: r.revision } : { data: { appliedVersion: 0, appliedLog: [] }, revision: 0 };
}
export function loadPublisherState(ctx: CommandContext, publisherId: string): { data: RuleState; revision: number } {
  const r = ctx.tx.repo(stateRepo).get(publisherStateId(publisherId));
  return r ? { data: r.data, revision: r.revision } : { data: { appliedVersion: 0, appliedLog: [] }, revision: 0 };
}
export function rulesOf(ctx: CommandContext, publisherId: string, status: RuleData['status']): Rec[] {
  return collectAll(ctx.tx.repo(ruleRepo), { publisher: publisherId }).filter((r) => r.data.status === status);
}

export function discardExpiredPendingPacks(ctx: CommandContext): number {
  const repo = ctx.tx.repo(packRepo);
  const cutoff = new Date(ctx.clock.now() - PENDING_TTL_MS).toISOString();
  let removed = 0;
  for (const r of collectAll(repo, { status: 'pending' })) if (r.data.receivedAt <= cutoff && repo.remove(r.id, { expectedRevision: r.revision }).ok) removed += 1;
  return removed;
}

/**
 * Retires every active emergency rule whose emergencyUntil has passed and announces it
 * (governance.prohibited_rule.changed, change emergency_expired). The composition root calls this from its
 * 5-minute sweep and at app start inside a command transaction; apply and release call it too.
 */
export function expireEmergencyRules(ctx: CommandContext): Result<string[], AppError> {
  const repo = ctx.tx.repo(ruleRepo);
  const now = ctx.clock.now();
  const out: string[] = [];
  for (const r of collectAll(repo, { status: 'active' })) {
    if (!expired(r.data, now)) continue;
    const next = ruleMachine.next('active', 'retire');
    if (!next.ok) return next;
    const saved = repo.put(r.id, { ...r.data, status: next.value, updatedAt: nowIso(ctx) }, { expectedRevision: r.revision });
    if (!saved.ok) return saved;
    ctx.emit(ruleChanged, {
      aggregate: { type: 'prohibited_rule', id: r.id }, revision: saved.value.revision,
      payload: { ruleKey: r.data.ruleKey, version: r.data.version, change: 'emergency_expired', action: r.data.action, rulesetVersion: loadPublisherState(ctx, r.data.publisherId).data.appliedVersion, publisherId: r.data.publisherId },
    });
    out.push(r.data.ruleKey);
  }
  return ok(out);
}

export interface RulePlan {
  readonly payload: RulePayload;
  /** Entries with normalized keywords, expired emergency entries removed. */
  readonly entries: RuleEntry[];
  readonly activations: RuleEntry[];
  readonly retirements: { rec: Rec; change: 'retired' | 'emergency_expired' }[];
  readonly active: Map<string, Rec>;
  readonly drafts: Map<string, Rec>;
}

const rejected = (): AppError => ruleError('GOVERNANCE_RULE_PACK_REJECTED');
const invalid = (path: string, code: string): AppError => appError('VALIDATION_FAILED', { fields: [{ path, code }] });

/** Every check that can reject a pack without side effects (V01, V02, V04, V05 presence, V06 on apply, V07, V09). */
export function planRulePack(ctx: CommandContext, payload: RulePayload): Result<RulePlan, AppError> {
  const state = loadPublisherState(ctx, payload.publisherId).data;
  if (!payload.fullSnapshot || payload.version <= state.appliedVersion) return err(rejected());
  if (payload.rules.length > MAX_RULES) return err(rejected());
  const now = ctx.clock.now();
  const seen = new Set<string>();
  const entries: RuleEntry[] = [];
  const expiredKeys = new Set<string>();
  let emergencies = 0;
  for (const raw of payload.rules) {
    if (seen.has(raw.ruleKey)) return err(invalid('rules', 'DUPLICATE_RULE_KEY'));
    seen.add(raw.ruleKey);
    const keywords = normalizeKeywords(raw.keywords);
    if (!keywords) return err(invalid('keywords', 'PHRASE_LENGTH'));
    const e: RuleEntry = { ...raw, keywords };
    if (e.sensitive ? e.keywords.length > 0 || !e.keywordHashes || e.matchMode !== 'whole_word' : e.keywordHashes !== undefined) return err(invalid('sensitive', 'INCONSISTENT'));
    if (e.categoryIds.length === 0 && e.keywords.length === 0 && !e.keywordHashes) return err(invalid('categoryIds', 'SCOPE_REQUIRED'));
    if ((e.action === 'review' || e.action === 'allow_with_notice') && e.noticeId === undefined) return err(invalid('noticeId', 'REQUIRED'));
    if (e.emergencyUntil !== undefined) {
      const until = Date.parse(e.emergencyUntil);
      if (e.action !== 'review' || until > Date.parse(payload.releasedAt) + EMERGENCY_MAX_MS || until > now + EMERGENCY_MAX_MS) return err(rejected());
      if (until <= now) { expiredKeys.add(e.ruleKey); continue; }
      emergencies += 1;
    }
    entries.push(e);
  }
  if (emergencies > MAX_EMERGENCY_ACTIVE) return err(rejected());
  const active = new Map(rulesOf(ctx, payload.publisherId, 'active').map((r) => [r.data.ruleKey, r] as const));
  const drafts = new Map(rulesOf(ctx, payload.publisherId, 'draft').map((r) => [r.data.ruleKey, r] as const));
  const activations: RuleEntry[] = [];
  for (const e of entries) {
    const cur = active.get(e.ruleKey);
    if (cur) {
      if (e.version < cur.data.version) return err(rejected());
      if (e.version === cur.data.version) {
        if (entryComparable(e) !== entryComparable(dataToEntry(cur.data))) return err(rejected());
        continue;
      }
    }
    if (e.emergencyUntil === undefined && e.proposalId === undefined) return err(ruleError('GOVERNANCE_RULE_PROPOSAL_REQUIRED'));
    activations.push(e);
  }
  const keep = new Set(entries.map((e) => e.ruleKey));
  const retirements: RulePlan['retirements'] = [];
  for (const [key, rec] of active) {
    if (keep.has(key)) continue;
    retirements.push({ rec, change: expiredKeys.has(key) ? 'emergency_expired' : 'retired' });
  }
  return ok({ payload, entries, activations, retirements, active, drafts });
}

export async function applyRulePlan(
  ctx: CommandContext,
  options: ProhibitedOptions,
  plan: RulePlan,
  meta: { readonly envelope: ApplyRulePackInput['envelope']; readonly cid: string; readonly provenance: ApplyRulePackInput['provenance']; readonly trustNow: boolean; readonly enforceProposals: boolean },
): Promise<Result<ApplyRulePackOutput, AppError>> {
  const { payload } = plan;
  const now = nowIso(ctx);
  const publisher = loadPublisherState(ctx, payload.publisherId);
  const vault = loadVaultState(ctx);
  const recent = vault.data.appliedLog.filter((t) => Date.parse(t) > ctx.clock.now() - DAY_MS);
  if (recent.length >= MAX_APPLIES_PER_DAY) return err(appError('RATE_LIMITED', { retryAfterMs: Math.max(1, Date.parse(recent[0] ?? now) + DAY_MS - ctx.clock.now()) }));
  if (meta.enforceProposals) {
    const byProposal = new Map<string, string[]>();
    for (const e of plan.activations) if (e.emergencyUntil === undefined && e.proposalId) byProposal.set(e.proposalId, [...(byProposal.get(e.proposalId) ?? []), e.ruleKey]);
    for (const [proposalId, keys] of byProposal) {
      let approved = false;
      try { approved = await options.proposalApproved(proposalId, keys); } catch { approved = false; }
      if (!approved) return err(ruleError('GOVERNANCE_RULE_PROPOSAL_REQUIRED'));
    }
  }
  if (meta.trustNow) {
    const trust = ctx.tx.repo(trustRepo);
    if (!trust.get(payload.publisherId)) {
      if (collectAll(trust).length >= MAX_TRUSTED_PUBLISHERS) return err(appError('PRECONDITION_FAILED', { params: { reason: 'trusted_publisher_limit' } }));
      const t = trust.put(payload.publisherId, { publisherId: payload.publisherId, trustedAt: now }, { expectedRevision: 0 });
      if (!t.ok) return t;
    }
  }
  const repo = ctx.tx.repo(ruleRepo);
  const changed: string[] = [];
  const provenance = { ...(meta.provenance.originRelay ? { originRelay: meta.provenance.originRelay } : {}), receivedAt: meta.provenance.receivedAt, verifiedAt: now, packCid: meta.cid };
  const emit = (ruleKey: string, version: number, change: 'activated' | 'retired' | 'emergency_expired', action: RuleData['action'], revision: number, id: string): void => {
    ctx.emit(ruleChanged, { aggregate: { type: 'prohibited_rule', id }, revision, payload: { ruleKey, version, change, action, rulesetVersion: payload.version, publisherId: payload.publisherId } });
  };
  for (const { rec, change } of plan.retirements) {
    const next = ruleMachine.next('active', 'retire');
    if (!next.ok) return next;
    const saved = repo.put(rec.id, { ...rec.data, status: next.value, updatedAt: now }, { expectedRevision: rec.revision });
    if (!saved.ok) return saved;
    changed.push(rec.data.ruleKey);
    emit(rec.data.ruleKey, rec.data.version, change, rec.data.action, saved.value.revision, rec.id);
  }
  for (const e of plan.activations) {
    const cur = plan.active.get(e.ruleKey);
    if (cur) {
      const next = ruleMachine.next('active', 'retire');
      if (!next.ok) return next;
      const s = repo.put(cur.id, { ...cur.data, status: next.value, updatedAt: now }, { expectedRevision: cur.revision });
      if (!s.ok) return s;
    }
    const draft = plan.drafts.get(e.ruleKey);
    const reuse = draft && draft.data.version === e.version ? draft : undefined;
    const activated = ruleMachine.next('draft', 'activate');
    if (!activated.ok) return activated;
    const data: RuleData = { ...e, tenantId: ctx.tenantId, publisherId: payload.publisherId, status: activated.value, rulesetVersion: payload.version, provenance, createdAt: reuse?.data.createdAt ?? now, updatedAt: now };
    const id = reuse?.id ?? ctx.ids.next();
    const saved = repo.put(id, data, { expectedRevision: reuse?.revision ?? 0 });
    if (!saved.ok) return saved;
    changed.push(e.ruleKey);
    emit(e.ruleKey, e.version, 'activated', e.action, saved.value.revision, id);
  }
  const packs = ctx.tx.repo(packRepo);
  for (const r of collectAll(packs, { publisher: payload.publisherId })) {
    if (r.data.status === 'applied') {
      const s = packs.put(r.id, { ...r.data, status: 'superseded' }, { expectedRevision: r.revision });
      if (!s.ok) return s;
    }
  }
  const existingPack = packs.get(meta.cid);
  const stored = packs.put(meta.cid, {
    publisherId: payload.publisherId, version: payload.version, envelope: meta.envelope, status: 'applied', receivedAt: meta.provenance.receivedAt, appliedAt: now,
    ...(meta.provenance.originRelay ? { originRelay: meta.provenance.originRelay } : {}), ruleCount: plan.entries.length, changelogEntry: payload.changelogEntry,
  }, { expectedRevision: existingPack?.revision ?? 0 });
  if (!stored.ok) return stored;
  const kept = collectAll(packs, { publisher: payload.publisherId }).filter((r) => r.data.status === 'superseded').sort((a, b) => b.data.version - a.data.version);
  for (const old of kept.slice(KEEP_PACKS - 1)) {
    const rm = packs.remove(old.id, { expectedRevision: old.revision });
    if (!rm.ok) return rm;
  }
  const states = ctx.tx.repo(stateRepo);
  const ps = states.put(publisherStateId(payload.publisherId), { appliedVersion: payload.version, appliedCid: meta.cid, appliedLog: [] }, { expectedRevision: publisher.revision });
  if (!ps.ok) return ps;
  const vs = states.put(VAULT_STATE_ID, { ...vault.data, appliedLog: [...recent, now] }, { expectedRevision: vault.revision });
  if (!vs.ok) return vs;
  return ok({ applied: true, packVersion: payload.version, changedRuleKeys: changed });
}

const unsupported = (): AppError => appError('UNSUPPORTED_SCHEMA_VERSION');

/** The shared inbound path of governance.prohibited_rule.apply_pack and the exported statement handler. */
export async function receiveRulePack(ctx: CommandContext, options: ProhibitedOptions, input: ApplyRulePackInput): Promise<Result<ApplyRulePackOutput, AppError>> {
  if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
  discardExpiredPendingPacks(ctx);
  const expiry = expireEmergencyRules(ctx);
  if (!expiry.ok) return expiry;
  let size: number;
  try { size = utf8Length(input.envelope); } catch { return err(appError('VALIDATION_FAILED')); }
  if (size > MAX_PACK_BYTES) return err(rejected());
  if (input.envelope.type !== RULE_PACK_TYPE) return err(input.envelope.type.startsWith('classrup.governance.rule_pack/') ? unsupported() : appError('VALIDATION_FAILED'));
  let verified: VerifiedRuleStatement;
  try { verified = await options.verifyPack(structuredClone(input.envelope)); } catch { return err(rejected()); }
  if (verified.type !== RULE_PACK_TYPE || verified.cid !== input.envelope.cid) return err(rejected());
  const parsed = rulePayloadSchema.safeParse(verified.payload);
  if (!parsed.success) return err(appError('VALIDATION_FAILED'));
  const payload = parsed.data;
  if (payload.publisherId !== verified.author) return err(rejected());
  const packs = ctx.tx.repo(packRepo);
  const known = packs.get(verified.cid);
  if (known && known.data.status !== 'pending') return ok({ applied: true, packVersion: known.data.version, changedRuleKeys: [] });
  const plan = planRulePack(ctx, payload);
  if (!plan.ok) return plan;
  const trusted = ctx.tx.repo(trustRepo).get(payload.publisherId) !== undefined;
  if (!trusted && input.trustPublisher !== true) {
    const pending = { applied: false, packVersion: payload.version, changedRuleKeys: [], pendingReason: 'untrusted_publisher' } as const;
    if (known) return ok({ ...pending, changedRuleKeys: [] });
    if (collectAll(packs, { status: 'pending' }).length >= MAX_PENDING_PACKS) return err(appError('RATE_LIMITED'));
    const saved = packs.put(verified.cid, {
      publisherId: payload.publisherId, version: payload.version, envelope: input.envelope, status: 'pending', receivedAt: input.provenance.receivedAt,
      ...(input.provenance.originRelay ? { originRelay: input.provenance.originRelay } : {}), ruleCount: payload.rules.length, changelogEntry: payload.changelogEntry, pendingReason: 'untrusted_publisher',
    }, { expectedRevision: 0 });
    if (!saved.ok) return saved;
    return ok({ ...pending, changedRuleKeys: [] });
  }
  return applyRulePlan(ctx, options, plan.value, { envelope: input.envelope, cid: verified.cid, provenance: input.provenance, trustNow: !trusted, enforceProposals: true });
}
