# CTR-MNY-001 — Money, currencies, FX quotes and rounding

**Status:** APPROVED. **Owner:** F09.S03.M03 (mod_precision) with F09.S03.M01 currency registry and F09.S03.M02 rates.

- **MNY-1** `Money = { amount: string (decimal integer of minor units, optional leading '-'), currency: string }`. In code `bigint`. Never floating point.
- **MNY-2** Currency registry: ISO 4217 alpha-3 with minor units from the ISO list; crypto assets use registry codes (`BTC` 8, `ETH` 18, `USDC` 6) defined in F09.S03.M01 with explicit decimals. Unknown currency ⇒ `COMMERCE_CURRENCY_UNKNOWN`.
- **MNY-3** Rounding: `HALF_EVEN` (banker's) by default; per-operation override only `FLOOR` for fee caps. Rounding happens once, at the end of a conversion.
- **MNY-4** FX quote: `{ id, base, quote, rate: {num: string, den: string} (positive integers), source, asOf, expiresAt }`. Conversion: `out = round(amount × num × 10^(dq) ÷ (den × 10^(db)))` where db/dq are minor-unit exponents. Quotes are pinned into proposals by `id`; expired quote ⇒ `EXPIRED` and re-quote with fresh consent.
- **MNY-5** Value comparison tolerance for barter (D03): default 5 % of the larger side or a configured absolute minimum, whichever is greater; differences beyond tolerance require an explicit compensation leg (F02.S04.M01) or explicit acceptance of imbalance by the disadvantaged party.
- **MNY-6** Arithmetic with mismatched currencies without a quote is a programmer error (throws in core, `INTERNAL`).
