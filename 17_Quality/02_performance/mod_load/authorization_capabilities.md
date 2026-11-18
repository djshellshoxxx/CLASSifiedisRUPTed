# PS-139-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-05.R01 | Defining workloads and profiles requires engineer role for the owning module or QA Lead. | MVP |
| PS-139-05.R02 | Starting a run requires QA Lead or CI `sys_` principal scoped to staging. | MVP |
| PS-139-05.R03 | Any load run against production hosts is denied, regardless of role. | MVP |
| PS-139-05.R04 | Abort permitted to QA Lead, run owner and SRE on call. | MVP |

## Data / schema
Capability IDs: `load_workload.define`, `load_run.start`, `load_run.abort`, `load_run.read`.

## Commands / queries / events
Decision records on denial.

## States & transitions
N/A.

## Validation & errors
| Actor | Action | Result |
|---|---|---|
| engineer (module owner) | define workload for own module | allow |
| engineer (other module) | define workload | DENY, SYS.FORBIDDEN |
| CI sys | start run on staging | allow |
| any | start run on production | DENY, LOAD.PRODUCTION_TARGET_FORBIDDEN |
| SRE on call | abort | allow |

## Authorization
Grants for CI principals scoped to staging environment IDs only.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
Denials carry no hostnames.

## Observability & budgets
Counter `load_authz_denied_total{rule}`.

## Tests
- TEST-PS-139-05-01: unit, decision table.
- TEST-PS-139-05-02: negative, production start denied for QA Lead too.

## Acceptance criteria
1. No production load start in any role in fixtures.
2. SRE abort honoured in 100% of runs.

## Assumptions & open decisions
- ASSUMPTION: production load is out of scope at MVP.
- D10: PROVISIONAL (D10 default, unapproved) for credentials used by load clients.
