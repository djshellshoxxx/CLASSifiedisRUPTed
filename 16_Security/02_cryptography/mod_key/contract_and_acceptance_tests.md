# PS-128-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-09.R01 | Consumers F07.S01.M01, F08.S01.M01, F10.S02.M02, F16.S01.M01 and F16.S02.M03 run contract tests against the key record format. | MVP |
| PS-128-09.R02 | Test vectors for Ed25519 and X25519 from the chosen library's published test suite are used (version pinned, OPEN). | MVP |
| PS-128-09.R03 | Synthetic keys in test fixtures; no real user keys. | MVP |

## Data / schema
Fixtures: `fixtures/keys/<purpose>/<algorithm>/`.

## Commands / queries / events
Tests use PS-128-04 operations.

## States & transitions
Every PS-128-03 transition covered.

## Validation & errors
Every code in PS-128-02 and PS-128-06 covered.

## Authorization
PS-128-05 matrix.

## Failure, idempotency, concurrency, offline
Fault cases in PS-128-06.

## Privacy, retention, abuse
Fixture scan.

## Observability & budgets
Suite <= 15 min (ASSUMPTION).

## Tests
- TEST-PS-128-09-01 (contract): five consumers pass.
- TEST-PS-128-09-02 (vector): library vectors pass.
- TEST-PS-128-09-03 (coverage): transitions and codes.
- TEST-PS-128-09-04 (lint): fixtures synthetic.

## Acceptance criteria
1. All consumer contracts pass (TEST-01).
2. TEST-PS-128-09-01 through -04 pass.

## Assumptions & open decisions
- OPEN (F17): cryptographic test-vector ownership with F16 review (S3-03, S3-04 in audits).
