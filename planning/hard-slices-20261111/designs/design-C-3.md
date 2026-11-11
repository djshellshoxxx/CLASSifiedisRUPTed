# Design C-3 — ADR-0013 account/device model as a signed identity log (minimal faithful implementation)

Repository `/home/user/CLASSifiedisRUPTed`, branch `claude/difficult-project-parts-dcqlup`; paths are repo-relative, `file:line` cites code this design depends on. Nothing here uploads anything: relays and delivery are out of scope; statements move by file/QR/paste exactly as alpha listings do.

## 1. Summary and scope

An account is `accountId = did:key` of its genesis key. The alpha identity record (`vault.identity/root`, `packages/vault/src/vault.ts:6-8,129`) *is* that genesis key, untouched and unmigrated: the first `identity.account.create` call appends a `genesis` event signed by `UnlockedVault.identity` (`vault.ts:36-44`). Every account change is one envelope of type `classrup.identity.event/v1` (allowed by the type regex at `packages/federation/src/envelope.ts:91`), chained per account by `payload.seq/prev`, signed by a key authorized at that position, and folded deterministically into an `IdentityDocument`. Signing and verification use only `signEnvelope`/`verifyEnvelope` (`envelope.ts:124-130`, `108-122`), reached through injected ports because `tools/deps/deps.mjs:9-14` puts `identity` and `federation` on the same layer and line 36 rejects such imports — the pattern discovery (`packages/discovery/src/search/index.ts:15-16`) and bazaar (`packages/bazaar/src/listings/index.ts:24-28`) already use. Key material at rest reuses `seal/unseal` and `createIdentity/unlockIdentity` (`packages/identity/src/identity.ts:42-59,79-107`) unchanged.

**MVP:** genesis, `device_link`, `device_revoke` (explicit `close`), atomic `key_rotate`, `recovery_setup`, `recovery_claim` (72 h window), `recovery_dispute` (freeze), deterministic fold, bounded hold buffer, fork freeze with retained evidence, idempotent replay, local manual thaw, `isAuthorizedSigner`, `accountOf`, kernel repos and commands, a one-time recovery kit with a dependency-free transcribable encoding, backup-codec validators.

**Deferred, each justified:** (a) relay delivery/sync outbox — out of scope by brief; (b) 7-day rotation overlap (PS-128 03.R02) — needs per-statement receipt-time semantics the alpha lacks; atomic rotation is strictly safer; (c) pseudonyms/handles (PS-052 V01-V06) — UTS #39 needs Unicode confusables data, a dependency; (d) PS-053 7-day pending expiry — unnecessary: the claim itself links the device and completes by time; (e) back-off for wrong kit secrets (PS-053 V07) — a 256-bit secret cannot be guessed, scrypt N=2^17 costs ~1 s per try, and a pre-unlock persisted counter is UI work; (f) a signed `classrup.identity.portable_doc/v1` snapshot — the log already is the signed portable artifact; a snapshot would be a second truth and fork surface; (g) wiring into `apps/pwa/src/main.ts` and `UnlockedVault` — files owned by other PRs, merge step; (h) editing spec command tables — only test rows and missing error codes are appended, keeping `pnpm spec:check` at 0 errors with no new warnings.

## 2. Data model and formats

### 2.1 Event envelope (CTR-FED-001, `envelope.ts:8-19`)

```json
{ "v": 1, "type": "classrup.identity.event/v1", "cid": "sha256-<hex>", "author": "did:key:z6Mk…signer",
  "createdAt": "2026-11-10T09:00:00.000Z", "seq": 1, "prev": null, "ext": {},
  "payload": { "accountId": "did:key:z6Mk…genesis", "seq": 4, "prev": "sha256-<cid of account seq 3>",
               "kind": "device_link", "device": { "did": "did:key:z6Mk…new", "label": "Laptop" },
               "proof": { "...": "classrup.identity.device_proof/v1 envelope signed by device.did" } },
  "sig": "<base64url, 64 bytes>" }
```

Envelope `seq/prev` remain the author's per-author counter owned by federation (FED-3, slice A); the alpha signs everything with `seq: 1, prev: null` (`vault.ts:113`) and the injected `sign` port decides them. The **account chain is `payload.seq/prev`**: `seq` starts at 1 and grows by exactly 1; `prev` is the `cid` of the previous *accepted* account event (`null` only at seq 1). `cid` covers the payload (`envelope.ts:116`), so chaining by cid is sound.

Payload per `kind` (zod `strictObject`; `label` 1..40 NFC code points without `\p{Cc}\p{Cf}`):

| kind | extra fields | author must be |
|---|---|---|
| `genesis` | `device:{did,label}`, `did === accountId`, `seq:1` | `accountId` |
| `device_link` | `device`, `proof` | an active device |
| `device_revoke` | `did`, `close:boolean` | an active device (may revoke itself) |
| `key_rotate` | `device`, `proof` — links `device`, revokes `author` | an active device |
| `recovery_setup` | `recoveryDid`, `proof` (role `recovery`) | an active device |
| `recovery_claim` | `device`, `proof`, `effectiveAt` = `createdAt` + 259 200 000 ms exactly | the current `recoveryDid` |
| `recovery_dispute` | `claimCid` | a device active before the claim |

**Proof** = nested envelope `classrup.identity.device_proof/v1`, `seq:1, prev:null`, `author` = the key proving possession, `payload: { accountId, role: "device"|"recovery", linkedBy: <outer author> }`, verified with `verify(proof, { expectedType, expectedAuthor: device.did })`; it must bind `payload.accountId === outer.accountId`, `payload.linkedBy === outer.author`, and `|proof.createdAt − outer.createdAt| ≤ 600 000 ms` (PS-052 V07). Replay to another account or linker fails.

**Bounds (constants in `events.ts`):** `MAX_IDENTITY_EVENT_BYTES = 8192` over `strictCanonicalJson` (`envelope.ts:37`; PS-055 V02); `MAX_DEVICES = 20` (PS-055); `MAX_ACTIVE_DEVICES = 10` (PS-052 V08); `MAX_LOG_EVENTS = 1000` per account (beyond → `PAYLOAD_TOO_LARGE {params:{limit:'log'}}`); `MAX_HOLD_AHEAD = 100`, `MAX_HELD_PER_ACCOUNT = 50`, `MAX_HELD_TOTAL = 500`, `HOLD_TTL_MS = 86 400 000` (PS-087 01.R03); `DISPUTE_WINDOW_MS = 259 200 000`; `PROOF_SKEW_MS = 600 000`; `MAX_EVIDENCE = 5` (PS-086 01.R01).

### 2.2 Identity document (`classrup.identity.document/v1`, derived, never signed)

```json
{ "format": "classrup.identity.document/v1", "accountId": "did:key:…", "state": "active",
  "head": { "seq": 4, "cid": "sha256-…" },
  "devices": [ { "did": "did:key:…", "label": "Phone", "status": "active", "since": "2026-11-10T09:00:00.000Z",
                 "linkCid": "sha256-…", "revokeCid": null } ],
  "recoveryDid": "did:key:…", "recovery": null, "freeze": null }
```

`state ∈ active|frozen|closed`; `status ∈ active|revoked`; `since` = `createdAt` of the event that set the status (an author claim). `recovery` = `{ claimCid, newDid, requestedAt, effectiveAt }` while a claim is pending. `freeze` = `{ reason: "fork_seq"|"prev_mismatch"|"dispute", at: <receiver clock>, evidence: [cid…≤5], resolution: null | { decidedAt, decision } }`. The stored document is a pure function of the accepted log; time is applied at read (3.3). Labels become public once a document is shared; the README says so.

### 2.3 Kernel repos (`defineRepo`, `packages/kernel/src/storage/repo.ts:26-38`; tenant = local principal as in `apps/pwa/src/main.ts:55-69`)

| type | id | data | indexes (slot order fixed, `repo.ts:23-24`) |
|---|---|---|---|
| `identity.log_event` | cid | `{accountId, seq, prev, author, kind, createdAt, envelope, receivedAt, status:'accepted'\|'evidence'}` | `account`; `accountSeq` = `${accountId}#${seq padded to 10}` (byte order, `memory-driver.ts:161-169`); `status` |
| `identity.document` | accountId | document above | `state` |
| `identity.held_event` | cid | `{accountId, seq, envelope, receivedAt, expiresAt}` | `account`, `expiresAt` |
| `identity.device_index` | device did | `{accountId, linkCid, since}` | `account` |
| `identity.recovery_key` | accountId | `{format:'classrup.identity.recovery_kit/v1', accountId, recoveryDid, key: ProtectedIdentity, createdAt, status:'active'\|'used'\|'superseded'}` | `status` |

`identity.recovery_key.key` is a `ProtectedIdentity` (`identity.ts:61`) whose `secret` is `Sealed` (`identity.ts:10-17`, scrypt-131072-8-1 + XChaCha20-Poly1305) under the kit secret: P4 at rest, unsealed only by `openRecoveryKit(kitFile, secret)`. The downloadable kit *file* is this record's data verbatim (re-downloadable, useless without the secret).

### 2.4 Kit secret encoding (no word list)

256 random bits (`crypto.getRandomValues`) + 24-bit checksum (first 3 bytes of `sha256(secret)`, `@noble/hashes/sha2.js`, already in `packages/identity/package.json`, export `node_modules/@noble/hashes/package.json:48`) = 280 bits = 56 Crockford base32 characters (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`, no I/L/O/U) shown as 14 groups of 4 (`K7Q2-…`). Decoding is case-insensitive, maps `O→0`, `I/L→1`, ignores hyphens/whitespace, re-encodes to the canonical 56-character form, which is the exact passphrase for `seal/unseal` (12–1024 UTF-8 bytes, `identity.ts:32`). Wrong length, character or checksum → `IDENTITY_KIT_WORDS_INVALID` with no position (PS-053 02.R03). The checksum catches every single-character error; a random error passes with probability 2⁻²⁴.

## 3. Algorithms and state machines

### 3.1 Fold (`fold.ts`, pure, synchronous)

`applyEvent(doc, ev)` takes a parsed, proof-verified event and checks, in order: `closed` → `CONFLICT_STATE {state:'closed'}`; `frozen` → `CONFLICT_STATE {state:'frozen'}`; `seq/prev` must extend `head` (the receiver guarantees this); authorization — `genesis` only at seq 1 with `author === accountId`; `recovery_claim` author `=== doc.recoveryDid` and `recovery === null`; `recovery_dispute` author active, not `recovery.newDid`, `recovery !== null`, `createdAt < effectiveAt`; every other kind needs an active device author: unknown → `SECURITY_SIGNER_UNKNOWN`, revoked → `SECURITY_KEY_REVOKED`, recovery key doing anything but a claim → `SECURITY_KEY_UNAUTHORIZED`. While `recovery` is pending, pre-claim devices may only dispute (`CONFLICT_STATE {state:'recovery_pending'}` otherwise); if `ev.createdAt ≥ effectiveAt` the pending recovery is first *completed* (pre-claim devices `revoked since effectiveAt`, `recovery → null`), after which a pre-claim author is `SECURITY_KEY_REVOKED`. Effects: `device_link`/`key_rotate` — `did` not already in this document (revoked never re-linked, PS-052 03.R02) and not bound to another account via `device_index`, else `IDENTITY_LINK_INVALID`; active < 10 and entries < 20, else `IDENTITY_DEVICE_LIMIT`; `key_rotate` then revokes the author. `device_revoke` — target active else `CONFLICT_STATE`; last active and `!close` → `IDENTITY_LAST_DEVICE_KEY`; `close` revokes all, `state:'closed'`, `recoveryDid:null`. `recovery_setup` — no pending recovery, replaces `recoveryDid`. `recovery_claim` — links `device`, sets `recovery`, clears `recoveryDid` (kit consumed). `recovery_dispute` — `state:'frozen'`, `freeze.reason:'dispute'`. Output carries `head = {seq, cid}`. Cost O(devices) ≤ 20 per event; a full fold of n ≤ 1000 events is O(20n).

`foldDocument(accountId, events)` is a left fold from `emptyDocument(accountId)`, pure, clockless. `materialize(doc, atIso)` completes a pending recovery when `atIso ≥ effectiveAt`. `isAuthorizedSigner(doc, did, atIso)` = `m = materialize(doc, atIso); m.state === 'active' && m.devices.some(d => d.did === did && d.status === 'active')` — frozen and closed accounts authorize nobody.

### 3.2 Receiver (`receiver.ts`): `decide` is pure; precedence duplicate → reject → fork → next → hold (PS-087 03.R02)

1. `known(cid)` → `duplicate`: nothing written.
2. Schema/size/proof failure → reject (`VALIDATION_FAILED`, `PAYLOAD_TOO_LARGE`, `IDENTITY_LINK_INVALID`; `SECURITY_ROTATION_INVALID` for a `key_rotate` without a valid proof).
3. `seq ≤ head.seq`, cid unknown → re-fold the stored prefix `[1..seq−1]` (O(seq) ≤ 1000) and run 3.1's guards against *that* document: valid there → `fork_seq` freeze; otherwise reject with the guard's code. A fork opens only from an event valid at its position (PS-086 02.R01): strangers and revoked keys never freeze anyone.
4. `seq === head.seq+1`, `prev !== head.cid` → same test → `prev_mismatch` freeze or reject.
5. `seq === head.seq+1`, `prev === head.cid` → `applyEvent` → accept or reject.
6. `seq > head.seq+1` → gap > 100 → `IDENTITY_LOG_GAP_TOO_LARGE`; per-account held ≥ 50 or total ≥ 500 → `IDENTITY_LOG_BUFFER_FULL` (429, retryable); else hold with `expiresAt = now + 24 h` (signature verified, authorization deferred).

`ingestEvent` runs in one `storage.transaction` (`packages/kernel/src/storage/storage.ts:10-22`): writes `log_event`, `document`, `device_index`, then drains the account's `held_event` rows in seq order while `seq === head+1`, each through `decide` again (a held fork still freezes). A freeze stores the conflicting event as `log_event` `status:'evidence'` and lists it in `freeze.evidence`; both versions survive (PS-055 06.R03). `sweepHeld(now)` deletes expired holds in pages ≤ 500 (`repo.ts:81`).

### 3.3 State machines and timeouts

- **Account:** `active → frozen` (fork_seq | prev_mismatch | dispute); `active → closed` (`device_revoke{close:true}`); `frozen → active` (thaw); `frozen → closed` (thaw with close); `closed` terminal — every later event `CONFLICT_STATE`, `isAuthorizedSigner` false.
- **Device:** `active → revoked` (revoke, rotate-out, recovery completion, close); terminal, never reused.
- **Recovery:** `none → pending` (claim; needs `recoveryDid`) → completed lazily when a folded event has `createdAt ≥ effectiveAt`, or at read via `materialize`; `pending → frozen` (dispute). **Kit:** `active → used` (claim) | `superseded` (new setup), both terminal (PS-053 03.R01).
- **Thaw** (`identity.account.thaw`, a local decision, not a statement): fork → `{keep: cid}` keeps the stored branch, evidence stays, `state:'active'`; dispute → `uphold_claim` completes the recovery now (`since = decidedAt`) or `reject_claim` revokes `recovery.newDid` and clears `recovery`; `recoveryDid` stays `null` because the kit was consumed. Recorded in `freeze.resolution`; it never propagates (section 8).

Timeouts: dispute window 72 h; hold TTL 24 h; proof skew 10 min; envelope future skew 5 min (`envelope.ts:115`). All time comes from the injected `Clock` (`packages/kernel/src/clock/clock.ts:2-7`) or `ctx.clock`; the fold uses only `createdAt` values inside the log.

## 4. Public API

New files `packages/identity/src/accounts/devices/{events,fold,receiver,repos,errors,definitions,index}.ts` and `packages/identity/src/accounts/recovery/{kit,index}.ts` (cross-module imports via `index.ts`, `deps.mjs:43`); exports appended to `packages/identity/src/index.ts`. No new dependencies, no `node:` imports.

```ts
// events.ts
export interface IdentityStatement { readonly v: 1; readonly type: string; readonly cid: string; readonly author: string; readonly createdAt: string;
  readonly seq: number; readonly prev: string | null; readonly payload: unknown; readonly ext: Readonly<Record<string, unknown>>; readonly sig: string } // = Envelope, envelope.ts:8-19
export interface VerifyOptions { readonly expectedType?: string; readonly expectedAuthor?: string; readonly now?: number; readonly maxAgeMs?: number } // envelope.ts:29-34
export interface IdentityPorts {
  readonly sign: (signer: StatementSigner, input: { readonly type: string; readonly createdAt: string; readonly payload: unknown }) => Promise<IdentityStatement>;
  readonly verify: (input: unknown, options?: VerifyOptions) => Promise<IdentityStatement>;
}
export type IdentityEvent = { readonly cid: string; readonly author: string; readonly createdAt: string; readonly envelope: IdentityStatement } & IdentityEventPayload; // zod union on kind
export function parseIdentityEvent(ports: IdentityPorts, input: unknown, now: number): Promise<Result<IdentityEvent, AppError>>;
export function signDeviceProof(ports: IdentityPorts, signer: StatementSigner, input: { accountId: string; role: 'device' | 'recovery'; linkedBy: string; createdAt: string }): Promise<IdentityStatement>;
// fold.ts
export function emptyDocument(accountId: string): IdentityDocument;
export function applyEvent(doc: IdentityDocument, ev: IdentityEvent): Result<IdentityDocument, AppError>;
export function foldDocument(accountId: string, events: readonly IdentityEvent[]): Result<IdentityDocument, AppError>;
export function materialize(doc: IdentityDocument, atIso: string): IdentityDocument;
export function isAuthorizedSigner(doc: IdentityDocument, did: string, atIso: string): boolean;
// receiver.ts
export type Decision = { kind: 'duplicate' } | { kind: 'accept'; doc: IdentityDocument } | { kind: 'hold'; expiresAt: string } | { kind: 'fork'; reason: 'fork_seq' | 'prev_mismatch' } | { kind: 'reject'; error: AppError };
export function decide(ev: IdentityEvent, current: IdentityDocument | undefined, prefix: (seq: number) => readonly IdentityEvent[], known: (cid: string) => boolean, held: { account: number; total: number }): Decision;
export function ingestEvent(scope: WriteScope, ports: IdentityPorts, input: unknown, clock: Clock): Promise<Result<IngestOutcome, AppError>>;
export function sweepHeld(scope: WriteScope, clock: Clock): Result<{ removed: number }, AppError>;
// repos.ts — identityLogRepo, identityDocumentRepo, identityHeldRepo, identityDeviceIndexRepo (RepoDef, 2.3)
export function accountOf(scope: ReadScope, did: string): { accountId: string; status: 'active' | 'revoked' } | undefined;
export function validateLogEventRecord(input: unknown, verify: IdentityPorts['verify']): Promise<void>;   // BackupCodec.validate hook, vault.ts:15-22
// errors.ts — defineErrors (app-error.ts:59-70): IDENTITY_LINK_INVALID 422, IDENTITY_DEVICE_LIMIT 409, IDENTITY_LAST_DEVICE_KEY 409, IDENTITY_KIT_PARAMS_INVALID 422,
//   IDENTITY_KIT_WORDS_INVALID 422, IDENTITY_KIT_CORRUPT 422, IDENTITY_RECOVERY_WINDOW_OPEN 409, IDENTITY_DOC_CHAIN_INVALID 409, IDENTITY_LOG_GAP_TOO_LARGE 422,
//   IDENTITY_LOG_BUFFER_FULL 429 retryable, SECURITY_SIGNER_UNKNOWN 422, SECURITY_KEY_REVOKED 422, SECURITY_KEY_UNAUTHORIZED 403, SECURITY_ROTATION_INVALID 422
// definitions.ts
export interface IdentityRuntimeOptions extends IdentityPorts { readonly identity: StatementSigner /* UnlockedVault.identity */ }
export function identityAccountDefinitions(o: IdentityRuntimeOptions): { readonly all: readonly AnyDefinition[] /* and each named definition */ };
// recovery/kit.ts
export function encodeKitSecret(bytes: Uint8Array): string;                       // 32 bytes → 'XXXX-…' (14×4)
export function decodeKitSecret(text: string): Result<string, AppError>;           // canonical 56 chars or IDENTITY_KIT_WORDS_INVALID
export function createRecoveryKit(ports: IdentityPorts, device: StatementSigner, accountId: string, createdAt: string, random?: (b: Uint8Array) => void): Promise<{ secret: string; kit: RecoveryKitFile; setup: IdentityStatement }>; // secret returned once, never stored
export function openRecoveryKit(kit: unknown, secret: string): Promise<StatementSigner>; // unlockIdentity(kit.key, canonical secret), identity.ts:91-107
export function signRecoveryClaim(ports: IdentityPorts, recovery: StatementSigner, newDevice: StatementSigner, doc: IdentityDocument, label: string, createdAt: string): Promise<IdentityStatement>;
export function signRecoveryDispute(ports: IdentityPorts, device: StatementSigner, doc: IdentityDocument, createdAt: string): Promise<IdentityStatement>;
export const recoveryKeyRepo: RepoDef<RecoveryKitFile, 'status'>;
```

Commands (`defineCommand`, `packages/kernel/src/bus/define.ts:47-63`; all `idempotent: true`, `surface: 'vault'`; handlers require `ctx.actor.id === o.identity.principal` else `FORBIDDEN` and sign inside the handler, as `apps/pwa/src/barter-runtime.ts:64-78` does): `identity.account.create {label}` (F07.S01.M01, cap `identity.account.create`; returns the existing head if present); `identity.device_key.add {proof, label}`; `identity.device_key.revoke {did, close}`; `identity.device_key.rotate {proof, label}`; `identity.recovery.create_kit {setup, kit}` (F07.S01.M03, cap `identity.recovery_kit.create`: persists the sealed record and ingests the pre-signed `recovery_setup` — the secret never enters the bus because `bus.ts:171-192` hashes raw inputs and stores outputs for 24 h); `identity.account.receive {envelope}` (F07.S02.M01: `ingestEvent`, also the path for claims and disputes signed outside this vault); `identity.account.thaw {accountId, decision}`; `identity.account.sweep {}`. Queries: `identity.account.get_own {}` (cap `identity.account.read_own`), `identity.account.get {accountId, at?}` → `materialize`, `identity.account.resolve_did {did}` → `accountOf` (cap `identity.account.read_public`).

Composition (merge step, one line each): `identityAccountDefinitions({ identity: session.identity, sign: (s, i) => signEnvelope(s, { ...i, seq: 1, prev: null }), verify: verifyEnvelope })`; `backupCodec(identityLogRepo)` with `validate: i => validateLogEventRecord(i, verifyEnvelope)` and `backupCodec(recoveryKeyRepo)` with `restoreData` rejecting a foreign `accountId` (pattern `main.ts:9-29`, `vault.ts:23-34`). Compatibility: `classrup.alpha.*`, `classrup.bazaar.listing/v1` and `classrup.vault.alpha_backup/v1` are untouched; `isAuthorizedSigner`/`accountOf` are offered to the discovery/mutiny receivers as an optional check at merge. Genesis is a command, not a `Migration`, because `Migration.up` is synchronous (`packages/kernel/src/storage/migrations.ts:8-13`) and signing is async.

## 5. Threat model and failure handling

| Case | Outcome |
|---|---|
| Bad signature, cid, type, size, timestamp | reject before any write (`verify` throws → `VALIDATION_FAILED`; size → `PAYLOAD_TOO_LARGE`) |
| Signer never in the account / revoked / account closed | `SECURITY_SIGNER_UNKNOWN` / `SECURITY_KEY_REVOKED` / `CONFLICT_STATE{closed}` |
| Recovery key signs anything but a claim; new device disputes its own claim | `SECURITY_KEY_UNAUTHORIZED` |
| Link without proof, stale proof (>10 min), proof bound to another account/linker | `IDENTITY_LINK_INVALID` (`SECURITY_ROTATION_INVALID` for rotate) |
| Same DID linked into a second account | `IDENTITY_LINK_INVALID`; first binding wins and needs the key owner's cooperation |
| Replay / duplicate cid | `duplicate`, no write, no event |
| Two valid events at one seq, or valid event with wrong prev (devices racing; a stolen still-active key rewriting history) | **freeze**, both versions kept, no silent acceptance, manual thaw |
| Stranger or revoked key sends a conflicting seq | reject, never a freeze (authorized-at-position test) |
| Thief holding the kit claims the account | 72 h window; any pre-claim device may dispute → freeze; with no surviving honest device the thief wins (PS-053 T01 limit) |
| Thief holding an old device disputes a legitimate recovery | freeze; the user decides locally; nobody wins silently |
| Backdated `createdAt` on a dispute | accepted (freeze is the conservative outcome); ordinary events cannot escape revocation because order is seq, not time |
| Gap > 100, > 50 held per account, > 500 total, > 1000 log events | `IDENTITY_LOG_GAP_TOO_LARGE`, `IDENTITY_LOG_BUFFER_FULL` (retryable), `PAYLOAD_TOO_LARGE`; holds expire after 24 h |
| Wrong kit secret, tampered kdf, flipped blob | `IDENTITY_KIT_WORDS_INVALID` (checksum, before scrypt), `IDENTITY_KIT_PARAMS_INVALID` (`identity.ts:24`), `IDENTITY_KIT_CORRUPT` (`identity.ts:57`), no position leak |
| Secret leakage through the kernel | the secret exists only as `createRecoveryKit`'s return and `openRecoveryKit`'s argument; never a command input/output, record, event or log field (`bus.ts:225-236` logs only ids and codes) |
| Clock anomalies | `verify` rejects > 5 min future; the fold ignores the receiver clock; `materialize` is monotone in `atIso` |
| Crash mid-command | one `storage.transaction` per command, rolled back on `err`/throw (`storage.ts:13-14`) |

Rule: **reject** anything not valid at its position; **freeze** only a valid-at-position event that contradicts accepted history, or a dispute.

## 6. Test plan (vitest, `fast-check` 4.10.2; every title carries its ID)

Unit (`packages/identity/src/accounts/devices/*.test.ts`, `.../recovery/kit.test.ts`; ports stubbed with a structural fake `verify` doing no crypto, so no federation import — real crypto is integration):

| # | ID | Scenario → expected | covers |
|---|---|---|---|
| U1 | TEST-PS-052-09.T01 | genesis fold → one active device, `accountId === author`, document JSON contains no `pkcs8`/`secret` | PS-052 01.R01,01.R02,04.R01 |
| U2 | TEST-PS-052-09.T07 | valid link; proof 11 min old → `IDENTITY_LINK_INVALID`; proof author ≠ device → `IDENTITY_LINK_INVALID`; 11th active → `IDENTITY_DEVICE_LIMIT`; re-link of revoked DID → `IDENTITY_LINK_INVALID` | 02.R02,02.R03,03.R02 |
| U3 | TEST-PS-052-09.T08 | revoke last device → `IDENTITY_LAST_DEVICE_KEY`; with `close` → `closed`; next event `CONFLICT_STATE` | 03.R02,02.R03 |
| U4 | TEST-PS-052-09.T17 (new row) | `key_rotate` links and revokes atomically; rotated-out key later → `SECURITY_KEY_REVOKED`; no proof → `SECURITY_ROTATION_INVALID` | 03.R02,04.R01,02.R02 |
| U5 | TEST-PS-055-09.T06 property | `fc.array` of random kinds/authors/labels (≤60) folded: ≤10 active, revoked never active again, only declared transitions, `head.seq` = accepted count, fold deterministic, duplicate apply is a no-op | PS-055 03.R01,03.R02,03.R03 |
| U6 | TEST-PS-055-09.T04 | seq 3 before 2 → held then applied; replay → duplicate; fork at seq 2 → frozen with evidence; prev mismatch → frozen; frozen rejects | 03.R01,03.R02 |
| U7 | TEST-PS-055-09.T16 (new row) property | every `fc.shuffledSubarray` permutation of a valid 1..n log converges to one document; gap 101 → `IDENTITY_LOG_GAP_TOO_LARGE`; 51st hold → `IDENTITY_LOG_BUFFER_FULL`; holds gone after 24 h; conflicting seq from a revoked key is rejected, not frozen | 03.R01,06.R03,02.R02 |
| U8 | TEST-PS-053-09.T04 property | random setup/claim/dispute/thaw sequences: ≤1 pending, kit `used` after claim, setup while pending → `CONFLICT_STATE`, used/superseded final | PS-053 01.R03,03.R01,03.R02,03.R03 |
| U9 | TEST-PS-053-09.T03 property | `fc.uint8Array({minLength:32,maxLength:32})` round trip; lowercase, `O/I/L`, hyphen-free variants decode equal; any single substitution, 55/57 chars → `IDENTITY_KIT_WORDS_INVALID` with empty `params` | 02.R02,02.R03 |
| U10 | TEST-PS-053-09.T01 | `createRecoveryKit` (fixed random): record holds only `Sealed` with `kdf 'scrypt-131072-8-1'`; `openRecoveryKit` signs as `recoveryDid`; wrong secret → `IDENTITY_KIT_CORRUPT`; tampered kdf → `IDENTITY_KIT_PARAMS_INVALID` | 01.R01,01.R02,02.R01 |
| U11 | TEST-PS-053-09.T05 | claim at T: old-device event at T+71 h → `CONFLICT_STATE{recovery_pending}`; `isAuthorizedSigner(old, T+71h)` true, `(old, T+72h)` false, `(new, T)` true; new-device event at T+72 h completes; old-device event at T+72 h → `SECURITY_KEY_REVOKED` | 03.R03,02.R03 |
| U12 | TEST-PS-053-09.T06 | dispute by old device in window → frozen; by `newDid` → `SECURITY_KEY_UNAUTHORIZED`; after window → `CONFLICT_STATE`; thaw `uphold_claim`/`reject_claim` effects | 03.R02,04.R03 |
| U13 | TEST-PS-052-09.T10 abuse | unknown signer, revoked signer, recovery key linking, `payload.accountId` mismatch, proof for another account, 8193-byte event, 1001st event → documented codes, nothing written | 05.R01,05.R02,05.R03 |
| U14 | TEST-PS-130-09.T06 | `isAuthorizedSigner` over active/revoked/unknown/frozen/closed; `accountOf` for genesis, linked, revoked, unknown | PS-130 03.R01,03.R02,03.R03 |

Integration (`tests/integration/identity-devices.test.ts`, `identity-recovery.test.ts`: real `signEnvelope`/`verifyEnvelope`, `createTestKernel` `harness.ts:80-126`, `vaultFromStorage(createMemoryStorage())` `vault.ts:59`, `createFakeClock`):

| # | ID | Scenario → expected | covers |
|---|---|---|---|
| I1 | TEST-PS-052-09.T09 | every command/query via the bus; each stored envelope re-verifies with `verifyEnvelope`; outputs JSON-normalised | 04.R01,04.R02,04.R03,09.R02 |
| I2 | TEST-PS-052-09.T11 | devices A and B (two kernels) append seq n concurrently, exchange logs → both frozen with evidence; same idempotency key → one result; same envelope twice → `duplicate` | 06.R01,06.R02,06.R03 |
| I3 | TEST-PS-055-09.T04 | Carol receives Alice's log as 3,1,2 → document equals Alice's own; replay duplicate; forked seq 3 → frozen, both kept | 03.R01,03.R02 |
| I4 | TEST-PS-053-09.T05 | kit created once; new device opens it and signs a claim; Alice's laptop and Carol receive it; 71 h vs 72 h authorization; laptop dispute → frozen everywhere; thaw | 03.R03,02.R03 |
| I5 | TEST-PS-053-09.T11 abuse | scan every record, idempotency row, log line and command output for the secret and private bytes → absent; `exportBackup` holds only `Sealed`; second claim while pending → `CONFLICT_STATE` | 07.R01,07.R02,07.R03 |
| I6 | TEST-PS-052-09.T16 | `exportBackup` with identity codecs → restore into a fresh vault → identical document, sealed kit record, evidence preserved; tampered log record fails `validateLogEventRecord` | 10.R01,10.R02,10.R03 |
| I7 | TEST-PS-128-09.T08 | rotation with a real second key; old key rejected afterwards; statement signed only by the new key → `SECURITY_ROTATION_INVALID` | PS-128 04.R03 |
| I8 | TEST-PS-055-09.T10 chaos | handler returns `err` after signing → nothing persisted; duplicate delivery → one `log_event` per cid; sweep after 24 h clears holds | 06.R01,06.R02,06.R03 |

Spec edits (append-only): PS-052 `T17 | integration | 03.R02,04.R01,02.R02 | key_rotate links the new device and revokes the signer in one statement | …`; PS-055 `T16 | property | 03.R01,06.R03,02.R02 | permuted and gapped identity logs | same document for every order; bounded holds; forks never silent`; PS-055 errors `IDENTITY_LOG_GAP_TOO_LARGE | 422 | no | …`, `IDENTITY_LOG_BUFFER_FULL | 429 | yes | …` (grep confirms neither exists in any spec, so `validate.mjs:213` raises no warning).

## 7. Open questions resolved

1. **Chain location:** `payload.seq/prev`, not envelope `seq/prev` — those are per-author (CTR-FED-001) and slice A's; a per-account chain there would read as author gaps to FED-3.
2. **Possession proof:** a nested `device_proof` envelope, keeping `verifyEnvelope` the only verification path; bound to `accountId` and `linkedBy`, 10-minute skew.
3. **Kit encoding:** Crockford base32 + 24-bit checksum, reusing `IDENTITY_KIT_WORDS_INVALID` with its spec meaning (transcription invalid or checksum fails); a 2048-word list is a dependency or 10 KB of embedded data with no security gain.
4. **Recovery key wrapping:** `createIdentity(canonicalSecret)` — existing `ProtectedIdentity` + `Sealed`, zero new crypto; scrypt over a 256-bit secret is redundant but harmless (~1 s).
5. **Recovery completion:** lazy and time-materialized; no `recovery_complete` event, since the new device may be offline at +72 h and a required event would stall every receiver.
6. **Rotation:** atomic single statement (1b).
7. **Unfreezing:** local thaw only; a signed resolution would have to come from a key the freeze itself contests.
8. **Genesis:** lazy command, not migration (`migrations.ts:12` is sync).
9. **Tenant for foreign documents:** the local principal's tenant keyed by `accountId`, like retained listings.
10. **Error ownership:** signer problems use PS-130/PS-129 `SECURITY_*` codes; link/limit/last-key PS-052; kit PS-053; buffering the two new PS-055 codes.
11. **`since` vs `freeze.at`:** `since` is the author's `createdAt` (a claim); `freeze.at` is the receiver clock (a local fact).
12. **Labels in a portable document:** kept per the brief's shape, ≤ 40 code points, documented as public once shared.

## 8. Honest limits

Not established: delivery or receipt of any statement (no relay, no outbox state beyond "local committed"); that peers learn a revocation before accepting a statement signed earlier (signing time is a claim); global agreement after a freeze (each receiver thaws on its own); who the person behind a key is; stopping a thief who holds the kit and faces no surviving honest device; secure erasure of the kit secret from JavaScript strings; encryption at rest of the P0/P3 log and document records (slice B); rate limiting of kit attempts; pseudonyms; any UI. "Frozen" means only "this vault refuses to upgrade trust until its user decides" (planning/CONSISTENCY_STATES.md).
