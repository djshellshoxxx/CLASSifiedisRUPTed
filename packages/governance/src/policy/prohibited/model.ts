// Prohibited-item rules (F18.S01.M02): schemas, repos, errors, events, state machine and pure helpers.
import { canonicalJson, codePointLength, defineErrors, defineEvent, defineMachine, defineRepo, isUuidV7, timestamp, z, type AppError } from '@classrup/kernel';
import { normalizeText } from './normalize.ts';

export const RULES_MODULE = 'F18.S01.M02';
export const RULE_PACK_TYPE = 'classrup.governance.rule_pack/v1';
export const MAX_RULES = 2000;
export const MAX_KEYWORDS = 50;
export const MIN_PHRASE = 2;
export const MAX_PHRASE = 60;
export const MAX_PACK_BYTES = 1024 * 1024;
export const MAX_EVAL_CODE_POINTS = 8000;
export const MAX_MATCHES = 10;
export const MAX_EMERGENCY_ACTIVE = 5;
export const MAX_TRUSTED_PUBLISHERS = 10;
export const MAX_APPLIES_PER_DAY = 20;
export const MAX_PENDING_PACKS = 10;
export const KEEP_PACKS = 3;
export const DAY_MS = 86_400_000;
export const EMERGENCY_MAX_MS = 7 * DAY_MS;
export const PENDING_TTL_MS = 30 * DAY_MS;

export const ruleErrors = defineErrors({
  GOVERNANCE_RULE_SCOPE_INVALID: { status: 422, retryable: false },
  GOVERNANCE_RULE_PROPOSAL_REQUIRED: { status: 412, retryable: false },
  GOVERNANCE_RULE_EMERGENCY_INVALID: { status: 422, retryable: false },
  GOVERNANCE_RULE_PACK_REJECTED: { status: 422, retryable: false },
});
export type RuleErrorCode = keyof typeof ruleErrors.codes;
export const ruleError = (code: RuleErrorCode): AppError => ruleErrors.make(code);

const uuid = () => z.string().refine((v): boolean => isUuidV7(v), { params: { code: 'INVALID_UUIDV7' } });
const didKey = z.string().startsWith('did:key:').max(128);
export const ruleKeySchema = z.string().regex(/^[a-z0-9_]{3,40}$/);
export const reasonKeySchema = z.string().regex(/^[a-z0-9_.]{3,120}$/);
export const actionSchema = z.enum(['block', 'review', 'allow_with_notice']);
export type RuleAction = z.output<typeof actionSchema>;
export const KINDS = ['sell', 'wanted', 'giveaway', 'service', 'rental', 'auction'] as const;
export const kindSchema = z.enum(KINDS);
const noticeSchema = z.string().regex(/^[a-z0-9_.]{3,120}$/);
const hashSchema = z.strictObject({
  salt: z.string().min(1).max(64),
  wordCounts: z.array(z.int().min(1).max(10)).min(1).max(10),
  hashes: z.array(z.string().regex(/^[0-9a-f]{64}$/)).min(1).max(MAX_KEYWORDS),
});
export type KeywordHashes = z.output<typeof hashSchema>;
const phrase = z.string().refine((v) => { const n = codePointLength(v); return n >= MIN_PHRASE && n <= MAX_PHRASE; }, { params: { code: 'PHRASE_LENGTH' } });

/** Fields of a rule that travel in a pack statement. Sensitive rules carry hashes instead of keywords. */
export const entryShape = {
  ruleKey: ruleKeySchema,
  version: z.int().min(1),
  categoryIds: z.array(uuid()).max(20),
  keywords: z.array(phrase).max(MAX_KEYWORDS),
  keywordHashes: hashSchema.optional(),
  matchMode: z.enum(['whole_word', 'phrase']),
  action: actionSchema,
  kinds: z.array(kindSchema).max(KINDS.length),
  jurisdictionProfileIds: z.array(uuid()).max(10),
  noticeId: noticeSchema.optional(),
  reasonKey: reasonKeySchema,
  sensitive: z.boolean(),
  emergencyUntil: timestamp().optional(),
  proposalId: uuid().optional(),
};
export const ruleEntrySchema = z.strictObject(entryShape);
export type RuleEntry = z.output<typeof ruleEntrySchema>;

export const provenanceSchema = z.strictObject({ originRelay: z.string().max(200).optional(), receivedAt: timestamp(), verifiedAt: timestamp(), packCid: z.string().min(1).max(200) });
export const ruleSchema = z.strictObject({
  ...entryShape,
  tenantId: z.string(),
  publisherId: didKey,
  status: z.enum(['draft', 'active', 'retired']),
  rulesetVersion: z.int().min(1).optional(),
  retirementStaged: z.boolean().optional(),
  provenance: provenanceSchema.optional(),
  createdAt: timestamp(),
  updatedAt: timestamp(),
});
export type RuleData = z.output<typeof ruleSchema>;
export type RuleStatus = RuleData['status'];

export const rulePayloadSchema = z.strictObject({
  publisherId: didKey,
  version: z.int().min(1),
  fullSnapshot: z.boolean(),
  changelogEntry: z.string().max(500),
  releasedAt: timestamp(),
  proposalId: uuid().optional(),
  rules: z.array(ruleEntrySchema),
});
export type RulePayload = z.output<typeof rulePayloadSchema>;

export const ruleRepo = defineRepo({
  type: 'governance.prohibited_rule',
  schema: ruleSchema,
  indexes: { ruleKey: (d) => d.ruleKey, status: (d) => d.status, pubkey: (d) => `${d.publisherId}|${d.ruleKey}`, publisher: (d) => d.publisherId },
});
const packRecordSchema = z.strictObject({
  publisherId: didKey,
  version: z.int().min(1),
  envelope: z.looseObject({ cid: z.string(), type: z.string() }),
  status: z.enum(['pending', 'applied', 'superseded']),
  receivedAt: timestamp(),
  appliedAt: timestamp().optional(),
  originRelay: z.string().max(200).optional(),
  ruleCount: z.int().min(0),
  changelogEntry: z.string().max(500),
  pendingReason: z.string().max(60).optional(),
});
export const packRepo = defineRepo({ type: 'governance.rule_pack', schema: packRecordSchema, indexes: { publisher: (d) => d.publisherId, status: (d) => d.status, received: (d) => d.receivedAt } });
export const trustRepo = defineRepo({ type: 'governance.rule_trust', schema: z.strictObject({ publisherId: didKey, trustedAt: timestamp() }), indexes: {} });
const stateSchema = z.strictObject({ appliedVersion: z.int().min(0), appliedCid: z.string().max(200).optional(), appliedLog: z.array(timestamp()).max(MAX_APPLIES_PER_DAY) });
export type RuleState = z.output<typeof stateSchema>;
export const stateRepo = defineRepo({ type: 'governance.rule_state', schema: stateSchema, indexes: {} });
export const VAULT_STATE_ID = 'vault';
export const publisherStateId = (publisherId: string): string => `pub:${publisherId}`;

export const ruleChanged = defineEvent(
  'governance.prohibited_rule.changed',
  1,
  'P0',
  z.strictObject({
    ruleKey: z.string(),
    version: z.int().min(1),
    change: z.enum(['activated', 'retired', 'emergency_expired']),
    action: actionSchema,
    rulesetVersion: z.int().min(0),
    publisherId: z.string(),
  }),
);

export const ruleMachine = defineMachine({
  initial: 'draft',
  terminal: ['retired'],
  transitions: [
    { from: 'draft', to: 'active', on: 'activate' },
    { from: 'active', to: 'retired', on: 'retire' },
    { from: 'draft', to: 'retired', on: 'discard' },
  ],
});

export const SEVERITY: Readonly<Record<RuleAction | 'allow', number>> = { block: 3, review: 2, allow_with_notice: 1, allow: 0 };

/** Keywords normalized, de-duplicated and bounded; undefined when any phrase is outside 2..60 code points. */
export function normalizeKeywords(raw: readonly string[]): string[] | undefined {
  const out = new Set<string>();
  for (const k of raw) {
    const n = normalizeText(k);
    const len = codePointLength(n);
    if (len < MIN_PHRASE || len > MAX_PHRASE) return undefined;
    out.add(n);
  }
  return out.size <= MAX_KEYWORDS ? [...out] : undefined;
}

export const wordCount = (normalizedPhrase: string): number => normalizedPhrase.split(' ').length;

export function utf8Length(value: unknown): number {
  return new TextEncoder().encode(canonicalJson(value)).length;
}

/** Fields that define a rule's behaviour in a pack, used to detect "same version, different content". */
export function entryComparable(e: RuleEntry): string {
  const { proposalId: _p, ...rest } = e;
  return canonicalJson(rest);
}
export function dataToEntry(d: RuleData): RuleEntry {
  const { tenantId: _t, publisherId: _pub, status: _s, rulesetVersion: _r, retirementStaged: _rs, provenance: _pr, createdAt: _c, updatedAt: _u, ...entry } = d;
  return entry;
}
export const expired = (e: { readonly emergencyUntil?: string | undefined }, nowMs: number): boolean => e.emergencyUntil !== undefined && Date.parse(e.emergencyUntil) <= nowMs;
