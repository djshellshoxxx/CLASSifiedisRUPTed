# PS-120-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-09.R01 | Consumer contract tests for `backup.manifest` run against every supported manifest version (CTR-SCH-001 R09). | MVP |
| PS-120-09.R02 | Consumers mod_recovery (PS-122), mod_reconciliation (F09.S02.M03) and mod_retention (F10.S01.M02) run contract tests against the manifest and tombstone formats. | MVP |
| PS-120-09.R03 | Fixtures are synthetic; no production backup data in test environments. | MVP |
| PS-120-09.R04 | Acceptance includes one full scheduled backup and one restore to isolated environment in staging each release. | MVP |

## Data / schema
Fixture path `fixtures/backups/<kind>/<manifest_version>/`. Each fixture includes expected digest.

## Commands / queries / events
Tests call PS-120-04 commands only.

## States & transitions
State coverage: every row of PS-120-03 has at least one test.

## Validation & errors
Each code in PS-120-02 and PS-120-06 has a fixture.

## Authorization
Negative tests for PS-120-05 matrix included.

## Failure, idempotency, concurrency, offline
Chaos suite in PS-120-06 runs in staging nightly.

## Privacy, retention, abuse
Test scans check that fixtures have no real identifiers.

## Observability & budgets
Suite runtime <= 45 min in CI (ASSUMPTION).

## Tests
- TEST-PS-120-09-01 (contract): manifest v1.x consumers pass.
- TEST-PS-120-09-02 (e2e staging): backup then restore to isolated environment; row counts and digests match.
- TEST-PS-120-09-03 (lint): fixture scan finds no real data.
- TEST-PS-120-09-04 (coverage): every PS-120-03 transition has a test ID.

## Acceptance criteria
1. Restore drill in staging matches source digests (TEST-02).
2. TEST-PS-120-09-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: staging has isolated keys and storage.
- OPEN: F17 test environment owner for restore drills.
