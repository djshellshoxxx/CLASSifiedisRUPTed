# F09.S03.M02 — FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S03](../SPEC.md). **Process IDs:** PS-075-01…PS-075-10. **Code:** `packages/commerce/src/valuation/rates`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Issues FX quotes with exact rational rates {num, den}, a named source and a short expiry (default 15 minutes) so that barter cycles, offers and deals can pin a quote by ID and show the same conversion to every party. Quotes live in the user's vault (ADR-0016). Rates come from a RateSourcePort adapter that the user chose (direct provider, or a relay that signs the quote it serves) or from manual rates typed by a principal, which are always labelled as manual. A quote requested with purpose barter_normalization may be pinned for up to 24 h and is shown as 'pinned rate agreed by all parties' (N16). Only a relay-signed quote has a verifiable origin (sourceSigned true); a manual quote is signed by its issuer, which proves who asserted the rate but not where it came from (issuerSigned true, sourceSigned false); a direct-provider quote embedded in a statement is labelled 'source asserted by <issuer pseudonym>, not verifiable' (sourceSigned false), and a receiver may re-derive reproducible sources such as the ECB reference rate for asOf. Expiry is evaluated against the local clock of the vault doing the check; a relay's asOf or expiresAt is shown only as that relay's claim. Quotes never move money and never silently refresh: an expired quote returns EXPIRED and callers must re-quote and re-obtain consent.

## Responsibilities

- Own FxQuote records and issue them from RateSourcePort adapters (MVP adapters ecb-daily for fiat and manual for any pair).
- Convert provider decimal strings to exact rationals without floating point, reducing by gcd and bounding to 40 digits.
- Enforce expiry on the local clock (default 15 min; provider quotes 1 to 60 min for purpose general and up to 24 h for purpose barter_normalization; manual quotes 15 min to 24 h) and staleness limits per source.
- Label manual quotes visibly with the issuing principal and reason, and let the issuer revoke them; a relay operator may also serve relay-signed quotes through a relay command.
- Provide a validity check so consumers can verify a pinned quote ID before use, per MNY-4.
- Verify quotes embedded in peer statements (relay signature, issuer signature and issuerRef binding, local-clock expiry, optional ECB re-derivation) and return sourceSigned with the label every consumer shows.
- Produce classrup.commerce.fx_quote_revocation/v1 and ingest peer revocations through commerce.fx_quote.ingest_revocation with signer-role checks, cid deduplication and quarantine reasons.

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
- As a receiver of a cycle proposal, I see whether each embedded rate's origin is verifiable or only asserted by the proposer, and whether it deviates from the ECB reference rate for its asOf.
- As a barter coordinator, I pin a cross-currency rate for up to 24 h so participants in different time zones can consent before it expires.

## Edge cases

- Provider (direct or via relay) returns the rate as a JSON float 1.0870; the adapter parses the token as a decimal string and stores 10870/10000 reduced to 1087/1000, never a double.
- The ECB daily file is 3 days old over a weekend; fiat quotes remain acceptable up to 96 h, older returns COMMERCE_RATE_STALE.
- A provider returns a rate that differs by more than 50 percent from the last accepted quote of the pair in 24 h; the quote is refused as suspicious.
- Two members request the same pair at the same instant; both get the same cached rate but separate quote IDs and expiry clocks.
- A quote expires while a consumer displays it; the consumer's pin check returns EXPIRED and it must request a new quote.
- The chosen source is unreachable or the device is offline; the request returns DEPENDENCY_UNAVAILABLE and falls back only to a non-expired local manual quote if one exists for the pair.
- A relay-signed quote arrives with an invalid or unknown-relay signature; it is refused with COMMERCE_RATE_SIGNATURE_INVALID and never pinned.
- No relay is configured at all; provider and manual quotes are issued and expire on the vault's own clock exactly as with a relay.
- A relay's clock runs 20 minutes ahead and its signed asOf and expiresAt reflect that; the receiving vault evaluates expiresAt against its own clock, shows the relay's times as that relay's claim and adds the 10-minute skew note.
- A proposer embeds {source ecb-daily} with an invented rate in a cycle revision; the receiving vault labels it 'source asserted by <proposer pseudonym>, not verifiable', re-derives the ECB reference rate for asOf and flags the deviation.
- A peer embeds a manual quote attributed to another pseudonym without that issuer's signature; it is refused with COMMERCE_RATE_SIGNATURE_INVALID and never shown as that issuer's rate.
- A barter_normalization request asks for validForMs 86 400 000 (24 h) and is accepted; 86 400 001 is refused with VALIDATION_FAILED, and a purpose general provider request above 60 minutes is refused too.
- A revocation statement arrives from a did that is not the quote's issuer, or from a blocked did; the first is quarantined with reason signer_not_issuer and the second dropped silently.

## UX and accessibility

- Rate chip next to converted values: shows 1 EUR = 1.087 USD, source name, 'expires in 14:32' on this device's clock, and a Manual rate label when applicable.
- Origin line under an embedded rate: 'signed by relay <name>', 'manual rate by <pseudonym>' or 'source asserted by <pseudonym>, not verifiable', plus 'ECB reference rate differs by 3.2 %' when re-derived.
- Pinned barter rate: 'pinned rate agreed by all parties' with source, asOf and expiry; relay times shown as 'according to relay <name>'.
- Manual-rate form: pair, rate as decimal or fraction, reason (≤ 200 chars), validity 15 min to 24 h.

**States:** loading; fresh; expiring; expired; manual; pinned-barter; source-unverified; revoked; error

**Accessibility:** The expiry countdown is announced politely at 5 min, 1 min and at expiry, not every second.; Manual rate and unverified-origin labels use text, not only color.; Rate chip is keyboard focusable and exposes source, origin verification and asOf in its accessible description.

## Owned data

- `FxQuote` (classrup.commerce.fx_quote/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.fx_quote.request`, `commerce.fx_quote.issue_manual`, `commerce.fx_quote.relay_issue`, `commerce.fx_quote.revoke`, `commerce.fx_quote.ingest_revocation`
- Queries: `commerce.fx_quote.check`, `commerce.fx_quote.get`, `commerce.fx_quote.verify_embedded`
- Emits: `commerce.fx_quote.issued`, `commerce.fx_quote.revoked`
- Consumes: `commerce.currency.registered`, `commerce.currency.status_changed`, `privacy.deletion.completed`

## Dependencies

F09.S03.M01, F09.S03.M03, F11.S01.M01, F11.S01.M03, F07.S02.M01, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-075-01 | [Domain schema](domain_schema.md) | 5 |
| PS-075-02 | [Validation rules](validation_rules.md) | 4 |
| PS-075-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-075-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-075-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-075-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-075-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-075-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-075-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-075-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/valuation/rates/index.ts`.

## Acceptance criteria

- All tests T01–T23 pass in CI.
- An expired or revoked quote can never be pinned or used, and the response is always EXPIRED or an explicit invalid status.
- Every manual quote is visibly labelled manual in API output and UI.
- Quote validity is decided by the local clock of the checking vault; no relay clock can make a quote valid or expired.
- A rate's origin is shown as verified only when a relay signature verifies; a manual rate shows its signed issuer, and every other embedded quote reads 'source asserted by <issuer pseudonym>, not verifiable'.
