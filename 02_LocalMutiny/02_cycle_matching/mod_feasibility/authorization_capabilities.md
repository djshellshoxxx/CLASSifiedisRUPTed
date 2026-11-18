# PS-016-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R06, R09), CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-05.R01 | The evaluator principal is `sys_` with `read` on `lst_` and `var_` at `global` scope, status fields only, purpose `feasibility`, expiry ≤ 72 h (CTR-CAP-001 R06). | MVP |
| PS-016-05.R02 | No user, `ope_` or `mod_` principal may call evaluate. | MVP |
| PS-016-05.R03 | `candidate_get` requires `participant` scope on the candidate. | MVP |
| PS-016-05.R04 | The evaluator has no read access to message, profile or payment content. | MVP |

## Data / schema
Grant record `grt_` for the evaluator; decision records `dec_` store outcome and reason only (CTR-CAP-001 R13).

## Commands / queries / events
Evaluate: sys_ with grant. Candidate read: participant. Snapshot seal: sys_ with grant.

## States & transitions
Grant states follow CTR-CAP-001 (active, revoked, expired).

## Validation & errors
Missing grant returns CAP.GRANT_NOT_ACTIVE; wrong caller returns SYS.FORBIDDEN.

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| sys_ evaluator (grant) | feasibility.evaluate | snapshot | ALLOW |
| user | feasibility.evaluate | snapshot | DENY SYS.FORBIDDEN |
| participant (acc_ in candidate) | cyc.read (candidate_get) | ccd_ | ALLOW own slot |
| non-participant | read | ccd_ | DENY SYS.NOT_FOUND |
| ope_ | read | ccd_ | DENY (no privileged path without case) |

## Failure, idempotency, concurrency, offline
Revocation effective at next decision (CTR-CAP-001 R09); the evaluator's grant revocation stops new evaluations, not sealed verdicts.

## Privacy, retention, abuse
Grants and decisions are RET-AUD (12 months); candidate verdicts RET-EPH.

## Observability & budgets
Grant use counted per purpose; no actor IDs in metrics.

## Tests
- TEST-PS-016-05-01 (unit): each table row.
- TEST-PS-016-05-02 (negative): evaluator attempts to read message content are denied.
- TEST-PS-016-05-03 (integration): revoked grant stops evaluation at next decision.

## Acceptance criteria
1. All rows covered by tests.
2. Evaluator grant has an expiry and purpose in 100% of fixtures.
3. Non-participant reads are indistinguishable from nonexistent candidates.

## Assumptions & open decisions
- ASSUMPTION: 72 h evaluator grant expiry (CTR-CAP-001 R06).
- PENDING CTR-CAP-001: `ccd` resource type registration.
