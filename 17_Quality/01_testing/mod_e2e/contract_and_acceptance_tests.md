# PS-134-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-COM-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-09.R01 | One acceptance scenario per flow, mapped to the owning PS IDs listed below | MVP |
| PS-134-09.R02 | Payment scenarios validate claimed and confirmed states against CTR-COM-001 | MVP |
| PS-134-09.R03 | Federation import/export scenario validates envelopes against CTR-FED-001 | MVP |
| PS-134-09.R04 | Browser automation library chosen with license and version recorded before first scenario | MVP |

## Data / schema
Acceptance map: `{flow, scenario test_id, owning PS IDs}`. Candidate tooling (to verify, not approved): Playwright (Apache-2.0), Cypress (MIT); versions to pin in a later step.

## Commands / queries / events
Acceptance checks use RegisterScenario and RunScenario (PS-134-04).

## States & transitions
Not applicable.

## Validation & errors
Mismatch with contract returns E2E.CONTRACT_MISMATCH (non-retryable).

## Authorization
Acceptance maps edited by QA Lead with flow owner review.

## Failure, idempotency, concurrency, offline
Scenario depends on upstream contract; upstream failure reported to owner, not patched locally.

## Privacy, retention, abuse
Fixtures synthetic (PS-134-07).

## Observability & budgets
Acceptance coverage count (target 12 of 12 flows).

## Tests
- TEST-PS-134-09-01 (e2e): paid listing flow, owners PS-0xx mod_sell and mod_create, asserts listing state and fee claim.
- TEST-PS-134-09-02 (e2e): three-party cycle, owners 02_LocalMutiny/02_cycle_matching/mod_three; asserts closure.
- TEST-PS-134-09-03 (e2e): payment scenario asserts claimed and confirmed separately (CTR-COM-001).
- TEST-PS-134-09-04 (contract): federation import/export envelope validates CTR-FED-001.

## Acceptance criteria
1. Twelve flows each map to one or more scenarios and owning PS IDs.
2. Payment scenario fails if only one state is shown.
3. Tooling version and license recorded in SPEC before first run.

## Assumptions & open decisions
- ASSUMPTION: 12 flows are the complete e2e set for MVP; N-party cycles tested at N=5 as the largest fixture.
- PENDING CTR-COM-001 and CTR-FED-001 approval.
- D01 PROVISIONAL (D01 default, unapproved): federation scenario uses versioned signed envelopes with explicit opt-in.
- D06 PROVISIONAL (D06 default, unapproved): receipts are signed statements; external verification is a separate step.
