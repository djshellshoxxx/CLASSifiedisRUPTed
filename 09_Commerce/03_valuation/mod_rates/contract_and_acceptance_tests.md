# PS-075-09 — Contract and acceptance tests: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-09.R01** Every requirement is covered by at least one automated test.
- **PS-075-09.R02** Adapter behavior is tested against recorded provider fixtures with no network access in CI, and signature verification is tested with fixed relay test keys.
- **PS-075-09.R03** Expiry boundaries are tested with a controllable clock.

## Specification

See the module test table below (all processes).

**Fixtures:** Recorded ECB daily XML fixtures (fresh, 3 days old, 6 days old), manual issuer O, fixed relay test keys with a relay clock skewed +20 min, vaults A (proposer) and B (receiver) with no relay configured, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T01 | unit | PS-075-01.R01, PS-075-01.R03, PS-075-02.R02 | request EUR/USD with the fixture 1.0870 token | stored rate 1087/1000, no float used, source ecb-daily |
| TEST-PS-075-09.T02 | unit | PS-075-02.R01, PS-075-02.R03 | same currency pair, unknown currency, stale 6-day-old data, 60% deviation | documented error codes returned and nothing stored |
| TEST-PS-075-09.T03 | property | PS-075-01.R01, PS-075-02.R02 | random decimal strings up to 18 fractional digits | num and den coprime and num/den equals the decimal exactly |
| TEST-PS-075-09.T04 | unit | PS-075-03.R01, PS-075-03.R02, PS-075-01.R03 | no relay configured; the vault clock is advanced to expiresAt and to one second before | check evaluates the local clock only - valid then EXPIRED - and the quote is never extended |
| TEST-PS-075-09.T05 | integration | PS-075-03.R03 | issuer revokes a manual quote already sent to a peer | local check shows revoked, revocation statement reaches prepared then peer_accepted, peer pin check reports invalid |
| TEST-PS-075-09.T06 | contract | PS-075-04.R01, PS-075-04.R02, PS-075-09.R02 | execute each command and query | outputs and events validate against registry schemas |
| TEST-PS-075-09.T07 | integration | PS-075-04.R03, PS-075-06.R01 | replayed request with same key | same quote ID returned; no second event |
| TEST-PS-075-09.T08 | abuse | PS-075-05.R01, PS-075-05.R02, PS-075-07.R02 | relay_issue by an unregistered device key; 31 relay requests in one hour; tampered relay quote | relay denies, 31st returns RATE_LIMITED, vault rejects tampered quote with COMMERCE_RATE_SIGNATURE_INVALID |
| TEST-PS-075-09.T09 | chaos | PS-075-06.R02, PS-075-06.R03 | provider times out three times | DEPENDENCY_UNAVAILABLE, falls back to live manual quote if present, cache intact |
| TEST-PS-075-09.T10 | integration | PS-075-07.R01, PS-075-01.R02 | inspect outbound provider request and a statement embedding a relay-signed and a direct-provider quote | request contains only the pair and no client identifiers; the relay-signed quote is carried with its relay signature; the direct-provider quote is carried in full with sourceSigned false |
| TEST-PS-075-09.T11 | load | PS-075-08.R01, PS-075-08.R02 | 50 req/s for 5 minutes with cache | p95 ≤ 150 ms; sweep of 100 000 quotes ≤ 3 s |
| TEST-PS-075-09.T12 | unit | PS-075-09.R01, PS-075-09.R03 | traceability tool run and boundary tests | every PS-075 requirement maps to a passing test |
| TEST-PS-075-09.T13 | integration | PS-075-10.R01, PS-075-10.R02, PS-075-10.R03 | export, re-import and downgrade | quotes round-trip identical; expired quotes import as expired |
| TEST-PS-075-09.T14 | abuse | PS-075-01.R04, PS-075-01.R05, PS-075-02.R04, PS-075-07.R05 | vault A embeds a forged {source ecb-daily} quote with an invented rate in a statement to vault B; B calls verify_embedded with reDerive | B shows 'source asserted by <A pseudonym>, not verifiable', sourceSigned false, stores receivedFrom and the ECB deviation; nothing reads as ECB-sourced |
| TEST-PS-075-09.T15 | unit | PS-075-03.R02, PS-075-05.R04 | relay-signed quote from a relay whose clock is 20 minutes ahead, embedded in a statement received 12 minutes after its claimed signing time | expiry decided on vault B's clock; relay asOf and expiresAt shown as the relay's claim; skew note shown |
| TEST-PS-075-09.T16 | unit | PS-075-03.R04, PS-075-02.R01 | barter_normalization requests of 86 400 000 ms and 86 400 001 ms, a general provider request of 3 600 001 ms, and a 24 h quote checked 23 h 29 min after issue against F02.S04.M02's 30-minute remaining-life requirement | first accepted and labelled 'pinned rate agreed by all parties'; second and third VALIDATION_FAILED; the 24 h quote still has 31 minutes of life and passes |
| TEST-PS-075-09.T17 | integration | PS-075-04.R04 | vault B ingests a revocation signed by the issuer, one signed by another did, a duplicate, one naming an unknown quote and one from a blocked did | applied once; signer_not_issuer quarantined; duplicate no-op; quote_unknown buffered then dropped after 24 h; blocked dropped silently |
| TEST-PS-075-09.T18 | abuse | PS-075-02.R04, PS-075-07.R05 | manual quote attributed to pseudonym C embedded by A without C's signature; and with C's valid signature | first refused with COMMERCE_RATE_SIGNATURE_INVALID; second shown as 'manual rate by C' with issuerSigned true and sourceSigned false |
| TEST-PS-075-09.T19 | integration | PS-075-07.R04 | export, deletion and retention purge driven by F10 | section commerce.fx_quotes exported; privacy.deletion.completed pseudonymizes issuerRef; RetentionPurgePort purges unreferenced quotes after 30 days; every field carries an F10.S02.M02 class |
| TEST-PS-075-09.T20 | unit | PS-075-08.R03 | issue two manual quotes, revoke one and ingest one revocation | classrup_commerce_fx_manual_quotes_total counts issued 2, revoked 1, ingested_revocation 1 in local diagnostics; no network telemetry |
| TEST-PS-075-09.T21 | unit | PS-075-05.R03 | issue a manual quote with a reason | one local audit-log entry with quoteId, pair and reason and no rate in any network payload |
| TEST-PS-075-09.T22 | integration | PS-075-07.R03 | a quote pinned by a proposal and an unreferenced quote, clock advanced 31 days and then 2 years | unreferenced quote purged at 31 days; pinned quote retained until 2 years after the proposal's last activity |
| TEST-PS-075-09.T23 | contract | PS-075-04.R05 | verify_embedded for relay-signed, issuer-signed, fetched and asserted quotes | outputs validate and carry the labels in the note exactly |

## Acceptance criteria

- All tests T01–T23 pass in CI.
- An expired or revoked quote can never be pinned or used, and the response is always EXPIRED or an explicit invalid status.
- Every manual quote is visibly labelled manual in API output and UI.
- Quote validity is decided by the local clock of the checking vault; no relay clock can make a quote valid or expired.
- A rate's origin is shown as verified only when a relay signature verifies; a manual rate shows its signed issuer, and every other embedded quote reads 'source asserted by <issuer pseudonym>, not verifiable'.

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F11.S01.M01, F11.S01.M03, F07.S02.M01, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
