# PS-115-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-08.R01 | Install-control UI renders ≤ 100 ms after `beforeinstallprompt`. | MVP |
| PS-115-08.R02 | CI reports installability checks for each release (manifest, icons, offline shell). | MVP |
| PS-115-08.R03 | No runtime telemetry from this module in MVP. | MVP |
| PS-115-08.R04 | Build size of install module ≤ 5 KB gzip (ASSUMPTION). | MVP |

## Data / schema
CI report fields: check name, result, build_id.

## Commands / queries / events
None.

## States & transitions
None.

## Validation & errors
CI codes only.

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
CI reports retained 90 days, no user data.

## Observability & budgets
Installability check runs ≤ 5 min in CI.

## Tests
- TEST-PS-115-08-01 (performance): control render time in test.
- TEST-PS-115-08-02 (build): installability check passes in CI.
- TEST-PS-115-08-03 (build): module size budget.
- TEST-PS-115-08-04 (contract): no telemetry calls in module code (static scan).

## Acceptance criteria
1. CI installability check exists and runs.
2. Size budget enforced.
3. Telemetry scan passes.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- No Dxx applies.
