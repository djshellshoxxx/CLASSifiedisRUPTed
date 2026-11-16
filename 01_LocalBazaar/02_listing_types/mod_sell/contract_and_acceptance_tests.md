# PS-006-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-COM-001, CTR-FED-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-09.R01 | Contract tests run in CI for every sell command, query and event against CTR-SCH-001 fixtures. A schema change without a compatibility pass blocks merge. | MVP |
| PS-006-09.R02 | End-to-end tests cover: single-unit sale; two-unit sale with reversal; dispute hold and release; reservation expiry; offline replay. | MVP |
| PS-006-09.R03 | Accessibility tests cover the request and accept flows by keyboard and screen reader (F14 rules). | MVP |
| PS-006-09.R04 | F09 is mocked for contract tests. A recorded F09 sandbox run is required before release (ASSUMPTION). | MVP |

## Data / schema
Test fixtures: `fixtures/sell.listing-extension/1.0.0/*.json` (valid and invalid); `fixtures/listing.sell_terms_changed/1.0.0/*.json`; claim sequences for cash, on-chain and reversal cases. Each fixture records its expected error code or event.

## Commands / queries / events
Every command and event in [PS-006-04](commands_queries_events.md) has at least one contract test.

## States & transitions
State-machine coverage: rows T1–T10 in [PS-006-03](workflow_state_machine.md) each have one e2e or integration test.

## Validation & errors
Each `SELL.*` code in [PS-006-02](validation_rules.md) has one fixture that triggers it.

## Authorization
Each row of the matrix in [PS-006-05](authorization_capabilities.md) has an allow and a deny case.

## Failure, idempotency, concurrency, offline
Fault injection: F09 timeout, duplicate claim event, out-of-order claim event, two concurrent accepts, replayed offline write.

## Privacy, retention, abuse
Negative fixtures: SECRET field in payload, coordinate-shaped `region_cell`, federated export containing `prq_`.

## Observability & budgets
Contract suite runtime ≤ 10 min in CI (ASSUMPTION). Load and budget tests are in [PS-006-08](observability_performance.md).

## Tests
- TEST-PS-006-09-01 (contract): all event fixtures validate against CTR-SCH-001 registry entries.
- TEST-PS-006-09-02 (e2e): single-unit sale from request to `listing.sale_recorded`.
- TEST-PS-006-09-03 (e2e): two-unit sale, then claim reversal restores quantity to 2.
- TEST-PS-006-09-04 (e2e): dispute hold, then resolved with no sale; listing returns to AVAILABLE.
- TEST-PS-006-09-05 (a11y): request, accept and decline are completable by keyboard alone with announced state changes.
- TEST-PS-006-09-06 (offline): queued `set_terms` replays against current revision and produces `SYS.CONFLICT` if changed.

## Acceptance criteria
1. Every row of PS-006-01 through PS-006-08 maps to at least one passing test ID.
2. All five e2e scenarios pass against the F09 mock and the recorded sandbox run.
3. Every `SELL.*` code has a fixture and a passing test.
4. Contract suite blocks merge on any unversioned schema change.

## Assumptions & open decisions
- ASSUMPTION: sandbox recording from F09 is available before release.
- D04 NOT APPLICABLE (not barter).
- D06 PROVISIONAL (signed statements only). Test fixtures use attested claims, not payment proof.
