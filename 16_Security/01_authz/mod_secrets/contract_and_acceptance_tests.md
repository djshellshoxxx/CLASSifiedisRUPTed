# PS-127-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-09.R01 | Consumer contract tests for lease issuance run for F07.S01.M02 (sessions), F09.S01.M01 (noncustodial), F15.S01.M02 (cache), F15.S02.M01 (relays). | MVP |
| PS-127-09.R02 | Negative contract tests confirm each consumer cannot lease a secret it does not own. | MVP |
| PS-127-09.R03 | Synthetic secrets only in test environments. | MVP |

## Data / schema
Fixtures: `fixtures/secrets/<name>/<version>/` with synthetic values and verifiers.

## Commands / queries / events
Tests call PS-127-04 commands.

## States & transitions
Every PS-127-03 transition covered.

## Validation & errors
Each code in PS-127-02 and PS-127-06 covered.

## Authorization
PS-127-05 matrix tested.

## Failure, idempotency, concurrency, offline
Fault injection per PS-127-06.

## Privacy, retention, abuse
Fixture scan for value leakage into artifacts.

## Observability & budgets
Suite <= 20 min (ASSUMPTION).

## Tests
- TEST-PS-127-09-01 (contract): four consumers lease owned secrets.
- TEST-PS-127-09-02 (negative): non-owner lease refused for each consumer.
- TEST-PS-127-09-03 (coverage): transitions and codes covered.
- TEST-PS-127-09-04 (lint): fixtures synthetic.

## Acceptance criteria
1. All consumer contract tests pass (TEST-01).
2. TEST-PS-127-09-01 through -04 pass.

## Assumptions & open decisions
- OPEN (F17): test KMS environment.
