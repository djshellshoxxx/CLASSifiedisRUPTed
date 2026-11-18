# PS-094-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-03.R01 | Only transitions in the table occur. Any other request → `SYS.UNPROCESSABLE_STATE`. | MVP |
| PS-094-03.R02 | `closed_invalid`, `closed` and `deduplicated` are terminal for the reporter. | MVP |
| PS-094-03.R03 | A report never changes the target's visibility. Enforcement is decided in PS-096, not here. | MVP |
| PS-094-03.R04 | Threshold crossing raises priority only; it never hides content. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | report.submitted | valid, not duplicate | submitted | `report.submitted` |
| (none) | report.deduplicated | HMAC match in 24 h | deduplicated (returns existing) | metric only, no event |
| submitted | queued | intake complete | queued | triage queue entry (no content) |
| queued | report.withdrawn | reporter is owner; not triaged | withdrawn | `report.withdrawn` |
| queued | threshold.crossed | sum of weights ≥ 5.0 for target | queued (priority raised) | `report.threshold_reached` |
| queued | report.triaged | mod with triage grant | triaged | `report.triaged` |
| triaged | report.linked_to_case | mod with case grant | linked | `report.linked_to_case`; `cas_` set |
| triaged | report.closed_invalid | no policy nexus or duplicate of case | closed_invalid | reporter notified generically |
| linked | report.closed | case closed | closed | outcome category copied; no sanction detail |
| closed, closed_invalid | retention.elapsed | 12 months after closure | archived | content purged; metadata kept RET-AUD |

## Validation & errors
Illegal transitions → `SYS.UNPROCESSABLE_STATE`; `FLG.WITHDRAW_NOT_ALLOWED` for withdraw after triage.

## Authorization
Transitions by reporter (withdraw), mod with grant (triage, link, close). System performs threshold and retention.

## Failure, idempotency, concurrency, offline
Each transition keyed by (report_id, revision). Concurrent triage → one wins, other receives `EVT.REVISION_CONFLICT`. Threshold counter update is idempotent per report_id.

## Privacy, retention, abuse
Reporter sees coarse status only: `received`, `under_review`, `closed`. Internal states are not exposed (CTR-CAP-001 R10).

## Observability & budgets
`flags_status_transitions_total{from,to}`; queue age p95 ≤ 24 h, high-harm reasons ≤ 1 h (ASSUMPTION).

## Tests
- TEST-PS-094-03-01 (property): no sequence reaches an undefined state.
- TEST-PS-094-03-02 (integration): withdraw after triage returns `FLG.WITHDRAW_NOT_ALLOWED`.
- TEST-PS-094-03-03 (threshold): 5 weight-1.0 reports cross threshold once; priority raised; no hide.

## Acceptance criteria
1. Every status is reachable and has an exit path or terminal flag.
2. Threshold never changes target visibility (TEST-03).

## Assumptions & open decisions
- ASSUMPTION: threshold sum 5.0; high-harm reasons prioritized (threat_or_violence, doxxing_or_personal_data).
- PROVISIONAL (D07 default, unapproved): 12-month archive.
