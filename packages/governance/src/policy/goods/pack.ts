// Verifying and applying taxonomy packs (V07 to V10 plus tree rules), atomically inside the caller's transaction.
import { appError, canonicalJson, err, ok, type AppError, type CommandContext, type Result, type SignedEnvelope } from '@classrup/kernel';
import {
  DAY_MS, KEEP_PACKS, MAX_APPLIES_PER_DAY, MAX_PACK_BYTES, MAX_PENDING_PACKS, MAX_TRUSTED_PUBLISHERS, PENDING_TTL_MS, TAXONOMY_PACK_TYPE, VAULT_STATE_ID,
  categoryChanged, categoryRepo, comparable, eventFor, goodsError, packPayloadSchema, packRepo, publisherStateId, stateRepo, treeInvalid, trustRepo, utf8Length, validateTree,
  type CategoryData, type PackEntry, type PackPayload, type TaxonomyState,
} from './model.ts';
import { collectAll } from './view.ts';

/** What a verification callback returns for a statement whose signature checked out. */
export interface VerifiedPackStatement {
  readonly type: string;
  /** did:key that signed the statement. */
  readonly author: string;
  readonly cid: string;
  readonly payload: unknown;
}

export interface GoodsOptions {
  /** did:key of the publisher key this vault holds, or undefined when the vault is not a publisher. */
  readonly localPublisherId: () => string | undefined;
  /** Signs a statement with the publisher key (Ed25519 over JCS); never implemented in this module. */
  readonly signPack: (type: string, payload: unknown, version: number, previousCid: string | null) => Promise<SignedEnvelope>;
  /** Verifies signature and envelope integrity; throws when invalid. */
  readonly verifyPack: (envelope: unknown) => Promise<VerifiedPackStatement>;
  /** Port to F18.S02.M01: is `proposalId` an approved decision for changing the restricted flag of `categoryId`? */
  readonly proposalApproved: (proposalId: string, categoryId: string) => boolean | Promise<boolean>;
}

export interface PackProvenanceInput {
  readonly originRelay?: string | undefined;
  readonly receivedAt: string;
}
export interface ApplyPackInput {
  readonly envelope: { readonly cid: string; readonly type: string; readonly [field: string]: unknown };
  readonly provenance: PackProvenanceInput;
  readonly trustPublisher?: boolean | undefined;
}
export interface ApplyPackOutput {
  readonly applied: boolean;
  readonly packVersion: number;
  readonly changedCategoryIds: string[];
  readonly pendingReason?: string;
}

const nowIso = (ctx: CommandContext): string => new Date(ctx.clock.now()).toISOString();

export function loadVaultState(ctx: CommandContext): { data: TaxonomyState; revision: number } {
  const r = ctx.tx.repo(stateRepo).get(VAULT_STATE_ID);
  return r ? { data: r.data, revision: r.revision } : { data: { appliedVersion: 0, dirty: false, appliedLog: [] }, revision: 0 };
}
export function loadPublisherState(ctx: CommandContext, publisherId: string): { data: TaxonomyState; revision: number } {
  const r = ctx.tx.repo(stateRepo).get(publisherStateId(publisherId));
  return r ? { data: r.data, revision: r.revision } : { data: { publisherId, appliedVersion: 0, dirty: false, appliedLog: [] }, revision: 0 };
}

/** Removes pending packs older than 30 days (spec timeout). Safe to call from any command transaction. */
export function discardExpiredPendingPacks(ctx: CommandContext): number {
  const repo = ctx.tx.repo(packRepo);
  const cutoff = new Date(ctx.clock.now() - PENDING_TTL_MS).toISOString();
  let removed = 0;
  for (const r of collectAll(repo, { status: 'pending' })) {
    if (r.data.receivedAt <= cutoff && repo.remove(r.id, { expectedRevision: r.revision }).ok) removed += 1;
  }
  return removed;
}

export interface ValidatedPack {
  readonly payload: PackPayload;
  readonly mirror: Map<string, { revision: number; data: CategoryData }>;
}

/** Everything that can reject a pack without side effects: V03 to V05, V08, V09 and status transitions. */
export function validatePackAgainstMirror(ctx: CommandContext, payload: PackPayload): Result<ValidatedPack, AppError> {
  const state = loadPublisherState(ctx, payload.publisherId).data;
  if (!payload.fullSnapshot || payload.version <= state.appliedVersion) return err(goodsError('GOVERNANCE_CATEGORY_PACK_STALE'));
  const tree = validateTree(payload.categories);
  if (!tree.ok) return tree;
  const repo = ctx.tx.repo(categoryRepo);
  const mirror = new Map<string, { revision: number; data: CategoryData }>();
  for (const r of collectAll(repo, { publisher: payload.publisherId })) mirror.set(r.id, { revision: r.revision, data: r.data });
  const incoming = new Map(payload.categories.map((e) => [e.id, e] as const));
  // V09: ids never change meaning and are never dropped from a full snapshot (retire with a merge target instead).
  for (const [id, m] of mirror) {
    const e = incoming.get(id);
    if (!e || e.key !== m.data.key) return err(treeInvalid());
  }
  for (const e of payload.categories) {
    const existing = mirror.get(e.id);
    if (existing) {
      if (existing.data.status !== e.status && eventFor(existing.data.status, e.status) === undefined) return err(treeInvalid());
      if (existing.data.status === 'retired' && comparable(e) !== comparable({ ...existing.data, id: e.id })) return err(treeInvalid());
    } else {
      // An id used by another publisher's category must never be reinterpreted.
      const other = repo.get(e.id);
      if (other && other.data.publisherId !== payload.publisherId) return err(treeInvalid());
    }
  }
  return ok({ payload, mirror });
}

type Change = 'created' | 'renamed' | 'moved' | 'restricted_changed' | 'deprecated' | 'reactivated' | 'retired';
function classify(old: CategoryData | undefined, e: PackEntry): Change | undefined {
  if (!old) return 'created';
  if (old.status !== e.status) return e.status === 'retired' ? 'retired' : e.status === 'deprecated' ? 'deprecated' : 'reactivated';
  if (old.restricted !== e.restricted) return 'restricted_changed';
  if (old.parentId !== e.parentId || old.sortOrder !== e.sortOrder || old.depth !== e.depth) return 'moved';
  if (canonicalJson(old.names) !== canonicalJson(e.names) || old.restrictedReasonKey !== e.restrictedReasonKey) return 'renamed';
  return comparable({ ...old, id: e.id }) === comparable(e) ? undefined : 'renamed';
}

/**
 * Applies a validated pack. All proposal checks run before the first write so a rejected pack stores nothing;
 * a returned error rolls the whole transaction back in any case.
 */
export async function applyValidatedPack(
  ctx: CommandContext,
  options: GoodsOptions,
  v: ValidatedPack,
  meta: { readonly envelope: ApplyPackInput['envelope']; readonly cid: string; readonly provenance: PackProvenanceInput; readonly trustNow: boolean; readonly enforceProposals: boolean },
): Promise<Result<ApplyPackOutput, AppError>> {
  const { payload, mirror } = v;
  const now = nowIso(ctx);
  const publisher = loadPublisherState(ctx, payload.publisherId);
  const vault = loadVaultState(ctx);
  const recent = vault.data.appliedLog.filter((t) => Date.parse(t) > ctx.clock.now() - DAY_MS);
  if (recent.length >= MAX_APPLIES_PER_DAY) return err(appError('RATE_LIMITED', { retryAfterMs: Math.max(1, Date.parse(recent[0] ?? now) + DAY_MS - ctx.clock.now()) }));

  const plan: { entry: PackEntry; old: { revision: number; data: CategoryData } | undefined; change: Change }[] = [];
  for (const e of payload.categories) {
    const old = mirror.get(e.id);
    const change = classify(old?.data, e);
    if (change) plan.push({ entry: e, old, change });
  }
  if (meta.enforceProposals && publisher.data.appliedVersion > 0) {
    for (const p of plan) {
      const restrictedChanged = p.old ? p.old.data.restricted !== p.entry.restricted : p.entry.restricted;
      if (!restrictedChanged) continue;
      let approved = false;
      try { approved = p.entry.proposalId !== undefined && (await options.proposalApproved(p.entry.proposalId, p.entry.id)); } catch { approved = false; }
      if (!approved) return err(goodsError('GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED'));
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
  const repo = ctx.tx.repo(categoryRepo);
  const changed: string[] = [];
  for (const { entry: e, old, change } of plan) {
    const { id, ...rest } = e;
    const deprecatedAt = e.status === 'deprecated' ? (e.deprecatedAt ?? old?.data.deprecatedAt ?? now) : undefined;
    const data: CategoryData = {
      ...rest, deprecatedAt, tenantId: ctx.tenantId, publisherId: payload.publisherId,
      createdAt: old?.data.createdAt ?? now, updatedAt: now, packVersion: payload.version,
      provenance: { ...(meta.provenance.originRelay ? { originRelay: meta.provenance.originRelay } : {}), receivedAt: meta.provenance.receivedAt, verifiedAt: now, packCid: meta.cid },
    };
    const saved = repo.put(id, data, { expectedRevision: old?.revision ?? 0 });
    if (!saved.ok) return saved;
    changed.push(id);
    ctx.emit(categoryChanged, {
      aggregate: { type: 'category', id }, revision: saved.value.revision,
      payload: { categoryId: id, change, restricted: e.restricted, ...(e.mergedInto ? { mergedInto: e.mergedInto } : {}), packVersion: payload.version, publisherId: payload.publisherId },
    });
  }
  const packs = ctx.tx.repo(packRepo);
  for (const r of collectAll(packs, { publisher: payload.publisherId })) {
    if (r.data.status === 'applied') {
      const s = packs.put(r.id, { ...r.data, status: 'superseded' }, { expectedRevision: r.revision });
      if (!s.ok) return s;
    }
  }
  const existingPack = packs.get(meta.cid);
  const record = {
    publisherId: payload.publisherId, version: payload.version, envelope: meta.envelope, status: 'applied' as const, receivedAt: meta.provenance.receivedAt, appliedAt: now,
    ...(meta.provenance.originRelay ? { originRelay: meta.provenance.originRelay } : {}), categoryCount: payload.categories.length, changelogEntry: payload.changelogEntry,
  };
  const stored = packs.put(meta.cid, record, { expectedRevision: existingPack?.revision ?? 0 });
  if (!stored.ok) return stored;
  const kept = collectAll(packs, { publisher: payload.publisherId }).filter((r) => r.data.status === 'superseded').sort((a, b) => b.data.version - a.data.version);
  for (const old of kept.slice(KEEP_PACKS - 1)) {
    const rm = packs.remove(old.id, { expectedRevision: old.revision });
    if (!rm.ok) return rm;
  }
  const states = ctx.tx.repo(stateRepo);
  const ps = states.put(publisherStateId(payload.publisherId), { ...publisher.data, publisherId: payload.publisherId, appliedVersion: payload.version, appliedCid: meta.cid, dirty: false, appliedLog: [] }, { expectedRevision: publisher.revision });
  if (!ps.ok) return ps;
  const vs = states.put(VAULT_STATE_ID, { ...vault.data, activePublisherId: vault.data.activePublisherId ?? payload.publisherId, appliedLog: [...recent, now] }, { expectedRevision: vault.revision });
  if (!vs.ok) return vs;
  return ok({ applied: true, packVersion: payload.version, changedCategoryIds: changed });
}

function untrustedOrInvalid(code: Parameters<typeof goodsError>[0] | 'UNSUPPORTED_SCHEMA_VERSION' | 'VALIDATION_FAILED'): AppError {
  return code === 'UNSUPPORTED_SCHEMA_VERSION' || code === 'VALIDATION_FAILED' ? appError(code) : goodsError(code);
}

/** The shared inbound path of governance.category.apply_pack and the exported statement handler. */
export async function receivePack(ctx: CommandContext, options: GoodsOptions, input: ApplyPackInput): Promise<Result<ApplyPackOutput, AppError>> {
  if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
  discardExpiredPendingPacks(ctx);
  // V10 first: size is measured before anything is parsed into storage.
  let size: number;
  try { size = utf8Length(input.envelope); } catch { return err(untrustedOrInvalid('VALIDATION_FAILED')); }
  if (size > MAX_PACK_BYTES) return err(untrustedOrInvalid('UNSUPPORTED_SCHEMA_VERSION'));
  if (input.envelope.type !== TAXONOMY_PACK_TYPE) {
    return err(untrustedOrInvalid(input.envelope.type.startsWith('classrup.governance.taxonomy_pack/') ? 'UNSUPPORTED_SCHEMA_VERSION' : 'VALIDATION_FAILED'));
  }
  let verified: VerifiedPackStatement;
  try { verified = await options.verifyPack(structuredClone(input.envelope)); } catch { return err(goodsError('GOVERNANCE_CATEGORY_PACK_UNTRUSTED')); }
  if (verified.type !== TAXONOMY_PACK_TYPE || verified.cid !== input.envelope.cid) return err(goodsError('GOVERNANCE_CATEGORY_PACK_UNTRUSTED'));
  const parsed = packPayloadSchema.safeParse(verified.payload);
  if (!parsed.success) return err(appError('VALIDATION_FAILED'));
  const payload = parsed.data;
  // The signer must be the publisher the pack speaks for.
  if (payload.publisherId !== verified.author) return err(goodsError('GOVERNANCE_CATEGORY_PACK_UNTRUSTED'));
  const packs = ctx.tx.repo(packRepo);
  const known = packs.get(verified.cid);
  if (known && known.data.status !== 'pending') return ok({ applied: true, packVersion: known.data.version, changedCategoryIds: [] });
  const checked = validatePackAgainstMirror(ctx, payload);
  if (!checked.ok) return checked;
  const trusted = ctx.tx.repo(trustRepo).get(payload.publisherId) !== undefined;
  if (!trusted && input.trustPublisher !== true) {
    if (known) return ok({ applied: false, packVersion: payload.version, changedCategoryIds: [], pendingReason: 'untrusted_publisher' });
    if (collectAll(packs, { status: 'pending' }).length >= MAX_PENDING_PACKS) return err(appError('RATE_LIMITED'));
    const saved = packs.put(verified.cid, {
      publisherId: payload.publisherId, version: payload.version, envelope: input.envelope, status: 'pending', receivedAt: input.provenance.receivedAt,
      ...(input.provenance.originRelay ? { originRelay: input.provenance.originRelay } : {}), categoryCount: payload.categories.length, changelogEntry: payload.changelogEntry, pendingReason: 'untrusted_publisher',
    }, { expectedRevision: 0 });
    if (!saved.ok) return saved;
    return ok({ applied: false, packVersion: payload.version, changedCategoryIds: [], pendingReason: 'untrusted_publisher' });
  }
  return applyValidatedPack(ctx, options, checked.value, { envelope: input.envelope, cid: verified.cid, provenance: input.provenance, trustNow: !trusted, enforceProposals: true });
}
