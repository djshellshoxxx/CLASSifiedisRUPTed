// F06.S03.M01 Relevance ranking: RankingConfig versions (relay-published, bundled default in the vault) and pure scoring.
// ADR-0016: the vault always ranks with the bundled default; a relay config is relay-local policy, published as a signed
// statement, and is never applied to a vault's own local ranking.
import { appError, canonicalJson, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, err, ok, timestamp, uuidv7, z, type AppError, type CommandContext, type Result, type SignedEnvelope } from '@classrup/kernel';
import type { VerifiedStatement } from '../../search/index.ts';
import { DEFAULT_RANKING_PARAMS, distanceNonIncreasing, rankingParamsShape, rankingParamsSchema, reasonNoteSchema, weightsSumToOne, type RankingParams, type ScoringConfig } from './scoring.ts';

export * from './scoring.ts';

export const rankingErrors = defineErrors({ RANKING_CONFIG_INVALID: { status: 422, retryable: false } });
export const RANKING_CONFIG_STATEMENT_TYPE = 'classrup.discovery.ranking_config/v1';
export const BUNDLED_CONFIG_ID = '00000000-0000-7000-8000-000000000001';
export const BUNDLED_ACTIVATED_AT = '1970-01-01T00:00:00.000Z';
export const MAX_PUBLICATIONS_PER_24H = 10;
export const MAX_HISTORY = 20;
const DAY_MS = 86_400_000;

export const rankingConfigSchema = z.strictObject({
  tenantId: z.string(), version: z.int().min(1), origin: z.enum(['bundled', 'relay_published']), relayId: z.string().max(200).optional(),
  ...rankingParamsShape,
  reasonNote: reasonNoteSchema.optional(), statementCid: z.string().max(200).optional(),
  status: z.enum(['active', 'retired']), activatedAt: timestamp(), retiredAt: timestamp().optional(), createdAt: timestamp(), updatedAt: timestamp(),
}).refine(weightsSumToOne).refine(distanceNonIncreasing);
export type RankingConfig = z.output<typeof rankingConfigSchema>;
const pad = (n: number): string => String(n).padStart(10, '0');
export const rankingConfigRepo = defineRepo({ type: 'discovery.ranking_config', schema: rankingConfigSchema,
  indexes: { version: d => pad(d.version), status: d => d.status, activatedAt: d => d.activatedAt } });
const statementRecordSchema = z.strictObject({ envelope: z.custom<SignedEnvelope>(v => typeof v === 'object' && v !== null), version: z.int().min(1) });
export const rankingStatementRepo = defineRepo({ type: 'discovery.ranking_config_statement', schema: statementRecordSchema, indexes: { version: d => pad(d.version) } });

export const rankingStatementPayloadSchema = z.strictObject({
  configId: uuidv7(), version: z.int().min(1), relayId: z.string().min(1).max(200), ...rankingParamsShape,
  reasonNote: reasonNoteSchema.optional(), activatedAt: timestamp(),
}).refine(weightsSumToOne).refine(distanceNonIncreasing);
export type RankingStatementPayload = z.output<typeof rankingStatementPayloadSchema>;

const published = defineEvent('discovery.ranking_config.published', 1, 'P0', z.strictObject({
  configId: z.string(), version: z.int().min(1), origin: z.enum(['bundled', 'relay_published']), relayId: z.string().optional(), statementCid: z.string(), activatedAt: timestamp(),
}));

export interface RankingConfigOptions {
  /** Id of the relay hosting this config store. */
  readonly relayId: string;
  /** Principal (did:key) of the relay key that must have signed every publication statement. */
  readonly relayAuthor: string;
  /** Relay policy: true only for an operator of that relay; an operator of another relay must get false. */
  readonly isOperator: (actorId: string, relayId: string) => boolean;
  readonly signStatement: (type: string, payload: unknown, seq: number, previousCid: string | null) => Promise<SignedEnvelope>;
  readonly verifyStatement: (envelope: unknown) => Promise<VerifiedStatement>;
}

export interface RankingConfigView extends RankingConfig { readonly id: string; readonly revision: number; }

const bundledData = (tenantId: string): RankingConfig => ({
  tenantId, version: 1, origin: 'bundled', ...DEFAULT_RANKING_PARAMS, status: 'active', activatedAt: BUNDLED_ACTIVATED_AT, createdAt: BUNDLED_ACTIVATED_AT, updatedAt: BUNDLED_ACTIVATED_AT,
});
export const toScoringConfig = (c: Pick<RankingConfig, 'origin' | 'version'> & RankingParams): ScoringConfig => ({
  origin: c.origin, version: c.version, weights: c.weights, bm25: c.bm25, recencyHalfLifeDays: c.recencyHalfLifeDays, distanceWeights: c.distanceWeights, promotionBoost: c.promotionBoost,
});

function invalidConfig(issues: readonly { path: PropertyKey[]; code: string }[]): AppError {
  return rankingErrors.make('RANKING_CONFIG_INVALID', { fields: issues.map(i => ({ path: i.path.map(String).join('.'), code: i.code })) });
}
function parseParams(input: unknown): Result<RankingParams, AppError> {
  const parsed = rankingParamsSchema.safeParse(input);
  return parsed.success ? ok(parsed.data) : err(invalidConfig(parsed.error.issues));
}

interface ActiveState { readonly record: { id: string; revision: number; data: RankingConfig } | undefined; readonly data: RankingConfig; }
function loadActive(ctx: { tx: { repo: CommandContext['tx']['repo'] }; tenantId: string }): Result<ActiveState, AppError> {
  const repo = ctx.tx.repo(rankingConfigRepo);
  const page = repo.query({ where: { status: 'active' }, limit: 2 });
  if (!page.ok) return page;
  if (page.value.items.length > 1) return err(appError('INTERNAL'));
  const rec = page.value.items[0];
  return ok(rec ? { record: { id: rec.id, revision: rec.revision, data: rec.data }, data: rec.data } : { record: undefined, data: bundledData(ctx.tenantId) });
}

/**
 * Atomically retires the active version and inserts the new one in the caller's command transaction.
 */
async function activateConfig(ctx: CommandContext, options: RankingConfigOptions, args: { params: RankingParams; reasonNote: string | undefined; expectedActiveVersion: number }): Promise<Result<{ configId: string; version: number; statementCid: string }, AppError>> {
  const active = loadActive(ctx);
  if (!active.ok) return active;
  if (active.value.data.version !== args.expectedActiveVersion) return err(appError('CONFLICT_REVISION'));
  const repo = ctx.tx.repo(rankingConfigRepo);
  const nowMs = ctx.clock.now();
  const now = new Date(nowMs).toISOString();
  const recent = repo.query({ where: { activatedAt: { gt: new Date(nowMs - DAY_MS).toISOString() } }, orderBy: 'activatedAt', dir: 'asc', limit: MAX_PUBLICATIONS_PER_24H });
  if (!recent.ok) return recent;
  const first = recent.value.items[0];
  if (recent.value.items.length >= MAX_PUBLICATIONS_PER_24H && first) return err(appError('RATE_LIMITED', { retryAfterMs: Math.max(1, Date.parse(first.data.activatedAt) + DAY_MS - nowMs) }));
  const version = active.value.data.version + 1;
  const configId = ctx.ids.next();
  const payload: RankingStatementPayload = { configId, version, relayId: options.relayId, ...args.params, ...(args.reasonNote !== undefined ? { reasonNote: args.reasonNote } : {}), activatedAt: now };
  // The bundled version has no statement. Start the signed chain at 1 and link each subsequent publication.
  const previousCid = active.value.data.statementCid ?? null;
  let seq = 1;
  if (previousCid !== null) {
    const previous = ctx.tx.repo(rankingStatementRepo).get(previousCid);
    const previousSeq = previous?.data.envelope.seq;
    if (typeof previousSeq !== 'number' || !Number.isSafeInteger(previousSeq) || previousSeq < 1 || previousSeq >= Number.MAX_SAFE_INTEGER) {
      return err(appError('INTERNAL'));
    }
    seq = previousSeq + 1;
  }
  let envelope: SignedEnvelope;
  try {
    envelope = structuredClone(await options.signStatement(RANKING_CONFIG_STATEMENT_TYPE, payload, seq, previousCid));
    const verified = await options.verifyStatement(envelope);
    if (verified.author !== options.relayAuthor || verified.type !== RANKING_CONFIG_STATEMENT_TYPE || verified.cid !== envelope.cid
        || verified.seq !== seq || envelope.prev !== previousCid || canonicalJson(verified.payload) !== canonicalJson(payload)) {
      return err(appError('FORBIDDEN'));
    }
  } catch { return err(appError('DEPENDENCY_UNAVAILABLE')); }
  const retired = { ...active.value.data, status: 'retired' as const, retiredAt: now, updatedAt: now };
  const prev = active.value.record;
  const r1 = prev ? repo.put(prev.id, retired, { expectedRevision: prev.revision }) : repo.put(BUNDLED_CONFIG_ID, retired, { expectedRevision: 0 });
  if (!r1.ok) return r1;
  const next: RankingConfig = { tenantId: ctx.tenantId, version, origin: 'relay_published', relayId: options.relayId, ...args.params,
    ...(args.reasonNote !== undefined ? { reasonNote: args.reasonNote } : {}), statementCid: envelope.cid, status: 'active', activatedAt: now, createdAt: now, updatedAt: now };
  const r2 = repo.put(configId, next, { expectedRevision: 0 });
  if (!r2.ok) return r2;
  const r3 = ctx.tx.repo(rankingStatementRepo).put(envelope.cid, { envelope, version }, { expectedRevision: 0 });
  if (!r3.ok) return r3;
  ctx.emit(published, { aggregate: { type: 'ranking_config', id: configId }, revision: r2.value.revision, payload: { configId, version, origin: 'relay_published', relayId: options.relayId, statementCid: envelope.cid, activatedAt: now } });
  ctx.log.info('ranking.config_published', { version });
  return ok({ configId, version, statementCid: envelope.cid });
}

const reasonOf = (v: unknown): Result<string | undefined, AppError> => {
  if (v === undefined) return ok(undefined);
  const r = reasonNoteSchema.safeParse(v);
  return r.success ? ok(r.data) : err(invalidConfig([{ path: ['reasonNote'], code: 'INVALID' }]));
};
const forbidden = (ctx: CommandContext, options: RankingConfigOptions): boolean => ctx.actor.kind !== 'user' || !options.isOperator(ctx.actor.id, options.relayId);

function activeQuery(surface: 'vault' | 'relay') {
  return defineQuery({
    name: 'discovery.ranking_config.get_active', module: 'F06.S03.M01', capability: 'discovery.ranking_config.read_public', auth: surface === 'vault' ? 'required' : 'public', surface,
    input: z.strictObject({ includeHistory: z.boolean().optional() }),
    handler(ctx, input) {
      const bundled: RankingConfigView = { id: BUNDLED_CONFIG_ID, revision: 1, ...bundledData(ctx.tenantId) };
      if (surface === 'vault') return ok({ active: bundled, ...(input.includeHistory ? { history: [bundled] } : {}) });
      const repo = ctx.tx.repo(rankingConfigRepo);
      const page = repo.query({ where: { status: 'active' }, limit: 2 });
      if (!page.ok) return page;
      if (page.value.items.length > 1) return err(appError('INTERNAL'));
      const rec = page.value.items[0];
      const active: RankingConfigView = rec ? { id: rec.id, revision: rec.revision, ...rec.data } : bundled;
      const st = active.statementCid ? ctx.tx.repo(rankingStatementRepo).get(active.statementCid) : undefined;
      const out: { active: RankingConfigView; statement?: SignedEnvelope; history?: RankingConfigView[] } = { active, ...(st ? { statement: st.data.envelope } : {}) };
      if (input.includeHistory) {
        const hist = repo.query({ orderBy: 'version', dir: 'desc', limit: MAX_HISTORY });
        if (!hist.ok) return hist;
        out.history = hist.value.items.length > 0 ? hist.value.items.map(r => ({ id: r.id, revision: r.revision, ...r.data })) : [active];
      }
      return ok(out);
    },
  });
}

/** Vault registration: only the principal's read, which returns the bundled default (a vault has no relay publication commands). */
export function rankingConfigVaultDefinitions() {
  const getActive = activeQuery('vault');
  return { getActive, all: [getActive] as const };
}

/** Relay registration: publish, rollback and the public read. Register either this or the vault set, not both. */
export function rankingConfigDefinitions(options: RankingConfigOptions) {
  const publish = defineCommand({
    name: 'discovery.ranking_config.publish', module: 'F06.S03.M01', capability: 'discovery.ranking_config.publish', idempotent: true, surface: 'relay',
    input: z.strictObject({ weights: z.unknown(), bm25: z.unknown(), recencyHalfLifeDays: z.unknown(), distanceWeights: z.unknown(), promotionBoost: z.unknown(), reasonNote: z.unknown().optional(), expectedActiveVersion: z.int().min(1) }),
    async handler(ctx, input) {
      if (forbidden(ctx, options)) return err(appError('FORBIDDEN'));
      const { expectedActiveVersion, reasonNote, ...raw } = input;
      const params = parseParams(raw); if (!params.ok) return params;
      const reason = reasonOf(reasonNote); if (!reason.ok) return reason;
      return activateConfig(ctx, options, { params: params.value, reasonNote: reason.value, expectedActiveVersion });
    },
  });
  const rollback = defineCommand({
    name: 'discovery.ranking_config.rollback', module: 'F06.S03.M01', capability: 'discovery.ranking_config.rollback', idempotent: true, surface: 'relay',
    input: z.strictObject({ targetVersion: z.int().min(1), expectedActiveVersion: z.int().min(1), reasonNote: z.unknown().optional() }),
    async handler(ctx, input) {
      if (forbidden(ctx, options)) return err(appError('FORBIDDEN'));
      const reason = reasonOf(input.reasonNote); if (!reason.ok) return reason;
      const active = loadActive(ctx); if (!active.ok) return active;
      if (input.targetVersion === active.value.data.version) return err(appError('NOT_FOUND'));
      const found = ctx.tx.repo(rankingConfigRepo).query({ where: { version: pad(input.targetVersion) }, limit: 1 });
      if (!found.ok) return found;
      const target: RankingConfig | undefined = found.value.items[0]?.data;
      // With nothing stored the bundled default is the active version 1, so any other target does not exist.
      if (!target) return err(appError('NOT_FOUND'));
      const params = parseParams({ weights: target.weights, bm25: target.bm25, recencyHalfLifeDays: target.recencyHalfLifeDays, distanceWeights: target.distanceWeights, promotionBoost: target.promotionBoost });
      if (!params.ok) return params;
      return activateConfig(ctx, options, { params: params.value, reasonNote: reason.value, expectedActiveVersion: input.expectedActiveVersion });
    },
  });
  const getActive = activeQuery('relay');
  return { publish, rollback, getActive, all: [publish, rollback, getActive] as const };
}

/**
 * Client-side check of a relay's published statement before display: signature, type, schema and the selected relay's key.
 * The result is for display only; a vault never applies a relay config to its own local ranking.
 */
export async function readRankingConfigStatement(envelope: unknown, verify: (e: unknown) => Promise<VerifiedStatement>, expected: { relayAuthor: string }): Promise<Result<RankingStatementPayload, AppError>> {
  let verified: VerifiedStatement;
  try { verified = await verify(structuredClone(envelope)); } catch { return err(appError('VALIDATION_FAILED')); }
  if (verified.type !== RANKING_CONFIG_STATEMENT_TYPE) return err(appError('VALIDATION_FAILED'));
  if (!expected?.relayAuthor || verified.author !== expected.relayAuthor) return err(appError('FORBIDDEN'));
  const parsed = rankingStatementPayloadSchema.safeParse(verified.payload);
  return parsed.success ? ok(parsed.data) : err(invalidConfig(parsed.error.issues));
}
