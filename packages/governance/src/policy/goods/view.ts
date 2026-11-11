// Read-side helpers for the taxonomy mirror: resolve (alias + path), an in-memory view and the
// synchronous adapter the composition root passes to bazaarDefinitions as `categoryAllowed`.
import type { ReadRepo, ReadScope } from '@classrup/kernel';
import { categoryRepo, stateRepo, VAULT_STATE_ID, type CategoryData, type CategoryStatus } from './model.ts';

export interface CategoryNode {
  readonly id: string;
  readonly publisherId: string;
  readonly key: string;
  readonly parentId?: string | undefined;
  readonly depth: number;
  readonly names: Readonly<Record<string, string>>;
  readonly restricted: boolean;
  readonly restrictedReasonKey?: string | undefined;
  readonly status: CategoryStatus;
  readonly mergedInto?: string | undefined;
  readonly sortOrder: number;
}
export interface ResolvedCategory {
  readonly categoryId: string;
  readonly resolvedId: string;
  /** Root to resolved category, uuidv7 ids. */
  readonly path: readonly string[];
  /** True when the resolved category or any ancestor carries the restricted flag. */
  readonly restricted: boolean;
}
export interface TaxonomyView {
  get(id: string): CategoryNode | undefined;
  resolve(id: string): ResolvedCategory | undefined;
  /** Active category of the active publisher: deprecated and retired categories are hidden for new listings. */
  allowedForNewListing(id: string): boolean;
  readonly activePublisherId: string | undefined;
  readonly size: number;
}

const MAX_HOPS = 8;

export function resolveIn(get: (id: string) => CategoryNode | undefined, id: string): ResolvedCategory | undefined {
  let node = get(id);
  let hops = 0;
  while (node && node.status === 'retired') {
    if (node.mergedInto === undefined || ++hops > MAX_HOPS) return undefined;
    node = get(node.mergedInto);
  }
  if (!node) return undefined;
  const path: string[] = [];
  let restricted = false;
  let cursor: CategoryNode | undefined = node;
  while (cursor && path.length < MAX_HOPS) {
    path.unshift(cursor.id);
    restricted ||= cursor.restricted;
    cursor = cursor.parentId === undefined ? undefined : get(cursor.parentId);
  }
  return { categoryId: id, resolvedId: node.id, path, restricted };
}

export function buildTaxonomyView(nodes: readonly CategoryNode[], activePublisherId?: string): TaxonomyView {
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const get = (id: string) => byId.get(id);
  return {
    get,
    resolve: (id) => resolveIn(get, id),
    allowedForNewListing: (id) => {
      const n = byId.get(id);
      return n !== undefined && n.status === 'active' && n.publisherId === activePublisherId;
    },
    activePublisherId,
    size: byId.size,
  };
}

/** Pages through every record of a repo query; bounded by the storage page size, not by a guess. */
export function collectAll<T, K extends string>(repo: ReadRepo<T, K>, where?: Partial<Record<K, string>>): { readonly id: string; readonly revision: number; readonly data: T }[] {
  const out: { id: string; revision: number; data: T }[] = [];
  let cursor: string | undefined;
  do {
    const page = repo.query({ limit: 500, ...(where ? { where } : {}), ...(cursor ? { cursor } : {}) });
    if (!page.ok) throw new Error('invalid repo query');
    for (const r of page.value.items) out.push({ id: r.id, revision: r.revision, data: r.data });
    cursor = page.value.nextCursor;
  } while (cursor);
  return out;
}

export const nodeOf = (id: string, d: CategoryData): CategoryNode => ({
  id, publisherId: d.publisherId, key: d.key, parentId: d.parentId, depth: d.depth, names: d.names, restricted: d.restricted,
  restrictedReasonKey: d.restrictedReasonKey, status: d.status, mergedInto: d.mergedInto, sortOrder: d.sortOrder,
});

export function activePublisherOf(tx: ReadScope): string | undefined {
  return tx.repo(stateRepo).get(VAULT_STATE_ID)?.data.activePublisherId;
}

/** Snapshot of the whole mirror (all publishers); the composition root caches it between category events. */
export function readTaxonomyView(tx: ReadScope): TaxonomyView {
  const nodes = collectAll(tx.repo(categoryRepo)).map((r) => nodeOf(r.id, r.data));
  return buildTaxonomyView(nodes, activePublisherOf(tx));
}

/**
 * The `(categoryId) => boolean` adapter for BazaarOptions.categoryAllowed. Fails closed: with no
 * taxonomy applied (or no view) nothing is allowed.
 */
export function categoryAllowedFrom(getView: () => TaxonomyView | undefined): (categoryId: string) => boolean {
  return (categoryId) => getView()?.allowedForNewListing(categoryId) ?? false;
}

/** Best language match for a name: exact locale, language part, then the required English name. */
export function pickName(names: Readonly<Record<string, string>>, locale?: string): string {
  if (locale) {
    const exact = names[locale];
    if (exact !== undefined) return exact;
    const lang = locale.split('-')[0] ?? locale;
    const byLang = names[lang] ?? Object.entries(names).find(([k]) => k.split('-')[0] === lang)?.[1];
    if (byLang !== undefined) return byLang;
  }
  return names['en'] ?? Object.values(names)[0] ?? '';
}
