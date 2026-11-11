# F14.S02.M02 — Currency display

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S02](../SPEC.md). **Process IDs:** PS-112-01…PS-112-10. **Code:** `packages/i18n/src/internationalization/currencies`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Locale-aware display and input parsing of Money (CTR-MNY-001: a decimal string of minor units plus a currency code). Amounts are validated with the canonical Money library F09.S03.M03 (parseMinor, at most 38 digits) and the currency is the F09.S03.M01 CurrencyDef the caller resolved from the registry; a code missing from the registry fails with COMMERCE_CURRENCY_UNKNOWN (MNY-2) and renders an explicit unavailable state. Formatting never converts minor units to a JavaScript Number: the string is split into whole and fraction digits and formatted through Intl.NumberFormat so values far beyond 2^53 stay exact. Approximate (converted) values are labelled with the code, wording that matches the quote's provenance (provider, manual rate by a named issuer, unverified source, or the N16 pinned rate agreed by all parties), the quote time and an expired marker taken from the quote's expiresAt and status, for example "≈ 42.10 EUR, quote from ECB at 10:15" (CTR-UX-001 UX-4); without a source or time no converted amount is shown. Every public function returns a Result. The module displays and parses only; it does not convert, round or hold funds, and a displayed price is a claim, not a payment instruction.

## Responsibilities

- Format Money { amount, currency } for a locale with the F09.S03.M01 CurrencyDef (decimals) passed by the caller, using string splitting so no Number conversion occurs, with exactly decimals fraction digits and no rounding; return COMMERCE_CURRENCY_UNKNOWN when the caller found no CurrencyDef and I18N_MONEY_SPEC_MISMATCH when money.currency differs from the CurrencyDef code.
- Support display modes symbol, code and name; fiat currencies known to Intl use Intl currency style, and registered codes that Intl does not know (crypto such as BTC 8, ETH 18, USDC 6, up to 36 decimals) use decimal style plus the code isolated for bidi, with CurrencyDef.name as the currency name.
- Format approximate values from a QuoteLabel that the caller builds from an F09.S03.M02 FxQuote, with provenance wording (quote from <provider>, manual rate by <issuer>, unverified source, pinned rate agreed by all parties), the quote time in the viewer's time zone and an expired or revoked marker; without a source or time no converted amount is rendered.
- Parse user-typed amounts in a locale to minor-unit strings by normalizing to a neutral decimal string and calling F09.S03.M03 parseDecimal, rejecting more fraction digits than the decimals, mixed separators, ambiguous grouping and values above 38 digits instead of rounding silently.
- Expose parts (sign, currency, integer, group, decimal, fraction) so layouts can style the currency and fraction, and provide currencyName output used by the spoken names of F14.S01.M02.

## Not responsible for

- Currency registry and decimals (F09.S03.M01), FX rates and quotes (F09.S03.M02) and Money parsing, conversion arithmetic and rounding (F09.S03.M03).
- Message catalogs and locale negotiation (F14.S02.M01), which this module uses.
- Verifying quote signatures, collecting consent and resolving issuer pseudonyms (callers, using F09.S03.M02, the barter consent modules and F07 identity); this module only renders the result it is given.
- Storing the display preference (F15.S04.M03 LocalSettings.moneyDisplay; the PWA shell passes it in).
- Payments, balances and custody; the platform holds no funds and displayed amounts are claims between parties (CTR-COM-001).
- Future: compact notation for large amounts, accounting-style negatives and per-region currency symbol preferences; MVP uses standard notation only.

## User stories

- As a buyer in Germany, I see a EUR price as "45,00 €" and a US buyer sees "€45.00" for the same listing.
- As a user, a very large amount such as 12345678901234567890 minor units is shown with every digit correct.
- As a barter participant, an approximate converted value reads "≈ 42.10 EUR, quote from ECB at 10:15", and a rate my counterparty typed reads "manual rate by <their pseudonym>", so I know it is neither exact nor from a provider.
- As a user typing a price, "12,50" in a German locale is understood as 12.50 and "12.345" is rejected as ambiguous with the hint "use 12345 or 12,345" rather than read silently.
- As a barter participant, a rate we pinned into the proposal reads "pinned rate agreed by all parties" only once every party has consented, and an expired pinned rate tells me a re-quote needs new consent from all parties.

## Edge cases

- Amount 5 minor units of a 2-decimal currency formats as 0.05, not 0.5 or 5.00.
- Negative amount -250 formats with the locale's minus sign and, when the whole part is zero (-5), keeps the sign (-0.05).
- Currency with 0 decimals (JPY) shows no fraction; 3 (KWD) shows three digits; ETH (18) shows 18 digits and a registered crypto asset with 36 decimals shows 36, with no trailing trim unless the caller requests trimming.
- Amount 9007199254740993 (above 2^53) formats exactly; a Number-based formatter would show ...992.
- The engine lacks exact decimal-string support in Intl.NumberFormat (older Safari); the BigInt part-substitution path is used and produces identical output.
- The quote has reached expiresAt or is revoked; the label adds 'expired quote' or 'revoked quote'; an unpinned quote offers a re-quote when online, while a pinned quote shows 're-quote needs new consent from all parties' instead of a refresh.
- A registered code that Intl does not know, such as USDC, is rendered through decimal style plus the code and CurrencyDef.name, never through Intl currency style which would throw; a code missing from the registry returns COMMERCE_CURRENCY_UNKNOWN and the price component shows 'amount unavailable, unknown currency <code>'.
- A JPY amount is passed with the EUR CurrencyDef; I18N_MONEY_SPEC_MISMATCH is returned instead of a value with the wrong exponent.
- A counterparty sends a manual quote whose source text is 'ECB'; it is rendered 'manual rate by <pseudonym>', never 'quote from ECB'.
- The quote source or time is missing; no converted amount is rendered and the caller shows the original-currency price with 'conversion unavailable'.
- Right-to-left locale; the amount is wrapped in bidi isolation so digits and symbol keep order inside RTL text.

## UX and accessibility

- Price display components used in listing cards, offers, proposals and receipts, always with a currency symbol or code, and an explicit 'amount unavailable, unknown currency <code>' state for codes missing from the registry.
- Money input field: label with currency, locale-aware decimal separator hint, inline errors for too many fraction digits, mixed separators and ambiguous grouping (with the hint 'use 12345 or 12,345' in the locale's separators).
- Approximate value chip: '≈ 42.10 EUR' with provenance wording and an info button that opens the quote source, issuer, manual reason, time and expiry; for an expired unpinned quote it offers Re-quote, for an expired pinned quote it shows 're-quote needs new consent from all parties'.

**States:** formatted; approximate; expired-quote; conversion-unavailable; amount-unavailable; invalid-input; parsed

**Accessibility:** Money input uses inputmode=decimal, a visible label including the currency, and errors linked with aria-describedby.; The approximate chip's accessible name contains approximately, the amount with currency name, the provenance wording, the time and the expired marker when shown.; The info button is at least 44×44 px and opens an accessible popover with focus management.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-112-01 | [Domain schema](domain_schema.md) | 3 |
| PS-112-02 | [Validation rules](validation_rules.md) | 5 |
| PS-112-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-112-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-112-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-112-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-112-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-112-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-112-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-112-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/i18n/src/internationalization/currencies/index.ts`.

## Acceptance criteria

- All tests T01–T18 pass in CI.
- Formatting is digit-exact for any amount up to 38 digits in every shipped locale (property test).
- Every approximate value is shown with currency, provenance wording and quote time, or the converted amount is not shown at all.
