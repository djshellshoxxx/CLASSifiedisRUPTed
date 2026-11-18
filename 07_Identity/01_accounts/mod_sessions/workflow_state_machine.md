# PS-054-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-03.R01 | Session states: active, revoked, expired. Terminal: revoked, expired. | MVP |
| PS-054-03.R02 | Refresh rotation issues a new refresh secret on every use; the previous secret stays valid for a 10 s grace window only (ASSUMPTION). | MVP |
| PS-054-03.R03 | Use of a refresh secret after grace revokes the whole family (`family_reuse`). | MVP |
| PS-054-03.R04 | Idle timeout 24 h and absolute timeout 30 days from login (ASSUMPTION). Checked on every validation. | MVP |
| PS-054-03.R05 | Each transition emits one CTR-EVT-001 event; `revision` increments by 1. | MVP |

## Data / schema
State lives on the `ses_` row; family state derived from member sessions.

## Commands / queries / events
Transitions via commands in [commands_queries_events](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | create | login proof valid; < 20 active | active | `session.created`. If at cap, oldest session by last use moves to revoked with `end_reason = lru_evicted`. |
| active | refresh | refresh secret current; now < both timeouts | active | Rotate secrets; `session.rotated`. |
| active | refresh | secret in grace window | active | Return current secrets; no second rotation. |
| active | refresh | secret used after grace | revoked | Revoke family; `session.family_revoked`; notify owner. |
| active | idle or absolute timer | now ≥ timeout | expired | `session.expired`. |
| active | logout or revoke | owner or step-up for others | revoked | `session.revoked`. |
| active | step_up | proof valid | active | Set `step_up_at`; `session.step_up_completed`. |

## Validation & errors
Invalid transitions return `MOD_SESSIONS.TOKEN_INVALID` or `TOKEN_REUSED` as in [validation_rules](validation_rules.md).

## Authorization
Owner revokes own sessions; `sys_` expires by timer; `ope_` has no revoke capability over others' sessions except `admin_security` with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Rotation uses compare-and-set on `current_refresh_hash` in one transaction.

## Privacy, retention, abuse
Ended rows retain `end_reason` and timestamps only.

## Observability & budgets
`session_transitions_total{to,end_reason}`; `session_family_reuse_total` alerts above 5 per hour globally (ASSUMPTION).

## Tests
TEST-PS-054-05 (table rows), TEST-PS-054-06 (concurrent refresh: one rotation, duplicate inside grace accepted, outside grace revokes family).

## Acceptance criteria
1. Every table row has a passing test.
2. Family revocation after reuse blocks all member sessions within 1 s.

## Assumptions & open decisions
- ASSUMPTION: timeouts and grace window above.
