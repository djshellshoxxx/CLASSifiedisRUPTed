// F18.S01.M03 Goods taxonomy (PS-144): signed taxonomy packs, a read-only mirror per vault, and the
// publisher-side authoring commands. Configuration, not law; ADR-0016: no central authority.
import { appError, canonicalJson, defineCommand, defineQuery, err, ok, timestamp, uuidv7, z, type CommandContext, type QueryContext, type Result, type AppError } from '@classrup/kernel';
import {
  applyValidatedPack, loadPublisherState, receivePack, validatePackAgainstMirror,
  type ApplyPackInput, type ApplyPackOutput, type GoodsOptions,
} from './pack.ts';
import {
  GOODS_MODULE, MAX_CATEGORIES, MAX_CHILDREN, MAX_DEPTH, MAX_PACK_BYTES, RETIRE_AFTER_DEPRECATION_MS, TAXONOMY_PACK_TYPE, categoryMachine, categoryRepo, eventFor, goodsError,
  namesSchema, packPayloadSchema, publisherStateId, stagedRepo, stateRepo, treeInvalid, utf8Length, validateTree,
  type PackEntry, type PackPayload, type StagedData,
} from './model.ts';
import { activePublisherOf, collectAll, nodeOf, pickName, resolveIn } from './view.ts';

export * from './model.ts';
export { discardExpiredPendingPacks, receivePack, type ApplyPackInput, type ApplyPackOutput, type GoodsOptions, type VerifiedPackStatement } from './pack.ts';
export { buildTaxonomyView, categoryAllowedFrom, collectAll, nodeOf, readTaxonomyView, resolveIn, pickName, type CategoryNode, type ResolvedCategory, type TaxonomyView } from './view.ts';
export { seedTaxonomyEntries } from './seed.ts';

const proposalIdSchema = uuidv7();
const reasonKeySchema = z.string().regex(/^[a-z0-9_.]{3,120}$/);
const sortOrderSchema = z.int().min(0).max(999);
const localeSchema = z.string().regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$/);
const ENVELOPE = z.looseObject({ cid: z.string().min(1).max(200), type: z.string().min(1).max(200) });
const PROVENANCE = z.strictObject({ originRelay: z.string().max(200).optional(), receivedAt: timestamp() });

const nowIso = (ctx: CommandContext): string => new Date(ctx.clock.now()).toISOString();
type Staged = Map<string, { revision: number; data: StagedData }>;

function loadStaged(ctx: CommandContext, publisherId: string): Staged {
  return new Map(collectAll(ctx.tx.repo(stagedRepo), { publisher: publisherId }).map((r) => [r.id, { revision: r.revision, data: r.data }] as const));
}
const childrenOf = (staged: Staged, parentId: string | undefined, except?: string) =>
  [...staged.entries()].filter(([id, r]) => id !== except && r.data.parentId === parentId && r.data.status !== 'retired');
function subtreeIds(staged: Staged, rootId: string): string[] {
  const out = [rootId];
  for (let i = 0; i < out.length; i++) for (const [id, r] of staged) if (r.data.parentId === out[i]) out.push(id);
  return out;
}
function entryOf(id: string, d: StagedData): PackEntry {
  return {
    id, key: d.key, depth: d.depth, names: d.names, restricted: d.restricted, status: d.status, sortOrder: d.sortOrder,
    ...(d.parentId ? { parentId: d.parentId } : {}), ...(d.restrictedReasonKey ? { restrictedReasonKey: d.restrictedReasonKey } : {}),
    ...(d.proposalId ? { proposalId: d.proposalId } : {}), ...(d.mergedInto ? { mergedInto: d.mergedInto } : {}), ...(d.deprecatedAt ? { deprecatedAt: d.deprecatedAt } : {}),
  };
}
async function approved(options: GoodsOptions, proposalId: string | undefined, categoryId: string): Promise<boolean> {
  if (proposalId === undefined) return false;
  try { return await options.proposalApproved(proposalId, categoryId); } catch { return false; }
}
const validation = (path: string, code: string): AppError => appError('VALIDATION_FAILED', { fields: [{ path, code }] });

export function goodsDefinitions(options: GoodsOptions) {
  /** Authoring needs the vault's principal and a publisher key held by this vault. */
  const publisherOf = (ctx: CommandContext): Result<string, AppError> => {
    const publisher = options.localPublisherId();
    return ctx.actor.kind === 'user' && publisher !== undefined ? ok(publisher) : err(appError('FORBIDDEN'));
  };
  const markDirty = (ctx: CommandContext, publisherId: string): void => {
    const s = loadPublisherState(ctx, publisherId);
    ctx.tx.repo(stateRepo).put(publisherStateId(publisherId), { ...s.data, publisherId, dirty: true }, { expectedRevision: s.revision });
  };

  const create = defineCommand({
    name: 'governance.category.create', module: GOODS_MODULE, capability: 'governance.category.author', idempotent: true,
    input: z.strictObject({ key: z.string().regex(/^[a-z0-9_]{2,40}$/), parentId: uuidv7().optional(), names: namesSchema, restricted: z.boolean().optional(), restrictedReasonKey: reasonKeySchema.optional(), proposalId: proposalIdSchema.optional(), sortOrder: sortOrderSchema.optional() }),
    async handler(ctx, input) {
      const who = publisherOf(ctx); if (!who.ok) return who;
      const staged = loadStaged(ctx, who.value);
      if ([...staged.values()].some((r) => r.data.key === input.key)) return err(validation('key', 'DUPLICATE_KEY'));
      if (staged.size >= MAX_CATEGORIES) return err(treeInvalid());
      let depth = 1;
      if (input.parentId !== undefined) {
        const parent = staged.get(input.parentId);
        if (!parent) return err(appError('NOT_FOUND'));
        if (parent.data.status === 'retired' || parent.data.depth + 1 > MAX_DEPTH) return err(treeInvalid());
        depth = parent.data.depth + 1;
      }
      if (childrenOf(staged, input.parentId).length >= MAX_CHILDREN) return err(treeInvalid());
      const restricted = input.restricted ?? false;
      if (restricted && !input.restrictedReasonKey) return err(validation('restrictedReasonKey', 'REQUIRED'));
      const categoryId = ctx.ids.next();
      if (restricted && !(await approved(options, input.proposalId, categoryId))) return err(goodsError('GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED'));
      const now = nowIso(ctx);
      const saved = ctx.tx.repo(stagedRepo).put(categoryId, {
        tenantId: ctx.tenantId, publisherId: who.value, key: input.key, depth, names: input.names, restricted, status: 'active', sortOrder: input.sortOrder ?? 0, createdAt: now, updatedAt: now,
        ...(input.parentId ? { parentId: input.parentId } : {}), ...(restricted ? { restrictedReasonKey: input.restrictedReasonKey, proposalId: input.proposalId } : {}),
      }, { expectedRevision: 0 });
      if (!saved.ok) return saved;
      markDirty(ctx, who.value);
      return ok({ categoryId, revision: saved.value.revision, stagedInPack: loadPublisherState(ctx, who.value).data.appliedVersion + 1 });
    },
  });

  const update = defineCommand({
    name: 'governance.category.update', module: GOODS_MODULE, capability: 'governance.category.author', idempotent: true,
    input: z.strictObject({ categoryId: uuidv7(), expectedRevision: z.int().min(1), names: namesSchema.optional(), restricted: z.boolean().optional(), restrictedReasonKey: reasonKeySchema.optional(), proposalId: proposalIdSchema.optional(), sortOrder: sortOrderSchema.optional() }),
    async handler(ctx, input) {
      const who = publisherOf(ctx); if (!who.ok) return who;
      const record = ctx.tx.repo(stagedRepo).get(input.categoryId);
      if (!record || record.data.publisherId !== who.value) return err(appError('NOT_FOUND'));
      if (record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      if (record.data.status === 'retired') return err(appError('CONFLICT_STATE'));
      const restricted = input.restricted ?? record.data.restricted;
      const reason = restricted ? (input.restrictedReasonKey ?? record.data.restrictedReasonKey) : undefined;
      if (restricted && !reason) return err(validation('restrictedReasonKey', 'REQUIRED'));
      const flagChanged = restricted !== record.data.restricted;
      if (flagChanged && !(await approved(options, input.proposalId, input.categoryId))) return err(goodsError('GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED'));
      const { restrictedReasonKey: _r, proposalId: _p, ...rest } = record.data;
      const saved = ctx.tx.repo(stagedRepo).put(input.categoryId, {
        ...rest, names: input.names ?? record.data.names, restricted, sortOrder: input.sortOrder ?? record.data.sortOrder, updatedAt: nowIso(ctx),
        ...(reason ? { restrictedReasonKey: reason } : {}), ...(flagChanged ? (input.proposalId ? { proposalId: input.proposalId } : {}) : record.data.proposalId ? { proposalId: record.data.proposalId } : {}),
      }, { expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved;
      markDirty(ctx, who.value);
      return ok({ categoryId: input.categoryId, revision: saved.value.revision });
    },
  });

  const move = defineCommand({
    name: 'governance.category.move', module: GOODS_MODULE, capability: 'governance.category.author', idempotent: true,
    input: z.strictObject({ categoryId: uuidv7(), expectedRevision: z.int().min(1), newParentId: uuidv7().optional(), sortOrder: sortOrderSchema.optional() }),
    handler(ctx, input) {
      const who = publisherOf(ctx); if (!who.ok) return who;
      const staged = loadStaged(ctx, who.value);
      const record = staged.get(input.categoryId);
      if (!record) return err(appError('NOT_FOUND'));
      if (record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      if (record.data.status === 'retired') return err(appError('CONFLICT_STATE'));
      let newDepth = 1;
      if (input.newParentId !== undefined) {
        const parent = staged.get(input.newParentId);
        if (!parent) return err(appError('NOT_FOUND'));
        const subtree = subtreeIds(staged, input.categoryId);
        if (subtree.includes(input.newParentId) || parent.data.status === 'retired') return err(treeInvalid());
        newDepth = parent.data.depth + 1;
      }
      const subtree = subtreeIds(staged, input.categoryId);
      const height = Math.max(...subtree.map((id) => (staged.get(id)?.data.depth ?? 1) - record.data.depth));
      if (newDepth + height > MAX_DEPTH) return err(treeInvalid());
      if (childrenOf(staged, input.newParentId, input.categoryId).length >= MAX_CHILDREN) return err(treeInvalid());
      const repo = ctx.tx.repo(stagedRepo);
      const delta = newDepth - record.data.depth;
      const now = nowIso(ctx);
      for (const id of subtree) {
        if (id === input.categoryId) continue;
        const d = staged.get(id);
        if (!d) continue;
        const r = repo.put(id, { ...d.data, depth: d.data.depth + delta, updatedAt: now }, { expectedRevision: d.revision });
        if (!r.ok) return r;
      }
      const { parentId: _old, ...rest } = record.data;
      const saved = repo.put(input.categoryId, { ...rest, depth: newDepth, sortOrder: input.sortOrder ?? record.data.sortOrder, updatedAt: now, ...(input.newParentId ? { parentId: input.newParentId } : {}) }, { expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved;
      markDirty(ctx, who.value);
      return ok({ categoryId: input.categoryId, revision: saved.value.revision, depth: newDepth });
    },
  });

  const setStatus = defineCommand({
    name: 'governance.category.set_status', module: GOODS_MODULE, capability: 'governance.category.author', idempotent: true,
    input: z.strictObject({ categoryId: uuidv7(), expectedRevision: z.int().min(1), to: z.enum(['deprecated', 'active', 'retired']), mergedInto: uuidv7().optional() }),
    handler(ctx, input) {
      const who = publisherOf(ctx); if (!who.ok) return who;
      const staged = loadStaged(ctx, who.value);
      const record = staged.get(input.categoryId);
      if (!record) return err(appError('NOT_FOUND'));
      if (record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      const event = eventFor(record.data.status, input.to);
      if (!event || !categoryMachine.next(record.data.status, event).ok) return err(appError('CONFLICT_STATE'));
      if (input.to !== 'retired' && input.mergedInto !== undefined) return err(validation('mergedInto', 'ONLY_WHEN_RETIRED'));
      const now = nowIso(ctx);
      if (input.to === 'retired') {
        if (record.data.status === 'deprecated' && Date.parse(record.data.deprecatedAt ?? now) + RETIRE_AFTER_DEPRECATION_MS > ctx.clock.now()) return err(appError('CONFLICT_STATE'));
        const target = input.mergedInto === undefined ? undefined : staged.get(input.mergedInto);
        if (!target || input.mergedInto === input.categoryId || target.data.status === 'retired' || subtreeIds(staged, input.categoryId).includes(target ? input.mergedInto ?? '' : '')) return err(treeInvalid());
        if (childrenOf(staged, input.categoryId).length > 0) return err(treeInvalid());
      }
      const { deprecatedAt: _d, mergedInto: _m, ...rest } = record.data;
      const saved = ctx.tx.repo(stagedRepo).put(input.categoryId, {
        ...rest, status: input.to, updatedAt: now,
        ...(input.to === 'deprecated' ? { deprecatedAt: now } : {}), ...(input.to === 'retired' ? { mergedInto: input.mergedInto, ...(record.data.deprecatedAt ? { deprecatedAt: record.data.deprecatedAt } : {}) } : {}),
      }, { expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved;
      markDirty(ctx, who.value);
      return ok({ categoryId: input.categoryId, revision: saved.value.revision, status: input.to });
    },
  });

  const releasePack = defineCommand({
    name: 'governance.category.release_pack', module: GOODS_MODULE, capability: 'governance.category.release', idempotent: true, deliveryEligible: true,
    input: z.strictObject({ expectedPackVersion: z.int().min(0), changelogEntry: z.string().min(1).max(500), relayIds: z.array(z.string().min(1).max(200)).max(20) }),
    async handler(ctx, input) {
      const who = publisherOf(ctx); if (!who.ok) return who;
      const state = loadPublisherState(ctx, who.value);
      if (state.data.appliedVersion !== input.expectedPackVersion) return err(appError('CONFLICT_REVISION'));
      if (!state.data.dirty) return err(appError('PRECONDITION_FAILED', { params: { reason: 'no_staged_changes' } }));
      const staged = loadStaged(ctx, who.value);
      const categories = [...staged.entries()].map(([id, r]) => entryOf(id, r.data)).sort((a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
      const tree = validateTree(categories);
      if (!tree.ok) return tree.error.code === 'VALIDATION_FAILED' ? tree : err(treeInvalid());
      const payload: PackPayload = { publisherId: who.value, version: state.data.appliedVersion + 1, fullSnapshot: true, changelogEntry: input.changelogEntry, releasedAt: nowIso(ctx), categories };
      const parsed = packPayloadSchema.safeParse(payload);
      if (!parsed.success) return err(appError('VALIDATION_FAILED'));
      let envelope;
      try {
        envelope = structuredClone(await options.signPack(TAXONOMY_PACK_TYPE, parsed.data, payload.version, state.data.appliedCid ?? null));
        const verified = await options.verifyPack(envelope);
        if (verified.author !== who.value || verified.type !== TAXONOMY_PACK_TYPE || verified.cid !== envelope.cid || canonicalJson(verified.payload) !== canonicalJson(parsed.data)) return err(appError('FORBIDDEN'));
      } catch { return err(appError('VALIDATION_FAILED')); }
      if (utf8Length(envelope) > MAX_PACK_BYTES) return err(treeInvalid());
      const checked = validatePackAgainstMirror(ctx, parsed.data);
      if (!checked.ok) return checked;
      const now = nowIso(ctx);
      // Own releases: proposals were verified when the restricted flag was staged, and the own key is trusted by definition.
      const applied = await applyValidatedPack(ctx, options, checked.value, { envelope, cid: envelope.cid, provenance: { receivedAt: now }, trustNow: false, enforceProposals: false });
      if (!applied.ok) return applied;
      for (const relay of new Set(input.relayIds)) ctx.tx.sync.enqueue(relay, envelope);
      return ok({ packVersion: payload.version, packCid: envelope.cid, categoryCount: categories.length, syncState: 'prepared' as const });
    },
  });

  const applyPack = defineCommand({
    name: 'governance.category.apply_pack', module: GOODS_MODULE, capability: 'governance.category.apply', idempotent: true,
    input: z.strictObject({ envelope: ENVELOPE, provenance: PROVENANCE, trustPublisher: z.boolean().optional() }),
    handler: (ctx, input) => receivePack(ctx, options, input),
  });

  const get = defineQuery({
    name: 'governance.category.get', module: GOODS_MODULE, capability: 'governance.category.read', input: z.strictObject({ categoryId: uuidv7() }),
    handler(ctx, input) {
      const r = ctx.tx.repo(categoryRepo).get(input.categoryId);
      return r ? ok({ category: { id: r.id, revision: r.revision, ...r.data } }) : err(appError('NOT_FOUND'));
    },
  });
  const present = (ctx: QueryContext, locale: string | undefined, rows: ReturnType<typeof collectAll<ReturnType<typeof categoryRepo.schema.parse>, 'key' | 'parent' | 'status' | 'publisher'>>) =>
    rows.map((r) => ({ id: r.id, revision: r.revision, ...r.data, name: pickName(r.data.names, locale) }));
  const byOrder = <T extends { sortOrder: number; key: string }>(a: { data: T }, b: { data: T }) => a.data.sortOrder - b.data.sortOrder || a.data.key.localeCompare(b.data.key);

  const listChildren = defineQuery({
    name: 'governance.category.list_children', module: GOODS_MODULE, capability: 'governance.category.read',
    input: z.strictObject({ parentId: uuidv7().optional(), includeDeprecated: z.boolean().optional(), locale: localeSchema.optional() }),
    handler(ctx, input) {
      const repo = ctx.tx.repo(categoryRepo);
      let slot: string;
      if (input.parentId !== undefined) {
        const parent = repo.get(input.parentId);
        if (!parent) return err(appError('NOT_FOUND'));
        slot = `${parent.data.publisherId}|${parent.id}`;
      } else {
        const active = activePublisherOf(ctx.tx);
        if (active === undefined) return ok({ items: [] });
        slot = `${active}|root`;
      }
      const rows = collectAll(repo, { parent: slot }).filter((r) => r.data.status === 'active' || (input.includeDeprecated === true && r.data.status === 'deprecated')).sort(byOrder);
      return ok({ items: present(ctx, input.locale, rows) });
    },
  });

  const tree = defineQuery({
    name: 'governance.category.tree', module: GOODS_MODULE, capability: 'governance.category.read',
    input: z.strictObject({ locale: localeSchema.optional(), includeDeprecated: z.boolean().optional() }),
    handler(ctx, input) {
      const active = activePublisherOf(ctx.tx);
      if (active === undefined) return ok({ packVersion: 0, packCid: null, items: [] });
      const state = ctx.tx.repo(stateRepo).get(publisherStateId(active))?.data;
      const rows = collectAll(ctx.tx.repo(categoryRepo), { publisher: active }).filter((r) => r.data.status === 'active' || (input.includeDeprecated === true && r.data.status === 'deprecated'));
      const ids = new Set(rows.map((r) => r.id));
      const kids = new Map<string, typeof rows>();
      for (const r of rows) {
        const slot = r.data.parentId !== undefined && ids.has(r.data.parentId) ? r.data.parentId : 'root';
        kids.set(slot, [...(kids.get(slot) ?? []), r]);
      }
      const ordered: typeof rows = [];
      const walk = (slot: string): void => { for (const r of (kids.get(slot) ?? []).sort(byOrder)) { ordered.push(r); walk(r.id); } };
      walk('root');
      return ok({ packVersion: state?.appliedVersion ?? 0, packCid: state?.appliedCid ?? null, items: present(ctx, input.locale, ordered) });
    },
  });

  const resolve = defineQuery({
    name: 'governance.category.resolve', module: GOODS_MODULE, capability: 'governance.category.read', input: z.strictObject({ categoryId: uuidv7() }),
    handler(ctx, input) {
      const repo = ctx.tx.repo(categoryRepo);
      const resolved = resolveIn((id) => { const r = repo.get(id); return r ? nodeOf(r.id, r.data) : undefined; }, input.categoryId);
      return resolved ? ok({ categoryId: resolved.categoryId, resolvedId: resolved.resolvedId, path: [...resolved.path], restricted: resolved.restricted }) : err(appError('NOT_FOUND'));
    },
  });

  /** Statement type to handler for the composition root's inbound router; runs inside a command transaction. */
  const statementHandlers = {
    [TAXONOMY_PACK_TYPE]: (ctx: CommandContext, statement: ApplyPackInput): Promise<Result<ApplyPackOutput, AppError>> => receivePack(ctx, options, statement),
  } as const;

  return { create, update, move, setStatus, releasePack, applyPack, get, listChildren, tree, resolve, statementHandlers, all: [create, update, move, setStatus, releasePack, applyPack, get, listChildren, tree, resolve] as const };
}
