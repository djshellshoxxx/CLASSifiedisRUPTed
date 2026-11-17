# Currency registry checkpoint — November 16, 2026

## Start here

Continues PR #42 on `codex/parallel-completion-20261116` from the exact-money
checkpoint (`36428ccc8a1ccf365418748abd7cc6ee2dc2bfb3`). Source is
`packages/commerce/src/valuation/currency/`; commerce exports/dependency metadata
also changed. Root regenerated the lockfile for the already-pinned
`@noble/hashes` 2.4.0 dependency. No commit, remote write, merge or deployment was
performed by this team. The fresh currency reviewer owns follow-up fixes after
this handoff.

This is a transaction-backed registry core requiring an authenticated release
snapshot. It is **not enabled in the PWA** and is not a claim that all registry,
commerce or product acceptance criteria are complete.

## Implemented boundary

- `verifyCurrencySnapshot(input, trustedSignerDid)` verifies an Ed25519 signature
  over domain-separated canonical JSON. The externally configured trust root
  must match the envelope signer. All rows are schema-checked, unique by code,
  chain-checked and canonicalized before admission. Verified snapshots carry a
  SHA-256 digest and source/version/signer provenance, are deeply frozen and are
  recorded in an internal WeakSet; a plain cloned/forged object cannot bootstrap
  the factory.
- `currencyDefinitions(options)` binds every command/query and initialization to
  both the local unlocked principal and an explicit canonical UUID vault ID.
  Peer, anonymous and same-owner/foreign-vault calls are denied independently of
  the kernel's capability policy.
- `seed(ctx)` runs inside an authenticated kernel transaction and writes the
  snapshot plus its provenance atomically. Retry preserves rows and local
  configuration; a different snapshot digest fails closed instead of silently
  mutating exponent or chain bindings. Partial rows without a seed manifest are
  rejected. New release snapshot migration remains an explicit future operation.
- Canonical `commerce.currency.register`, `set_status`, `get` and `list`
  definitions use existing bus authorization/auditing/idempotency and transactional
  outbox behavior. Registration additionally requires `confirmed: true` and the
  composition root's crypto-enabled flag. Successful registrations are bounded
  to 20/hour using a persisted counter. The vault-wide single-writer lock/fence
  serializes duplicate-code checks; no extra independent multi-tab cache exists.
- Crypto registration preserves the canonical registry ranges: codes 2–10
  uppercase letters/digits and exponents 0–36. Decimal/kind/chain/contract fields
  have no mutation API. EIP-55 validates or canonicalizes Ethereum token addresses;
  incorrectly mixed-case and zero addresses are rejected. Bitcoin has no token
  contract field. Chain presence alone makes no on-chain verification claim.
- Disabling preserves readable historical amounts but rejects new use.
  Retirement requires prior disablement and a transaction-scoped usage port
  resolving open offers, Deals and quotes to zero. Missing/error/invalid adapter
  responses fail closed. Retired codes cannot be re-enabled or reused.
- `resolvePrecisionCurrency` refuses metadata outside the existing arithmetic
  and i18n subset (code starts with a letter, length at least 3; exponent ≤18).
  `get` and `resolveCurrency` still expose valid canonical registry metadata.
- `validateImport(current, input)` validates a complete configuration section
  without writing: unique IDs/codes, shape/bindings, snapshot-fixed fiat **and
  crypto** immutable fields, complete seed membership, preservation of established
  codes and no resurrection of retired codes. Existing rows must be identical;
  this preflight cannot authorize status/revision changes around the usage port.
  Root backup integration is still required. The fresh reviewer is tightening
  explicit import vault binding before any remapping exists.

## Evidence and review handoff

The last combined focused run before final backup hardening passed **25/25**:
13 new registry tests plus 12 precision tests. Narrow commerce typecheck passed.
Final backup hardening then added default-crypto immutability and changed-existing
row rejection; the fresh review owns its final rerun and independent regressions.

Registry tests cover snapshot key mismatch/tampering/duplicate rows/forgery;
all eight official EIP-55 vectors; seed rollback and retry; output/events/audit;
confirmation/chain/flag failures; principal and tenant isolation; retirement and
new-use separation; missing/invalid usage adapters; duplicate concurrent commands
and persisted command replay; registration capacity; pagination; immutable backup
preflight; precision-range refusal. IndexedDB integration uses fake-indexeddb and
a deterministic exclusive Web Lock manager, closes/reopens the vault, verifies
persisted configuration/idempotency responses, and rejects a simultaneous writer.
This is not a real-browser IndexedDB or physical-device acceptance run.

Commands:

```sh
corepack pnpm exec vitest run packages/commerce/src/valuation/currency/currency.test.ts packages/commerce/src/valuation/precision/precision.test.ts --maxWorkers=1 --no-file-parallelism
GOMEMLIMIT=256MiB GOMAXPROCS=2 corepack pnpm exec tsc -p packages/commerce/tsconfig.json --noEmit --singleThreaded
```

Two intermediate runs failed only in new test fixtures: negative `clock.advance`
was replaced with the explicit fake-clock `set`; the IndexedDB test gained its
own deterministic Web Lock manager instead of relying on host Node's
`navigator.locks`. Runtime budgets or assertions were not reduced.

Historical porting survey: both `origin/claude/busy-cerf-vg3hz3` and
`origin/claude/bold-mccarthy-qklhl6` contain commerce package metadata and empty
entrypoints, with no registry implementation to port. Reused current kernel
transaction/repository/bus primitives, current security encodings and the pinned
Noble Keccak implementation. The checksum algorithm and test vectors were checked
against the primary [ERC-55 specification](https://eips.ethereum.org/EIPS/eip-55).

## Remaining gates and integration instructions

1. No authentic bundled ISO snapshot or release verification key exists in this
   repository. Tests generate a clearly synthetic signed six-asset fixture with
   an `example.test` provenance URL. Do not package it or describe it as an ISO
   authority. A release snapshot must retain publication provenance, establish
   its signing authority, contain the approved ISO/default crypto records and
   pass independent reference-data verification before production bootstrap.
2. Current alpha vault tenant IDs use principal DIDs, whereas the canonical
   registry contract requires UUID vault IDs. Add a reviewed identity/scope
   adapter before application wiring; do not remove tenant binding to make the
   feature appear ready. The common money subset is usable once this adapter and
   release snapshot exist; the range mismatch does not invalidate that subset.
3. Root must compose `seed(ctx)` in a real authenticated startup transaction,
   inject transaction-scoped offer/Deal/quote usage resolvers, and use the
   supported precision adapter in every price/offer/quote consumer. Do not inject
   a permanent zero-reference stub while those domains are absent.
4. Actual encrypted backup codecs must include registry rows, seed provenance and
   rate-limit state, validate cross-domain references and restore atomically.
   This module's import validator alone does not provide complete export/restore,
   authenticated vault-ID remapping, migration or historical rollback support.
5. PWA accessible currency settings/picker/registration confirmation and checksum
   presentation remain unwired. Relay accepted-currency policy, unknown-currency
   statement quarantine and authenticated FX/rates remain separate features.
6. Performance/load/cache targets, full 190-row reference seed, 180-day version
   compatibility, audit persistence/retention and remaining T01–T13 acceptance
   need their exact evidence. Read-through avoids stale cache invalidation but
   makes no cached lookup latency claim. Mapped test IDs cover exercised slices,
   not all requirements mentioned by the corresponding specification test.
