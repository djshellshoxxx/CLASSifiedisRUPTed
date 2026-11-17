import { appError, canonicalJson, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, err, ok, timestamp, uuidv7, z,
  type CommandContext, type QueryContext, type ReadScope, type Result, type StoredRecord } from '@classrup/kernel';
import { assetSchema, chainSchema, currencyCodeSchema, currencyNameSchema, currencyStatusSchema, isVerifiedCurrencySnapshot, normalizeCurrencyAsset,
  type CurrencyAsset, type CurrencyChain, type VerifiedCurrencySnapshot } from './snapshot.ts';
export * from './snapshot.ts';

const MODULE = 'F09.S03.M01';
const HOUR = 3_600_000;
export const registryErrors = defineErrors({
  COMMERCE_CURRENCY_UNKNOWN: { status: 422, retryable: false }, COMMERCE_CURRENCY_EXISTS: { status: 409, retryable: false },
  COMMERCE_CURRENCY_IMMUTABLE: { status: 422, retryable: false }, COMMERCE_CURRENCY_DISABLED: { status: 422, retryable: false },
  COMMERCE_CURRENCY_CHAIN_UNSUPPORTED: { status: 422, retryable: false },
});
export const currencyDataSchema = z.strictObject({
  ...assetSchema.shape, status: currencyStatusSchema, snapshotVersion: z.iso.date().optional(),
}).superRefine((data, ctx) => {
  const { status: _status, snapshotVersion, ...asset } = data;
  if (!assetSchema.safeParse(asset).success || ((asset.kind === 'fiat') !== (snapshotVersion !== undefined))) ctx.addIssue({ code: 'custom', message: 'Invalid currency definition' });
});
export type CurrencyData = z.output<typeof currencyDataSchema>;
export const currencyRepo = defineRepo({ type: 'commerce.currency', schema: currencyDataSchema, indexes: { code: d => d.code, kind: d => d.kind, status: d => d.status } });
const seedSchema = z.strictObject({ version: z.iso.date(), digest: z.string().regex(/^[a-f0-9]{64}$/), signerDid: z.string().max(128), sourceUrl: z.string().max(512) });
export const currencySeedRepo = defineRepo({ type: 'commerce.currency_seed', schema: seedSchema, indexes: {} });
const counterRepo = defineRepo({ type: 'commerce.currency_counter', schema: z.strictObject({ startedAt: timestamp(), count: z.int().min(0).max(20) }), indexes: {} });
export const currencyDefSchema = z.strictObject({ ...currencyDataSchema.shape, id: uuidv7(), vaultId: uuidv7(), revision: z.int().min(1), createdAt: timestamp(), updatedAt: timestamp() }).superRefine((row, ctx) => {
  const { id: _id, vaultId: _vault, revision: _revision, createdAt: _created, updatedAt: _updated, ...data } = row;
  if (!currencyDataSchema.safeParse(data).success) ctx.addIssue({ code: 'custom', message: 'Invalid currency data' });
});
export type CurrencyDef = z.output<typeof currencyDefSchema>;
const present = (r: StoredRecord<CurrencyData>): CurrencyDef => currencyDefSchema.parse({ ...r.data, id: r.id, vaultId: r.tenantId, revision: r.revision, createdAt: r.createdAt, updatedAt: r.updatedAt });
const registered = defineEvent('commerce.currency.registered', 1, 'P0', z.strictObject({ currencyId: uuidv7(), code: currencyCodeSchema, kind: z.enum(['fiat', 'crypto']), decimals: z.int().min(0).max(36), chainId: chainSchema.optional() }));
const statusChanged = defineEvent('commerce.currency.status_changed', 1, 'P0', z.strictObject({ currencyId: uuidv7(), code: currencyCodeSchema, from: currencyStatusSchema, to: currencyStatusSchema }));

/** Every count comes from the same transaction; missing or incomplete ownership adapters must fail. */
export interface CurrencyUsagePort { openReferences(tx: ReadScope, code: string): Result<{ readonly offers: number; readonly deals: number; readonly quotes: number }> }
export interface CurrencyOptions {
  localPrincipal(): string;
  /** Canonical UUID vault scope; callers must not substitute the alpha principal-DID tenant slot. */
  readonly vaultId: string;
  readonly snapshot: VerifiedCurrencySnapshot;
  readonly configuredChains: readonly CurrencyChain[];
  readonly allowedCurrencies: readonly string[];
  readonly usage?: CurrencyUsagePort;
  /** Crypto registration is opt-in by the composition root, in addition to the kernel module flag. */
  cryptoEnabled(): boolean;
}
type Context = CommandContext | QueryContext;
function assetOf(data: CurrencyData): CurrencyAsset {
  const { status: _status, snapshotVersion: _snapshot, ...asset } = data; return asset;
}
const immutable = (a: CurrencyAsset, b: CurrencyAsset): boolean => a.code === b.code && a.kind === b.kind && a.decimals === b.decimals && a.chainId === b.chainId && a.contract === b.contract;
function byCode(tx: ReadScope, code: string): Result<StoredRecord<CurrencyData>> {
  const result = tx.repo(currencyRepo).query({ where: { code }, limit: 2 });
  if (!result.ok) return result;
  if (result.value.items.length > 1 || result.value.nextCursor) return err(appError('PRECONDITION_FAILED'));
  const row = result.value.items[0];
  return row ? ok(row) : err(registryErrors.make('COMMERCE_CURRENCY_UNKNOWN', { params: { code } }));
}

/** No cache: reads remain transaction-consistent even when change notifications are lost. */
export function resolveCurrency(tx: ReadScope, code: string, forNewUse = false): Result<CurrencyDef> {
  if (!currencyCodeSchema.safeParse(code).success) return err(appError('VALIDATION_FAILED'));
  if (!tx.repo(currencySeedRepo).get('seed')) return err(appError('DEPENDENCY_UNAVAILABLE'));
  const found = byCode(tx, code); if (!found.ok) return found;
  if (forNewUse && found.value.data.status !== 'active') return err(registryErrors.make('COMMERCE_CURRENCY_DISABLED', { params: { code } }));
  return ok(present(found.value));
}

/** Adapter to the currently supported precision/i18n range; metadata outside it stays readable. */
export function resolvePrecisionCurrency(tx: ReadScope, code: string, forNewUse = false): Result<CurrencyDef> {
  const result = resolveCurrency(tx, code, forNewUse);
  if (!result.ok) return result;
  return result.value.decimals <= 18 && /^[A-Z][A-Z0-9]{2,9}$/.test(result.value.code)
    ? result : err(appError('PRECONDITION_FAILED', { params: { reason: 'unsupported_precision_currency' } }));
}

/** Factory rejects forged/unsigned snapshots before exposing any mutation definitions. */
export function currencyDefinitions(options: CurrencyOptions) {
  if (!isVerifiedCurrencySnapshot(options.snapshot)) throw new TypeError('A verified currency snapshot is required');
  const snapshot = options.snapshot;
  const vaultId = uuidv7().parse(options.vaultId);
  const chains = [...new Set(options.configuredChains)];
  if (chains.some(chain => !chainSchema.safeParse(chain).success)) throw new TypeError('Unsupported configured currency chain');
  const allowed = new Set(options.allowedCurrencies);
  if (allowed.size !== options.allowedCurrencies.length || [...allowed].some(code => !snapshot.payload.assets.some(a => a.code === code))) throw new TypeError('Allowed currencies must be present in the snapshot');
  for (const asset of snapshot.payload.assets) if (allowed.has(asset.code) && !normalizeCurrencyAsset(asset, chains)) throw new TypeError('An allowed currency requires a configured chain');
  const referenceAssets = new Map(snapshot.payload.assets.map(a => [a.code, a]));
  const fiat = new Map(snapshot.payload.assets.filter(a => a.kind === 'fiat').map(a => [a.code, a]));
  const local = (ctx: Context) => ctx.actor.kind === 'user' && ctx.actor.id === options.localPrincipal() && ctx.tenantId === vaultId;
  const ready = (tx: ReadScope) => {
    const seed = tx.repo(currencySeedRepo).get('seed');
    return seed && seed.data.digest === snapshot.digest && seed.data.signerDid === snapshot.signerDid;
  };

  /** Called inside the composition root's authenticated initialization transaction. Never a network operation. */
  function seed(ctx: CommandContext): Result<{ seeded: boolean; count: number }> {
    if (!local(ctx)) return err(appError('FORBIDDEN'));
    const state = ctx.tx.repo(currencySeedRepo).get('seed');
    if (state) return ready(ctx.tx) ? ok({ seeded: false, count: snapshot.payload.assets.length }) : err(appError('PRECONDITION_FAILED'));
    const existing = ctx.tx.repo(currencyRepo).query({ limit: 1 });
    if (!existing.ok) return existing;
    if (existing.value.items.length) return err(appError('PRECONDITION_FAILED'));
    for (const asset of snapshot.payload.assets) {
      const row = ctx.tx.repo(currencyRepo).put(ctx.ids.next(), { ...asset, status: allowed.has(asset.code) ? 'active' : 'disabled', ...(asset.kind === 'fiat' ? { snapshotVersion: snapshot.payload.version } : {}) }, { expectedRevision: 0 });
      if (!row.ok) return row;
    }
    const written = ctx.tx.repo(currencySeedRepo).put('seed', { version: snapshot.payload.version, digest: snapshot.digest, signerDid: snapshot.signerDid, sourceUrl: snapshot.payload.sourceUrl }, { expectedRevision: 0 });
    return written.ok ? ok({ seeded: true, count: snapshot.payload.assets.length }) : written;
  }
  const register = defineCommand({ name: 'commerce.currency.register', module: MODULE, capability: 'commerce.currency.register', idempotent: true,
    input: z.strictObject({ code: currencyCodeSchema, kind: z.literal('crypto'), name: currencyNameSchema, decimals: z.int().min(0).max(36), chainId: z.string().max(80), contract: z.string().max(42).optional(), confirmed: z.literal(true) }),
    handler(ctx, input) {
      if (!local(ctx)) return err(appError('FORBIDDEN'));
      if (!ready(ctx.tx)) return err(appError('DEPENDENCY_UNAVAILABLE'));
      if (!options.cryptoEnabled()) return err(appError('FEATURE_DISABLED'));
      if (fiat.has(input.code)) return err(registryErrors.make('COMMERCE_CURRENCY_EXISTS'));
      const parsed = assetSchema.safeParse(inputWithNoConfirmation(input));
      const asset = parsed.success ? normalizeCurrencyAsset(parsed.data, chains) : undefined;
      if (!asset) return err(registryErrors.make('COMMERCE_CURRENCY_CHAIN_UNSUPPORTED'));
      const found = byCode(ctx.tx, input.code);
      if (found.ok) return err(registryErrors.make('COMMERCE_CURRENCY_EXISTS'));
      if (found.error.code !== 'COMMERCE_CURRENCY_UNKNOWN') return found;
      const counter = ctx.tx.repo(counterRepo).get('register');
      const resets = !counter || ctx.clock.now() - Date.parse(counter.data.startedAt) >= HOUR;
      const count = resets ? 0 : counter.data.count;
      if (count >= 20) return err(appError('RATE_LIMITED', { retryAfterMs: HOUR }));
      const limit = ctx.tx.repo(counterRepo).put('register', { startedAt: resets ? new Date(ctx.clock.now()).toISOString() : counter.data.startedAt, count: count + 1 }, { expectedRevision: counter?.revision ?? 0 });
      if (!limit.ok) return limit;
      const row = ctx.tx.repo(currencyRepo).put(ctx.ids.next(), { ...asset, status: 'active' }, { expectedRevision: 0 });
      if (!row.ok) return row;
      ctx.emit(registered, { aggregate: { type: 'currency', id: row.value.id }, revision: 1, payload: { currencyId: uuidv7().parse(row.value.id), code: asset.code, kind: asset.kind, decimals: asset.decimals, ...(asset.chainId ? { chainId: asset.chainId } : {}) } });
      return ok({ currencyId: row.value.id, revision: 1 });
    },
  });
  const setStatus = defineCommand({ name: 'commerce.currency.set_status', module: MODULE, capability: 'commerce.currency.set_status', idempotent: true,
    input: z.strictObject({ currencyId: uuidv7(), status: currencyStatusSchema, expectedRevision: z.int().min(1) }),
    handler(ctx, input) {
      if (!local(ctx)) return err(appError('FORBIDDEN'));
      if (!ready(ctx.tx)) return err(appError('DEPENDENCY_UNAVAILABLE'));
      const repo = ctx.tx.repo(currencyRepo), row = repo.get(input.currencyId);
      if (!row) return err(appError('NOT_FOUND'));
      if (row.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      if (row.data.status === input.status) return ok({ currencyId: row.id, revision: row.revision, status: row.data.status });
      if (row.data.status === 'retired' || (input.status === 'retired' && row.data.status !== 'disabled')) return err(appError('CONFLICT_STATE'));
      if (input.status === 'active' && !normalizeCurrencyAsset(assetOf(row.data), chains)) return err(registryErrors.make('COMMERCE_CURRENCY_CHAIN_UNSUPPORTED'));
      if (input.status === 'retired') {
        if (!options.usage) return err(appError('DEPENDENCY_UNAVAILABLE'));
        const usage = options.usage.openReferences(ctx.tx, row.data.code);
        if (!usage.ok) return usage;
        const counts = [usage.value.offers, usage.value.deals, usage.value.quotes];
        if (counts.some(n => !Number.isSafeInteger(n) || n < 0)) return err(appError('DEPENDENCY_UNAVAILABLE'));
        if (counts.some(n => n > 0)) return err(appError('PRECONDITION_FAILED'));
      }
      const saved = repo.put(row.id, { ...row.data, status: input.status }, { expectedRevision: row.revision });
      if (!saved.ok) return saved;
      ctx.emit(statusChanged, { aggregate: { type: 'currency', id: row.id }, revision: saved.value.revision, payload: { currencyId: uuidv7().parse(row.id), code: row.data.code, from: row.data.status, to: input.status } });
      return ok({ currencyId: row.id, revision: saved.value.revision, status: input.status });
    },
  });
  const get = defineQuery({ name: 'commerce.currency.get', module: MODULE, capability: 'commerce.currency.read', input: z.strictObject({ code: currencyCodeSchema }),
    handler(ctx, input) { return !local(ctx) ? err(appError('FORBIDDEN')) : !ready(ctx.tx) ? err(appError('DEPENDENCY_UNAVAILABLE')) : resolveCurrency(ctx.tx, input.code); },
  });
  const list = defineQuery({ name: 'commerce.currency.list', module: MODULE, capability: 'commerce.currency.read',
    input: z.strictObject({ status: z.enum(['active', 'disabled', 'retired', 'all']).default('active'), kind: z.enum(['fiat', 'crypto']).optional(), cursor: z.string().max(512).optional(), limit: z.int().min(1).max(200).default(50) }),
    handler(ctx, input) {
      if (!local(ctx)) return err(appError('FORBIDDEN'));
      if (!ready(ctx.tx)) return err(appError('DEPENDENCY_UNAVAILABLE'));
      const page = ctx.tx.repo(currencyRepo).query({ where: { ...(input.status === 'all' ? {} : { status: input.status }), ...(input.kind ? { kind: input.kind } : {}) }, orderBy: 'code', cursor: input.cursor, limit: input.limit });
      return page.ok ? ok({ items: page.value.items.map(present), ...(page.value.nextCursor ? { nextCursor: page.value.nextCursor } : {}) }) : page;
    },
  });

  /** Validates a complete configuration section before the caller starts an atomic restore. No writes occur here. */
  function validateImport(current: readonly CurrencyDef[], input: unknown): Result<CurrencyDef[]> {
    const parsed = z.array(currencyDefSchema).max(2000).safeParse(input);
    if (!parsed.success) return err(appError('VALIDATION_FAILED'));
    // An authenticated cross-vault remapping adapter does not exist yet.
    if (parsed.data.some(row => row.vaultId !== vaultId) || current.some(row => row.vaultId !== vaultId)) return err(appError('FORBIDDEN'));
    const codes = new Set<string>(), ids = new Set<string>();
    for (const row of parsed.data) {
      const { id: _id, vaultId: _vault, revision: _revision, createdAt: _created, updatedAt: _updated, status: _status, snapshotVersion: _snapshot, ...asset } = row;
      const canonical = normalizeCurrencyAsset(asset, ['bitcoin-mainnet', 'ethereum-mainnet']);
      const data = currencyDataSchema.safeParse({ ...asset, status: row.status, ...(row.snapshotVersion ? { snapshotVersion: row.snapshotVersion } : {}) });
      if (!data.success) return err(appError('VALIDATION_FAILED'));
      if (!canonical || canonicalJson(canonical) !== canonicalJson(asset) || codes.has(row.code) || ids.has(row.id) || Date.parse(row.updatedAt) < Date.parse(row.createdAt)) return err(appError('VALIDATION_FAILED'));
      // Disabled historical bindings remain readable, but importing a row must not
      // enable a chain that normal registration/status commands cannot enable.
      if (row.status === 'active' && !normalizeCurrencyAsset(asset, chains)) return err(registryErrors.make('COMMERCE_CURRENCY_CHAIN_UNSUPPORTED'));
      const reference = referenceAssets.get(row.code);
      if ((reference && !immutable(reference, row)) || (row.kind === 'fiat' && (!reference || row.snapshotVersion !== snapshot.payload.version))) return err(registryErrors.make('COMMERCE_CURRENCY_IMMUTABLE'));
      const existing = current.find(c => c.code === row.code || c.id === row.id);
      if (existing && (!immutable(existing, row) || existing.id !== row.id || (existing.status === 'retired' && row.status !== 'retired'))) return err(registryErrors.make('COMMERCE_CURRENCY_IMMUTABLE'));
      // This preflight cannot authorize status changes to existing obligations. Preserve existing rows exactly.
      if (existing && canonicalJson(existing) !== canonicalJson(row)) return err(appError('CONFLICT_REVISION'));
      codes.add(row.code); ids.add(row.id);
    }
    // A complete-section restore may not forget established codes and thereby allow their reuse.
    if (snapshot.payload.assets.some(asset => !codes.has(asset.code)) || current.some(row => !codes.has(row.code))) return err(registryErrors.make('COMMERCE_CURRENCY_IMMUTABLE'));
    return ok(parsed.data);
  }
  return { all: [register, setStatus, get, list], register, setStatus, get, list, seed, validateImport };
}
function inputWithNoConfirmation(input: { confirmed: true } & Record<string, unknown>): Record<string, unknown> {
  const { confirmed: _confirmed, ...asset } = input;
  return asset;
}
