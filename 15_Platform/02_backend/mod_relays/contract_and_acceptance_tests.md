# PS-118-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-FED-001 (R04–R13, Examples, Verification order), CTR-EVT-001 (R05), CTR-ERR-001, CTR-SCH-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-09.R01 | Golden federation batches from CTR-FED-001 Examples are accepted/rejected exactly as the examples state. | MVP |
| PS-118-09.R02 | Two-relay interop test: origin relay → destination relay, both current and previous MINOR. | MVP |
| PS-118-09.R03 | Contract tests cover every RELAY.* and FED.* code used by this module. | MVP |

## Data / schema
Fixture set `fixtures/relay/*.json`: valid batches, tampered batches, oversize batches, equivocation pairs, key-rotation sequences. Synthetic keys only.

## Commands / queries / events
Tests exercise PS-118-04 routes and PS-118-03 transitions.

## States & transitions
Full transition table covered by black-box tests through the queue API.

## Validation & errors
Each code asserted with status, retryable and `message_key`.

## Authorization
Fixtures for peer A, peer B, suspended peer, operator (single and dual approval), user principal.

## Failure, idempotency, concurrency, offline
Concurrency: 20 workers claiming 1 000 items; no item double-claimed.

## Privacy, retention, abuse
Fixtures contain no real identifiers; canary bytes for payload leak detection.

## Observability & budgets
Suite runtime ≤ 15 min in CI (ASSUMPTION).

## Tests
- TEST-PS-118-09-01 (contract): CTR-FED-001 example batches.
- TEST-PS-118-09-02 (integration): two-relay interop.
- TEST-PS-118-09-03 (integration): 20-worker claim race.
- TEST-PS-118-09-04 (e2e): federation import then export of a PUBLIC listing across two nodes.
- TEST-PS-118-09-05 (property): duplicates and reordering never produce two accepted results for one (origin, event).

## Acceptance criteria
1. All CTR-FED-001 examples pass.
2. Interop passes for current and previous MINOR.
3. Zero double-claims in 100 race runs.

## Assumptions & open decisions
- PENDING CTR-FED-001 HTTP path definitions (see PS-118-04).
- D01 PROVISIONAL (unapproved).
