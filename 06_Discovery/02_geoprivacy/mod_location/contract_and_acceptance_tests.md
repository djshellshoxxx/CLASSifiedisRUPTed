# PS-048-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09), CTR-PRV-001 (R03, R09), CTR-ERR-001 (R02); PENDING CTR-DSC-001.

**Decision labels:** Synthetic location fixtures ASSUMPTION (F17 QA Lead).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-09.R01 | Contract tests for every command and event in PS-048-04. | MVP |
| PS-048-09.R02 | Privacy contract test: every payload schema classified per CTR-PRV-001 R01. | MVP |
| PS-048-09.R03 | E2E: pick cell → search filtered to cell → withdraw consent → cell cleared. | MVP |
| PS-048-09.R04 | Accessibility: picker and device-permission prompts keyboard operable and labelled (owner F14). | MVP |

## Data / schema
Fixtures: synthetic fixes across 10 cells, boundary fixes on cell edges, out-of-area fixes, spoofed sequences.

## Commands / queries / events
Covers PS-048-04.

## States & transitions
Each row of PS-048-03 reached.

## Validation & errors
Each code in PS-048-02.

## Authorization
Matrix rows in PS-048-05.

## Failure, idempotency, concurrency, offline
Offline and race fixtures from PS-048-06.

## Privacy, retention, abuse
Synthetic fixes only; no real coordinates in fixtures.

## Observability & budgets
Latency and log-scan results per PS-048-08.

## Tests
- TEST-PS-048-09-01 (contract): payload schemas.
- TEST-PS-048-09-02 (e2e): pick→search→withdraw.
- TEST-PS-048-09-03 (a11y): picker keyboard and screen reader.
- TEST-PS-048-09-04 (offline): geometry cache used for resolution.

## Acceptance criteria
1. Every PS-048 requirement mapped to TEST IDs.
2. Privacy contract tests pass.
3. E2E passes.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures.
