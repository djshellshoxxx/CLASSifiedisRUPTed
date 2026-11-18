# PS-037-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-09.R01 | Contract tests run against CTR-EVT-001, CTR-CAP-001, CTR-ERR-001 and CTR-PRV-001 schemas in CI. | MVP |
| PS-037-09.R02 | Four rule families each have positive, negative and boundary fixtures (score 69, 70). | MVP |
| PS-037-09.R03 | Fixtures include a shared household device (false-positive case) and a colluding ring (true-positive case). | MVP |
| PS-037-09.R04 | Acceptance requires zero leaks of `device_key_hash` and account IDs in non-F12 outputs. | MVP |

## Data / schema
Fixture format: JSON bid streams with synthetic `acc_`/`bid_` IDs; no real personal data.

## Commands / queries / events
Consumer-driven contract tests for `fraud.signal_recorded` and `fraud.case_*` events.

## States & transitions
Scenario tests walk OPEN to UPHELD, DISMISSED and AUTO_CLOSED paths.

## Validation & errors
Negative fixtures for each FRAUD.* code (PS-037-02).

## Authorization
Negative tests for each actor-action pair (PS-037-05).

## Failure, idempotency, concurrency, offline
Chaos fixtures: duplicate, late, and timed-out events (PS-037-06).

## Privacy, retention, abuse
Lint and redaction tests (PS-037-07, PS-037-08).

## Observability & budgets
Test run must include metric assertions from PS-037-08.

## Tests
- TEST-PS-037-09-01 (contract): event envelopes validate against CTR-EVT-001.
- TEST-PS-037-09-02 (e2e): colluding-ring fixture reaches an OPEN case with score >= 70.
- TEST-PS-037-09-03 (e2e): shared-household fixture scores below 70 and opens no case.
- TEST-PS-037-09-04 (a11y): moderator review screen passes keyboard-only and screen-reader checks (F14).

## Acceptance criteria
1. Contract suite green in CI.
2. Both true-positive and false-positive fixtures behave as specified.
3. Zero leaks in the full fixture corpus.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures are sufficient for planning; real-data validation is a future gate.
- PROVISIONAL (D07 default, unapproved): fixture data retention 30 days.
