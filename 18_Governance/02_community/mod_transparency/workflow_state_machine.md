# PS-148-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-148-03. **Owner:** [18_Governance/02_community/mod_transparency](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_transparency. **Consumers:** F12 moderation, [mod_governance](../mod_governance/SPEC.md), F13 notifications (state change notices), F15 platform (job scheduler for timers); declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Define the only legal lifecycles for decision log entries and transparency reports, the guard for each transition, and the terminal states. Publication is always explicit and reviewed by a second actor. Nothing becomes public by implication, and no transition represents real-world settlement of anything.

Exclusions: the internal workflow of moderation decisions (F12) and of governance votes (mod_governance); scheduling infrastructure (F15).

## Requirements
- PS-148-03.R01: Business outcome: every public entry and report has a known author, a second reviewer and a recorded history, and each state can be explained to a participant in plain language. Actors: author, governance reviewer, scheduler (system), auditor.
- PS-148-03.R02: Cases: duplicate submit of an already REVIEW entry (idempotent no-op with same revision); approve after a concurrent withdraw (rejected by revision check); review timeout racing with approval (serialized by row lock, first writer wins); report freeze while an included entry is edited (rejected, entry not PUBLISHED); offline client action (not a state change until acknowledged); adversarial self-approval (rejected).
- PS-148-03.R03: Accessibility: state names are returned as codes with a localized label key; clients display text for each state and do not rely on colour. Performance budgets: PS-148-08.R05.
- PS-148-03.R04: Decision entry state table (see below). Every transition writes one `transparency_audit_entry` row and one outbox event in the same database transaction.
- PS-148-03.R05: Report state table (see below). FROZEN is the only state from which a snapshot may be published.
- PS-148-03.R06: Four-eyes rule: author and approver must be different actors (A-TRANSPARENCY-05). The approver role is GOVERNANCE_REVIEWER.
- PS-148-03.R07: Timers (A-TRANSPARENCY-06): a REVIEW entry older than 14 days returns to PREPARING with `review_timed_out`; a PREPARING entry whose last edit is older than 90 days is purged unless `legal_hold` is true. Timers are evaluated by a scheduled job that runs hourly and is idempotent.
- PS-148-03.R08: Supersession is atomic: approving a successor entry or report moves its predecessor to SUPERSEDED in the same transaction.
- PS-148-03.R09: Withdrawal is a transition, not a deletion. WITHDRAWN records remain as tombstones (PS-148-07.R05).

## Decision entry states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| PREPARING | CreateDecisionLogEntry; RejectDecisionLogEntry; review timeout | REVIEW via SubmitDecisionLogEntry; PREPARING via UpdateDecisionLogEntry (revision + 1) | Update and Submit: caller is author; Submit runs full validation (PS-148-02) | No |
| REVIEW | SubmitDecisionLogEntry | PUBLISHED via ApproveDecisionLogEntry; PREPARING via RejectDecisionLogEntry or timeout | Approve: caller role GOVERNANCE_REVIEWER and caller != author; reject requires `reason_code` | No |
| PUBLISHED | ApproveDecisionLogEntry | SUPERSEDED via approval of a successor; WITHDRAWN via WithdrawDecisionLogEntry | Withdraw: caller role GOVERNANCE_REVIEWER; blocked for purge while legal_hold is true, but withdrawal itself is allowed | No |
| SUPERSEDED | approval of successor (supersedes_entry_id) | none | not applicable | Yes |
| WITHDRAWN | WithdrawDecisionLogEntry | none (tombstone) | not applicable | Yes |

Publication effects on PUBLISHED: `published_at` (UTC day), `content_hash` computed, `reviewer_actor_ref` recorded, and the outbox event `transparency.decision_entry.published.v1` written.

## Transparency report states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| PREPARING | CreateTransparencyReport; UnfreezeTransparencyReport | FROZEN via FreezeTransparencyReport | Freeze: period valid; no overlapping PUBLISHED report unless supersedes_report_id is set; at most 5000 entries in period (A-TRANSPARENCY-16) | No |
| FROZEN | FreezeTransparencyReport | PUBLISHED via PublishTransparencyReport; PREPARING via UnfreezeTransparencyReport | Publish: snapshot present; content_hash present; approver role GOVERNANCE_REVIEWER and approver != author; every included entry PUBLISHED; no entry in the period changed revision after freeze | No |
| PUBLISHED | PublishTransparencyReport | SUPERSEDED via successor publish; WITHDRAWN via WithdrawTransparencyReport | Withdraw: GOVERNANCE_REVIEWER; reason_code required | No |
| SUPERSEDED | successor publish | none | not applicable | Yes |
| WITHDRAWN | WithdrawTransparencyReport | none | not applicable | Yes |

Freeze computes the snapshot and `content_hash` in one transaction. A failed freeze leaves the report in PREPARING, not in an intermediate state (PS-148-06.R08).

## Transition timing
- Entry REVIEW to PREPARING by timeout: 14 days after submit (A-TRANSPARENCY-06).
- Entry PREPARING purge: 90 days after last edit, skipped when legal_hold is true.
- Report FROZEN has no timeout; leaving FROZEN is always a human action (Unfreeze or Publish).
- Public visibility lag after PUBLISHED: at most 60 seconds (PS-148-06.R05).

## Concurrency rules
Each transition checks `expected_revision` against the stored revision inside a row lock. A mismatch returns TRANSPARENCY_REVISION_CONFLICT. Transitions on the same entry are serialized; transitions on different entries are independent.

## Open decisions
- A-TRANSPARENCY-05: Four-eyes approval applies to every publication, including PUBLIC_AGGREGATE entries. A single-reviewer path is not allowed in version 1.
- A-TRANSPARENCY-06: Timer values (14 days review, 90 days purge) are defaults pending D07 retention review.
- A-TRANSPARENCY-16: Quarterly reports are the default period and the cap is 5000 entries per report.
