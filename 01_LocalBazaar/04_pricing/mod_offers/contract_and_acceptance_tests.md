# PS-011-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001, CTR-ID-001, CTR-COM-001, CTR-FED-001. Test ownership: F17 QA Lead.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-09.R01 | Consumer contract tests run against every supported producer version (CTR-SCH-001 consumer-driven). | MVP |
| PS-011-09.R02 | Every OFFER.* code passes CTR-ERR-001 registry lint and has a message_key in the catalog. | MVP |
| PS-011-09.R03 | Every offer event passes CTR-EVT-001 envelope fixtures, including the invalid examples. | MVP |
| PS-011-09.R04 | Authorization matrix (PS-011-05) runs as a table-driven test; each row is one case. | MVP |
| PS-011-09.R05 | State transition table (PS-011-03) runs as a table-driven test; each row is one case. | MVP |
| PS-011-09.R06 | Acceptance scenarios cover the user journeys: submit, accept, reject, withdraw, expire, offline replay, blocked party, duplicate offer, stale quote. | MVP |
| PS-011-09.R07 | Test fixtures are synthetic. No real account, listing or location data. | MVP |

## Data / schema
Fixtures: `fixtures/offer/<version>/*.json`, one file per example in PS-011-01 and PS-011-04 plus each invalid case from PS-011-02.

## Commands / queries / events
Harness calls each command and subscribes to each event; no internal calls bypass the API.

## States & transitions
Table-driven from PS-011-03 (R05).

## Validation & errors
Negative fixtures for every rule in PS-011-02 and every error in PS-011-04.

## Authorization
Matrix from PS-011-05 (R04). Includes cross-listing and guessed-ID cases.

## Failure, idempotency, concurrency, offline
Scenarios from PS-011-06 are acceptance tests: replay, race, offline reconnect, partial supersede.

## Privacy, retention, abuse
Privacy scan fixtures from PS-011-07 run in this harness (zero-tolerance output check).

## Observability & budgets
Harness asserts metric emission from PS-011-08 for each command.

## Tests
- TEST-PS-011-09-01 (consumer contract): each consumer fixture set passes against 1.0.0 producer.
- TEST-PS-011-09-02 (error lint): OFFER codes and message keys present.
- TEST-PS-011-09-03 (envelope): valid example passes; each invalid example fails on its listed violation.
- TEST-PS-011-09-04 (matrix): PS-011-05 rows, one case each.
- TEST-PS-011-09-05 (state table): PS-011-03 rows, one case each.
- TEST-PS-011-09-06 (journeys): end-to-end scenario per R06 journey, run on PWA and API.
- TEST-PS-011-09-07 (fixtures): scan finds no real-looking personal data.

## Acceptance criteria
1. Matrix and state-table cases all pass.
2. Each fixture in PS-011-01 and PS-011-04 validates; each invalid case fails.
3. TEST-PS-011-09-01 through -07 pass in CI.

## Assumptions & open decisions
- ASSUMPTION: harness and fixture location owned by F17 (test strategy, OPEN).
- PENDING CTR-ID-001 (offer prefix) and CTR-COM-001 (COM.QUOTE_EXPIRED) before fixtures can be final.
- PENDING F01 listing-state fixtures.
