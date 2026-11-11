# F14.S02.M02 Currency display (PS-112)

Headless library: no commands, queries, events, capabilities or statement handlers, no state beyond a 64-entry Intl.NumberFormat cache.

## Implemented (index.ts)
- `formatMoney`, `formatMoneyParts`, `formatApprox`, `parseMoneyInput`, `currencyName`, `runFormatSelfTest`, `currencyErrors` (the five I18N_MONEY_* / I18N_QUOTE_LABEL_INVALID codes).
- Exact formatting through Intl decimal strings, with the BigInt part-substitution path (power-of-ten layout template, digits replaced from the input string) when the engine lacks them; `engine` option forces a path.
- Symbol, code and name display; crypto and non-ISO codes use decimal style plus the code; RTL locales wrap the amount in FSI/PDI.

## Ports the composition root must supply
- `CurrencySpec { code, exponent, kind }` per call, from the registry F09.S03.M01 (no built-in table: the spec says the exponent comes from the registry).
- `ApproxOptions.translate(key, params): string`, normally `i18n.t` from F14.S02.M01 (keys money.approx, money.approx_old, money.approx_unavailable with `{amount}`, `{source}`, `{time}`); `now` (injected clock, epoch ms) and `timeZone`.

## Deviations
- `formatMoney`, `formatMoneyParts` and `formatApprox` return `Result<...>` rather than bare strings: spec requires invalid input to give an explicit error and never a string (T04). The example strings in the spec are the `.value`.
- `formatApprox` amount is decimal style plus code ("42.10 EUR"), as in the spec example, not Intl currency style.
- Isolation marks (FSI/PDI) are added only for RTL locales or when bidi controls were stripped, so the en examples match the spec byte for byte. Crypto code in en is therefore not wrapped.
- Input longer than 40 characters returns I18N_MONEY_TOO_LARGE (spec names no code for "rejected by length").
- A group separator without a decimal part is rejected as I18N_MONEY_PRECISION for exponent above 0 ("12.345" in de, "1,234" in en), to follow threat T04; with exponent 0 well-formed grouping is accepted.
- Missing quote source renders the "quote details unavailable" text (partial_failure); a missing or malformed asOf with a source present is I18N_QUOTE_LABEL_INVALID. An invalid time zone is also I18N_QUOTE_LABEL_INVALID.
- `money.currency` must equal `spec.code`, else I18N_MONEY_INVALID.

## Test rows not covered
- T10 (UI labelling part), T11 (a11y), T12 (bundle size and cold budget not measurable; a warm speed check exists without the row id), T13, T14 (golden files and ICU pin are repository tooling).

## Open questions
- Golden strings were generated with the local Node ICU (78.x); the Chromium/WebKit cross-check and an ICU pin are not part of this lane.
