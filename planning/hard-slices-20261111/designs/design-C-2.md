# Design C-2 — ADR-0013 account/device model (adversarial-security lens)

Slice C, designer 2 of 3. Paths are relative to `/home/user/CLASSifiedisRUPTed`; citations are `file:line` on branch `claude/difficult-project-parts-dcqlup`.

## 1. Summary and scope

An **account** is `accountId = did:key` of the genesis key. The alpha identity (`vault.identity/root`, `packages/vault/src/vault.ts:6-8,129`) *is* the genesis device: an empty log folds to `{devices:[{did: accountId, status:'active'}]}`, so nothing migrates and an unknown DID is its own account. State changes are CTR-FED-001 envelopes of one type, `classrup.identity.event/v1`, chained **per account** by the envelope's own `seq`/`prev` (shape enforced by `packages/federation/src/envelope.ts:95-96`). A receiver stores accepted events, holds out-of-order ones (bounded, expiring) and re-folds the log into an `IdentityDocument` on every change; anything other than one straight chain signed by keys authorized at that point freezes the document with evidence.

**Adversarial stance:** any key an attacker can obtain — stolen unlocked device, copied kit, captured proof — *is* an authorized key until revocation is known. Hence (a) every counter-signature binds account, purpose and a one-time `linkId`; (b) ownership-changing events (`recovery_claim`, `account_close`, kit replacement without the old kit) are **guarded**: effective 72 h after *local receipt*, disputable; (c) competing valid claims freeze; (d) timers use the receiver's injected clock, never a claimed `createdAt`.

**Constraint found:** `tools/deps/deps.mjs:9-15` puts `identity` and `federation` in one layer and L36-41 rejects same-layer imports, type imports included. `signEnvelope`/`verifyEnvelope` (`envelope.ts:124,108`) are therefore injected as a `StatementCrypto` port, as `packages/discovery/src/search/index.ts:17-18` does, and stay the only signing/verification path. `packages/identity/src/*.test.ts` use a structural fake port; real-crypto tests live in `tests/integration/identity-*.test.ts`.

**MVP:** statements and schemas; fold with fork freeze and local resolution; hold buffer; bindings/`accountOf`; `isAuthorizedSigner`; word-list-free kit; sealed recovery key; bus definitions; repos and backup codecs; spec rows and codes.

**Deferred:** (1) relays/transport — statements move as files/QR; the README says so. (2) Signed `classrup.identity.portable_doc/v1` (PS-055) — the fold is derived evidence; a signed copy is a second forkable chain. (3) Pseudonyms/handles (PS-052 V01-V06) — no bearing on key authority. (4) Pruning revoked devices after 180 d — `isAuthorizedSigner` would fail closed on old statements; the 256-event bound bounds documents. (5) Kit-entry backoff (PS-053 V07) — 256 random bits and scrypt N=2^17 per guess make it UX, not security. (6) PS-129 freshness registry — the document plus `receivedAt` carries the same facts. (7) Sessions (PS-054).

## 2. Data model and formats

### 2.1 Statement envelope
Exactly `Envelope` (`envelope.ts:8-19`): `{v:1, type:"classrup.identity.event/v1", cid, author:<signer did:key>, createdAt, seq:<log position>, prev:<cid of seq-1 | null>, payload, ext:{}, sig}`. `verifyEnvelope` (`envelope.ts:108-122`) checks shape, size/depth (`:37-77`), +5 min future skew (`:115`), cid and Ed25519; the receiver further bounds JCS bytes to **8 192** (PS-055 01.R02).

### 2.2 Payload family (zod `strictObject`, unknown keys ⇒ `VALIDATION_FAILED`)
Common fields `accountId` (did:key ≤ 64 chars) and `kind`:
```json
{"kind":"device_link",     "accountId":"did:key:z6Mk…", "device":{"did":"did:key:z6Mk…","label":"Laptop"}, "proof":<Proof>}
{"kind":"device_revoke",   "accountId":"…", "did":"…", "reason":"lost|compromised|retired"}
{"kind":"key_rotate",      "accountId":"…", "device":{…}, "proof":<Proof>}
{"kind":"recovery_setup",  "accountId":"…", "recoveryDid":"…", "proof":<Proof>, "replaces":<cid|null>, "proofPrevious":<Proof|null>}
{"kind":"recovery_claim",  "accountId":"…", "setup":<cid of recovery_setup>, "device":{…}, "proof":<Proof>}
{"kind":"recovery_dispute","accountId":"…", "target":<cid of the pending guarded event>}
{"kind":"account_close",   "accountId":"…"}
```
`label`: 1..40 code points, NFC, no `\p{Cc}\p{Cf}` (`boundedString`, `packages/kernel/src/validation/schemas.ts:42`); `reason`/`kind` closed enums.

**Proof** = a complete envelope of type `classrup.identity.proof/v1`, `seq:1, prev:null`, `author` = the key proving possession, payload `{accountId, purpose:<kind>, subject:<author did>, linkId:<uuidv7>}`, JCS ≤ 2 048 bytes, verified with `verifyEnvelope(proof,{expectedType, expectedAuthor, now: Date.parse(event.createdAt)})`, `|event.createdAt − proof.createdAt| ≤ 600 000 ms` (PS-052 V07), `linkId` unused in this log. Bound to (account, purpose, subject, linkId), it cannot be replayed elsewhere or twice.

### 2.3 Vault records (`defineRepo`, `packages/kernel/src/storage/repo.ts:26-38`; tenant = vault principal; ids control-char free per `vault.ts:159`; `seq6` = six zero-padded digits)
- `identity.log_event` id `${accountId}/${seq6}/${cid}`: `{accountId, seq, cid, prev, author, kind, envelope, receivedAt}`; indexes `account`, `position=${accountId}/${seq6}`.
- `identity.held_event` id `${accountId}/${cid}`: `{accountId, seq, prev, author, envelope, receivedAt, expiresAt}`; indexes `account`, `expiresAt`.
- `identity.document` id `accountId`: `IdentityDocument & {foldedAt}`; index `state`.
- `identity.binding` id `did`: `{did, accountIds: string[] ≤ 8}`.
- `identity.resolution` id `${accountId}/${seq6}`: `{accountId, seq, decision:'choose'|'uphold'|'reject', cid, decidedAt}`; index `account`.
- `identity.recovery_key` id `accountId`: `{format:'classrup.identity.recovery_key/v1', accountId, recoveryDid, setupCid, key: ProtectedIdentity, createdAt}` — P4, `key.secret` is `Sealed` (`identity.ts:10-17,61`).
- `identity.self` id `self`: `{deviceDid, accountId}`; absent ⇒ `accountId = principal`.

### 2.4 Document
```ts
interface IdentityDocument {
  accountId: string; state: 'active'|'frozen'|'closed';
  devices: readonly { did; label; status: 'active'|'revoked'; since: string|null; until: string|null; linkedBy: 'genesis'|'device_link'|'key_rotate'|'recovery_claim' }[];   // ≤ 256, ≤ 10 active
  recoveryDid: string|null; head: { seq: number; cid: string }|null;
  pending: null|{ kind: 'recovery_claim'|'recovery_setup'|'account_close'; cid; seq; receivedAt; effectiveAt };
  frozen: null|{ reason: 'fork'|'prev_mismatch'|'dispute'|'late_dispute'; seq; cids: string[] };
  superseded: string[]; closedAt: string|null;
}
```
`since/until` of link/revoke/rotate are signed `createdAt` claims (identical everywhere); those from an effective recovery claim, and `pending.effectiveAt`, are **local** (`receivedAt + 72 h`) by design (§5).

### 2.5 Recovery kit (no word list)
`secret` = 32 bytes from an injected `RandomFill` (default `crypto.getRandomValues`). Transcription form: `secret ‖ SHA-256(secret)[0..2]` = 272 bits ⇒ **55 Crockford base32 chars** (3 zero pad bits) in 11 groups of 5: `K7Q2M-3F8RW-…`. Decoding is case-insensitive, maps `O→0`, `I/L→1`, ignores `-`/spaces, rejects everything else; the 16-bit checksum catches a transcription error with probability 1−2⁻¹⁶ before any scrypt work. The canonical string is the *passphrase* for `createIdentity(kit)` / `unlockIdentity(file.key, kit)` (`identity.ts:79,91`; 12..1024 bytes, `:32`), so the unchanged `seal` (`:42`) protects the recovery private key. Kit file (user download; otherwise only the vault's P4 record and the user's sealed backup): `{format:'classrup.identity.recovery_kit/v1', accountId, recoveryDid, setupCid, key: ProtectedIdentity}`. ADR-0013's "24-word-equivalent" secret thus needs no word table.

### 2.6 Bounds (exported constants)
`MAX_IDENTITY_EVENT_BYTES=8192`, `MAX_PROOF_BYTES=2048`, `MAX_LOG_EVENTS=256`/account, `MAX_ACTIVE_DEVICES=10`, `MAX_ACCOUNTS=5000`/vault, `MAX_HELD_PER_ACCOUNT=16`, `MAX_HELD_PER_VAULT=512`, `HOLD_TTL_MS=86 400 000`, `DISPUTE_WINDOW_MS=259 200 000`, `LINK_PROOF_SKEW_MS=600 000`, `MAX_BINDINGS_PER_DID=8`.

## 3. Algorithms and state machines

### 3.1 Ingest (one kernel transaction; outcomes `accepted | duplicate | held | rejected{code} | frozen`)
1. `verifyEnvelope(input,{expectedType, now})`; any throw ⇒ `IDENTITY_DOC_SIGNATURE_INVALID` (no message leaks); JCS > 8 192 bytes ⇒ `PAYLOAD_TOO_LARGE`; schema (§2.2) ⇒ `VALIDATION_FAILED`.
2. Load the account's log (`position` index). Same cid in log or hold ⇒ `duplicate`, no write. Log full ⇒ `PAYLOAD_TOO_LARGE`; new account beyond `MAX_ACCOUNTS` ⇒ `PRECONDITION_FAILED`. Fold (§3.2); `closed` ⇒ `CONFLICT_STATE{state:'closed'}`.
3. Placement against `H = doc.head`: `prev === H.cid && seq === H.seq+1` ⇒ next. A `recovery_claim` may instead name as `prev` any accepted cid at seq ≥ seq(`payload.setup`) (§3.4), else `IDENTITY_DOC_CHAIN_INVALID`. `seq ≤ H.seq` with a different cid, or `seq === H.seq+1` with `prev ≠ H.cid` ⇒ fork candidate: store if authorized at `doc(seq−1)` (the fold freezes), else reject. `seq > H.seq+1` or unknown `prev` ⇒ hold (§3.5) only when `author` is known to `doc` (active device, `recoveryDid`, `pending` device), else `SECURITY_SIGNER_UNKNOWN`.
4. Authorize at `doc(seq−1)` (§3.3): revoked ⇒ `SECURITY_KEY_REVOKED`; unknown ⇒ `SECURITY_SIGNER_UNKNOWN`; not permitted ⇒ `SECURITY_KEY_UNAUTHORIZED`; guards and proofs ⇒ their codes.
5. Persist `identity.log_event` (`receivedAt = clock.iso()`), update bindings, refold, CAS-write `identity.document`; a racing tab gets `CONFLICT_REVISION` and the kernel rolls everything back (`packages/kernel/src/storage/storage.ts:50-55`). Drain held events whose `prev` is now accepted, in seq order (≤ 16 rounds).

Cost per ingest: O(n log n + n·d), n ≤ 256 events, d ≤ 256 devices; one Ed25519 verify per event plus one per embedded proof.

### 3.2 Fold: `foldIdentityLog(entries, resolutions, now)` (pure)
Group accepted entries `{seq, cid, prev, author, kind, payload, createdAt, receivedAt}` by seq; start from the genesis document; walk `seq = 1..`:
- no candidate ⇒ stop, head = seq−1;
- several candidates, or one whose `prev ≠ head.cid` (claims excepted) ⇒ apply the candidate named by a local `resolution{choose}`, mark the rest `superseded`; otherwise `state='frozen'`, `frozen={reason, seq, cids}`, stop (later events retained, unapplied);
- one candidate ⇒ re-check authorization (a tampered store yields `frozen{prev_mismatch}`); immediate kinds mutate `doc`; guarded kinds set `pending` (one at a time; a second is rejected at ingest, `CONFLICT_STATE{state:'pending'}`); an eligible `recovery_dispute` on `pending.cid` ⇒ `frozen{dispute}` unless a resolution `uphold` (apply) or `reject` (drop) exists.
After the walk, if `pending` and `now ≥ pending.effectiveAt`, apply it: claim per §3.4; setup ⇒ `recoveryDid` replaced; close ⇒ `state='closed'`, `closedAt=effectiveAt`, every device `until=effectiveAt`. Output depends only on (entry set, resolutions, provenance, now); arrival order is irrelevant (§6, test 6).

### 3.3 Authorization at doc(seq−1)
- **device_link** — active device. `device.did` unseen, ≠ `accountId`; active < 10 else `IDENTITY_DEVICE_LIMIT`; proof purpose `device_link` by `device.did` else `IDENTITY_LINK_INVALID`; revoked did ⇒ `SECURITY_KEY_REVOKED`.
- **device_revoke** — active device, self allowed. Target active else `CONFLICT_STATE`; last one ⇒ `IDENTITY_LAST_DEVICE_KEY`.
- **key_rotate** — the active device being replaced. Link guards for the new did; old revoked and new active atomically.
- **recovery_setup** — active device. Proof by `recoveryDid`; replacing an existing key is immediate only with `replaces` = current setup cid and `proofPrevious` by the current recovery key, else guarded 72 h.
- **recovery_claim** — `doc.recoveryDid` at head. `setup` = cid that registered that key; proof by `device.did`; always guarded; a second claim while pending ⇒ `CONFLICT_STATE`.
- **recovery_dispute** — for a pending claim, any device active at the claim's receipt; for pending setup/close, any other active device or `recoveryDid`. `target === pending.cid`; a dispute arriving after the effect from a then-eligible key is `late_dispute` ⇒ frozen: an offline owner is never silently overruled.
- **account_close** — active device; always guarded.

### 3.4 Guarded events and the recovery branch
`effectiveAt = receivedAt + DISPUTE_WINDOW_MS` on the **receiver's** clock. Claim effect: every device active at the receiver's head gets `until = effectiveAt`; `device.did` becomes active (`since = effectiveAt`, `linkedBy:'recovery_claim'`); `recoveryDid = null` (one-time kit: a replayed claim is `duplicate`, a fresh one by that key `SECURITY_SIGNER_UNKNOWN`); `head = claim` and the chain is **re-rooted**: later events chain from the claim, old-branch events at seq ≥ claim.seq become `superseded`. Only claims may branch, because a recoverer without relays may hold a stale log; revocations and the author check use the receiver's head, so an early branch resurrects nothing.

### 3.5 Hold buffer
Keyed by `(accountId, cid)`; ≤ 16 per account, ≤ 512 per vault (`IDENTITY_DOC_BUFFER_FULL`, retryable); `expiresAt = receivedAt + HOLD_TTL_MS`, or `pending.effectiveAt + HOLD_TTL_MS` behind a not-yet-effective claim. `expireHeld(now)` runs at vault open and from the retention hook, reporting `rejected{EXPIRED}`; payloads stay unread until their predecessor exists.

### 3.6 Document machine
`active` (initial) →`event`→ `active`; →`fork|dispute`→ `frozen`; →`close`→ `closed` (terminal); `frozen` →`resolve`→ `active` **only** through a local `identity.resolution`, never by a statement. Encoded with `defineMachine` (`packages/kernel/src/machine/machine.ts:45`) as `identityDocumentMachine`.

### 3.7 `isAuthorizedSigner(doc, did, atIso)` and `accountOf`
`false` unless `doc.state === 'active'` and `atIso` is a timestamp; then true iff a device with `did` has `since ≤ atIso` (null = −∞) and (`until === null || atIso < until`). `recoveryDid` never authorizes statements. `accountOf(did)`: one binding ⇒ that account; none ⇒ `did` (implicit genesis); several ⇒ `undefined` (fail closed).

## 4. Public API

New files: `packages/identity/src/accounts/devices/{statements,fold,ingest,author,repos,definitions,index}.ts` (F07.S01.M01 + F07.S02.M01) and `packages/identity/src/accounts/recovery/{kit,index}.ts` (F07.S01.M03); cross-module imports only via `index.ts` (`deps.mjs:44`).
```ts
// statements.ts
export const IDENTITY_EVENT_TYPE = 'classrup.identity.event/v1', IDENTITY_PROOF_TYPE = 'classrup.identity.proof/v1';
export interface IdentityEnvelope { v:1; type; cid; author; createdAt; seq:number; prev:string|null; payload:unknown; ext; sig }
export interface StatementCrypto {   // root passes { signEnvelope, verifyEnvelope }
  sign(signer: StatementSigner, input: { type; createdAt; seq; prev; payload; ext? }): Promise<IdentityEnvelope>;
  verify(input: unknown, options: { expectedType?; expectedAuthor?; now: number; maxAgeMs? }): Promise<IdentityEnvelope>;
}
export const identityEventPayload: z.ZodType<IdentityEventPayload>;                 // union of §2.2
export const identityErrors = defineErrors({ /* codes of §5, statuses per owning spec */ });   // app-error.ts:59
// fold.ts (pure)
export function foldIdentityLog(entries: readonly LogEntry[], resolutions: readonly Resolution[], now: number): IdentityDocument;
export function isAuthorizedSigner(doc: IdentityDocument, did: string, atIso: string): boolean;
// ingest.ts (scope = a handler's ctx.tx, packages/kernel/src/storage/scope.ts:50-55)
export async function ingestIdentityEvent(scope: Pick<WriteScope,'repo'>, deps: { crypto: StatementCrypto; clock: Clock }, input: unknown): Promise<Result<IngestOutcome, AppError>>;
export function expireHeld(scope: Pick<WriteScope,'repo'>, now: number): Result<{ expired: string[] }, AppError>;
export function resolveFrozen(scope, accountId: string, d: { seq: number; decision: 'choose'|'uphold'|'reject'; cid: string }, now: number): Result<IdentityDocument, AppError>;
export function readDocument(scope: Pick<ReadScope,'repo'>, accountId: string, now: number): IdentityDocument;   // always refolds
export function accountOf(scope: Pick<ReadScope,'repo'>, did: string): string | undefined;
// author.ts — returns signed events; the caller ingests them (own events take the receiver path)
export function createIdentityAuthor(o: { signer: StatementSigner; crypto: StatementCrypto; clock: Clock; ids: IdGen }): {
  makeProof(accountId, purpose: Kind); linkDevice(head: Head, accountId, device: {did; label}, proof); revokeDevice(head, accountId, did, reason);
  rotateKey(head, accountId, device, proof); setupRecovery(head, accountId, recoveryDid, proof, previous?: { replaces; proofPrevious });
  dispute(head, accountId, target); closeAccount(head, accountId);   // each Promise<IdentityEnvelope>
};
// repos.ts — §2.3 definitions; codecs per vault.ts:15-34 (`validate` re-verifies envelopes; held events never exported)
export function identityBackupCodecs(crypto: StatementCrypto, now: () => number): readonly BackupCodec[];
export function identityDefinitions(o: { crypto: StatementCrypto; signer: StatementSigner; principal: string }): { all: AnyDefinition[] };
// recovery/kit.ts
export function encodeKitSecret(secret: Uint8Array): string;                  // 55 chars, 11 groups
export function decodeKitSecret(text: string): Result<Uint8Array, AppError>;  // IDENTITY_KIT_WORDS_INVALID
export async function createRecoveryKit(o: { random?: RandomFill }): Promise<{ secret: string; recovery: UnlockedIdentity; key: ProtectedIdentity }>;   // createIdentity(secret)
export async function openRecoveryKit(file: unknown, secret: string): Promise<UnlockedIdentity>;   // identity.ts:19,91 → IDENTITY_KIT_PARAMS_INVALID | _WORDS_INVALID | _CORRUPT
export async function verifyRecoveryKit(file: unknown, secret: string, expectedRecoveryDid: string): Promise<Result<void, AppError>>;   // opens, compares, locks
export async function claimRecovery(o: { file; secret; crypto; clock; ids; newDevice: StatementSigner; knownHead: Head; setupCid; label }): Promise<IdentityEnvelope>;
```
Bus wrappers: commands `identity.event.ingest`, `identity.device_key.{add,revoke,rotate}`, `identity.recovery.{create_kit,begin,cancel}`, `identity.account.close`, `identity.portable_doc.resolve`; queries `identity.portable_doc.get`, `identity.account.resolve_did`. `packages/identity/src/index.ts` re-exports everything plus §2.6. Composition (merge step): `apps/pwa/src/main.ts` adds `identityDefinitions({ crypto:{sign:signEnvelope, verify:verifyEnvelope}, signer: session.identity, principal })` to the registry and `identityBackupCodecs(...)` to `openVault({codecs})`; federation receivers call `readDocument`, `isAuthorizedSigner(doc, author, receiptIso)` and `accountOf(author)`.

**Compatibility:** `vault.identity/root`, `classrup.identity-key/v1`, `classrup.sealed/v1`, `classrup.vault.alpha_backup/v1` and every `classrup.alpha.*` type are untouched. Old vaults open with an empty log as their own genesis account; `restoreBackup` (`vault.ts:140-190`) rejects unknown record types, so pre-slice backups restore unchanged. Rotating the genesis device keeps `accountId`; the vault `principal` stays the device DID and `identity.self` names the account.

## 5. Threat model and failure handling

- **Stolen unlocked device revokes the owner's other devices.** Allowed: an active key is an active key. Recourse: kit → `recovery_claim` (72 h); if the thief disputes, `frozen{dispute}` ⇒ the owner resolves locally and re-issues on the chosen branch.
- **Stolen device replaces the recovery key or closes the account.** Guarded 72 h; the recovery key and other devices may dispute.
- **Unrevoked stolen key races the revocation** (O revokes S at n, S revokes O at n). Both authorized at n−1 ⇒ `frozen{fork}`; a receiver freezes once it sees both.
- **Forged claim without the kit.** Author must equal `recoveryDid` at head, else `SECURITY_SIGNER_UNKNOWN` with no state touched.
- **Copied kit, kit reuse.** Two valid claims ⇒ `frozen{fork}`; `recoveryDid` is cleared once a claim takes effect, so that key is unknown afterwards; same cid ⇒ `duplicate`.
- **Backdated `createdAt`; "the window already passed, apply now".** Anchored to local `receivedAt`; nothing applies a pending event early (`IDENTITY_RECOVERY_WINDOW_OPEN`); a late dispute still freezes.
- **Replay of an old link/claim.** cid dedupe ⇒ `duplicate`; an old seq with a different cid is a fork candidate only if its signer was authorized then (`SECURITY_KEY_REVOKED` otherwise).
- **Captured proof reused** across account, purpose or a second link. Binds `accountId`, `purpose`, `subject`, one-time `linkId`, skew ≤ 10 min ⇒ `IDENTITY_LINK_INVALID`.
- **Victim's DID bound into the attacker's account.** Needs the victim's key for the proof; a colluding key in two logs makes `accountOf` `undefined`, harming neither log.
- **Hold-buffer flood.** Only authors known to the document are held: 16/account, 512/vault, 24 h TTL.
- **Tampered store or backup.** Fold re-checks chain and authorization (frozen); restore re-verifies every envelope (rejected).
- **Kit brute force or typo.** 256 random bits, one scrypt N=2^17 per guess; the checksum fails fast, revealing no position (`IDENTITY_KIT_WORDS_INVALID`, `IDENTITY_KIT_CORRUPT`).
- **Kit secret leakage.** Never persisted, logged or exported; only `recoveryDid` and the `Sealed` key are stored; errors are codes only.
- **Clock jumps backwards.** `now < receivedAt` keeps pending; one injected clock feeds all TTLs.

**Reject** (nothing stored): bad signature, schema, size, unauthorized/unknown/revoked signer, reused linkId, limits, pending collision, closed account, gaps outside hold rules. **Freeze** (stored with evidence, no effect): only conflicts between *valid* events — fork, prev mismatch, dispute. **Hold**: events from known keys awaiting predecessors.

## 6. Test plan (titles carry the IDs; new spec rows are appended)

Fixtures: fake clock `2026-11-04T10:00:00.000Z`, deterministic ids; keys A (genesis), D1, D2, N (new), R (recovery), X (attacker); fake port in unit, real envelopes in integration.

Unit (`packages/identity/src/accounts/devices/fold.test.ts`, `recovery/kit.test.ts`):
1. `TEST-PS-052-09.T01` empty log folds to the genesis document; `accountOf(unknown)` is itself.
2. `TEST-PS-052-09.T07` valid link accepted; proof skew 11 min or wrong proof author ⇒ `IDENTITY_LINK_INVALID`; 11th active ⇒ `IDENTITY_DEVICE_LIMIT`; re-linking a revoked did ⇒ `SECURITY_KEY_REVOKED`.
3. `TEST-PS-052-09.T08` revoking the last device ⇒ `IDENTITY_LAST_DEVICE_KEY`; post-close events ⇒ `CONFLICT_STATE{closed}`.
4. `TEST-PS-052-09.T17` (new, covers 03.R02,02.R02) `key_rotate` revokes old and activates new in one event; by another device ⇒ `SECURITY_KEY_UNAUTHORIZED`; rotating the genesis keeps `accountId`.
5. `TEST-PS-055-09.T04` seq 2, 3, replay of 1 (`duplicate`), forked 3 ⇒ frozen with both cids, nothing deleted; `TEST-PS-055-09.T05` `resolveFrozen choose` applies one branch, the other is `superseded`; `uphold`/`reject` on a dispute.
6. `TEST-PS-055-09.T06` property (fast-check, 300 runs): random valid logs (≤ 40 events, 1..10 devices, rotations, revocations) ingested in any arrival permutation give identical document and head; revoked never returns active; active ≤ 10; only declared edges occur.
7. `TEST-PS-129-09.T03` property: one fork or prev mismatch at a random seq ⇒ frozen with exactly the conflicting cids; later events never applied.
8. `TEST-PS-055-09.T16` (new, covers 03.R01,06.R03) seq 5 before 4 ⇒ `held`, then both accepted; 17th held ⇒ `IDENTITY_DOC_BUFFER_FULL`; `expireHeld` keeps at 23 h 59 min, expires at 24 h; unknown author at head+2 ⇒ `SECURITY_SIGNER_UNKNOWN`.
9. `TEST-PS-053-09.T03` kit: property round trip over 10 000 secrets; 54/56 chars, `U`, one altered char, swapped groups ⇒ `IDENTITY_KIT_WORDS_INVALID`, no position revealed; `O/I/L` and lowercase decode canonically. `TEST-PS-053-09.T02` kit file with `kdf:'scrypt-2-1-1'` or a 12-byte nonce ⇒ `IDENTITY_KIT_PARAMS_INVALID` before derivation.

Integration (`tests/integration/identity-devices.test.ts`, `identity-recovery.test.ts`, `identity-vault.test.ts`; `createTestKernel`, `openVault` + `fake-indexeddb`):
10. `TEST-PS-052-09.T09` every command round-trips through the bus, stored envelopes re-verify; `TEST-PS-052-09.T11` the same event twice ⇒ one row; two devices link at one seq ⇒ frozen; a racing document write ⇒ `CONFLICT_REVISION`, no partial rows.
11. `TEST-PS-055-09.T11` X signs a link for its own key or a claim ⇒ `SECURITY_SIGNER_UNKNOWN`; revoked D1 signs a revoke ⇒ `SECURITY_KEY_REVOKED`; `TEST-PS-052-09.T10` R as a device signer ⇒ `SECURITY_KEY_UNAUTHORIZED`; a locked signer throws (`identity.ts:69`), nothing persisted.
12. `TEST-PS-053-09.T01` create kit: the record holds only `recoveryDid` + `Sealed`; the secret appears in no record, event, log or `exportBackup`; `verifyRecoveryKit` succeeds, key locked.
13. `TEST-PS-053-09.T05` claim received at T: at T+71 h N is unauthorized and completion gives `IDENTITY_RECOVERY_WINDOW_OPEN`; at T+72 h N is active, A/D1/D2 have `until = T+72h`, `recoveryDid` null; a second claim by R ⇒ `SECURITY_SIGNER_UNKNOWN`. `TEST-PS-130-09.T06` `isAuthorizedSigner` is false after `until`, before `since`, and on a frozen document.
14. `TEST-PS-053-09.T06` dispute by D2 inside the window ⇒ `frozen{dispute}`; `resolveFrozen reject` drops the claim, devices intact. `TEST-PS-053-09.T09` dispute by revoked D1 ⇒ `SECURITY_KEY_REVOKED`; by N ⇒ `SECURITY_KEY_UNAUTHORIZED`.
15. `TEST-PS-053-09.T16` (new, covers 02.R02,03.R03) a claim with `createdAt` 80 h old stays pending until local receipt + 72 h; a dispute delivered at T+80 h ⇒ `late_dispute` frozen. `TEST-PS-053-09.T10` chaos: store throws after signing ⇒ no row; begin replayed ⇒ `duplicate`, one pending.
16. `TEST-PS-129-09.T08` stolen D2 revokes A and D1; the owner claims; D2 disputes ⇒ frozen; `uphold` ⇒ D2 revoked, N active, D2's later statements unauthorized. `TEST-PS-129-09.T05` two claims from two kit copies ⇒ `frozen{fork}`.
17. `TEST-PS-052-09.T16`, `TEST-PS-053-09.T15` export → restore into a fresh vault: all records and the sealed recovery key round-trip; a tampered event fails `codec.validate`, target uninitialised; no held events.
18. `TEST-PS-055-09.T17` (new, abuse, covers 07.R01,06.R03) 10 000 forged future-seq events ⇒ ≤ 16 held per account, payloads unread, document unchanged.

Spec changes: append T17 to PS-052, T16 to PS-053, T16/T17 to PS-055, and `IDENTITY_DOC_BUFFER_FULL | 429 | yes | held out-of-order identity events exceed the per-account or per-vault bound` to PS-055 `errors`. All referenced `pp.Rnn` exist; `tools/specgen/validate.mjs:173-184` checks only ids, levels and covers, so `pnpm spec:check` stays at 0 errors, 33 warnings.

## 7. Open questions resolved

1. **Envelope `seq` = account position, not per-author (FED-3):** the task defines the log per account and `verifyEnvelope` validates that shape; slice A must exclude `classrup.identity.event/v1` from author-chain buffering.
2. **One type with `kind`**, not four spec-named types: one `expectedType` gate, one schema union, one fold.
3. **Implicit genesis**, no seq-1 event: no migration; every did:key is its own account until linked.
4. **Dispute window from local receipt**, per receiver: the only anchor an attacker cannot move; divergence is honest.
5. **Frozen exits only by local resolution**: a statement-based unfreeze would let the "superior" key win the dispute the freeze exists to surface.
6. **Guarded close and kit replacement**: otherwise a stolen device turns a recoverable loss into a permanent one; the claim's mechanism is reused.
7. **Base32 kit over a word list**: no table, no licence, checksum before scrypt; `IDENTITY_KIT_WORDS_INVALID` means "transcribed secret invalid".
8. **Only recovery claims may branch**: without relays the recoverer may hold a stale log; semantics use the receiver's head, so the relaxation grants no power.
9. **Hold only from known authors**: a DoS filter needing no state beyond the document; early events are resent, never silently lost.
10. **Crypto as a port** (deps layering); its contract "throws unless signed by `author`" keeps fake-port logic tests valid.
11. **`since/until` are claims for links/revocations, local times for recovery effects**; receipt-time policy = pass the receipt time as `atIso`.

## 8. Honest limits

- Nothing is uploaded; "receiver" means a vault that imported the events by file or QR. Receivers can disagree (one frozen, one not) until the owner resolves each.
- A valid signature by an active device is authority; the design cannot tell owner from thief holding an unlocked device or the kit. It gives visibility and a 72 h brake, not prevention.
- A revoked key can still sign with a backdated `createdAt`; claimed-time checks accept it. Receipt-time policy is the caller's choice; it rejects some honest late deliveries.
- Recovery needs the account's log (user export, counterparty, future relay); a kit with no log anywhere recovers nothing. Losing kit and all devices is unrecoverable (PS-053).
- A frozen account signs nothing trusted until each receiver resolves.
- No audit, no "secure" claim; `@noble` 2.4.0 and WebCrypto Ed25519 as in the alpha.
