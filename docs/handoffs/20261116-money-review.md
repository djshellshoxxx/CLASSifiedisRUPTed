# Fresh money-precision review — November 16, 2026

## Scope and predecessor

Fresh reviewer continued from `20261116-inventory-audit.md` and the commerce
implementation team's working milestone on `codex/parallel-completion-20261116`,
based on `560b328dd335aebdc12de01ec339c43ebd164be3`. Reviewed the precision
implementation, tests, vectors/reference checker, source guard, benchmark and
new narrow kernel error export. No remote changes or commits were made by this
reviewer. The final integrated commit requires its own combined qualification.

The canonical contract is `planning/contracts/CTR-MNY-001.md`; the detailed
module requirements are `09_Commerce/03_valuation/mod_precision/module.spec.yaml`.

## Finding and correction

**Required, corrected:** importing helpers from the root `@classrup/kernel`
barrel pulled unrelated validation/runtime code into a supposedly small pure
money module. Independent esbuild browser bundling measured 94,178 raw bytes
and 28,278 gzip bytes, exceeding the module's 12 KiB gzip acceptance limit.

The implementation now imports reused helpers from `@classrup/kernel/errors`,
with a dedicated pure export surface. The first independent recheck measured
6,375 raw bytes / 2,331 gzip bytes. After adding `sign` and eliminating a repeated
allocation multiplication, the project's benchmark measured 2,355 gzip bytes.
Both corrected bundle measurements are below the unchanged 12,288-byte cap.

The module's responsibilities explicitly mention a sign operation even though
its public API note omitted it. The team added `sign` and positive/zero/negative
coverage, preserving Result-style validation.

No additional high-confidence arithmetic defect was found in this review.
This statement is limited to the reviewed implementation and evidence below.

## Executed evidence

- Precision Vitest suite: 12 tests passed, including four deterministic
  properties of 10,000 cases each with seed 740016. Reviewed oracle independence,
  HALF_EVEN negative/tie behavior, final-result bounds and signed allocation.
- Independent Python standard-library `Fraction` checker: all 331 versioned
  vectors passed. The corpus contains 108 conversions, 83 allocations,
  80 percentages and 60 decimal parses; it includes 38-digit amounts,
  40-digit rate components and exponent 18.
- Source guard passed. Negative fixture tests reject float coercion and I/O
  examples. Safe number use for counts/exponents/indexes is distinct from
  monetary arithmetic, which remains bigint.
- Additional independent probe: 104 malformed structured-Money cases across
  13 public operations returned error Results without thrown exceptions.
  Cases included null, undefined, missing fields, number/string amounts,
  missing/invalid currencies and over-bound bigint amounts.
- Browser bundle validation passed after the correction above. The library
  imports only the pure error/result surface; no storage, clock, network or
  random work is performed by the arithmetic implementation.
- Allocation performance **did not qualify** on this concurrent host. A run
  measured p99 2.20007 ms; after eliminating the duplicate multiplication,
  another measured 2.61939 ms, against the unchanged 2 ms cap. Both benchmark
  commands exited 1. These are recorded failures, not suppressed outliers.
  The specified 2022 mid-range Android device remains untested.

Commands used:

```sh
corepack pnpm exec vitest run packages/commerce/src/valuation/precision/precision.test.ts --maxWorkers=1
python3 packages/commerce/test/check_money_vectors.py
node packages/commerce/test/check_money_source.mjs
node packages/commerce/test/benchmark_money.mjs
corepack pnpm exec esbuild packages/commerce/src/valuation/precision/index.ts --bundle --format=esm --platform=browser --minify --outfile=/tmp/classrup-money-review.js
```

## Compatibility and remaining gates

CTR-MNY-001 specifies exact bigint arithmetic and canonical minor-unit strings,
but does not itself specify the digit limit. The precision module explicitly
limits absolute amounts to 38 digits; the existing alpha kernel Money validator
accepts up to 78 digits. This addition does not alter the alpha schema, reject
previously saved listing data or assert that all monetary consumers now share
one bound. A later migration must choose and test that compatibility boundary
before substituting the new core in existing storage/import paths.

This is a stateless arithmetic module, not completed purchase offers, settlement,
currency registry, FX quote provenance or receipts. Callers still authenticate
quotes, enforce expiry, authorize operations and validate currency membership.
Barter declared values do not create monetary obligations.

Remaining acceptance includes stable performance on the specified device,
conversion timing qualification, execution of the added CI gates on the final
candidate, and final integrated type/dependency/test qualification.
Do not call the entire F09 commerce group or all F09.S03.M03 acceptance complete
from the passing deterministic tests alone.

## Fresh continuation: deterministic CI gates

After the review milestone, this fresh team took ownership of the commerce test
tools and `.github/workflows/alpha-checks.yml` to finish the deterministic CI
wiring. The domain job now runs:

```sh
python3 -I packages/commerce/test/check_money_vectors.py
node packages/commerce/test/check_money_bundle.mjs
```

Python isolated mode prevents environment variables from disabling assertions.
The checker uses only the standard library. The source guard already executes
inside the precision Vitest suite and remains there.

`money_bundle.mjs` contains the single shared esbuild/gzip measurement and the
unchanged 12,288-byte cap. The new `check_money_bundle.mjs` enforces only that
deterministic size gate. `benchmark_money.mjs` reuses the same measurement and
retains its original 1,000-weight test, 100 warmup/1,000 measured runs and 2 ms
p99 limit. Host timing was not added to CI or relaxed; all earlier failing
timing evidence remains applicable.

Continuation verification:

- Python reference CLI: 331 vectors passed.
- Bundle CLI: 2,355 gzip bytes against 12,288-byte cap, exit 0.
- Source guard CLI and benchmark syntax check: passed.
- Independent negative reference fixture with a changed expected value: exit 1.
- Independent oversized exported browser fixture: 44,990 gzip bytes, correctly
  rejected by the actual bundle CLI with exit 1.
- Parsed workflow YAML and asserted both new commands are present while the
  host timing benchmark is absent from CI; passed.
- Whitespace diff check: passed. No full suite or remote Actions run was executed
  by this continuation; root owns final combined qualification.
