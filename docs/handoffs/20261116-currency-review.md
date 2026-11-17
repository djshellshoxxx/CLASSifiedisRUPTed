# Fresh currency registry review — November 16, 2026

## Reviewed checkpoint

Independent review of the currency team's F09.S03.M01 checkpoint on
`codex/parallel-completion-20261116` (PR #42). Read the complete canonical module
specification, implementation, tests and
[implementation handoff](20261116-currency-registry.md). This reviewer changed
only the currency module/tests and this handoff. No commit, remote write, merge
or deployment was performed. The registry remains disabled in the PWA.

## Findings and corrections

1. **Foreign-vault backup admission.** The command/query factory bound the local
   principal and canonical vault UUID, but `validateImport([], rows)` accepted a
   complete section consistently labelled with another vault UUID. Reproduced
   with an independent failing test (`expected FORBIDDEN, received ok`). Import
   preflight now requires both incoming and established rows to belong to the
   configured vault. Authenticated cross-vault remapping has no implementation
   and is not inferred from a matching currency code.
2. **Unconfigured-chain activation through import.** Normal registration and
   activation reject unconfigured chains; import preflight previously accepted
   an active row on any globally supported chain. It now rejects active rows
   that the current chain configuration cannot enable. Disabled historical
   metadata remains admissible and readable. A regression narrows the registry
   to Bitcoin, preserves disabled Ethereum metadata, and rejects imported active
   USDC.
3. **Seeded crypto immutable bindings.** Initial review found the snapshot
   comparison covered fiat only, allowing altered default-crypto exponents or
   chain bindings when importing into an empty registry. The implementation
   team independently fixed this before transferring file ownership. Reviewed
   the resulting all-asset comparison and its USDC regression. The same handoff
   also made existing rows byte-equivalent on import, preventing the preflight
   from bypassing revision or retirement usage checks.

Additional authorization regression checks initialization, registration, status
changes and list queries with the correct principal but the wrong vault scope.
They all return `FORBIDDEN`; the original vault remains unchanged.

## Verification

- **27/27 focused tests passed:** 15 currency tests and 12 existing precision
  tests, 2.72 seconds on this host.
- Narrow commerce TypeScript check passed with the bounded compiler settings.
- Currency whitespace check passed.
- The foreign-vault regression failed before its runtime fix and passed after it.

```sh
corepack pnpm exec vitest run packages/commerce/src/valuation/currency/currency.test.ts packages/commerce/src/valuation/precision/precision.test.ts --maxWorkers=1 --no-file-parallelism
GOMEMLIMIT=256MiB GOMAXPROCS=2 corepack pnpm exec tsc -p packages/commerce/tsconfig.json --noEmit --singleThreaded
git diff --check -- packages/commerce
```

Reviewed trust checks require the externally configured snapshot signer, verify
canonical domain-separated bytes, reject tampering and forged verified-object
copies, and freeze parsed snapshot rows. Code uniqueness and idempotency use the
existing transaction/single-writer boundary; IndexedDB reopen/fencing is tested
with fake-indexeddb and deterministic locks. Retirement fails closed when usage
counts are missing, invalid, unavailable or nonzero. These are the implemented
boundaries, not evidence of real-browser or physical-device qualification.

## Remaining gates

The implementation handoff's integration gates remain open: an authentic release
snapshot and configured verification authority; UUID-vault/alpha-DID scope
adapter; real offer/Deal/quote usage adapters; encrypted backup codecs and
cross-domain restore; currency settings/pickers and explicit confirmation;
unknown-currency quarantine; release snapshot migration; performance targets;
audit persistence/retention; canonical federation and FX integration.

Immutability is enforced through this module's public domain operations and
import preflight. The specification's database-level trigger/migration assurance
is not implemented by these tests. Do not describe a synthetic signed fixture
as official ISO data, an available registry helper as a completed payment flow,
or a passing focused suite as full product qualification.
