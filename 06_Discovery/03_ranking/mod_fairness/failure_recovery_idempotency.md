# PS-046-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

**Decision labels:** D02 cycle optimizer OPEN (not used here). No fairness guarantee is claimed.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-06.R01 | If the fairness step fails, the relevance service serves the unconstrained order with `constraint_status = UNCHECKED` and an alert; it does not block the page. | MVP |
| PS-046-06.R02 | Audit write failure queues the row (RET-OPS) and retries; no page is blocked. | MVP |
| PS-046-06.R03 | Policy activation is idempotent per `(policy_id, version)`. | MVP |
| PS-046-06.R04 | Repair step is deterministic and bounded (≤ N passes = 3, ASSUMPTION); if constraints still fail, the page is marked `VIOLATED_AUTO_REPAIRED` and audited. | MVP |

## Data / schema
Queued audit rows carry the same schema as PS-046-01.

## Commands / queries / events
Retry-safe per PS-046-04.

## States & transitions
No new states.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`. Non-retryable: `FAIRNESS.*`.

## Authorization
Internal call only.

## Failure, idempotency, concurrency, offline
- Fairness step timeout (> 20 ms): unconstrained order served and flagged.
- Policy store unavailable: last ACTIVE policy cached for 15 min (ASSUMPTION), then fail-open to unconstrained order with alert (the caps are not a safety control).
- Duplicate audit retry: deduplicated by `(page_id, policy_id)`.

## Privacy, retention, abuse
Queues hold aggregated rows only.

## Observability & budgets
`fairness_unchecked_pages_total`, `fairness_audit_queue_depth`, `fairness_repairs_total`.

## Tests
- TEST-PS-046-06-01 (failure): fairness timeout serves page flagged UNCHECKED.
- TEST-PS-046-06-02 (queue): audit store down → rows queued and written once.
- TEST-PS-046-06-03 (repair): adversarial input repaired within 3 passes or marked violated.
- TEST-PS-046-06-04 (cache): policy store down for 10 min → cached policy used.

## Acceptance criteria
1. No page blocked by fairness failure.
2. Every unchecked page is alerted and audited.
3. Audit rows deduplicated.

## Assumptions & open decisions
- ASSUMPTION: 15-minute policy cache, 3 repair passes, 20 ms timeout.
- OPEN (F06): whether fail-open is acceptable for caps (see Risk).
