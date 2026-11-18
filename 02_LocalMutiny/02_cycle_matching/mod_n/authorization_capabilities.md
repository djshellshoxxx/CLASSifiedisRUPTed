# PS-018-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R06, R10), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-05.R01 | Search runs require a `sys_` matcher grant with purpose `cycle_search`, expiry ≤ 72 h. | MVP |
| PS-018-05.R02 | No user, `ope_` or `mod_` principal may start or read a run. | MVP |
| PS-018-05.R03 | Run results are visible only to the matcher until proposals are created by PS-017 / PS-018 flows. | MVP |
| PS-018-05.R04 | Operators may change parameters within bounds only through configuration with dual control (CTR-CAP-001 R07). | MVP |

## Data / schema
Grant `grt_` for matcher; run records readable by matcher only.

## Commands / queries / events
Run start and read: sys_ matcher. Configuration change: ope_ with dual approval.

## States & transitions
Not applicable.

## Validation & errors
Unauthorised run request returns SYS.FORBIDDEN; unreadable run returns SYS.NOT_FOUND.

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| sys_ matcher (grant) | cycle.search | snapshot | ALLOW |
| user | cycle.search | snapshot | DENY SYS.FORBIDDEN |
| ope_ (single) | config change | parameters | DENY without second approver |
| ope_ pair (dual control) | config change | parameters | ALLOW within bounds |
| mod_ | read run | run | DENY |

## Failure, idempotency, concurrency, offline
Grant revocation stops new runs at next decision.

## Privacy, retention, abuse
Matcher reads are logged as `aud_` with run ID and purpose, no content.

## Observability & budgets
Denials counted without actor IDs.

## Tests
- TEST-PS-018-05-01 (unit): each table row.
- TEST-PS-018-05-02 (negative): single operator cannot change bounds.
- TEST-PS-018-05-03 (integration): revoked grant stops runs.

## Acceptance criteria
1. Every row covered by tests.
2. Config changes outside bounds are rejected in 100% of fixtures.
3. Matcher reads produce aud_ records.

## Assumptions & open decisions
- ASSUMPTION: dual control for parameter bounds (CTR-CAP-001 R07 pattern).
