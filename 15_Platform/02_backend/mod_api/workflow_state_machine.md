# PS-117-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001 (R03, R09), CTR-ID-001 (R01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-03.R01 | Each state-changing request passes through the states below; no state is skipped. | MVP |
| PS-117-03.R02 | An idempotency row reaches a terminal state (`succeeded` or `failed_final`) or is released within 60 s (ASSUMPTION) of its last heartbeat. | MVP |
| PS-117-03.R03 | A replayed request with identical digest returns the stored response byte-for-byte. | MVP |

## Data / schema
Request state is held in memory per request; durable state is the `api_idempotency.status` column (PS-117-01).

## Commands / queries / events
Not applicable beyond PS-117-04.

## States & transitions
Request lifecycle:

| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| RECEIVED | authenticate | valid session (F07 `ses_`) | AUTHENTICATED | none |
| RECEIVED | authenticate fails | — | REJECTED_401 | error response |
| AUTHENTICATED | validate | PS-117-02 passes | VALIDATED | none |
| VALIDATED | idempotency lookup | no row | IN_PROGRESS | insert row (`in_progress`) |
| IN_PROGRESS | key found, same digest, `succeeded` | — | REPLAYED | return stored response |
| IN_PROGRESS | key found, different digest | — | REJECTED_409 | `API.IDEMPOTENCY_KEY_REUSED` |
| IN_PROGRESS | key found, status `in_progress` | age < 60 s | REJECTED_409 | `API.REQUEST_IN_PROGRESS`, retryable |
| IN_PROGRESS | command committed | downstream ack | SUCCEEDED | update row to `succeeded`, store response |
| IN_PROGRESS | downstream rejects with final code | — | FAILED_FINAL | store error, status `failed_final` |
| IN_PROGRESS | downstream timeout | age ≥ 60 s | RECONCILING | reconciliation job |
| RECONCILING | event found under correlation ID | — | SUCCEEDED | store response |
| RECONCILING | no event | — | RELEASED | delete row; client may retry with same key |

## Validation & errors
Transition errors use codes from PS-117-02 or PS-117-06. `REJECTED_409` and `RELEASED` are the only paths that permit a client retry with the same key.

## Authorization
Transitions are performed by the api `sys_` principal. Authorization of the command itself is evaluated by the owning module (PS-117-05).

## Failure, idempotency, concurrency, offline
Row insert is the linearization point for a key. Two concurrent first requests: one inserts, the other observes `in_progress` (409). Reconciliation uses the CTR-EVT-001 `correlation_id` to find the committed event.

## Privacy, retention, abuse
State rows hold no content. Reconciliation logs carry `request_id` and state only.

## Observability & budgets
Counter `api_request_transitions_total{to}`. Alert if RECONCILING count > 0 for > 5 min (ASSUMPTION).

## Tests
- TEST-PS-117-03-01 (unit): every row of the table, including forbidden transitions.
- TEST-PS-117-03-02 (integration): kill process after commit, before response; replay returns stored result.
- TEST-PS-117-03-03 (property): N concurrent identical requests produce exactly one committed effect.

## Acceptance criteria
1. Table is exhaustive; any unlisted transition raises an internal error and is counted.
2. Replay response bytes equal original bytes (SHA-256 compare).
3. No key remains `in_progress` longer than 60 s + reconciliation interval (5 min) in the chaos test.

## Assumptions & open decisions
- ASSUMPTION: 60 s stale-lock threshold.
- D04 (PROVISIONAL default: explicit per-party attestations and compensating recovery; unapproved): not applied here; api does not decide business completion.
