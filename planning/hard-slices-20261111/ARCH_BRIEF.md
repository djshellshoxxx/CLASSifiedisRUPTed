# ClassRup hard-slice program — shared architecture brief

Repository: /home/user/CLASSifiedisRUPTed, branch `claude/difficult-project-parts-dcqlup`, based on the
local-first alpha head `codex/local-alpha-20261109` (commit 429fcfc). Node 22, `corepack pnpm 10.28.0`
(already installed; `node_modules` present). Never run `pnpm install` with network changes; never add
dependencies without recording source, version and licence in the slice report.

## What the product is (non-negotiable, from ADR-0016 / PROJECT_SPEC / CTR-*)
- Local-first PWA. The browser **vault** (IndexedDB, one per principal) is authoritative. Relays are
  optional, untrusted, never see plaintext private data, never create consent, never hold funds or keys.
- Identity = user-held Ed25519 key; principal is `did:key:z6Mk…` (multicodec ed25519-pub, base58btc).
- All cross-party state is a signed statement: CTR-FED-001 envelope
  `{v:1,type,cid,author,createdAt,seq,prev,payload,ext,sig}`; `cid = sha256-<hex>` of JCS(envelope minus cid,sig);
  `sig` = Ed25519 over JCS(envelope minus sig). `packages/federation/src/envelope.ts` implements
  `signEnvelope`/`verifyEnvelope`/`strictCanonicalJson` (1 MiB, depth 32, 50k nodes, +5 min clock skew).
- A valid signature is never domain authority. Every receiver validates schema, author role, subject
  binding, expiry, revision, previous commitment and conflicting evidence before mutating anything.
- Consistency states are explicit (planning/CONSISTENCY_STATES.md). Never claim a stronger state.
  No last-writer-wins for consent, money, identity revocation, inventory commitments. Conflicts freeze.
- Money: integer minor units as decimal strings / `bigint`, never floats (CTR-MNY-001). HALF_EVEN rounding
  once at the end. FX quotes `{id, base, quote, rate:{num,den}, source, asOf, expiresAt}` pinned by id.
  Barter tolerance default 5 % of the larger side or configured absolute minimum (MNY-5).
- Privacy classes P0–P4 and location levels L0–L4 (CTR-PRV-001). P3/P4 never leave the vault except in
  the user's own export. Exact addresses never in any statement.
- Existing on-disk `classrup.alpha.*` statement types and `classrup.vault.alpha_backup/v1` must keep
  working (tests in tests/integration and packages/*/src cover them). Add new versioned types; do not
  mutate the meaning of existing ones. Existing vaults created by the alpha must migrate forward, never
  silently downgrade.
- Pseudonyms are not anonymity. Signed receipts evidence statements, not physical delivery.

## Kernel facts you will rely on (see maps/kernel-storage.md, maps/kernel-bus.md)
- `packages/kernel/src/storage/driver.ts`: row model (`RecordRow{tenant,type,id,revision,data: JSON text,
  idx[4],createdAt,updatedAt}`), tables: records, outbox, inbox, idempotency, leases, deadLetters, sync,
  blobs, migrations, meta. `StorageDriver{begin,commit,rollback,close}`.
- `storage.ts`: `createStorage(driver)` serializes transactions; `transaction(fn)` commits on `ok`, rolls
  back on `err`/throw; `read(fn)` always rolls back.
- `tx.ts`: `createTx` gives `records.{get,put(expectedRevision CAS),remove,query,restore}`, `leases`
  (CAS, fence, TTL ≤ 24h), `idempotency`, `outbox`, `inbox`, `deadLetters`, `sync` (prepared →
  transport_acknowledged → peer_accepted | failed), `blobs` (content-addressed, holders, shredded()).
- `indexeddb.ts`: the memory driver is the working set; each commit's `Change[]` (table,key,row) is
  written in one IndexedDB readwrite transaction; `loadSnapshot` reads all tables at open; `meta` table
  holds the writer token; exclusive Web Lock per vault; `VAULT_DB_VERSION = 1`.
- `repo.ts`: `defineRepo({type:'<slug>.<entity>', schema: zod, indexes})`, `writeRepo(scope, def)` with
  `put/remove/restore`, max 4 index slots, limit ≤ 500.
- `migrations.ts`: forward-only `Migration{id, up(tx, now)}` recorded in `migrations` table.
- Errors: `appError(code, {params|fields})`, `Result<T,E>` = `{ok:true,value}|{ok:false,error}`; common
  codes in CTR-ERR-001 (NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED, EXPIRED,
  VALIDATION_FAILED, PAYLOAD_TOO_LARGE, DEPENDENCY_UNAVAILABLE, INTERNAL, …).

## Vault / identity facts (packages/vault/src/vault.ts, packages/identity/src/identity.ts)
- `openVault({name, codecs})` → `Vault{isInitialized, create(pass), unlock(pass), restoreBackup(bundle, pass), close}`.
  `UnlockedVault{principal, identity (StatementSigner), storage (guarded Storage), lock(), exportBackup(pass)}`.
- The protected identity is a record `{tenant:'local-vault', type:'vault.identity', id:'root'}` holding
  `ProtectedIdentity{format:'classrup.identity-key/v1', principal, secret: Sealed}`.
  `Sealed{format:'classrup.sealed/v1', kdf:'scrypt-131072-8-1', cipher:'xchacha20poly1305', salt, nonce, ciphertext}`
  (scrypt N=2^17,r=8,p=1 via @noble/hashes; XChaCha20-Poly1305 via @noble/ciphers; both MIT, pinned 2.4.0).
- Domain records are **plaintext** in IndexedDB today. Signing key is non-extractable WebCrypto after unlock.
- Backup = `classrup.vault.alpha_backup/v1` signed envelope sealed with the passphrase; restore only into a
  new empty vault, atomic, with codec `parse/validate/restoreData/indexes`.

## Mutiny / bazaar facts (see maps/mutiny.md)
- `admitSignedGraph(listings, wants, options)` verifies envelopes then builds edges; `discoverCycles(edges,
  options)` bounded Johnson-style enumeration (≤2000 nodes, ≤20000 edges, L≤8, 100k expansions, 250 ms,
  500 candidates); greedy disjoint selection by (participants, quantized imbalance, distance, want age, hash).
- Statements: `classrup.alpha.want/v1`, `classrup.alpha.proposal_revision/v1` (ProposalSnapshot digest),
  `classrup.alpha.consent/v1`, `classrup.alpha.reservation/v1` (single item hold), `classrup.alpha.withdrawal/v1`.
- Coordination needs every participant's consent + reservation for the same digest + fresh feasibility;
  revision invalidates prior consent; divergent revision freezes; withdrawals/freezes terminal.
- Kernel wrapper `mutinyDefinitions` requires callbacks `hasLocalReservation`, `checkFeasibility`,
  `releaseLocalReservations`; commands `mutiny.want.retain`, `mutiny.coordination.ingest/refresh`.

## Slice ownership (disjoint files; coordinate only through the interfaces named here)
| Slice | Owns (create/modify) | Must not touch |
|---|---|---|
| A FED-3 author chains | `packages/federation/src/**` (new files + index exports), `tests/integration/federation-*.test.ts` | vault.ts, identity, mutiny, kernel |
| B encryption at rest | `packages/kernel/src/storage/indexeddb.ts`, new `packages/kernel/src/storage/at-rest*.ts`, `packages/vault/src/vault.ts` (unlock/create/migration flow only), `packages/identity/src/**` only for key-material helpers (new file), `tests/integration/vault-encryption*.test.ts` | memory-driver.ts, sqlite.ts, outbox/*, observability/* (open PRs #16/#22 touch them), federation, mutiny |
| C identity devices/recovery | new files under `packages/identity/src/` (account/devices/recovery), `packages/identity/src/index.ts` exports, `tests/integration/identity-*.test.ts` | identity.ts (read-only, reuse seal/unseal), vault.ts, federation internals, kernel |
| D import preflight | new `packages/vault/src/import.ts` (+ test), minimal export wiring in `packages/vault/src/index.ts`; integration into `UnlockedVault` happens in the merge step | vault.ts unlock flow, kernel, identity |
| E value balancing + quantity | `packages/mutiny/src/**` (new `value_balancing/`), `packages/bazaar/src/listings/**` (quantity, additive), `tests/integration/mutiny-value*.test.ts` | federation, vault, identity, kernel |

Files touched by other people's open PRs — do not modify: `packages/kernel/src/outbox/dispatcher.ts`,
`packages/kernel/src/storage/memory-driver.ts`, `packages/kernel/src/storage/sqlite.ts`,
`packages/kernel/src/observability/logger.ts`, `tools/cli/classrup.mjs`, `apps/pwa/src/barter.ts`,
`apps/pwa/src/main.ts`, `apps/pwa/index.html`, `tests/browser/alpha.spec.ts`.

## Engineering rules
- Test first: write the failing test, then the minimal implementation. Vitest (`packages/*/src/**/*.test.ts`,
  `tests/{unit,property,integration,chaos,compat}/**/*.test.ts`), `fast-check` 4.10.2 for properties,
  `fake-indexeddb` for IndexedDB. Node `--test` only for tests/cli and tests/tooling.
- Every new test title that implements a spec test must include the trace ID `TEST-PS-NNN-09.Tnn` from the
  owning `module.spec.yaml` (`processes.contract_and_acceptance_tests.tests`, `Tnn | level | covers | …`)
  so `pnpm trace` counts it. Where no spec test exists yet, append a new test row to that module's
  `module.spec.yaml` (append only; never reorder or delete; keep `pnpm spec:check` at 0 errors and do not
  add warnings) and reference it.
- No `node:` imports in isomorphic packages (kernel core, federation, identity, vault, mutiny, bazaar).
- No floats for money. No `Date.now()` in domain logic without an injected clock/`now` parameter.
- Fail closed: unknown versions, unknown fields that would grant privileges, oversize inputs, invalid
  encodings, clock anomalies all reject with typed errors. Bound every collection (document the bound).
- Zero secrets or passphrases in logs, errors, test output or fixtures committed as "real".
- Keep `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm spec:check` (0 errors, ≤33 warnings),
  `corepack pnpm deps:check`, `corepack pnpm run test:tooling` green. Run only the relevant vitest files
  while iterating (`corepack pnpm exec vitest run <file>`), the full suite before reporting.
- Document limits honestly in the package README (what is and is not established). No "audited",
  "production-ready", "secure" claims.
