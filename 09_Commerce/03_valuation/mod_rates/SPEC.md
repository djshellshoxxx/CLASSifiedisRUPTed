# F09.S03.M02 — FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S03](../SPEC.md). **Process IDs:** PS-075-01…PS-075-10. **Code:** `packages/commerce/src/valuation/rates`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Issues FX quotes with exact rational rates {num, den}, a named source and a short expiry (default 15 minutes) so that barter cycles, offers and deals can pin a quote by ID and show the same conversion to every party. Quotes live in the user's vault (ADR-0016). Rates come from a RateSourcePort adapter that the user chose (direct provider, or a relay that signs the quote it serves) or from manual rates typed by a principal, which are always labelled as manual. A quote pinned into a signed statement is embedded with its source signature so counterparties verify the rate origin. Quotes never move money and never silently refresh: an expired quote returns EXPIRED and callers must re-quote and re-obtain consent.

## Responsibilities

- Own FxQuote records and issue them from RateSourcePort adapters (MVP adapters ecb-daily for fiat and manual for any pair).
- Convert provider decimal strings to exact rationals without floating point, reducing by gcd and bounding to 40 digits.
- Enforce expiry (default 15 min, range 1 to 60 min for provider quotes, up to 24 h for manual quotes) and staleness limits per source.
- Label manual quotes visibly with the issuing principal and reason, and let the issuer revoke them; a relay operator may also serve relay-signed quotes through a relay command.
- Provide a validity check so consumers can verify a pinned quote ID before use, per MNY-4.

## Not responsible for

- The conversion arithmetic and rounding (F09.S03.M03 precision).
- Which currencies exist and their decimals (F09.S03.M01 currency registry).
- Re-consent flows after quote expiry (F02.S04.M02 normalization and the barter consent modules).
- Choosing a trusted relay or rate provider; the user selects it in settings (F15 platform) and this module only records the choice in each quote's source.
- Future: live crypto market-data adapters and multi-source median quotes; MVP crypto pairs use manual quotes or a configured adapter disabled by default.

## User stories

- As a barter participant, I see the exact rate, its source and when it expires before I consent to a value-balanced cycle.
- As a community member, I can enter a manual rate for a local currency pair, and everyone who receives a statement containing it sees it labelled as a manual rate with my pseudonym.
- As a developer, I can pin a quote by ID and later verify it is still valid.

## Edge cases

- Provider (direct or via relay) returns the rate as a JSON float 1.0870; the adapter parses the token as a decimal string and stores 10870/10000 reduced to 1087/1000, never a double.
- The ECB daily file is 3 days old over a weekend; fiat quotes remain acceptable up to 96 h, older returns COMMERCE_RATE_STALE.
- A provider returns a rate that differs by more than 50 percent from the last accepted quote of the pair in 24 h; the quote is refused as suspicious.
- Two members request the same pair at the same instant; both get the same cached rate but separate quote IDs and expiry clocks.
- A quote expires while a consumer displays it; the consumer's pin check returns EXPIRED and it must request a new quote.
- The chosen source is unreachable or the device is offline; the request returns DEPENDENCY_UNAVAILABLE and falls back only to a non-expired local manual quote if one exists for the pair.
- A relay-signed quote arrives with an invalid or unknown-relay signature; it is refused with COMMERCE_RATE_SIGNATURE_INVALID and never pinned.

## UX and accessibility

- Rate chip next to converted values: shows 1 EUR = 1.087 USD, source name, 'expires in 14:32', and a Manual rate label when applicable.
- Manual-rate form: pair, rate as decimal or fraction, reason (≤ 200 chars), validity 15 min to 24 h.

**States:** loading; fresh; expiring; expired; manual; error

**Accessibility:** The expiry countdown is announced politely at 5 min, 1 min and at expiry, not every second.; Manual rate label uses text, not only color.; Rate chip is keyboard focusable and exposes source and asOf in its accessible description.

## Owned data

- `FxQuote` (classrup.commerce.fx_quote/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.fx_quote.request`, `commerce.fx_quote.issue_manual`, `commerce.fx_quote.relay_issue`, `commerce.fx_quote.revoke`
- Queries: `commerce.fx_quote.check`, `commerce.fx_quote.get`
- Emits: `commerce.fx_quote.issued`, `commerce.fx_quote.revoked`
- Consumes: `commerce.currency.registered`, `commerce.currency.status_changed`

## Dependencies

F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-075-01 | [Domain schema](domain_schema.md) | 3 |
| PS-075-02 | [Validation rules](validation_rules.md) | 3 |
| PS-075-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-075-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-075-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-075-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-075-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-075-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-075-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-075-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/valuation/rates/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI.
- An expired or revoked quote can never be pinned or used, and the response is always EXPIRED or an explicit invalid status.
- Every manual quote is visibly labelled manual in API output and UI.
