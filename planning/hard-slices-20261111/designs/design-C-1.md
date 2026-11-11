# Design C-1 — Account/device log, rotation, revocation, recovery kit (identity-protocol lens)

## 1. Summary and scope

An **account** is a sequencer-free, append-only log of signed statements. `accountId` is the did:key of the genesis key; the alpha vault principal (`vault.ts:36-44`, `identity.ts:79`) *is* the genesis device, so an empty log already folds to a valid document (implicit genesis, no migration). Every statement is a CTR-FED-001 envelope made by `signEnvelope` (`envelope.ts:124`) and checked only by `verifyEnvelope` (`envelope.ts:108`), chained per account by the envelope's `seq`/`prev` (`envelope.ts:95-96`). Receivers verify, authorize each statement against the document folded from the prefix `seq−1`, hold out-of-order statements in a bounded buffer, freeze on any fork, and persist log and document as kernel records.

Because `identity` and `federation` share layer 2 (`tools/deps/deps.mjs:12`, rule `:37`), the module receives `signEnvelope`/`verifyEnvelope` by injection, like `DiscoveryOptions.verifyEnvelope` (`packages/discovery/src/search/index.ts:16`) and `BazaarOptions.signProjection/verifyProjection` (`packages/bazaar/src/listings/index.ts:27-28`). No other signing or verification code exists.

**MVP:** statement kinds `device_link`, `device_revoke`, `key_rotate`, `recovery_setup`, `recovery_claim`, `recovery_dispute`, `resolve`, `account_close`; pure fold; hold buffer; freeze with evidence; `isAuthorizedSigner`; `accountOf`; persistence; recovery kit secret (Crockford base32 + CRC-24, no word list); P4 sealing via `createIdentity`/`unlockIdentity`.

**Deferred (justified):** (a) 24-word BIP-39 encoding — needs an embedded 2048-word list (~12 KB, licence, locale) while a 56-symbol base32 string needs none and detects every single-symbol error deterministically; (b) deriving the recovery key from the secret — avoids the kit file but needs hand-built PKCS#8 wrapping, a crypto path outside `createIdentity`; (c) a signed `classrup.identity.portable_doc/v1` wrapper (PS-055) — receivers get the log itself, which carries strictly more evidence; (d) relays/sync — out of scope; nothing uploads anything, statements leave the vault only as user-exported files; (e) UI and kit-guess backoff (PS-053 V07) — 256 bits of entropy make it a UI nicety.

## 2. Data model and formats

Types: outer `classrup.identity.event/v1` (`kind` discriminator, one `expectedType` for receivers) and inner `classrup.identity.proof/v1` (possession counter-signature); both match the envelope type regex (`envelope.ts:91`).

```jsonc
// outer statement (CTR-FED-001 envelope), payload ≤ 4096 UTF-8 bytes
{ "v":1, "type":"classrup.identity.event/v1", "cid":"sha256-…", "author":"did:key:z6Mk…(device or recovery did)",
  "createdAt":"2026-11-11T10:00:00.000Z", "seq":3, "prev":"sha256-…", "ext":{}, "sig":"…",
  "payload": { "accountId":"did:key:z6Mk…", "kind":"device_link", /* kind fields */ } }
```

| kind | payload fields (all strict objects, unknown keys rejected) | signer rule (state after seq−1) |
|---|---|---|
| `device_link` | `device: did, label: 1..60 code points, proof: Proof` | active device |
| `device_revoke` | `device: did, reason?: 'lost'\|'compromised'\|'retired'` | active device; target active; ≥1 active remains |
| `key_rotate` | `device: did, label, proof: Proof, revoke: did` | active device; `revoke` active and ≠ `device` |
| `recovery_setup` | `recoveryDid: did, proof: Proof` | active device; supersedes earlier recoveryDid |
| `recovery_claim` | `device: did, label, proof: Proof` | author = current `recoveryDid`; no claim pending |
| `recovery_dispute` | `claimCid: cid` | device active at `claimSeq−1`; receiver time < `windowEndsAt` |
| `resolve` | `keep: cid, drop: cid, proof: Proof` | author of `keep` or `drop`; proof by the other author |
| `account_close` | `{}` | active device |

```jsonc
// Proof: inner envelope signed by the proven key (seq 1, prev null)
{ "v":1, "type":"classrup.identity.proof/v1", "author":"did:key:z6Mk…(proven key)", "seq":1, "prev":null, "createdAt":"…",
  "payload": { "accountId":"did:key:…", "purpose":"device_link|key_rotate|recovery_setup|recovery_claim|resolve",
               "subject":"did:key:… (the key itself) or cid (resolve: the drop cid)" }, "ext":{}, "cid":"…", "sig":"…" }
```

```ts
// folded document — classrup.identity.document/v1 (derived, unsigned, portable, ≤ 64 KiB)
interface IdentityDocument {
  readonly format: 'classrup.identity.document/v1';
  readonly accountId: string;
  readonly devices: readonly { did: string; label: string; status: 'active' | 'revoked'; since: string; until?: string }[];
  readonly recoveryDid: string | null;
  readonly state: 'active' | 'frozen' | 'closed';
  readonly head: { seq: number; cid: string } | null;
  readonly recovery?: { claimCid: string; claimSeq: number; device: string; windowEndsAt: string; disputableBy: readonly string[] };
  readonly frozen?: { reason: 'fork' | 'prev_mismatch' | 'dispute'; seq: number; candidates: readonly { cid: string; author: string; receivedAt: string }[] };
}
```
`since`/`until` are **receiver receipt times**, half-open `[since, until)`; the genesis device has `since: '1970-01-01T00:00:00.000Z'`.

Records (tenant = vault principal; `defineRepo` `repo.ts:26`; written via `tx.records.put` `tx.ts:124` as `vault.ts:129` does):

| repo type | id | data | idx |
|---|---|---|---|
| `identity.account_log` | `${accountId}:${seq padded to 8}` | `{accountId, seq, cid, envelope, receivedAt, source:'local'\|'peer'\|'import'}` | accountId, cid |
| `identity.account_doc` | accountId | `IdentityDocument` | state |
| `identity.account_held` | `${accountId}:${seq}:${cid}` | `{accountId, seq, envelope, receivedAt, expiresAt, reason:'gap'\|'window'}` | accountId, expiresAt |
| `identity.account_evidence` | cid | `{accountId, seq, envelope, receivedAt, kind}`, ≤ 5 per account | accountId |
| `identity.key_index` | did | `{accountId, role:'device'\|'recovery'}` | accountId |
| `identity.local_account` | `self` | `{accountId, deviceDid}`; absent ⇒ accountId = principal | — |
| `identity.recovery_kit` | accountId | kit file below, P4 | status |

```jsonc
// kit file = the vault record = what the user downloads (re-downloadable; the secret is not)
{ "format":"classrup.identity.recovery_kit/v1", "accountId":"did:key:…", "recoveryDid":"did:key:…", "createdAt":"…",
  "status":"active|superseded",
  "protectedIdentity": { "format":"classrup.identity-key/v1", "principal":"did:key:…(recoveryDid)",
     "secret": { "format":"classrup.sealed/v1", "kdf":"scrypt-131072-8-1", "cipher":"xchacha20poly1305", "salt":"…", "nonce":"…", "ciphertext":"…" } } }
```
The kit **secret**: 32 random bytes ‖ CRC-24 (OpenPGP polynomial 0x864CFB) = 280 bits = 56 Crockford base32 symbols (`0-9 A-Z` minus `I L O U`), shown once as 14 groups of 4. Its canonical form (uppercase, hyphen-joined, 59 chars) is the passphrase for `createIdentity` (`identity.ts:79`, length rule `:32`), so `protectedIdentity.secret` is sealed by the existing `seal` (`identity.ts:42`) and opened only by `unlockIdentity` (`identity.ts:91`) with the secret. Decoding is case-insensitive, maps `I/L→1`, `O→0`, ignores spaces/hyphens.

**Limits (`limits.ts`):** `MAX_PAYLOAD_BYTES 4096`, `MAX_LABEL_CP 60`, `MAX_ACTIVE_DEVICES 10`, `MAX_DEVICE_ENTRIES 200`, `MAX_LOG_EVENTS 2000`, `MAX_GAP 50`, `MAX_HELD_PER_ACCOUNT 20`, `MAX_HELD_TOTAL 500`, `HOLD_TTL_MS 24 h`, `DISPUTE_WINDOW_MS 259_200_000`, `MAX_EVIDENCE 5`, `MAX_PROOF_AGE_MS 600_000`, `MAX_ACCOUNTS 5000`; every bound rejects with a typed code.

## 3. Algorithms and state machines

**Fold** `foldLog(accountId, entries): IdentityDocument` is pure, O(n·d), n ≤ 2000, d ≤ 200. Start: genesis device active, `recoveryDid null`, `state active`, `head null`. Per entry in seq order:
- `device_link`: push `{did, label, status:'active', since: receivedAt}`; `key_rotate` also sets `until: receivedAt` on `revoke`.
- `device_revoke`: `until = receivedAt`, `status 'revoked'`. `recovery_setup`: `recoveryDid = payload.recoveryDid`.
- `recovery_claim`: `recovery = {…, windowEndsAt: receivedAt + 72 h, disputableBy: active dids}`; new device `since: windowEndsAt`; every other active device `until: windowEndsAt`.
- `recovery_dispute`: `state 'frozen'`, `frozen {reason:'dispute', candidates:[claim, dispute]}`.
- `resolve`: undo `drop` (fork: loser never applied; `drop = dispute` ⇒ unfreeze, keep claim; `drop = claim` ⇒ restore pre-claim devices, clear `recovery`); `state 'active'`.
- `account_close`: all devices `until = receivedAt`; `state 'closed'`.
Fork candidates live in `account_evidence`, not the log, so the fold depends on the log alone; the `fork` freeze is written by the receive step.

**Authorization at a point** `signerAt(doc_{k−1}, author, kind, receivedAt)`: unknown did ⇒ `SECURITY_SIGNER_UNKNOWN`; `until ≤ receivedAt` (or `until` set and kind ≠ `recovery_dispute`) ⇒ `SECURITY_KEY_REVOKED`; `state closed/frozen` ⇒ `CONFLICT_STATE {state}` (only `resolve` passes frozen); `since > receivedAt` (recovering device in the window) ⇒ hold `window`; author ∈ `disputableBy` ⇒ only `recovery_dispute`; `recoveryDid` ⇒ only `recovery_claim`/`resolve`; else the kind table, else `SECURITY_KEY_UNAUTHORIZED`.

**Receive decision** (fixed precedence, mirrors PS-087): `duplicate` (cid in log/held/evidence ⇒ no-op) → `reject` (verifyEnvelope throws ⇒ `IDENTITY_DOC_SIGNATURE_INVALID`; type/schema/size ⇒ `VALIDATION_FAILED`/`PAYLOAD_TOO_LARGE`; `seq > head+1+MAX_GAP` ⇒ `IDENTITY_DOC_CHAIN_INVALID`; log full ⇒ `IDENTITY_LOG_LIMIT`) → `hold` (`seq > head+1` ⇒ `gap`, `expiresAt = receivedAt + 24 h`; buffer full ⇒ `IDENTITY_LOG_BUFFER_FULL`) → `fork` (`seq ≤ head` with another cid, or `seq = head+1` with `prev ≠ head.cid`, **and** signer authorized at `fold(prefix seq−1)` ⇒ `frozen`, both candidates in evidence; unauthorized sibling ⇒ plain reject) → `authorize` (table above; `window` ⇒ hold until `windowEndsAt + 24 h`) → `guards` (limits, last device, proof: `verify(proof, {expectedType, expectedAuthor: device, now: receivedAt})` + payload binding, else `IDENTITY_LINK_INVALID`) → `apply` (append, refold, upsert doc and key index). `drain()` re-feeds held entries in `(accountId, seq)` order after each apply and on demand; expired holds are deleted. Receive is O(n) and one transaction per statement, so a bad statement never rolls back its neighbours.

**Authoring** `author(kind, fields)` runs the same checks against the local head with `receivedAt = clock.iso()`, signs with the vault's `UnlockedIdentity` (`StatementSigner`, `security/index.ts:41`) and applies in one transaction. Differences: proof `createdAt` older than 10 min ⇒ `IDENTITY_LINK_INVALID` (PS-052 V07); recovering device before `windowEndsAt` ⇒ `IDENTITY_RECOVERY_WINDOW_OPEN` (not a hold); dispute after `windowEndsAt` ⇒ `EXPIRED`.

**Machines** (`defineMachine`, `machine.ts:45`): account `active →(fork|dispute) frozen`, `frozen →(resolve) active`, `active →(account_close) closed` (terminal); recovery sub-state `none →(claim) pending →(windowEndsAt, receiver clock) effective`, `pending|effective →(resolve drop=claim) none`; device `active → revoked` once, a revoked did is never re-linked (PS-129 01.R03); held entry `held → applied | expired`.

**Recovery flow** (new empty vault, principal N): secret + kit file + exported log snapshot → `decodeKitSecret` (CRC before scrypt, `IDENTITY_KIT_WORDS_INVALID`) → `validateSealed` (`identity.ts:19`, `IDENTITY_KIT_PARAMS_INVALID`) → `unlockIdentity` (`IDENTITY_KIT_CORRUPT`) → proof by N, `recovery_claim` by the recovery identity, then `lock()` it (`identity.ts:75`) → import log, apply claim, write `local_account {accountId, deviceDid: N}`. N is active in this vault from `now + 72 h`; every other receiver counts its own 72 h from its receipt.

## 4. Public API

New files (catalog paths, `planning/modules.yaml:62,64`): `packages/identity/src/accounts/pseudonyms/{index,limits,errors,statements,fold,decide,log,resolver}.ts` + `README.md`, `packages/identity/src/accounts/recovery/{index,kit,recovery}.ts`, `*.test.ts` beside them, `tests/integration/identity-{accounts,recovery}.test.ts`; `packages/identity/src/index.ts` re-exports both `index.ts`.

```ts
// statements.ts — structural mirrors of Envelope, EnvelopeInput and VerificationOptions (envelope.ts:8-34); no federation import
export interface EnvelopeLike { /* same ten fields as Envelope */ }
export type SignFn = (signer: StatementSigner, input: EnvelopeInputLike) => Promise<EnvelopeLike>;      // = signEnvelope
export type VerifyFn = (input: unknown, opts?: VerificationOptionsLike) => Promise<EnvelopeLike>;      // = verifyEnvelope
export const IDENTITY_EVENT_TYPE = 'classrup.identity.event/v1'; export const IDENTITY_PROOF_TYPE = 'classrup.identity.proof/v1';
export const eventPayloadSchema: z.ZodType<EventPayload>;   // discriminated strictObject union, boundedString labels (schemas.ts:42)
export type EventKind = 'device_link' | 'device_revoke' | 'key_rotate' | 'recovery_setup' | 'recovery_claim' | 'recovery_dispute' | 'resolve' | 'account_close';

// errors.ts — defineErrors (app-error.ts:59); codes owned by PS-052/053/055/129/130, all retryable:false except *_BUFFER_FULL
export const identityErrors = defineErrors({ /* 422 */ IDENTITY_LINK_INVALID, IDENTITY_KIT_PARAMS_INVALID, IDENTITY_KIT_WORDS_INVALID, IDENTITY_KIT_CORRUPT,
  IDENTITY_DOC_SIGNATURE_INVALID, SECURITY_KEY_REVOKED, SECURITY_SIGNER_UNKNOWN, /* 409 */ IDENTITY_DEVICE_LIMIT, IDENTITY_LAST_DEVICE_KEY,
  IDENTITY_RECOVERY_WINDOW_OPEN, IDENTITY_DOC_CHAIN_INVALID, IDENTITY_LOG_LIMIT, /* 403 */ SECURITY_KEY_UNAUTHORIZED, /* 429, retryable */ IDENTITY_LOG_BUFFER_FULL });

// fold.ts / resolver.ts — pure
export function foldLog(accountId: string, entries: readonly LogEntry[]): IdentityDocument;
export function isAuthorizedSigner(document: IdentityDocument, did: string, atIso: string): Result<void, AppError>;  // ok | SECURITY_SIGNER_UNKNOWN | SECURITY_KEY_REVOKED | IDENTITY_RECOVERY_WINDOW_OPEN | CONFLICT_STATE{state}
export function decide(input: { prefix: readonly LogEntry[]; known: ReadonlySet<string>; heldCount: number; statement: EnvelopeLike; receivedAt: string }): Decision;
export type Decision = { kind: 'duplicate' } | { kind: 'reject'; error: AppError } | { kind: 'hold'; reason: 'gap' | 'window'; expiresAt: string } | { kind: 'fork'; reason: 'fork' | 'prev_mismatch' } | { kind: 'apply' };

// log.ts — persistence service
export interface AccountLogOptions { readonly storage: Storage; readonly clock: Clock; readonly sign: SignFn; readonly verify: VerifyFn; readonly tenantId: string; readonly random?: RandomFill }
export interface AccountLog {
  local(): Promise<{ accountId: string; deviceDid: string }>;                      // local_account record, else {principal, principal}
  document(accountId: string): Promise<IdentityDocument | undefined>;
  accountOf(did: string): Promise<{ accountId: string; role: 'device' | 'recovery' } | undefined>;
  author(signer: UnlockedIdentity, event: AuthorInput): Promise<Result<{ entry: LogEntry; document: IdentityDocument }, AppError>>;
  receive(statement: unknown, source: 'peer' | 'import'): Promise<Result<Decision['kind'] | 'frozen', AppError>>;
  drain(): Promise<{ applied: number; expired: number }>;
  exportLog(accountId: string): Promise<readonly EnvelopeLike[]>;                   // P0, seq order
  proveDevice(signer: UnlockedIdentity, accountId: string, purpose: ProofPurpose, subject: string): Promise<EnvelopeLike>;
}
export type AuthorInput = { kind: EventKind } & /* the kind's payload fields from §2 minus accountId; proofs passed as unknown */ Record<string, unknown>;
export function createAccountLog(options: AccountLogOptions): AccountLog;
export const identityCodecs: readonly BackupCodecLike[];   // {type, parse, validate, restoreData, indexes} for the seven repos

// recovery/index.ts
export function generateKitSecret(random?: RandomFill): { display: string; canonical: string };
export function decodeKitSecret(text: string): Result<string /* canonical */, AppError>;         // IDENTITY_KIT_WORDS_INVALID
export function createRecoveryKit(accountId: string, canonicalSecret: string, now: string): Promise<{ kit: RecoveryKitFile; identity: UnlockedIdentity }>;  // createIdentity(identity.ts:79)
export function openRecoveryKit(file: unknown, canonicalSecret: string): Promise<Result<UnlockedIdentity, AppError>>;  // validateSealed → IDENTITY_KIT_PARAMS_INVALID; unseal → IDENTITY_KIT_CORRUPT
export function setupRecovery(log: AccountLog, signer: UnlockedIdentity, opts?: { random?: RandomFill }): Promise<Result<{ display: string; kit: RecoveryKitFile }, AppError>>; // display never stored
export function beginRecovery(log: AccountLog, newDevice: UnlockedIdentity, input: { secret: string; kit: unknown; snapshot: readonly unknown[]; label: string }): Promise<Result<IdentityDocument, AppError>>;
export function disputeRecovery(log: AccountLog, signer: UnlockedIdentity, claimCid: string): Promise<Result<IdentityDocument, AppError>>;
export function exportRecoveryKit(log: AccountLog, accountId: string): Promise<RecoveryKitFile | undefined>;   // ciphertext only
```

Composition (merge step; `apps/pwa/src/main.ts` untouched here): `createAccountLog({ storage: session.storage, clock: createSystemClock(), sign: signEnvelope, verify: verifyEnvelope, tenantId: session.principal })`. Federation receivers (slice A) call `accountOf(envelope.author)` then `isAuthorizedSigner(document, author, receivedAtIso)`; an unknown did is a stand-alone principal, never silently an account member.

**Compatibility:** `vault.identity` (`vault.ts:6-8`) and `classrup.identity-key/v1` are untouched; an existing vault is an account with an empty log. `identityCodecs` match `BackupCodec` (`vault.ts:15-22`): `restoreData` rejects foreign tenants, `validate` re-verifies every stored envelope. Registering them changes the backup `recordTypes` set checked at `vault.ts:151`, so adding them to the PWA codec list is a merge-step decision with slice D (older backups must keep restoring).

## 5. Threat model and failure handling

| Threat / failure | Handling | Code / outcome |
|---|---|---|
| Forged or tampered statement | `verifyEnvelope` recomputes cid and signature (`envelope.ts:116-120`) | reject `IDENTITY_DOC_SIGNATURE_INVALID` |
| Unknown / revoked / unauthorized-for-kind signer | authorization at `fold(prefix)` | reject `SECURITY_SIGNER_UNKNOWN` / `SECURITY_KEY_REVOKED` / `SECURITY_KEY_UNAUTHORIZED` |
| Linking a key the author does not control; did already bound elsewhere | proof by the new key bound to `{accountId, purpose, subject}`; `key_index` lookup | reject `IDENTITY_LINK_INVALID` / `CONFLICT_STATE` |
| Replay / duplicate delivery | cid in log, held or evidence | `duplicate`, no change |
| Two authorized statements at one seq, or prev mismatch | freeze, both kept as evidence, no branch chosen | `frozen`; later statements `CONFLICT_STATE {state:'frozen'}` |
| Forged future-seq flood; log growth | gap > 50 rejected; ≤ 20 held per account, ≤ 500 total, 24 h TTL; 2000 statements per account, 5000 accounts | `IDENTITY_DOC_CHAIN_INVALID` / `IDENTITY_LOG_BUFFER_FULL` / `IDENTITY_LOG_LIMIT` |
| Backdated claim `createdAt` to skip the window | window anchored to each receiver's `receivedAt`; `createdAt` only future-bounded by `verifyEnvelope` (`envelope.ts:115`) | pending 72 h regardless |
| Backwards or jumping local clock | `receivedAt` from the injected `Clock` (`clock.ts:2`); a receipt earlier than `head`'s is clamped to it so `since/until` stay monotone; `drain` never re-opens an expired hold | no silent extension |
| Thief holds an active device, or secret + kit file | can revoke/dispute, or claim; the window and the freeze are the only brake | documented limit |
| Revoking the last device | refused unless `account_close` | `IDENTITY_LAST_DEVICE_KEY` |
| Kit secret typo / corruption | CRC-24 before scrypt (any single-symbol or adjacent-transposition error detected); AEAD failure after | `IDENTITY_KIT_WORDS_INVALID` / `IDENTITY_KIT_CORRUPT` |
| Secret leakage | returned once, never persisted or placed in errors; recovery identity `lock()`ed (`identity.ts:75`) at once | privacy test scans storage and exports |
| Oversize / non-canonical JSON; crash mid-operation | `strictCanonicalJson` limits (`envelope.ts:37-77`), payload ≤ 4 KiB; one `storage.transaction` (`storage.ts:16`) per statement | `PAYLOAD_TOO_LARGE` / `VALIDATION_FAILED`; no partial state |

Freezes vs rejects: **reject** when the statement cannot come from an authorized key at that point (unknown, revoked, wrong kind, bad proof) — the log is unaffected; **freeze** when two authorized histories exist (fork, prev mismatch, dispute) — evidence retained, `isAuthorizedSigner` answers `CONFLICT_STATE` for every key until a dual-signed `resolve`.

## 6. Test plan

Fixtures: `createFakeClock` (`clock.ts:33`), `createMemoryStorage` (`storage.ts:93`), real `signEnvelope`/`verifyEnvelope` injected, identities from `createIdentity` cached in `beforeAll` (30 s, as `alpha-security.test.ts:33`), `fast-check` 4.10.2. Rows marked **new** are appended to the named `module.spec.yaml`; `IDENTITY_LOG_LIMIT 409 no` and `IDENTITY_LOG_BUFFER_FULL 429 yes` are appended to PS-055 errors (no other module defines them, so no new warning).

| # | ID | level | scenario | expected |
|---|---|---|---|---|
| 1 | TEST-PS-052-09.T07 | unit | link D2 with valid proof; proof 11 min old; proof by D3 for D2; 11th active device; re-link revoked D2 | ok; `IDENTITY_LINK_INVALID`×2; `IDENTITY_DEVICE_LIMIT`; `SECURITY_KEY_REVOKED` |
| 2 | TEST-PS-052-09.T08 | integration | revoke the only active device | `IDENTITY_LAST_DEVICE_KEY`, document unchanged |
| 3 | TEST-PS-052-09.T17 **new** | integration | `key_rotate` D1→D2; then D1 signs | D2 active, D1 `until = receivedAt`; `SECURITY_KEY_REVOKED` |
| 4 | TEST-PS-052-09.T11 | integration | replay; D1 and D2 both author seq 4 | `duplicate`; `frozen`, two candidates, nothing deleted |
| 5 | TEST-PS-052-09.T16 | integration | export codecs, restore into a fresh vault | log/doc/kit round-trip; no plaintext key; re-verified |
| 6 | TEST-PS-053-09.T01 | unit | `setupRecovery` with seeded random | 59-char secret decodes to the 32 bytes; sealed `scrypt-131072-8-1`; record holds no secret |
| 7 | TEST-PS-053-09.T03 | unit | 55 symbols; symbol `U`; flipped symbol; swapped neighbours; bit-flipped ciphertext | `IDENTITY_KIT_WORDS_INVALID`×4 before scrypt; `IDENTITY_KIT_CORRUPT` |
| 8 | TEST-PS-053-09.T05 | integration | claim at t; new device authors at t+71 h and t+72 h; a peer receives that at its t'+71 h | `IDENTITY_RECOVERY_WINDOW_OPEN`; applied, D1/D2 `until = windowEndsAt`; peer holds, applies on `drain` |
| 9 | TEST-PS-053-09.T06 | integration | claim, then dispute by D2 in the window | `frozen {reason:'dispute'}`; all signers `CONFLICT_STATE`; no key revoked |
| 10 | TEST-PS-053-09.T09 | abuse | dispute by revoked D0; by unknown key; by D2 after window | `SECURITY_KEY_REVOKED`; `SECURITY_SIGNER_UNKNOWN`; `EXPIRED` |
| 11 | TEST-PS-053-09.T10 | chaos | `persist` throws during `setupRecovery`; `beginRecovery` replayed | no kit record, no entry; second claim `duplicate` |
| 12 | TEST-PS-053-09.T11 | abuse | serialize every record, export and error after setup | secret (canonical and raw) appears nowhere |
| 13 | TEST-PS-053-09.T04 | property | random setup/claim/dispute/resolve/close/link/revoke sequences | only declared transitions; ≤ 1 pending claim; frozen exits only via resolve |
| 14 | TEST-PS-053-09.T16 **new** | integration | claim `createdAt` 80 h in the past, received now | pending 72 h from receipt |
| 15 | TEST-PS-055-09.T03 | unit | tampered payload; wrong signer; 4097-byte payload; unknown kind | `IDENTITY_DOC_SIGNATURE_INVALID`; `PAYLOAD_TOO_LARGE`; `VALIDATION_FAILED`; nothing stored |
| 16 | TEST-PS-055-09.T04 | integration | receive seq 2, 3, replay 1, forked 3 | head 3; `duplicate`; `frozen` with evidence |
| 17 | TEST-PS-055-09.T05 | integration | `resolve` keep=3a drop=3b with 3b-author proof; proof by a third device | active, head = resolve; `IDENTITY_LINK_INVALID` |
| 18 | TEST-PS-055-09.T06 | property | 1..40-event chain, random permutations/duplications via `receive`+`drain` | same document as in-order; held ≤ 20; applied in seq order |
| 19 | TEST-PS-055-09.T10 | chaos | gap hold at 23 h 59 min and 24 h; 21st held per account; 501st total | kept / `expired`; `IDENTITY_LOG_BUFFER_FULL`×2 |
| 20 | TEST-PS-055-09.T11 | abuse | revoked device links; foreign did signs; gap 51 | `SECURITY_KEY_REVOKED`; `SECURITY_SIGNER_UNKNOWN`; `IDENTITY_DOC_CHAIN_INVALID` |
| 21 | TEST-PS-055-09.T16 **new** | unit | 2000th/2001st statement; `isAuthorizedSigner` at `since−1 ms`, `since`, `until−1 ms`, `until` | ok / `IDENTITY_LOG_LIMIT`; window-open, ok, ok, `SECURITY_KEY_REVOKED` |
| 22 | TEST-PS-129-09.T04 | integration | revoke (seq 5) received before link (seq 4) | held, then both applied in order |
| 23 | TEST-PS-129-09.T05 | integration | `key_rotate` from D1 and from D2 at one seq | `frozen`; evidence holds both cids |
| 24 | TEST-PS-130-09.T06 | integration | snapshots: active, revoked, unknown, frozen, closed | ok; `SECURITY_KEY_REVOKED`; `SECURITY_SIGNER_UNKNOWN`; `CONFLICT_STATE`×2 |
| 25 | TEST-PS-052-09.T10 | abuse | `author` with a locked identity; statement with swapped `accountId` | rejected, nothing persisted; `VALIDATION_FAILED accountId/MISMATCH` |

Covers PS-052 02.R02, 03.R02, 05.R01, 06.R03, 10.R01; PS-053 01.R01–03, 02.R01–03, 03.R01–03, 05.R02, 06.R03, 07.R01, 10.R01; PS-055 02.R01–02, 03.R01–03, 06.R01, 06.R03; PS-129 01.R03, 03.R02, 06.R03; PS-130 03.R02.

## 7. Open questions resolved

1. **Window anchored to receipt, not `createdAt`.** Claimed times are attacker-controlled; receipt time is the only time a verifier owns (PS-130 03.R02). Receivers disagree on `windowEndsAt` by their receipt delay, always on the conservative side.
2. **Fold is pure over the log; time enters only `isAuthorizedSigner(…, atIso)` and the receive gate**, so the document is replayable; `since/until` encode effectivity.
3. **One statement type with `kind`**: one `expectedType`, one zod union, one repo; `ext` stays free for additive fields.
4. **Proof is an inner envelope** (seq 1, prev null), because `signEnvelope`/`verifyEnvelope` are the only allowed paths; `{accountId, purpose, subject}` prevents cross-purpose replay; the outer signature binds position.
5. **Disputes freeze; `resolve` is dual-signed by the authors of the competing statements.** Any single-key tiebreak (recovery key, newest seq) hands the account to whoever stole that key; dual signature settles honest races (two own devices) and refuses to adjudicate adversarial ones, which a sequencer-free protocol cannot do truthfully.
6. **During a pending claim old devices may only dispute and the new device may do nothing**, keeping the fold to one post-claim branch point.
7. **Last device cannot be revoked even with a kit**; `account_close` is the explicit exit (narrower than PS-052 V09; T17 records it).
8. **Any active device may revoke another** (PS-129 V03); the recovery claim exists for the compromised-device case.
9. **Crockford base32 + CRC-24** — no dependency, deterministic typo detection, canonical form valid as a `createIdentity` passphrase.
10. **Kit file ≡ vault record** — re-downloadable ciphertext; only the secret is shown once.
11. **Chain scope is `(type, accountId)`, not envelope author** (authors change on rotation). Slice A's per-author FED-3 chains must scope identity statements by this key or exclude the type — interface note for the merge.

## 8. Honest limits

- Nothing is uploaded; relays are out of scope. Statements reach other vaults only as user-exported files, so "effective after 72 h" means 72 h after *each* receiver imports the claim; a peer that never imports it keeps trusting old devices.
- A fork or dispute involving an adversary ends `frozen` with no automated exit; the owner starts a new account. The design proves key control, never who holds the key.
- Recovery needs the kit file and a current log snapshot; a claim chained at a stale head freezes the account wherever newer statements exist.
- `isAuthorizedSigner` answers for *this vault's* document only; vaults with different logs answer differently, and the document claims no more than "statements this vault verified".
- Protection is the alpha's `scrypt-131072-8-1` + XChaCha20-Poly1305; nothing here is audited or production-ready, and recovery private material is in memory during setup and claim.
- Two codes are appended to PS-055; `pnpm spec:check` stays at 0 errors / 33 warnings only if existing codes are not redefined.
