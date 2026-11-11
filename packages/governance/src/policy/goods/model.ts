// Goods taxonomy (F18.S01.M03): schemas, repos, errors, machine and pure tree validation.
import { appError, boundedString, canonicalJson, defineErrors, defineEvent, defineMachine, defineRepo, err, ok, isUuidV7, timestamp, z, type AppError, type Result } from '@classrup/kernel';

export const GOODS_MODULE = 'F18.S01.M03';
export const TAXONOMY_PACK_TYPE = 'classrup.governance.taxonomy_pack/v1';
export const MAX_DEPTH = 4;
export const MAX_CHILDREN = 50;
export const MAX_CATEGORIES = 2000;
export const MAX_PACK_BYTES = 1024 * 1024;
export const MAX_TRUSTED_PUBLISHERS = 10;
export const MAX_APPLIES_PER_DAY = 20;
export const MAX_PENDING_PACKS = 10;
export const KEEP_PACKS = 3;
export const DAY_MS = 86_400_000;
export const PENDING_TTL_MS = 30 * DAY_MS;
export const RETIRE_AFTER_DEPRECATION_MS = 30 * DAY_MS;

export const goodsErrors = defineErrors({
  GOVERNANCE_CATEGORY_TREE_INVALID: { status: 422, retryable: false },
  GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED: { status: 412, retryable: false },
  GOVERNANCE_CATEGORY_PACK_UNTRUSTED: { status: 403, retryable: false },
  GOVERNANCE_CATEGORY_PACK_STALE: { status: 409, retryable: false },
});
export type GoodsErrorCode = keyof typeof goodsErrors.codes;
export const goodsError = (code: GoodsErrorCode): AppError => goodsErrors.make(code);
export const treeInvalid = (): AppError => goodsError('GOVERNANCE_CATEGORY_TREE_INVALID');

const uuidv7 = () => z.string().refine((v): boolean => isUuidV7(v), { params: { code: 'INVALID_UUIDV7' } });
const didKey = z.string().startsWith('did:key:').max(128);
const categoryKey = z.string().regex(/^[a-z0-9_]{2,40}$/);
const reasonKey = z.string().regex(/^[a-z0-9_.]{3,120}$/);
const localeKey = z.string().regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$/);
const categoryName = boundedString({ min: 1, max: 60 }).refine((v) => !/[\p{Cc}\p{Cf}]/u.test(v), { params: { code: 'CONTROL_CHARACTER' } });
export const namesSchema = z
  .record(localeKey, categoryName)
  .refine((n) => Object.keys(n).length >= 1 && Object.keys(n).length <= 30, { params: { code: 'LOCALE_COUNT' } })
  .refine((n) => typeof n['en'] === 'string', { params: { code: 'EN_REQUIRED' } });
export const categoryStatus = z.enum(['active', 'deprecated', 'retired']);
export type CategoryStatus = z.output<typeof categoryStatus>;

/** Fields a category carries in a pack statement (and in the publisher's staged working copy). */
export const packEntryShape = {
  id: uuidv7(),
  key: categoryKey,
  parentId: uuidv7().optional(),
  depth: z.int().min(1).max(MAX_DEPTH),
  names: namesSchema,
  restricted: z.boolean(),
  restrictedReasonKey: reasonKey.optional(),
  proposalId: uuidv7().optional(),
  status: categoryStatus,
  mergedInto: uuidv7().optional(),
  sortOrder: z.int().min(0).max(999),
  deprecatedAt: timestamp().optional(),
};
export const packEntrySchema = z.strictObject(packEntryShape);
export type PackEntry = z.output<typeof packEntrySchema>;

const { id: _id, ...entryRest } = packEntryShape;
const stagedShape = { ...entryRest, tenantId: z.string(), publisherId: didKey, createdAt: timestamp(), updatedAt: timestamp() };
export const stagedSchema = z.strictObject(stagedShape);
export type StagedData = z.output<typeof stagedSchema>;

export const provenanceSchema = z.strictObject({ originRelay: z.string().max(200).optional(), receivedAt: timestamp(), verifiedAt: timestamp(), packCid: z.string().min(1).max(200) });
export const categorySchema = z.strictObject({ ...stagedShape, packVersion: z.int().min(1), provenance: provenanceSchema });
export type CategoryData = z.output<typeof categorySchema>;

export const packPayloadSchema = z.strictObject({
  publisherId: didKey,
  version: z.int().min(1),
  fullSnapshot: z.boolean(),
  changelogEntry: z.string().max(500),
  releasedAt: timestamp(),
  categories: z.array(packEntrySchema),
});
export type PackPayload = z.output<typeof packPayloadSchema>;

export const categoryRepo = defineRepo({
  type: 'governance.category',
  schema: categorySchema,
  indexes: { key: (d) => `${d.publisherId}|${d.key}`, parent: (d) => `${d.publisherId}|${d.parentId ?? 'root'}`, status: (d) => d.status, publisher: (d) => d.publisherId },
});
export const stagedRepo = defineRepo({
  type: 'governance.category_staged',
  schema: stagedSchema,
  indexes: { key: (d) => d.key, parent: (d) => d.parentId ?? 'root', publisher: (d) => d.publisherId },
});
const packRecordSchema = z.strictObject({
  publisherId: didKey,
  version: z.int().min(1),
  envelope: z.looseObject({ cid: z.string(), type: z.string() }),
  status: z.enum(['pending', 'applied', 'superseded']),
  receivedAt: timestamp(),
  appliedAt: timestamp().optional(),
  originRelay: z.string().max(200).optional(),
  categoryCount: z.int().min(0),
  changelogEntry: z.string().max(500),
  pendingReason: z.string().max(60).optional(),
});
export type PackRecord = z.output<typeof packRecordSchema>;
export const packRepo = defineRepo({ type: 'governance.taxonomy_pack', schema: packRecordSchema, indexes: { publisher: (d) => d.publisherId, status: (d) => d.status, received: (d) => d.receivedAt } });
export const trustRepo = defineRepo({ type: 'governance.taxonomy_trust', schema: z.strictObject({ publisherId: didKey, trustedAt: timestamp() }), indexes: {} });
const stateSchema = z.strictObject({
  publisherId: didKey.optional(),
  appliedVersion: z.int().min(0),
  appliedCid: z.string().max(200).optional(),
  dirty: z.boolean(),
  activePublisherId: didKey.optional(),
  appliedLog: z.array(timestamp()).max(MAX_APPLIES_PER_DAY),
});
export type TaxonomyState = z.output<typeof stateSchema>;
export const stateRepo = defineRepo({ type: 'governance.taxonomy_state', schema: stateSchema, indexes: {} });
export const VAULT_STATE_ID = 'vault';
export const publisherStateId = (publisherId: string): string => `pub:${publisherId}`;

export const categoryChanged = defineEvent(
  'governance.category.changed',
  1,
  'P0',
  z.strictObject({
    categoryId: z.string(),
    change: z.enum(['created', 'renamed', 'moved', 'restricted_changed', 'deprecated', 'reactivated', 'retired']),
    restricted: z.boolean(),
    mergedInto: z.string().optional(),
    packVersion: z.int().min(1),
    publisherId: z.string(),
  }),
);

export const categoryMachine = defineMachine({
  initial: 'active',
  terminal: ['retired'],
  transitions: [
    { from: 'active', to: 'deprecated', on: 'deprecate' },
    { from: 'deprecated', to: 'active', on: 'reactivate' },
    { from: 'deprecated', to: 'retired', on: 'retire' },
    { from: 'active', to: 'retired', on: 'retire' },
  ],
});
export type CategoryEvent = 'deprecate' | 'reactivate' | 'retire';

/** The machine event that moves `from` to `to`, or undefined when no declared transition does. */
export function eventFor(from: CategoryStatus, to: CategoryStatus): CategoryEvent | undefined {
  const event: CategoryEvent = to === 'deprecated' ? 'deprecate' : to === 'active' ? 'reactivate' : 'retire';
  const next = categoryMachine.next(from, event);
  return next.ok && next.value === to ? event : undefined;
}

export interface TreeNode {
  readonly id: string;
  readonly key: string;
  readonly parentId?: string | undefined;
  readonly depth: number;
  readonly status: CategoryStatus;
  readonly mergedInto?: string | undefined;
  readonly restricted: boolean;
  readonly restrictedReasonKey?: string | undefined;
}

/**
 * Pure tree validation (V01, V03, V04, V05 and the entity invariants). Violations of V01/V02-like
 * shape rules are VALIDATION_FAILED; every structural violation is GOVERNANCE_CATEGORY_TREE_INVALID.
 */
export function validateTree(nodes: readonly TreeNode[]): Result<void, AppError> {
  if (nodes.length > MAX_CATEGORIES) return err(treeInvalid());
  const byId = new Map<string, TreeNode>();
  const keys = new Set<string>();
  for (const n of nodes) {
    if (byId.has(n.id)) return err(treeInvalid());
    byId.set(n.id, n);
    if (keys.has(n.key)) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'key', code: 'DUPLICATE_KEY' }] }));
    keys.add(n.key);
    if (n.restricted && !n.restrictedReasonKey) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'restrictedReasonKey', code: 'REQUIRED' }] }));
    if (n.status !== 'retired' && n.mergedInto !== undefined) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'mergedInto', code: 'ONLY_WHEN_RETIRED' }] }));
  }
  const children = new Map<string, number>();
  for (const n of nodes) {
    // Walk the parent chain: at most MAX_DEPTH nodes, no repeats, every parent present.
    let hops = 1;
    let cursor: TreeNode = n;
    const seen = new Set<string>([n.id]);
    while (cursor.parentId !== undefined) {
      const parent = byId.get(cursor.parentId);
      if (!parent || seen.has(parent.id)) return err(treeInvalid());
      seen.add(parent.id);
      cursor = parent;
      hops += 1;
      if (hops > MAX_DEPTH) return err(treeInvalid());
    }
    if (n.depth !== hops) return err(treeInvalid());
    const parent = n.parentId === undefined ? undefined : byId.get(n.parentId);
    if (parent && parent.status === 'retired' && n.status !== 'retired') return err(treeInvalid());
    if (n.status === 'retired') {
      const target = n.mergedInto === undefined ? undefined : byId.get(n.mergedInto);
      if (!target || target.id === n.id || target.status === 'retired') return err(treeInvalid());
    } else {
      const slot = n.parentId ?? 'root';
      const count = (children.get(slot) ?? 0) + 1;
      if (count > MAX_CHILDREN) return err(treeInvalid());
      children.set(slot, count);
    }
  }
  return ok(undefined);
}

export function utf8Length(value: unknown): number {
  return new TextEncoder().encode(canonicalJson(value)).length;
}

/** Fields that define a category's meaning; provenance and bookkeeping are excluded. */
export function comparable(e: PackEntry | (StagedData & { id: string }) | (CategoryData & { id: string })): string {
  return canonicalJson({ key: e.key, parentId: e.parentId, depth: e.depth, names: e.names, restricted: e.restricted, restrictedReasonKey: e.restrictedReasonKey, status: e.status, mergedInto: e.mergedInto, sortOrder: e.sortOrder });
}
