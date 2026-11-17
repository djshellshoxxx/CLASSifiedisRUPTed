# Exact money precision

F09.S03.M03 implements the pure arithmetic surface from PS-074 and CTR-MNY-001.
Amounts in memory are `bigint`; `money` constructs frozen values and `toWire`
returns canonical integer strings. Functions return kernel `Result` values;
mismatched currencies throw a content-free `TypeError`, as MNY-6 requires.

The API provides `money`, `parseMinor`, `parseDecimal`, `formatDecimal`, `add`,
`sub`, `neg`, `sign`, `cmp`, `sum`, `convert`, `percentBps`, `capFee`, `allocate` and
`splitEven`. Empty sums require an explicit currency. Amount magnitudes are
limited to 38 digits; rational numerator/denominator inputs to 40 digits;
minor-unit exponents to 0–18; allocation/sum collections to 1,000 entries.
Percentages accept exact nonnegative bigint basis points. Validated number
inputs are used only for indexes, exponents, counts and integer weights.

Conversions and percentages round HALF_EVEN once at the end, symmetrically for
negative amounts. FLOOR is rejected on general operations. `capFee` takes two
already-integral nonnegative minor-unit values and returns their minimum, so it
cannot round upward. Decimal input with excess fractional digits requires
explicit HALF_EVEN, including excess zero digits. Negative zero is rejected.
Allocation uses largest fractional remainder, then lowest original index; a
negative allocation negates the positive allocation. Parts sum exactly.

The pure library checks currency code syntax. The currency registry must check
membership; the owning workflow must authenticate and pin an FX quote and check
its expiry. This library has no clock, storage, events, custody or settlement
behavior. Existing listing storage and i18n have different legacy amount bounds;
this addition does not silently reinterpret their saved records.

Verification commands:

```sh
corepack pnpm exec vitest run packages/commerce/src/valuation/precision/precision.test.ts --maxWorkers=1
python packages/commerce/test/check_money_vectors.py
node packages/commerce/test/check_money_source.mjs
node packages/commerce/test/benchmark_money.mjs
```

`test/vectors/money.json` has 331 vectors in `classrup-money-vectors/v1`, with
seed 740016. Its independent Python reference uses standard-library `Fraction`
and Python's exact rational HALF_EVEN. Four property tests use 10,000 cases
each with seed 740016. The benchmark checks 1,000-weight allocation p99 ≤2 ms
and a minified browser bundle gzip size ≤12 KiB. Timing evidence describes the
host on which it ran; it is separate from deterministic correctness tests.

Payment claims, agreed deals, receipts, purchase offers and negotiation remain
unfinished. Current barter item values do not establish cash obligations; no
payment flow is synthesized from them.
