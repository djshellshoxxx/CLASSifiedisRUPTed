# PS-030-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-030-03. **Owner:** [03_Services/02_service_booking/mod_disputes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_disputes. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); event subscribers in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
Defines the dispute lifecycle as an explicit state machine. Every status change is one row in the transition log, produced by one named command or timer, with a guard and a single emitted event. No state implies a payment, a refund or a completed real-world handover. Terminal states are final.

Exclusions: merit decisions (moderator, recorded as data); money movement (none); booking status changes (parent service_booking owns them; this machine never writes booking state).

## Requirements
- **PS-030-03.R01**: Business outcome: a dispute moves from claim to response to a resolution, or to withdrawal or intake rejection, with a traceable reason at each step. Actors: claimant, respondent, moderator, system timer. Exclusions as above.
- **PS-030-03.R02**: Cases covered: response window elapses (no default win; the case escalates); settlement proposal expires; reviewer released; return for more information (once only); appeal filed and decided (once only); withdrawal while escalated; concurrent accept and withdraw (serialized by row lock, second writer gets a conflict).
- **PS-030-03.R03**: Each transition completes within the 300 ms write budget (p95) excluding notification fan-out. No transition blocks on an external call; booking eligibility is checked before `open` only.
- **PS-030-03.R04**: Only the transitions listed in this file are legal. Any other (state, command) pair returns `DISPUTES_STATE_CONFLICT`. Timers never choose an outcome; they only move a dispute to `escalated` or `closed`.
- **PS-030-03.R05**: Consent: a settlement or decision that changes outcome requires the explicit action of the named actor. Revocation (withdrawal) is allowed until a reviewer is assigned.
- **PS-030-03.R06**: Compensation for a mistaken state change is a new forward transition. Rows are never rewritten.

## States
| State | Entry event | Allowed transitions out | Guard summary | Terminal |
|---|---|---|---|---|
| `open` | `disputes.dispute_opened.v1` | `responded`, `escalated`, `withdrawn`, `rejected_at_intake` | Created with valid claim | no |
| `responded` | `disputes.dispute_responded.v1` | `settlement_proposed`, `escalated`, `withdrawn` | Response filed inside window | no |
| `settlement_proposed` | `disputes.settlement_proposed.v1` | `resolved_mutual`, `responded`, `withdrawn` | Non-proposer accepts or rejects; or 72 h expiry | no |
| `escalated` | `disputes.dispute_escalated.v1` | `under_review`, `withdrawn` | Queued for moderator | no |
| `under_review` | `disputes.review_started.v1` | `decided`, `responded`, `escalated`, `closed` | Reviewer assigned and independent | no |
| `decided` | `disputes.dispute_decided.v1` | `under_review`, `closed` | Appeal filed in window, or window elapses | no |
| `closed` | `disputes.dispute_closed.v1` | none | Decision final | yes |
| `resolved_mutual` | `disputes.dispute_resolved_mutual.v1` | none | Both parties agreed via settlement | yes |
| `withdrawn` | `disputes.dispute_withdrawn.v1` | none | Claimant withdrew | yes |
| `rejected_at_intake` | `disputes.dispute_rejected_at_intake.v1` | none | Moderator rejected claim | yes |

## Transitions
| ID | From | To | Trigger (command or timer) | Actor | Guard | Effect |
|---|---|---|---|---|---|---|
| T01 | (none) | open | `OpenDispute` | claimant | Booking eligible; no active dispute; not suspended; not blocked | Creates dispute, claim statement, `response_due_at` |
| T02 | open | responded | `RespondToDispute` | respondent | now <= `response_due_at`; no response yet | Sets `evidence_due_at` = now + 7 days |
| T03 | open | escalated | `response_window_elapsed` | system | No response by `response_due_at` | No default outcome; queue for review |
| T04 | open | withdrawn | `WithdrawDispute` | claimant | None | Resolution `withdrawn` |
| T05 | open | rejected_at_intake | `RejectAtIntake` | moderator | Reason in intake list | Resolution `rejected_at_intake` |
| T06 | responded | settlement_proposed | `ProposeSettlement` | claimant or respondent | No `proposed` row exists | Creates proposal, `expires_at` = now + 72 h |
| T07 | responded | escalated | `EscalateDispute` | either party | now >= `responded_at` + 72 h, or `evidence_window_elapsed` timer | Queue for review |
| T08 | responded | withdrawn | `WithdrawDispute` | claimant | None | Resolution `withdrawn` |
| T09 | settlement_proposed | resolved_mutual | `RespondToSettlement` (accept) | non-proposer party | now < `expires_at`; not proposer | Resolution `mutual_settlement`, `decided_by` = `mutual` |
| T10 | settlement_proposed | responded | `RespondToSettlement` (reject) or `settlement_expired` timer | non-proposer, or system | Reject by non-proposer, or now >= `expires_at` | Proposal `rejected` or `expired` |
| T11 | settlement_proposed | withdrawn | `WithdrawDispute` | claimant | None | Proposal `superseded`; resolution `withdrawn` |
| T12 | escalated | under_review | `AssignReviewer` | moderator | Reviewer not party, not prior decider | Sets `current_reviewer_ref`; starts 14-day SLA clock |
| T13 | escalated | withdrawn | `WithdrawDispute` | claimant | None | Resolution `withdrawn` |
| T14 | under_review | decided | `RecordDecision` | assigned reviewer | `appeal_count` = 0; outcome allowed; reason valid | Resolution `appeal_round` 0; `appeal_deadline_at` = now + 14 days |
| T15 | under_review | responded | `ReturnForMoreInfo` | moderator | `reopen_count` = 0 | `reopen_count` = 1; `evidence_due_at` = now + 7 days |
| T16 | under_review | escalated | `ReleaseReviewer` | moderator | Assigned reviewer only | Clears `current_reviewer_ref` |
| T17 | under_review | closed | `RecordDecision` (appeal round) | assigned reviewer | `appeal_count` = 1 | Resolution `appeal_round` 1; final |
| T18 | decided | under_review | `FileAppeal` | adverse party | now <= `appeal_deadline_at`; `appeal_count` = 0 | `appeal_count` = 1; reviewer must differ from prior decider |
| T19 | decided | closed | `appeal_window_elapsed` timer | system | No appeal filed | Final |

Non-status writes (no transition row, revision still increments): `SubmitEvidence`, `WithdrawEvidence`, statement additions, `AddReviewerNote`. These are allowed only in the states named in the authorization matrix ([authorization_capabilities.md](authorization_capabilities.md)).

## Timers
| Timer | Applies in | Deadline field | On fire |
|---|---|---|---|
| response_window_elapsed | open | `response_due_at` | T03 |
| evidence_window_elapsed | responded | `evidence_due_at` | T07 |
| settlement_expired | settlement_proposed | `expires_at` | T10 |
| appeal_window_elapsed | decided | `appeal_deadline_at` | T19 |
| review_sla_breached | under_review | assigned_at + 14 days | Emits `disputes.review_sla_breached.v1`; no state change |

Timers are durable rows scanned every 30 s. Overdue timers are processed in deadline order. Each timer carries a dedup key `(dispute_id, timer_name, deadline_at)` so re-running after a crash cannot apply a transition twice (see [failure_recovery_idempotency.md](failure_recovery_idempotency.md)).

## Invariants
- At most one active dispute per booking or booking+milestone (unique index in [domain_schema.md](domain_schema.md)).
- `closed`, `resolved_mutual`, `withdrawn` and `rejected_at_intake` have no outgoing transitions.
- `under_review` always has `current_reviewer_ref` set; no other state has it set.
- `appeal_count` and `reopen_count` never exceed 1.
- `revision` in the transition log is strictly increasing and gap-free per dispute.

## Open decisions
- A-disputes-07: Deadlines are 7 days (response, evidence), 72 hours (settlement, escalation request), 14 days (review SLA, appeal). Values are defaults, changeable through configuration with a schema note.
- A-disputes-14: Server time is authoritative. Timers are at-least-once and never auto-decide.
- D04 (partial barter execution) and D09 (rentals and deposits) are OPEN. This machine assumes no atomic real-world handover and no platform custody.
