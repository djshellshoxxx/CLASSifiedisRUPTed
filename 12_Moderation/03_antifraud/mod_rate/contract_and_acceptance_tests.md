# PS-099-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-FED-001 (R11, R13), CTR-EVT-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-09.R01 | Reference GCRA implementation in tests; production equals reference on the corpus. | MVP |
| PS-099-09.R02 | Contract tests validate `rate.consume` responses, policy schema and error envelopes. | MVP |
| PS-099-09.R03 | Integration tests with each rate-limited route: message send, listing create, auth login, federation inbound. | MVP |

## Data / schema
Fixtures: policy files for each class (test values); synthetic subject tokens; two-node cluster.

## Commands / queries / events
Test IDs `TEST-PS-099-09-nn`.

## States & transitions
Both bucket states and all policy states exercised.

## Validation & errors
Negative corpus for each code in PS-099-02.

## Authorization
Caller registration tests from PS-099-05.

## Failure, idempotency, concurrency, offline
Fault injection: store outage, clock skew, edge retries.

## Privacy, retention, abuse
Canary and rotation tests from PS-099-07.

## Observability & budgets
Benchmarks and alerts from PS-099-08.

## Tests
- `TEST-PS-099-09-01` unit: GCRA equals reference over 10 000 sequences.
- `TEST-PS-099-09-02` property: burst and sustained bounds hold.
- `TEST-PS-099-09-03` contract: schemas validate; `retry_after_ms` ≤ 3 600 000.
- `TEST-PS-099-09-04` integration: login route closed on store outage; message send open_throttled.
- `TEST-PS-099-09-05` integration: federation per-peer limit returns `FED.RATE_LIMITED` with retry-after.
- `TEST-PS-099-09-06` e2e: rate-limited message send shows an accessible, plain-language retry message (WCAG 2.1 AA, ASSUMPTION scope).

## Acceptance criteria
1. Reference equivalence and property tests pass in CI.
2. Fail-mode table verified for every class.
3. Accessibility test passes for rate-limited messages.

## Assumptions & open decisions
- ASSUMPTION: integration suites use the owning modules' test doubles until those specs reach implementation.
- D01 (federated protocol), PROVISIONAL default applies to TEST-PS-099-09-05 (unapproved).
