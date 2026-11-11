// F15.S04.M03 Tenants: entities (classrup.platform.tenant/v1, classrup.platform.local_settings/v1), the relay-signed
// statement classrup.platform.tenant_config/v1, command/query inputs and outputs and event payloads.
import { boundedString, codePointLength, revision, timestamp, uuidv7, z } from '@classrup/kernel';
import { isEd25519DidKey, isPlainText } from './text.ts';

export const TENANTS_MODULE_ID = 'F15.S04.M03';
export const TENANT_SCHEMA_ID = 'classrup.platform.tenant/v1';
export const LOCAL_SETTINGS_SCHEMA_ID = 'classrup.platform.local_settings/v1';
export const TENANT_CONFIG_TYPE = 'classrup.platform.tenant_config/v1';

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const CURRENCY_RE = /^[A-Z0-9]{2,12}$/;
export const LOCALE_RE = /^[a-z]{2,3}(-[A-Z]{2})?$/;
export const PROFILE_CODE_RE = /^[a-z0-9_-]{2,40}$/;
/** Platform caps: N9 upload cap and CTR-SCH-001 SCH-6 envelope cap. */
export const PLATFORM_MAX_UPLOAD_BYTES = 5_242_880;
export const PLATFORM_MAX_ENVELOPE_BYTES = 262_144;
export const MAX_TENANTS_PER_RELAY = 50;
export const MAX_OPERATOR_EXPIRY_MS = 31_536_000_000;
export const ARCHIVE_AFTER_SUSPENDED_MS = 2_592_000_000;
export const ARCHIVE_PURGE_AFTER_MS = 7_776_000_000;
export const CONFIG_CACHE_TTL_MS = 30_000;

export const didKey = () => z.string().refine(isEd25519DidKey, { params: { code: 'INVALID_DID_KEY' } });
export const plainText = (min: number, max: number) => boundedString({ min, max }).refine(isPlainText, { params: { code: 'NOT_PLAIN_TEXT' } });

const distinct = (values: readonly string[]) => new Set(values).size === values.length;

export const tenantStatusSchema = z.enum(['active', 'suspended', 'archived']);
export type TenantStatus = z.output<typeof tenantStatusSchema>;

/** ProfileRef of F18.S01.M01: stored and signed as given, never resolved here. */
export const profileRefSchema = z.strictObject({
  publisherId: didKey().optional(),
  code: z.string().regex(PROFILE_CODE_RE),
});
export type ProfileRef = z.output<typeof profileRefSchema>;
export const GENERIC_PROFILE: ProfileRef = Object.freeze({ code: 'generic' });

export const currencyListSchema = z
  .array(z.string().regex(CURRENCY_RE))
  .min(1)
  .max(20)
  .refine(distinct, { params: { code: 'DUPLICATE' } });

export const localeSchema = z.string().regex(LOCALE_RE);

/** Each limit with its range, default and enforcing module (a limit without an enforcer is not part of the record). */
export const NUMERIC_LIMITS = {
  maxIndexedListingsPerPublisher: { min: 1, max: 1000, default: 100, enforcedBy: 'F06.S01.M01' },
  maxUploadBytes: { min: 65_536, max: PLATFORM_MAX_UPLOAD_BYTES, default: PLATFORM_MAX_UPLOAD_BYTES, enforcedBy: 'F15.S02.M01' },
  maxMailboxBytesPerRecipient: { min: 1_048_576, max: 1_073_741_824, default: 52_428_800, enforcedBy: 'F08.S01.M01' },
  maxEnvelopeBytes: { min: 4096, max: PLATFORM_MAX_ENVELOPE_BYTES, default: PLATFORM_MAX_ENVELOPE_BYTES, enforcedBy: 'F08.S01.M01' },
  maxCycleLength: { min: 3, max: 6, default: 5, enforcedBy: 'F02.S02.M03' },
  maxDepth: { min: 1, max: 500, default: 500, enforcedBy: 'F06.S02.M03' },
} as const;
export type NumericLimit = keyof typeof NUMERIC_LIMITS;
export const ANONYMOUS_RADII_KM = [25, 50, 100] as const;
export const DISCOVERY_LIMITS_ENFORCER = 'F06.S02.M03';

export const tenantLimitsSchema = z.object({
  maxIndexedListingsPerPublisher: z.int(),
  maxUploadBytes: z.int(),
  maxMailboxBytesPerRecipient: z.int(),
  maxEnvelopeBytes: z.int(),
  maxCycleLength: z.int(),
  anonymousAllowed: z.boolean(),
  anonymousMinRadiusKm: z.union([z.literal(25), z.literal(50), z.literal(100)]),
  anonymousCenterLevel: z.literal('L1'),
  maxDepth: z.int(),
});
export type TenantLimits = z.output<typeof tenantLimitsSchema>;

export const DEFAULT_LIMITS: TenantLimits = Object.freeze({
  maxIndexedListingsPerPublisher: NUMERIC_LIMITS.maxIndexedListingsPerPublisher.default,
  maxUploadBytes: NUMERIC_LIMITS.maxUploadBytes.default,
  maxMailboxBytesPerRecipient: NUMERIC_LIMITS.maxMailboxBytesPerRecipient.default,
  maxEnvelopeBytes: NUMERIC_LIMITS.maxEnvelopeBytes.default,
  maxCycleLength: NUMERIC_LIMITS.maxCycleLength.default,
  anonymousAllowed: true,
  anonymousMinRadiusKm: 25,
  anonymousCenterLevel: 'L1',
  maxDepth: NUMERIC_LIMITS.maxDepth.default,
});

/** Limits as received: ranges and enums are checked by rules.ts (V05, V14) so errors can name the maximum. */
export const limitsPatchInput = z.strictObject({
  maxIndexedListingsPerPublisher: z.int().optional(),
  maxUploadBytes: z.int().optional(),
  maxMailboxBytesPerRecipient: z.int().optional(),
  maxEnvelopeBytes: z.int().optional(),
  maxCycleLength: z.int().optional(),
  anonymousAllowed: z.boolean().optional(),
  anonymousMinRadiusKm: z.int().optional(),
  anonymousCenterLevel: z.string().optional(),
  maxDepth: z.int().optional(),
});
export type LimitsPatch = z.output<typeof limitsPatchInput>;

/** Stored Tenant (classrup.platform.tenant/v1). Readers ignore unknown optional fields of newer releases. */
export const tenantDataSchema = z.object({
  id: uuidv7(),
  slug: z.string().regex(SLUG_RE),
  displayName: z.string(),
  status: tenantStatusSchema,
  allowedCurrencies: z.array(z.string()),
  jurisdictionProfile: z.object({ publisherId: z.string().optional(), code: z.string() }),
  defaultLocale: z.string(),
  limits: tenantLimitsSchema,
  suspendedReason: z.string().optional(),
  suspendedAt: timestamp().optional(),
  configStatementCid: z.string(),
  createdAt: timestamp(),
  updatedAt: timestamp(),
});
export type TenantData = z.output<typeof tenantDataSchema>;

/** Tenant view with the record revision and the derived operator keys (read through F16.S01.M01). */
export const tenantSchema = tenantDataSchema.extend({ revision: revision(), operatorKeys: z.array(z.string()) });
export type Tenant = z.output<typeof tenantSchema>;

/** classrup.platform.tenant_config/v1: relay-signed configuration of one tenant revision. */
export const tenantConfigStatementSchema = z.object({
  type: z.literal(TENANT_CONFIG_TYPE),
  v: z.literal(1),
  cid: z.string(),
  relayId: z.string().min(1),
  tenantId: uuidv7(),
  slug: z.string(),
  displayName: z.string(),
  revision: revision(),
  status: tenantStatusSchema,
  suspendedReason: z.string().optional(),
  allowedCurrencies: z.array(z.string()),
  jurisdictionProfile: z.object({ publisherId: z.string().optional(), code: z.string() }),
  defaultLocale: z.string(),
  limits: tenantLimitsSchema,
  operatorKeys: z.array(z.string()),
  issuedAt: timestamp(),
  keyId: z.string().min(1),
  sig: z.string().min(1),
});
export type TenantConfigStatement = z.output<typeof tenantConfigStatementSchema>;
export type UnsignedTenantConfig = Omit<TenantConfigStatement, 'cid' | 'sig'>;

export const tenantConfigRecordSchema = z.object({ tenantId: uuidv7(), revision: revision(), cid: z.string(), statement: tenantConfigStatementSchema });
export type TenantConfigRecord = z.output<typeof tenantConfigRecordSchema>;

// ---------------------------------------------------------------- LocalSettings (vault, P3)

export const a11yMotionSchema = z.enum(['system', 'reduced']);
export const moneyDisplaySchema = z.enum(['symbol', 'code', 'name']);
export const LOCAL_LIMITS = {
  maxLocalAttachmentBytes: { min: 65_536, max: PLATFORM_MAX_UPLOAD_BYTES, default: PLATFORM_MAX_UPLOAD_BYTES, enforcedBy: 'F15.S02.M03' },
  maxOutboxEntries: { min: 10, max: 200, default: 200, enforcedBy: 'F15.S01.M01' },
} as const;

export const localLimitsSchema = z.object({
  maxLocalAttachmentBytes: z.int().min(LOCAL_LIMITS.maxLocalAttachmentBytes.min).max(LOCAL_LIMITS.maxLocalAttachmentBytes.max),
  maxOutboxEntries: z.int().min(LOCAL_LIMITS.maxOutboxEntries.min).max(LOCAL_LIMITS.maxOutboxEntries.max),
});
export type LocalLimits = z.output<typeof localLimitsSchema>;
export const DEFAULT_LOCAL_LIMITS: LocalLimits = Object.freeze({ maxLocalAttachmentBytes: LOCAL_LIMITS.maxLocalAttachmentBytes.default, maxOutboxEntries: LOCAL_LIMITS.maxOutboxEntries.default });

export const knownRelayConfigSchema = z.object({
  tenantId: uuidv7(),
  revision: revision(),
  cid: z.string(),
  statement: tenantConfigStatementSchema,
  verifiedAt: timestamp(),
  /** Two different verified statements for one (tenantId, revision): proof kept and shown as a warning. */
  equivocation: z.object({ tenantId: uuidv7(), revision: revision(), statements: z.array(tenantConfigStatementSchema).length(2) }).optional(),
});
export type KnownRelayConfig = z.output<typeof knownRelayConfigSchema>;

export const localSettingsDataSchema = z.object({
  id: uuidv7(),
  vaultId: uuidv7(),
  defaultLocale: z.string(),
  preferredCurrencies: z.array(z.string()),
  localLimits: localLimitsSchema,
  a11yMotion: a11yMotionSchema.optional(),
  moneyDisplay: moneyDisplaySchema.optional(),
  knownRelayConfigs: z.record(z.string(), knownRelayConfigSchema).optional(),
  updatedAt: timestamp(),
});
export type LocalSettingsData = z.output<typeof localSettingsDataSchema>;
export const localSettingsSchema = localSettingsDataSchema.extend({ revision: revision() });
export type LocalSettings = z.output<typeof localSettingsSchema>;

/** Schemas by schema ID (F11.S01.M01 registry, contract tests). */
export const schemas = {
  [TENANT_SCHEMA_ID]: tenantSchema,
  [LOCAL_SETTINGS_SCHEMA_ID]: localSettingsSchema,
  [TENANT_CONFIG_TYPE]: tenantConfigStatementSchema,
} as const;

// ---------------------------------------------------------------- command and query inputs

const breakGlassReason = z.string().refine((v) => codePointLength(v) >= 20 && codePointLength(v) <= 500, { params: { code: 'OUT_OF_RANGE' } });

export const createTenantInput = z.strictObject({
  slug: z.string().regex(SLUG_RE),
  displayName: plainText(1, 80),
  allowedCurrencies: currencyListSchema,
  jurisdictionProfile: profileRefSchema.optional(),
  defaultLocale: localeSchema.optional(),
  limits: limitsPatchInput.optional(),
  operatorKeys: z.array(didKey()).min(1).max(10).refine(distinct, { params: { code: 'DUPLICATE' } }),
  /** Local relay CLI bootstrap only (V17). */
  adminKey: didKey().optional(),
  /** Local relay CLI only, 20..500 code points (V16). */
  breakGlassReason: breakGlassReason.optional(),
});
export type CreateTenantInput = z.output<typeof createTenantInput>;

export const configPatchInput = z.strictObject({
  displayName: plainText(1, 80).optional(),
  allowedCurrencies: currencyListSchema.optional(),
  jurisdictionProfile: profileRefSchema.optional(),
  defaultLocale: localeSchema.optional(),
  limits: limitsPatchInput.optional(),
});
export type ConfigPatch = z.output<typeof configPatchInput>;

export const configureTenantInput = z.strictObject({ tenantId: uuidv7(), expectedRevision: revision(), patch: configPatchInput });

export const assignOperatorInput = z.strictObject({
  tenantId: uuidv7(),
  expectedRevision: revision(),
  add: z.array(z.strictObject({ key: didKey(), expiresInMs: z.int().min(1).max(MAX_OPERATOR_EXPIRY_MS) })).max(10).optional(),
  remove: z.array(z.string().min(1)).max(10).optional(),
});

export const changeStatusInput = z.strictObject({
  tenantId: uuidv7(),
  expectedRevision: revision(),
  status: tenantStatusSchema,
  reason: plainText(1, 200).optional(),
});

export const localSettingsPatchInput = z.strictObject({
  defaultLocale: localeSchema.optional(),
  preferredCurrencies: z.array(z.string().regex(CURRENCY_RE)).max(20).refine(distinct, { params: { code: 'DUPLICATE' } }).optional(),
  localLimits: z
    .strictObject({
      maxLocalAttachmentBytes: z.int().min(LOCAL_LIMITS.maxLocalAttachmentBytes.min).max(LOCAL_LIMITS.maxLocalAttachmentBytes.max).optional(),
      maxOutboxEntries: z.int().min(LOCAL_LIMITS.maxOutboxEntries.min).max(LOCAL_LIMITS.maxOutboxEntries.max).optional(),
    })
    .optional(),
  a11yMotion: a11yMotionSchema.optional(),
  moneyDisplay: moneyDisplaySchema.optional(),
});
export type LocalSettingsPatch = z.output<typeof localSettingsPatchInput>;
export const updateLocalSettingsInput = z.strictObject({ expectedRevision: z.int().min(0).optional(), patch: localSettingsPatchInput });

export const getTenantInput = z
  .strictObject({ tenantId: uuidv7().optional(), slug: z.string().regex(SLUG_RE).optional(), revision: revision().optional() })
  .refine((v) => !(v.tenantId !== undefined && v.slug !== undefined), { params: { code: 'TENANT_ID_OR_SLUG' } });
export const listTenantsInput = z.strictObject({ status: tenantStatusSchema.optional(), cursor: z.string().optional(), limit: z.int().min(1).max(50).default(50) });
export const getLocalSettingsInput = z.strictObject({});

// ---------------------------------------------------------------- outputs

export const createTenantOutput = z.strictObject({ tenantId: z.string(), revision: z.literal(1), status: z.literal('active'), configStatementCid: z.string(), roleAssignmentIds: z.array(z.string()) });
export const configureTenantOutput = z.strictObject({ tenantId: z.string(), revision: revision(), changed: z.array(z.string()), configStatementCid: z.string() });
export const assignOperatorOutput = z.strictObject({ tenantId: z.string(), revision: revision(), operatorKeys: z.array(z.string()), roleAssignmentIds: z.array(z.string()), configStatementCid: z.string() });
export const changeStatusOutput = z.strictObject({ tenantId: z.string(), revision: revision(), status: tenantStatusSchema, configStatementCid: z.string() });
export const updateLocalSettingsOutput = z.strictObject({ revision: revision() });
export const getTenantOutput = z.strictObject({ statement: tenantConfigStatementSchema });
export const listTenantsOutput = z.strictObject({ items: z.array(tenantSchema), nextCursor: z.string().optional() });
export const getLocalSettingsOutput = z.strictObject({
  vaultId: z.string(),
  defaultLocale: z.string(),
  preferredCurrencies: z.array(z.string()),
  localLimits: localLimitsSchema,
  a11yMotion: a11yMotionSchema,
  moneyDisplay: moneyDisplaySchema,
  knownRelayConfigs: z.record(z.string(), knownRelayConfigSchema).optional(),
  revision: z.int().min(0),
});

// ---------------------------------------------------------------- event payloads (P0)

const profileRefPayload = z.strictObject({ publisherId: z.string().optional(), code: z.string() });

export const tenantCreatedPayload = z.strictObject({
  tenantId: z.string(),
  slug: z.string(),
  revision: revision(),
  allowedCurrencies: z.array(z.string()),
  defaultLocale: z.string(),
  jurisdictionProfile: profileRefPayload,
  limits: tenantLimitsSchema,
  operatorKeys: z.array(z.string()),
  configStatementCid: z.string(),
});
export const tenantConfiguredPayload = z.strictObject({
  tenantId: z.string(),
  revision: revision(),
  changed: z.array(z.string()),
  status: tenantStatusSchema,
  allowedCurrencies: z.array(z.string()),
  removedCurrencies: z.array(z.string()),
  jurisdictionProfile: profileRefPayload,
  defaultLocale: z.string(),
  limits: tenantLimitsSchema,
  operatorKeys: z.array(z.string()),
  configStatementCid: z.string(),
});
export const tenantStatusChangedPayload = z.strictObject({
  tenantId: z.string(),
  from: tenantStatusSchema,
  to: tenantStatusSchema,
  reason: z.string().optional(),
  revision: revision(),
  configStatementCid: z.string(),
});

/** Field classification (F10.S02.M02): Tenant and statements are P0, LocalSettings P3 field by field. */
export const TENANT_FIELD_CLASSES = Object.freeze(Object.fromEntries(Object.keys(tenantSchema.shape).map((k) => [k, 'P0'])) as Record<string, 'P0'>);
export const LOCAL_SETTINGS_FIELD_CLASSES = Object.freeze(Object.fromEntries(Object.keys(localSettingsSchema.shape).map((k) => [k, 'P3'])) as Record<string, 'P3'>);
