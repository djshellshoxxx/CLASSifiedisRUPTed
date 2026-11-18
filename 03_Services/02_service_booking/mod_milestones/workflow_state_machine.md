# PS-031-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review.
**Requirement ID:** PS-031-03. **Owner:** [03_Services/02_service_booking/mod_milestones](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_milestones. **Consumers:** F07 identity, F10 privacy, F15 platform, F16 security (per [dependency matrix](../../../DEPENDENCY_MATRIX.md)); mod_quotes (PS-032) and mod_disputes (PS-030) through events and queries.

## Purpose and scope
Business outcome: every plan and every milestone moves only along the listed transitions, each by a named command or a named system event, with a guard that is checked inside the same transaction as the state change. No transition implies payment, completion of real-world work, or release of funds.

Exclusions: the rules for individual field values are in validation_rules.md; who may invoke a transition is in authorization_capabilities.md; dispute decisions are made only in mod_disputes.

## Requirements
- PS-031-03.R01: Two state machines: plan (6 states) and item (8 states). Every state has an entry event, an allowed exit list, a guard, and a terminal flag. Any transition not listed returns `MILESTONES_INVALID_TRANSITION`.
- PS-031-03.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial cases are enumerated in the transition tables and in the timers section. Duplicate command delivery is absorbed by the idempotency log, not by a second transition.
- PS-031-03.R03: Timers are evaluated by a scheduler every 5 minutes; a timer firing performs at most one transition per row and is idempotent (see failure_recovery_idempotency.md).

## Plan state machine
| From | Command or event (entry) | Actor | Guard | To | Terminal |
|---|---|---|---|---|---|
| (none) | `milestones.plan.create` | provider | feature flag on; quote accepted; booking eligible | draft | no |
| draft | `milestones.plan.propose` | provider | 1 to 50 items; sum rule; due-date order; revision 1 written | proposed (resume_state NULL) | no |
| draft | `milestones.plan.cancel_draft` | provider | none | cancelled | yes |
| proposed (resume NULL) | `milestones.plan.consent` by client with matching digest | client | digest equals revision 1 digest | agreed (agreed_revision 1) | no |
| proposed (resume NULL) | `milestones.plan.reject_proposal` | client | reason code | draft | no |
| proposed (resume NULL) | `milestones.plan.withdraw_proposal` | provider | none | draft | no |
| agreed | `milestones.plan.propose_revision` | either party | plan not completed or cancelled; no request for mutual cancel pending; revision content valid | proposed (resume_state = agreed) | no |
| active | `milestones.plan.propose_revision` | either party | as above; no item in `disputed` | proposed (resume_state = active) | no |
| proposed (resume set) | `milestones.plan.consent` by the other party with matching digest | either party | both consents for this revision now exist | resume_state (agreed or active); agreed_revision = proposed_revision | no |
| proposed (resume set) | `milestones.plan.reject_proposal` | other party | reason code | resume_state; proposed_revision cleared | no |
| proposed (resume set) | `milestones.plan.withdraw_proposal` | proposer | none | resume_state; proposed_revision cleared | no |
| agreed | first `milestones.item.start` (system records entry) | provider | item is first in sequence or sequencing = parallel | active | no |
| agreed or active | `milestones.plan.request_mutual_cancel` | either party | no item disputed | unchanged; mutual_cancel_requested_* set | no |
| agreed or active | `milestones.plan.confirm_mutual_cancel` | other party | request pending and younger than 7 days | cancelled (all non-terminal items cancelled, reason MUTUAL_CANCEL_CONFIRMED) | yes |
| active | system completion check (below) | system | see completion guard | completed | yes |
| agreed or active | timer `plan.stall_check` | system | no state change in 30 days | unchanged; emits plan.stalled | no |

Completion guard: every item is in `accepted`, `expired` or `cancelled`; at least one item is `accepted`; no item is `disputed`. A plan whose items are all `expired` or `cancelled` stays `active` until a mutual cancel or a revision is agreed. Completion does not mean payment was made.

## Item state machine
| From | Command or event (entry) | Actor | Guard | To | Terminal |
|---|---|---|---|---|---|
| (none) | item created at plan draft, or applied by agreed revision | provider or system | plan draft or revision applying | pending | no |
| pending | `milestones.item.start` | provider | plan active; all lower-sequence items accepted or cancelled when sequencing = sequential | in_progress | no |
| in_progress | `milestones.item.submit` | provider | submission_count < 5; no dispute; digest valid | submitted | no |
| rejected | `milestones.item.submit` (resubmission) | provider | submission_count < 5; no dispute | submitted | no |
| submitted | `milestones.item.accept` | client | none | accepted | yes |
| submitted | `milestones.item.reject` | client | reason code present | rejected | no |
| submitted or rejected | `milestones.item.open_dispute` | either party | dispute_ref belongs to this item and is open in mod_disputes | disputed | no |
| disputed | event `dispute.resolved` with outcome `completion_upheld` (from mod_disputes) | system | dispute_ref matches; event id not seen before | accepted | yes |
| disputed | event `dispute.resolved` with outcome `cancelled` (from mod_disputes) | system | dispute_ref matches; event id not seen before | cancelled | yes |
| pending or in_progress | timer `item.expiry_check` | system | due_date plus 7 days is before now (UTC); no submission in `submitted` | expired | yes |
| pending or in_progress | plan cancelled (mutual, dispute-driven, or draft withdrawal) | system | none | cancelled | yes |
| pending | revision removes item | system | item not started | cancelled (REVISION_REMOVED) | yes |
| submitted | timer `item.review_overdue` | system | 14 days since submitted_at | submitted (no change; emits review_overdue) | no |

Item notes: `rejected` is never expired by timer and never auto-accepted. `accepted` is not a payment signal. `expired` items never reopen; a new revision may add a replacement item with a new `milestone_id`.

## Consent and revision rules
- A revision is a complete content snapshot. Its digest is SHA-256 over canonical JSON (A-MILESTONES-15).
- Both parties must consent to each revision with the same digest. The proposer's propose command counts as the proposer's consent. Consents are append-only rows.
- A revision that would remove or change the amount, title or due date of an item in `in_progress`, `submitted`, `rejected`, `disputed` or `accepted` is refused (`MILESTONES_ITEM_IMMUTABLE`). Only `pending` items may change.
- Changing `sequencing` is a revision change and needs both consents.
- A proposal stays pending until consented, rejected, withdrawn, or superseded. Only one proposed revision may be pending at a time.

## Timers
| Timer | Schedule | Condition | Effect |
|---|---|---|---|
| item.expiry_check | every 5 min | due_date + 7 days < now | item to expired, outbox event |
| item.review_overdue | every 5 min | submitted and 14 days since submission | outbox event only (A-MILESTONES-06) |
| mutual_cancel.expire | every 5 min | request older than 7 days | clear request fields; outbox event |
| plan.stall_check | daily 00:00 UTC | no change in 30 days in agreed or active | outbox event `milestones.plan.stalled` |

## Assumptions and open decisions
- A-MILESTONES-05: Sequential is the default. Parallel is allowed only by agreed revision.
- A-MILESTONES-06: No automatic acceptance. Client silence never changes item state.
- A-MILESTONES-07: Expiry grace is 7 days after due_date and applies only to pending and in_progress items. Items without due_date never expire.
- A-MILESTONES-08: Mutual cancel request is valid for 7 days.
- A-MILESTONES-09: Dispute outcomes arrive as events from mod_disputes; this module does not decide them.
- A-MILESTONES-12: Stall alert at 30 days; no automatic cancellation.
- Open: exact outcome enum names used by mod_disputes (`completion_upheld`, `cancelled`) are proposed and must be confirmed in PS-030 before implementation.
