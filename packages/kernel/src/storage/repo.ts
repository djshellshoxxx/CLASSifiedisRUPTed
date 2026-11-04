// Typed repositories over the generic records table: get, put(expectedRevision), remove, query by indexes.
import type * as z from 'zod';
import { appError, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';
import { decodeText, encodeText } from './base64url.ts';
import type { FilterOp, IndexSlot, IndexValues, RecordFilter } from './driver.ts';
import type { StoredRecord, Tx } from './tx.ts';

export type IndexFn<T> = (data: T) => string | null | undefined;

export interface RepoDef<T, K extends string = string> {
  readonly type: string;
  readonly schema: z.ZodType<T>;
  readonly indexes: Readonly<Record<K, IndexFn<T>>>;
  readonly slots: Readonly<Record<K, IndexSlot>>;
}

const TYPE_RE = /^[a-z0-9]+\.[a-z0-9_]+$/;

/**
 * Declares a record type `<slug>.<entity>` with up to four indexed fields. Index slots follow key
 * order; append new indexes, never reorder (stored rows keep their slot).
 */
export function defineRepo<S extends z.ZodType, const K extends string = never>(def: {
  readonly type: string;
  readonly schema: S;
  readonly indexes?: { readonly [P in K]: IndexFn<z.output<S>> };
}): RepoDef<z.output<S>, K> {
  if (!TYPE_RE.test(def.type)) throw new Error(`defineRepo: type ${def.type} must be <slug>.<entity>`);
  const indexes = (def.indexes ?? {}) as Record<K, IndexFn<z.output<S>>>;
  const names = Object.keys(indexes) as K[];
  if (names.length > 4) throw new Error(`defineRepo: ${def.type} declares more than 4 indexes`);
  const slots = Object.fromEntries(names.map((n, i) => [n, (i + 1) as IndexSlot])) as Record<K, IndexSlot>;
  return Object.freeze({ type: def.type, schema: def.schema as z.ZodType<z.output<S>>, indexes, slots });
}

export interface Range {
  readonly lt?: string;
  readonly lte?: string;
  readonly gt?: string;
  readonly gte?: string;
}

export interface RepoQuery<K extends string> {
  readonly where?: Partial<Readonly<Record<K, string | Range>>>;
  readonly orderBy?: K | 'id';
  readonly dir?: 'asc' | 'desc';
  readonly cursor?: string;
  /** 1..500, default 50. */
  readonly limit?: number;
}

export interface Page<T> {
  readonly items: readonly StoredRecord<T>[];
  readonly nextCursor?: string;
}

export interface ReadRepo<T, K extends string> {
  get(id: string): StoredRecord<T> | undefined;
  require(id: string): Result<StoredRecord<T>, AppError>;
  query(q?: RepoQuery<K>): Result<Page<T>, AppError>;
}

export interface Repo<T, K extends string> extends ReadRepo<T, K> {
  /** expectedRevision 0 creates; otherwise must equal the stored revision (CONFLICT_REVISION). */
  put(id: string, data: T, opts: { readonly expectedRevision: number }): Result<StoredRecord<T>, AppError>;
  remove(id: string, opts: { readonly expectedRevision: number }): Result<void, AppError>;
  /** Import/restore of an exported record into this tenant, keeping its revision (IOX-2). */
  restore(record: StoredRecord<T>): Result<'restored' | 'identical', AppError>;
}

const OPS: readonly (keyof Range)[] = ['lt', 'lte', 'gt', 'gte'];
const MAX_LIMIT = 500;

function invalid(path: string, code: string): AppError {
  return appError('VALIDATION_FAILED', { fields: [{ path, code }] });
}

function filtersOf<T, K extends string>(def: RepoDef<T, K>, where: RepoQuery<K>['where']): Result<RecordFilter[], AppError> {
  const out: RecordFilter[] = [];
  for (const [name, cond] of Object.entries(where ?? {}) as [K, string | Range | undefined][]) {
    const slot = def.slots[name];
    if (slot === undefined) return err(invalid(`where.${name}`, 'UNKNOWN_INDEX'));
    if (cond === undefined) continue;
    if (typeof cond === 'string') out.push({ slot, op: 'eq', value: cond });
    else for (const op of OPS) if (cond[op] !== undefined) out.push({ slot, op: op as FilterOp, value: cond[op] as string });
  }
  return ok(out);
}

function decodeCursor(cursor: string | undefined): Result<{ value: string | null; id: string } | undefined, AppError> {
  if (cursor === undefined) return ok(undefined);
  const text = decodeText(cursor);
  try {
    const v = JSON.parse(text ?? '') as unknown;
    if (Array.isArray(v) && v.length === 2 && (typeof v[0] === 'string' || v[0] === null) && typeof v[1] === 'string') return ok({ value: v[0] as string | null, id: v[1] });
  } catch {
    // fall through to the validation error
  }
  return err(invalid('cursor', 'INVALID_CURSOR'));
}

function indexValues<T, K extends string>(def: RepoDef<T, K>, data: T): IndexValues {
  const v: [string | null, string | null, string | null, string | null] = [null, null, null, null];
  for (const name of Object.keys(def.slots) as K[]) v[def.slots[name] - 1] = def.indexes[name](data) ?? null;
  return v;
}

export interface RepoScope {
  readonly tx: Tx;
  readonly tenantId: string;
  readonly now: () => number;
}

function runQuery<T, K extends string>(s: RepoScope, def: RepoDef<T, K>, q: RepoQuery<K>): Result<Page<T>, AppError> {
  const limit = q.limit ?? 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return err(invalid('limit', 'OUT_OF_RANGE'));
  const orderSlot = q.orderBy === undefined || q.orderBy === 'id' ? 0 : def.slots[q.orderBy];
  if (orderSlot === undefined) return err(invalid('orderBy', 'UNKNOWN_INDEX'));
  const filters = filtersOf(def, q.where);
  if (!filters.ok) return filters;
  const after = decodeCursor(q.cursor);
  if (!after.ok) return after;
  if (after.value && orderSlot !== 0 && after.value.value === null) return err(invalid('cursor', 'INVALID_CURSOR'));
  const rows = s.tx.records.query<T>({ tenant: s.tenantId, type: def.type, filters: filters.value, orderSlot, dir: q.dir ?? 'asc', limit: limit + 1, ...(after.value ? { after: after.value } : {}) });
  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  if (rows.length <= limit || !last) return ok({ items });
  const value = orderSlot === 0 ? null : (indexValues(def, last.data)[orderSlot - 1] ?? null);
  return ok({ items, nextCursor: encodeText(JSON.stringify([value, last.id])) });
}

export function readRepo<T, K extends string>(s: RepoScope, def: RepoDef<T, K>): ReadRepo<T, K> {
  const get = (id: string) => s.tx.records.get<T>(s.tenantId, def.type, id);
  return {
    get,
    require: (id) => {
      const r = get(id);
      return r ? ok(r) : err(appError('NOT_FOUND'));
    },
    query: (q = {}) => runQuery(s, def, q),
  };
}

export function writeRepo<T, K extends string>(s: RepoScope, def: RepoDef<T, K>): Repo<T, K> {
  return {
    ...readRepo(s, def),
    put: (id, data, opts) => {
      const parsed = def.schema.safeParse(data);
      if (!parsed.success) throw new Error(`repo ${def.type}: data does not match its schema`);
      return s.tx.records.put<T>({ tenant: s.tenantId, type: def.type, id, data: parsed.data, idx: indexValues(def, parsed.data), expectedRevision: opts.expectedRevision, now: s.now() });
    },
    remove: (id, opts) => s.tx.records.remove(s.tenantId, def.type, id, opts.expectedRevision),
    restore: (record) => {
      const parsed = def.schema.safeParse(record.data);
      if (!parsed.success) return err(invalid('data', 'SCHEMA_MISMATCH'));
      return s.tx.records.restore({ ...record, tenantId: s.tenantId, type: def.type, data: parsed.data }, indexValues(def, parsed.data));
    },
  };
}
