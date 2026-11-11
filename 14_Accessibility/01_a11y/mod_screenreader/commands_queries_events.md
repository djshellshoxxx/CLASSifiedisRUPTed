# PS-110-04 — Commands, queries and events: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-04.R01** The module exposes component and helper APIs and no vault or relay commands or queries.
- **PS-110-04.R02** It emits DOM events only and no domain events.
- **PS-110-04.R03** Lint and test failures are developer-facing codes never shown to end users; runtime helper failures are Result errors whose localized text the components render.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| I18N_A11Y_LANDMARKS | 400 | no | landmark or heading structure rule failed |
| I18N_A11Y_FORM_LABEL | 400 | no | form control lacks a name or error association |
| I18N_A11Y_NAME_MISSING | 400 | no | interactive element without accessible name |
| I18N_A11Y_ALT_TEXT | 400 | no | Photo call site without alt and decorative props, or with a literal alt string longer than 140 characters |
| I18N_A11Y_LIVE_REGION | 400 | no | live region misuse or announcement flood |
| I18N_A11Y_SPOKEN_VALUE | 400 | no | value displayed without a spoken name |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: <PageShell/> (announces localechange), <Field/> with label hint error, <ErrorSummary/>, announce(message, { priority, region, coalesceKey?, summaryKey? }), spokenMoney(money, spec: CurrencyDef | null, locale, { approximate?: QuoteLabel, timeZone, now }) -> Result<string, AppError>, spokenDistance(bucket: DistanceBucket, locale) -> Result<string, AppError>, spokenTime(instant, now, locale, timeZone) -> Result<string, AppError>, spokenSync(state: SyncState, locale, { transport?: { kind: relay | direct, name? } }) -> Result<string, AppError>, <Photo alt decorative index count own/>. spokenMoney has no Intl path of its own: it builds the text from F14.S02.M02 formatMoneyParts and currencyName (and formatApprox for QuoteLabel wording), so it accepts every registry decimals value (BTC 8, ETH 18, USDC 6, crypto up to 36) and returns COMMERCE_MONEY_INVALID (F09.S03.M03), COMMERCE_CURRENCY_UNKNOWN (F09.S03.M01, spec null) or the F14.S02.M02 errors unchanged. Components render the localized error text on Err ('amount unavailable', 'amount unavailable, unknown currency {code}').

### Example

```
spokenMoney({ amount: "4500", currency: "EUR" }, eurDef, "en", { timeZone: "UTC", now }) // Ok("45 euros")
spokenMoney({ amount: "12345", currency: "BTC" }, btcDef, "en", { timeZone: "UTC", now }) // Ok("0.00012345 Bitcoin")
spokenMoney({ amount: "4210", currency: "EUR" }, eurDef, "en", { timeZone: "UTC", now, approximate: { source: "ecb-daily", sourceKind: "provider",
  signatureVerified: true, asOf: "2026-11-04T10:15:00Z", expiresAt: "2026-11-04T10:30:00Z", status: "issued" } })
  // Ok("approximately 42 euros 10 cents, quote from ECB at 10:15")
spokenMoney({ amount: "500", currency: "XYZ" }, null, "en", { timeZone: "UTC", now }) // Err(COMMERCE_CURRENCY_UNKNOWN) -> component says "amount unavailable, unknown currency XYZ"
spokenDistance("lt5", "en") // Ok("less than 5 kilometres away") from discovery.bucket.lt5.spoken
spokenSync("transport_acknowledged", "en", { transport: { kind: "relay", name: "Old Town Swap" } }) // Ok("Delivered to relay Old Town Swap, peer has not confirmed")
announce(t("offer.received"), { priority: "polite", region: "status", coalesceKey: "incoming-offers", summaryKey: "offers.received.summary" })
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R02, PS-110-01.R03, PS-110-03.R03, PS-110-05.R01, PS-110-05.R02, PS-110-10.R01 | inspect exports, storage and network calls; run spoken helpers on typed inputs and invalid ones | no vault, IndexedDB or network access; no stored data or persisted state; pure typed functions; Ok for valid input; Err(COMMERCE_MONEY_INVALID) for amount '01'; alt text taken only from props |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
