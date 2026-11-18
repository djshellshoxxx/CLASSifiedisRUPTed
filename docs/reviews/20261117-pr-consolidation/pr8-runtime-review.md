# PR #8 — unique runtime checkpoint review

## Recommendation

Keep PR #8 (`claude/bold-mccarthy-qklhl6`, head `a403614bb34d3d176d4693730e512e14959718b8`) open as a draft for selective reconciliation. Do not merge its current tree or import its kernel storage replacement. There is valuable work to preserve, but no independently tested, immediately usable unique runtime slice was found that qualifies for integration during this consolidation.

The latest runtime commit changes **34 files, adding 3,920 lines and removing 221**. It adds **no test files or test changes**. The preceding unique commits mostly reconcile specifications; the whole branch diff from its common ancestor spans 1,914 files and cannot be judged as a small foundation patch. The active alpha on main has evolved beyond its runtime assumptions.

## Executed qualification of the exact PR head

Isolated detached worktree: `classrupted-pr8-review`; no source edits. Node `v24.22.1`, pnpm `10.28.0`.

| Check | Result |
|---|---|
| `corepack pnpm install --offline --frozen-lockfile` | PASS; pinned lockfile, 50 packages reused, no downloads |
| `corepack pnpm typecheck` | FAIL; 86 TypeScript diagnostics; includes both unfinished new interfaces and inherited placeholder package exports |
| `corepack pnpm test --reporter=json --outputFile=../review-evidence/pr8-tests.json` | FAIL; **93 tests executed: 20 passed, 73 failed, zero pending** |
| `node packages/platform/scripts/gen-registry.mjs --check --strict` | FAIL before registry generation: kernel re-exports deleted `syncMachine` |

Execution evidence: [typecheck log](pr8-typecheck.txt) and [test result JSON](pr8-tests.json). These results qualify the **old PR head only**, not the current consolidated application.

## Standards and implementation findings

### 1. Incomplete transaction API replacement breaks storage operations

At the PR head, `packages/kernel/src/storage/tx.ts:631–641` constructs every transaction and still evaluates `sync: syncStore(d)`, but the function `syncStore` has been removed. The test suite repeatedly fails with `ReferenceError: syncStore is not defined` at line 640, including memory/SQLite/IndexedDB storage contracts, command bus, relay access and sync sender tests.

The same function now expects a `TxEnv` object; `storage/storage.ts:42` still passes `driver.kind`, a string. This is not merely a missing type export: callers and transaction construction are unfinished.

### 2. Driver contract and persistence migration are not completed together

The branch changes `DriverTx` with new blob metadata, dead-letter replay and deletion APIs, removes sync row/types/operations, and removes `sync_outbox` from memory `TABLES`. The SQLite adapter still implements the old interfaces and still accesses `sync_outbox`; consumers in storage scope and sync sender still require the removed `SignedEnvelope`, `SyncEntry`, and `SyncState` types.

The new required `DeadLetterRow.replayCount` and `lastReplayedAt` are not produced by the SQLite row conversion. Required `outbox.remove`, `inbox.remove`, the new dead-letter query signature, and `bytesPresent` metadata also fail typechecking. This needs an intentional migration and adapter parity work, not accepting a conflict resolution that happens to compile one adapter.

### 3. Package and generated inputs required by the new foundation are absent

- `packages/platform/src/configuration/feature/registry.ts:3` imports absent `registry.generated.ts`.
- `packages/platform/src/configuration/tenants/schema.ts:4` imports absent `./text.ts`.
- Platform package entrypoint re-exports absent `configuration/index.ts`.
- Security package entrypoint re-exports absent `authz/index.ts` and `cryptography/index.ts`; the new secrets/signature files are not exposed through a finished package boundary.
- New signature JCS code uses `String.isWellFormed` while the branch compiler library settings do not provide it; this gives three additional type errors.

The registry's generation script cannot currently remedy the missing generated file because importing `@classrup/kernel` itself throws: kernel index line 112 still re-exports `syncMachine` removed from `storage/machines.ts`.

### 4. A wholesale old-kernel replacement would discard later qualified fixes

A direct main-to-PR comparison of `storage/memory-driver.ts` shows the PR's pending-event blocking keyed only by `aggregateId`. Main keys blocked streams by `(tenant, aggregateType, aggregateId)`, with later isolation regression coverage. Selecting the old file would restore cross-stream blocking. Main also includes later encrypted-storage and lifecycle behavior that this branch predates. These are specific reasons to retain main's implementation while porting isolated future behavior.

This finding concerns replacement/old-side conflict resolution; it is not a claim that a correctly resolved merge must necessarily lose main's fix.

### 5. New cryptographic and secret helpers have no acceptance evidence in this checkpoint

The signature primitive layer, inventory/context verifier, secret loader, redacting wrapper, constant-time comparison, and feature registry code are new source without new tests in their introduction commit. The 20 passing tests are inherited kernel coverage and do not establish the added cryptographic or configuration APIs. Their comments naming test IDs are not executed evidence.

No heuristic-only refactoring is proposed. These are compile/runtime/dependency and compatibility blockers, separate from code-smell judgment calls.

## Specification and integration findings

### Federation format is a future migration, not a drop-in substitute

The new signature federation helper uses `sha256-` plus 43 base64url characters for CIDs, optional `prev`, device signer extensions and a delegation decision left to the caller. Current main's intentionally experimental alpha envelope (`packages/federation/src/envelope.ts`) uses a 64-hex-character digest and requires `prev: null` for the first record. Both the current README/federation scope and planning contracts distinguish the alpha from full canonical interoperability.

Importing the new helper under the current API would change signed bytes/identifiers and require a versioned admission adapter, identity/delegation/revocation authority, migration/backup compatibility, negative tests and published vectors. Valid Ed25519 verification alone is not authorization to admit a delegated statement.

### Hour-floored public IDs are additive source but are not a completed product slice

The branch adds `floorToHour`, `isHourFloored`, `parsePublicId`, `hourFlooredUuidV7`, `createHourFlooredIds` and the `publicId()` field validator. These helpers have no new tests, package export integration, or product callers here. The intended privacy rule (public IDs expose only hour precision) requires a deliberate choice of which records get new identifiers while retaining private ordering, stable existing IDs, signature references and backup/restore behavior.

Adding unused helpers would neither remove current public-ID timestamp exposure nor satisfy that acceptance requirement. This is a small future port candidate after agreeing the use/migration boundary and adding range, rollback, collision, parse/skew, non-monotonic-public-order and interoperability tests.

### Feature registry is the most promising separate future port, but needs qualification

The graph construction and generator are largely independent of the storage redesign and could be ported without taking the broken transaction changes. Nevertheless, no test evidence exists for cycle/unknown dependency rejection, deterministic canonical digest/order, stale generation, atomic output on error, compiled defaults, registry immutability or the read query capability/rate boundary. The generated registry and parent entrypoint are missing, and CI does not currently run its stale-check command. It needs a focused implementation PR against current main with these requirements supplied.

### Secret-handling source belongs to optional relay infrastructure

The secret loader defaults require relay data keys, audit pepper, VAPID private key and SMTP password. It has injected environment/filesystem ports but no actual relay composition/adapter in the current product. Installing this as a mandatory PWA dependency would conflict with the client-owned local-alpha setup. Its wrapper/redaction and token helpers can serve as references when optional relay infrastructure is implemented and tested; they do not complete present application workflows.

## Bounded salvage order for the remaining draft

1. Port and test **feature-registry generation/read queries** alone against main's existing kernel, preserving executable runtime truth and adding the generated artifact/CI stale check.
2. Port **hour-floored public-ID helpers** only with their public-record creation/validation/migration boundary and meaningful tests. Do not rewrite existing signed references implicitly.
3. Qualify **canonical signature helpers** with independent vectors, current identity/revocation adapters, explicit format versioning and backward-compatible import handling.
4. Implement **optional relay secret adapters** with tests for filesystem races, reload overlap, missing versions, log redaction and failure behavior when the relay itself has a concrete consumer.
5. Revisit **storage/dead-letter/blob changes** separately, preserving alpha sync and encryption; finish all three adapter contracts, migrations, old vault compatibility and transaction rollback tests before integration.

These are remaining implementation tasks. They are not represented as already completed or folded into the present consolidation.
