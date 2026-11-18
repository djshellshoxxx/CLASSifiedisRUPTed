# PS-146-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-03. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [12_Moderation](../../../12_Moderation). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-03.R01: Business outcome. Catalogue versions, decisions and holds move only through explicit, authorized, auditable transitions. A subject is never left in an unknown state: until a decision is ALLOW, the owner service keeps it out of public or cycle-eligible states.
- Exclusions: the owner's subject lifecycle (listing published, offer accepted, cycle executed). This module emits outcomes; owners transition their own records.
- Exclusions: appeal outcomes. A reviewer resolution here does not reverse a moderation sanction.

## PolicyVersion states
| State | Entry event | Allowed transitions (event -> target) | Guard | Terminal |
|---|---|---|---|---|
| EDITING | `prohibited.policy_version.create` | `update_editing` -> EDITING; `approve` -> ACTIVE; `discard` -> DISCARDED | create requires draft capability; update requires same author and row_version match | no |
| ACTIVE | `prohibited.policy_version.approve` | `retire` -> RETIRED (only when a successor becomes ACTIVE in the same transaction) | approver != author (PROHIBITED_APPROVER_NOT_INDEPENDENT); rule set passes validation_rules.md R11-R15; content_sha256 computed; no other ACTIVE row exists | no |
| RETIRED | `prohibited.policy_version.retired.v1` event after successor activation | none | none | yes |
| DISCARDED | `prohibited.policy_version.discard` from EDITING only | none | none | yes |

Rules:
- PS-146-03.R02: Exactly one ACTIVE version exists at any time, except during the atomic swap, which runs in one transaction (old -> RETIRED, new -> ACTIVE). Evaluate requests during the swap read the old version or the new version, never none.
- PS-146-03.R03: Activation sets `effective_from` (default: activation time). Versions cannot be re-activated; a rollback is a new version copied from an earlier one (import_export_backup_rollback.md).
- PS-146-03.R04: An ACTIVE version is immutable. Any change requires a new EDITING version.

## PolicyDecision states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| RECORDED | `prohibited.decision.evaluate` persisted | `supersede` -> SUPERSEDED | superseding decision for same subject_id and subject_type with higher subject_revision, or hold resolution writing a new decision | no |
| SUPERSEDED | `prohibited.decision.superseded.v1` | none | none | yes |

Rules:
- PS-146-03.R05: Decisions are never deleted or edited in place except for status and superseded_by_decision_id. Supersession never changes outcome or rule_codes.
- PS-146-03.R06: A hold resolution does not rewrite the HOLD decision. It records a new RECORDED decision for the same revision with outcome ALLOW or BLOCK and the hold_id in its audit trail; the HOLD decision becomes SUPERSEDED.

## PolicyHold states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| OPEN | `prohibited.hold.opened.v1` (HOLD decision recorded) | `escalate` -> ESCALATED; `resolve_release` -> RELEASED; `resolve_block` -> CONFIRMED_BLOCK; `withdraw` -> WITHDRAWN | reviewer != subject owner and != policy author (PROHIBITED_HOLD_REVIEWER_CONFLICT); row_version match; `escalate` also automatic when now >= due_at | no |
| ESCALATED | `prohibited.hold.escalated.v1` | `resolve_release` -> RELEASED; `resolve_block` -> CONFIRMED_BLOCK; `withdraw` -> WITHDRAWN | same reviewer guard; reviewer holds escalation capability | no |
| RELEASED | `prohibited.hold.resolved.v1` with ALLOW resolution | none | resolution_code in {RELEASE_NO_MATCH, RELEASE_EXCEPTION_DOCUMENTED} | yes |
| CONFIRMED_BLOCK | `prohibited.hold.resolved.v1` with BLOCK resolution | none | resolution_code = BLOCK_RULE_CONFIRMED | yes |
| WITHDRAWN | `prohibited.hold.withdrawn.v1` | none | owner withdrew subject before resolution; no decision change for owner beyond its own state | yes |

Rules:
- PS-146-03.R07: Timeout. At due_at (opened_at + 72 h, A-prohibited-07) an OPEN hold moves to ESCALATED automatically. There is no automatic release from any state. A hold that stays ESCALATED keeps the subject blocked (fail-closed).
- PS-146-03.R08: Escalation does not change the subject's effective outcome. The subject stays blocked from public and cycle-eligible states until RELEASED.
- PS-146-03.R09: Resolution requires a reviewer capability and a resolution_code. A reviewer note is optional, max 1000 characters.

## Evaluate flow (checkpoint)
1. Validate request (validation_rules.md).
2. Check idempotency record for (caller_service_id, idempotency_key). Same digest returns the stored decision; different digest returns PROHIBITED_IDEMPOTENCY_CONFLICT.
3. Read ACTIVE PolicyVersion. If none, return PROHIBITED_NO_ACTIVE_POLICY and record nothing.
4. Check subject_revision against latest recorded revision for the subject; stale returns PROHIBITED_SUBJECT_REVISION_STALE.
5. Run deterministic matching (validation_rules.md R16-R21).
6. Persist decision and, when HOLD, the PolicyHold, in one transaction with the outbox events.
7. Return decision. Owner applies outcome and records decision_id.

## Re-evaluation flow (on activation)
- PS-146-03.R10: On activation, the scheduler enqueues REEVALUATION checkpoints for ACTIVE listings and live cycle participations, in batches of 500 ordered by subject_id.
- PS-146-03.R11: A re-evaluation that changes outcome from ALLOW to HOLD or BLOCK opens a hold (HOLD) or records a BLOCK decision for owner review. It never removes a subject silently (A-prohibited-12). Owner applies the outcome through its own workflow.
- PS-146-03.R12: Completion within 24 h of activation is the target. A batch that fails mid-way resumes from its last committed cursor (failure_recovery_idempotency.md).

## Open decisions
- A-prohibited-07 (72 h hold due window), A-prohibited-11 (two-person activation), A-prohibited-12 (re-evaluation rather than removal).
- Whether a BLOCK from re-evaluation of an ACTIVE listing is applied automatically by the owner or held for review is an owner-module decision; this spec requires it to be explicit. No entry in DECISIONS.md yet.
