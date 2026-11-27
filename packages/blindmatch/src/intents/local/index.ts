import { appError, defineRepo, err, ok, timestamp, uuidv7, z,
  type AppError, type Clock, type RepoDef, type Result, type Storage, type StoredRecord, type Tx } from '@classrup/kernel';

const opaqueId = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
const amount = z.string().max(78).regex(/^(0|[1-9][0-9]{0,77})$/);
const ordered = (min: string, max: string): boolean => min.length < max.length || (min.length === max.length && min <= max);
const price = z.strictObject({ currency: z.string().regex(/^[A-Z][A-Z0-9]{2,9}$/), min: amount.optional(), max: amount.optional() })
  .refine(value => value.min === undefined || value.max === undefined || ordered(value.min, value.max));

/** Local preferences only: this schema grants no publication, peer access or remote processing. */
export const privateIntentCriteriaSchema = z.strictObject({
  query: z.string().max(120).refine(value => value.length <= 120 && value === value.normalize('NFC') && !/[\p{Cc}\p{Cf}]/u.test(value)).default(''),
  categoryId: uuidv7().optional(), kind: z.enum(['sell', 'wanted', 'giveaway']).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor', 'for_parts']).optional(),
  regionCell: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}$/).optional(), price: price.optional(),
});
export type PrivateIntentCriteria = z.output<typeof privateIntentCriteriaSchema>;
export const privateIntentSchema = z.strictObject({
  intentId: opaqueId, ownerId: z.string().startsWith('did:key:').max(128),
  state: z.enum(['draft', 'active', 'paused']), expiresAt: timestamp(), criteria: privateIntentCriteriaSchema,
});
export type PrivateIntent = z.output<typeof privateIntentSchema>;
export const privateIntentRepo = defineRepo({ type: 'blindmatch.private_intent', schema: privateIntentSchema,
  indexes: { owner: data => data.ownerId } });

export const MAX_LOCAL_INTENTS = 50;
const revision = z.int().min(1).max(Number.MAX_SAFE_INTEGER);
const content = z.strictObject({ criteria: privateIntentCriteriaSchema, expiresAt: timestamp() });
const revisionInput = z.strictObject({ id: opaqueId, expectedRevision: revision });
const reviseInput = z.strictObject({ ...revisionInput.shape, ...content.shape });
const stateInput = z.strictObject({ ...revisionInput.shape, state: z.enum(['active', 'paused']) });
type Row = StoredRecord<PrivateIntent>;
type Outcome<T> = Promise<Result<T, AppError>>;

export interface LocalIntentStore {
  create(input: unknown): Outcome<Row>;
  read(id: unknown): Outcome<Row>;
  list(): Outcome<readonly Row[]>;
  revise(input: unknown): Outcome<Row>;
  setState(input: unknown): Outcome<Row>;
  erase(input: unknown): Outcome<void>;
  /** Ephemeral cancellation token, not a deleted-object registry. Compare identity at result admission. */
  epoch(): object;
}

export interface LocalIntentStoreOptions {
  /** Inject the unlocked owner's encrypted vault storage; this module does not encrypt a raw adapter. */
  readonly storage: Storage;
  readonly principal: string;
  readonly clock: Clock;
  readonly randomId?: () => string;
  readonly isCurrent: () => boolean;
  readonly enabled?: boolean;
}

function parsed<T>(schema: z.ZodType<T>, value: unknown): Result<T, AppError> {
  try { const result = schema.safeParse(value); return result.success ? ok(result.data) : err(appError('VALIDATION_FAILED')); }
  catch { return err(appError('VALIDATION_FAILED')); }
}

/**
 * Disabled-by-default foundation. Only current intent rows persist: no command-bus idempotency,
 * events, audit records, telemetry, retained results, deleted IDs or automatic public withdrawals.
 * Erasure covers this module's local rows only. Other domains and external copies are not erased.
 */
export function createLocalIntentStore(options: LocalIntentStoreOptions): LocalIntentStore {
  const { storage, principal, clock, isCurrent } = options;
  const enabled = options.enabled === true;
  const randomId = options.randomId ?? (() => crypto.randomUUID());
  let token: object = Object.freeze({});
  let revoked = false;
  const invalidate = () => { token = Object.freeze({}); };
  function gate(requireEnabled: boolean): Result<number, AppError> {
    try {
      if (revoked || !isCurrent()) {
        if (!revoked) invalidate();
        revoked = true;
        return err(appError('FORBIDDEN'));
      }
      if (!privateIntentSchema.shape.ownerId.safeParse(principal).success) return err(appError('FORBIDDEN'));
      const now = clock.now();
      if (!Number.isSafeInteger(now) || now < 0 || now > 253402300799999) return err(appError('PRECONDITION_FAILED'));
      return requireEnabled && !enabled ? err(appError('FEATURE_DISABLED')) : ok(now);
    } catch { revoked = true; invalidate(); return err(appError('FORBIDDEN')); }
  }
  function owned(tx: Tx, id: string): Result<Row, AppError> {
    const row = tx.records.get<PrivateIntent>(principal, privateIntentRepo.type, id);
    if (!row) return err(appError('NOT_FOUND'));
    const data = parsed(privateIntentSchema, row.data);
    if (!data.ok || data.value.ownerId !== principal || data.value.intentId !== id) return err(appError('NOT_FOUND'));
    return ok({ ...row, data: data.value });
  }
  function rows(tx: Tx): Result<readonly Row[], AppError> {
    const found = tx.records.query<PrivateIntent>({ tenant: principal, type: privateIntentRepo.type,
      filters: [], orderSlot: 0, dir: 'asc', limit: MAX_LOCAL_INTENTS + 1 });
    if (found.length > MAX_LOCAL_INTENTS) return err(appError('PRECONDITION_FAILED'));
    const output: Row[] = [];
    for (const row of found) { const item = owned(tx, row.id); if (!item.ok) return item; output.push(item.value); }
    return ok(output);
  }
  function put(tx: Tx, data: PrivateIntent, expectedRevision: number, now: number): Result<Row, AppError> {
    return tx.records.put({ tenant: principal, type: privateIntentRepo.type, id: data.intentId, data,
      idx: [principal, null, null, null], expectedRevision, now });
  }
  async function run<T>(write: boolean, requireEnabled: boolean,
    work: (tx: Tx, now: number) => Result<T, AppError>): Outcome<T> {
    const before = gate(requireEnabled); if (!before.ok) return before;
    // Invalidate pending results before destructive work, even when a later write fails.
    if (write) invalidate();
    try {
      const result = await storage.transaction(tx => {
        const current = gate(requireEnabled); if (!current.ok) return current;
        const out = work(tx, current.value);
        const final = gate(requireEnabled);
        return final.ok ? out : final;
      }, { mode: write ? 'write' : 'read' });
      const after = gate(requireEnabled);
      return after.ok ? result : after;
    } catch {
      const after = gate(requireEnabled);
      return after.ok ? err(appError('INTERNAL')) : after;
    }
  }
  return {
    epoch() { gate(false); return token; },
    async create(input) {
      const value = parsed(content, input); if (!value.ok) return value;
      return run(true, true, (tx, now) => {
        if (Date.parse(value.value.expiresAt) <= now) return err(appError('EXPIRED'));
        const existing = rows(tx); if (!existing.ok) return existing;
        if (existing.value.length >= MAX_LOCAL_INTENTS) return err(appError('PRECONDITION_FAILED'));
        const id = parsed(opaqueId, randomId()); if (!id.ok) return id;
        return put(tx, { ...value.value, ownerId: principal, intentId: id.value, state: 'draft' }, 0, now);
      });
    },
    async read(id) {
      const value = parsed(opaqueId, id); if (!value.ok) return value;
      return run(false, false, tx => owned(tx, value.value));
    },
    list: () => run(false, false, rows),
    async revise(input) {
      const value = parsed(reviseInput, input); if (!value.ok) return value;
      return run(true, true, (tx, now) => {
        const { id, expectedRevision, criteria, expiresAt } = value.value;
        const found = owned(tx, id); if (!found.ok) return found;
        if (found.value.revision !== expectedRevision) return err(appError('CONFLICT_REVISION'));
        if (Date.parse(expiresAt) <= now) return err(appError('EXPIRED'));
        return put(tx, { ...found.value.data, criteria, expiresAt, state: 'draft' }, expectedRevision, now);
      });
    },
    async setState(input) {
      const value = parsed(stateInput, input); if (!value.ok) return value;
      return run(true, value.value.state === 'active', (tx, now) => {
        const { id, expectedRevision, state } = value.value;
        const found = owned(tx, id); if (!found.ok) return found;
        if (found.value.revision !== expectedRevision) return err(appError('CONFLICT_REVISION'));
        if (state === 'active' && Date.parse(found.value.data.expiresAt) <= now) return err(appError('EXPIRED'));
        return put(tx, { ...found.value.data, state }, expectedRevision, now);
      });
    },
    async erase(input) {
      const value = parsed(revisionInput, input); if (!value.ok) return value;
      return run(true, false, tx => {
        const { id, expectedRevision } = value.value;
        const found = owned(tx, id); if (!found.ok) return found;
        return tx.records.remove(principal, privateIntentRepo.type, id, expectedRevision);
      });
    },
  };
}

interface Codec {
  readonly type: string; parse(input: unknown): unknown;
  indexes(input: unknown): readonly [string | null, string | null, string | null, string | null];
  recordId?(input: unknown): string; restoreData?(input: unknown, principal: string): Promise<unknown>;
}
/** Backup content is not processing authority; restore always returns a draft. */
export function privateIntentBackupCodecs(factory: <T, K extends string>(repo: RepoDef<T, K>) => Codec): readonly Codec[] {
  return [{ ...factory(privateIntentRepo),
    recordId(input) { return privateIntentSchema.parse(input).intentId; },
    async restoreData(input, principal) {
      const data = privateIntentSchema.parse(input);
      if (data.ownerId !== principal) throw new Error('Private intent backup belongs to another principal');
      return { ...data, state: 'draft' };
    },
  }];
}
