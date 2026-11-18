# PS-094-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-04.R01 | Every state-changing command carries `idempotency_key` and `expected_revision` (null on create). | MVP |
| PS-094-04.R02 | Commands are `report.<verb>@1`. | MVP |
| PS-094-04.R03 | Reporter status query returns only the three coarse statuses in PS-094-03. | MVP |

## Commands
| Command | Input | Emits | Errors |
|---|---|---|---|
| report.submit | target_type, target_id, reason_code, detail_text?, evidence_ids[] (≤10 `mev_`) | report.submitted | FLG.*, SYS.NOT_FOUND |
| report.withdraw | report_id, expected_revision | report.withdrawn | FLG.WITHDRAW_NOT_ALLOWED, EVT.REVISION_CONFLICT |
| report.triage | report_id, outcome (queue_priority, route_to_case, closed_invalid), expected_revision | report.triaged or report.closed_invalid | SYS.FORBIDDEN, EVT.REVISION_CONFLICT |
| report.link_case | report_id, case_id, expected_revision | report.linked_to_case | CAP.SCOPE_INVALID |

## Queries
| Query | Returns | Auth |
|---|---|---|
| report.status | own report: status (coarse), submitted_at | reporter |
| report.triage_queue | paged ≤ 50: report_id, target_type, reason_code, weight_sum, age; no content, no reporter | mod triage grant |
| report.list_by_case | reports linked to case, with reporter and detail (case scope) | mod case grant |

## Events
| event_type | Payload | max_data_class |
|---|---|---|
| report.submitted | report_id, target_type, target_id, reason_code, evidence_count | PSEUDONYMOUS |
| report.withdrawn | report_id | PSEUDONYMOUS |
| report.triaged | report_id, outcome | PSEUDONYMOUS |
| report.linked_to_case | report_id, case_id | PSEUDONYMOUS |
| report.closed_invalid | report_id | PSEUDONYMOUS |
| report.closed | report_id, outcome_category | PSEUDONYMOUS |
| report.threshold_reached | report_id (latest), target_type, target_id, weight_band | PSEUDONYMOUS |

Event payloads exclude `reporter_ref`, `detail_text` and `dedupe_hmac`. Events are local-only (not federated).

## Validation & errors
Shared CTR-ERR-001 codes plus FLG.* (PS-094-02).

## Authorization
PS-094-05.

## Failure, idempotency, concurrency, offline
Submit idempotent on dedupe_hmac and idempotency_key. Replay returns original result, no second event.

## Privacy, retention, abuse
Events carry IDs and coarse categories only. `weight_band` is a 3-value enum (low, medium, high), not the raw weight.

## Observability & budgets
`flags_commands_total{command,outcome}`; submit p95 ≤ 300 ms (ASSUMPTION).

## Tests
- TEST-PS-094-04-01 (contract): payloads validate against schema `report` 1.0.0.
- TEST-PS-094-04-02 (idempotency): same key twice → one `rpt_`, one event.
- TEST-PS-094-04-03 (lint): no event contains `reporter_ref`, `detail_text` or `dedupe_hmac`.

## Acceptance criteria
1. Each command has exactly the listed errors.
2. Triage queue response contains no reporter identity or content (TEST-02).

## Assumptions & open decisions
- PENDING: none (prefix `rpt` exists).
- PROVISIONAL (D08 default, unapproved): reports queued offline send only after server ack.
