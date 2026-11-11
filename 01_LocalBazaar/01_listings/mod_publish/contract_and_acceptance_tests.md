# PS-004-09 — Contract and acceptance tests: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-09.R01** Every requirement is covered by at least one automated test.
- **PS-004-09.R02** Contract tests validate the signed projection, tombstone and event payloads against the schema registry and verify signatures.
- **PS-004-09.R03** Honesty tests assert that the UI and API never report relay receipt or peer acceptance without a signed receipt.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with principal P1 and key K1, complete sell listing L (EUR 50.00, region u33db, barterAcceptable true), wanted listing W with private budget, relays R1 (accepting), R2 (rejecting under its policy) and R3 (clock 3 days ahead), policy pack with block rule b1 and review rule r1, risk stub, consent store, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T01 | unit | PS-004-01.R01, PS-004-01.R03, PS-004-06.R03 | publish L offline | PublicationRecord active, delivery prepared, no receiptAt, no peer_accepted claim |
| TEST-PS-004-09.T02 | contract | PS-004-01.R02, PS-004-01.R04, PS-004-04.R02, PS-004-09.R02 | publish L and W, then unpublish | projection validates against classrup.bazaar.listing/v1 and its key set equals the allowlist exactly (barterAcceptable, inStock, expiresAt and mailboxHints present; no status, closeReason, currentPublicationId or minOffer; W has no maxBudget); region <= 5 chars; signature verifies; tombstone validates |
| TEST-PS-004-09.T03 | unit | PS-004-02.R01, PS-004-02.R02, PS-004-02.R03 | violate each rule V01-V17 | documented error code returned, no statement signed |
| TEST-PS-004-09.T04 | property | PS-004-03.R01, PS-004-03.R02 | random command sequences | only declared transitions succeed; active implies Listing published in same transaction |
| TEST-PS-004-09.T05 | integration | PS-004-03.R03, PS-004-06.R02 | R1 accepts, R2 rejects | R1 peer_accepted after signed receipt, R2 relay_rejected, record stays active |
| TEST-PS-004-09.T06 | integration | PS-004-04.R01, PS-004-04.R03 | publish with review verdict then confirm | held_for_confirmation first, active after confirm with ownerConfirmedAt |
| TEST-PS-004-09.T07 | contract | PS-004-04.R02 | each command runs | outputs and events validate against registry schemas |
| TEST-PS-004-09.T08 | abuse | PS-004-05.R01, PS-004-05.R02 | another principal's key or revoked key signs publish | FORBIDDEN; no statement produced |
| TEST-PS-004-09.T09 | abuse | PS-004-05.R03, PS-004-07.R03, PS-004-04.R04 | R2 signs a statement of reasons for L, then a foreign-author statement reaches a receiving vault | delivery relay_removed with hostingRemoved only for R2; Listing status and R1 delivery unchanged; foreign statement quarantined; wording says pseudonymous not anonymous |
| TEST-PS-004-09.T10 | integration | PS-004-06.R01, PS-004-06.R02 | replay publish with same key; fork chain from second device | one statement; fork detected, publication frozen, user prompt shown |
| TEST-PS-004-09.T11 | chaos | PS-004-06.R03 | R1 unreachable for 2 h then returns | backoff schedule honoured, state moves prepared to transport_acknowledged without duplicate statements |
| TEST-PS-004-09.T12 | integration | PS-004-07.R01, PS-004-07.R02 | unpublish after publish | tombstone queued to every relay with a received delivery; UI copy states fetched copies may persist |
| TEST-PS-004-09.T13 | integration | PS-004-03.R01 | governance.prohibited_rule.changed adds a block rule matching L | publication ends with policy_changed and tombstone queued |
| TEST-PS-004-09.T14 | abuse | PS-004-04.R04 | a notice for R2 signed by R1, one signed by a random key, a replay of an accepted notice, then a valid R2 reversal | first three quarantined (signer_not_relay, signature_invalid or signer_not_relay, duplicate); reversal clears hostingRemoved on R2 only |
| TEST-PS-004-09.T15 | integration | PS-004-03.R04, PS-004-04.R05 | attach_promotion, payment claimed and acknowledged by the operator, then a promotion statement signed by R1 vs by a random key, then a signed withdrawal | Deal opened with contextRef listing_fee and payee operatorDid; acknowledged without label; active only for R1's signature with promotion_activated; revoked after withdrawal |
| TEST-PS-004-09.T16 | load | PS-004-08.R01, PS-004-08.R02, PS-004-08.R03 | 200 publications re-evaluated on Moto G profile; relay at 50 req/s | publish p95 <= 150 ms, batch <= 2 s, relay p95 <= 300 ms, no telemetry requests |
| TEST-PS-004-09.T17 | unit | PS-004-09.R01, PS-004-09.R03 | traceability and honesty test | every PS-004 requirement maps to a passing test; UI never shows accepted without receipt |
| TEST-PS-004-09.T18 | integration | PS-004-10.R01, PS-004-10.R02, PS-004-10.R03 | export, import to fresh vault, import with wrong owner | records round-trip; active publications import as unpublished-pending-resign; foreign owner read-only |
| TEST-PS-004-09.T19 | integration | PS-004-02.R04 | spam stub (moderation.spam.evaluate) scores high, then risk stub (moderation.risk.assess) returns elevated; federationOptIn without consent for R1; regionCell of 6 characters injected past the record check | held_for_confirmation and no signature in both first cases; BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED; DISCOVERY_PRECISION_FORBIDDEN; nothing queued in each case |
| TEST-PS-004-09.T20 | abuse | PS-004-02.R05 | R3 returns receipts 3 days in the future while R1 and R2 agree with the device; then only R3 is configured | R3 flagged untrusted and publish succeeds; with R3 alone the command proceeds with clockWarning instead of PRECONDITION_FAILED |
| TEST-PS-004-09.T21 | integration | PS-004-02.R06 | unpublish L with an active deal hold without and with confirmHolds | BAZAAR_PUBLISH_HOLDS_ACTIVE first; then unpublished with the hold still active and listed |
| TEST-PS-004-09.T22 | integration | PS-004-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.publications present with field classes; deletion ends publications with account_deleted and pseudonymizes retained records |

## Acceptance criteria

- All tests T01-T22 pass in CI.
- No projection contains data beyond the P0 allowlist or a region finer than L2.
- No UI or API reports transport_acknowledged, peer_accepted or Promoted without a verified signed receipt or relay statement, no relay notice changes the owner's Listing, and no text claims global removal.

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
