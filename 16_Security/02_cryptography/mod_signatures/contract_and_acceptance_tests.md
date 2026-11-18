# PS-130-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-FED-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-09.R01 | Ed25519 implementation passes RFC 8032 test vectors in CI. | MVP |
| PS-130-09.R02 | JCS canonicalization passes RFC 8785 vectors. | MVP |
| PS-130-09.R03 | Golden CTR-EVT-001 signed envelope fixtures verify on two independent implementations (interop). | MVP |
| PS-130-09.R04 | Tamper fixtures (one byte change in any field) all fail verification. | MVP |

## Data / schema
Fixtures stored in module test directory; synthetic keys only, never production keys.

## Commands / queries / events
Tests exercise [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Covers all rows in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Each code in [validation_rules.md](validation_rules.md) has a fixture.

## Authorization
Tests cover producer and user principals per PS-130-05.

## Failure, idempotency, concurrency, offline
Key rotation fixture set and key-revoked-before-occurred fixture set.

## Privacy, retention, abuse
Synthetic IDs only.

## Observability & budgets
Suite runtime ≤ 5 min (ASSUMPTION).

## Tests
- TEST-PS-130-09-01: unit, RFC 8032 vectors.
- TEST-PS-130-09-02: unit, RFC 8785 vectors.
- TEST-PS-130-09-03: integration, two-implementation interop.
- TEST-PS-130-09-04: property, sign-then-verify round trip for 10,000 random payloads.

## Acceptance criteria
1. 100% pass rate on vectors.
2. Zero acceptance of tampered fixtures.

## Assumptions & open decisions
- ASSUMPTION: second implementation is available for interop (to be selected; OPEN).
- D01 default governs envelope fixtures: PROVISIONAL (D01 default, unapproved).
