# PS-031-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-COM-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-05.R01 | Default deny (CTR-CAP-001 R01). Each command checks one capability before validation. | MVP |
| PS-031-05.R02 | Only the provider (`acc_` on the booking) may `start` and `submit` milestones. | MVP |
| PS-031-05.R03 | Only the client may `accept` or `reject`. | MVP |
| PS-031-05.R04 | `plan_set` and `cancel` require consent by both participants (`consent` verb, CTR-CAP-001 R03). | MVP |
| PS-031-05.R05 | Participant scope is derived from booking state at decision time (CTR-CAP-001 R05). | MVP |
| PS-031-05.R06 | No operator grant can accept or submit a milestone on a participant's behalf in MVP. Dispute outcomes are applied by F03.S02.M03 / F09 under their own grants. | MVP |
| PS-031-05.R07 | Milestone amounts and acceptance text: visibility `participant` only (CTR-CAP-001 R10). | MVP |
| PS-031-05.R08 | Revocation of account access takes effect at next decision (CTR-CAP-001 R09). | MVP |

## Data / schema
Capability IDs for F16 matrix: `milestone.create` (plan_set), `milestone.update` (start, submit), `milestone.accept` (accept, reject), `milestone.consent` (cancel), `milestone.read` (participant). PROVISIONAL.

## Commands / queries / events
Each command in [commands_queries_events.md](commands_queries_events.md) names one capability.

## States & transitions
Capability checks gate [workflow_state_machine.md](workflow_state_machine.md) transitions.

## Validation & errors
Non-participant: `SYS.NOT_FOUND`. Wrong role for a participant: `SYS.FORBIDDEN` (retryable false).

## Authorization
| Actor | Action | Scope | Condition |
|---|---|---|---|
| provider | start, submit | participant (provider) | state rules |
| client | accept, reject | participant (client) | state `submitted` |
| both | plan_set, cancel | participant | mutual consent record |
| both | read | participant | always |

## Failure, idempotency, concurrency, offline
Replay re-checks capability when no stored result exists. Revoked principal's queued submissions fail with `SYS.FORBIDDEN`.

## Privacy, retention, abuse
Auto-accept is a system transition; it is recorded as `sys_` actor with no human decision.

## Observability & budgets
Denied-decision counter per capability.

## Tests
- TEST-PS-031-05-01 unit: matrix rows.
- TEST-PS-031-05-02 integration: provider cannot accept own submission.
- TEST-PS-031-05-03 negative: non-participant read → `SYS.NOT_FOUND`.

## Acceptance criteria
1. Each matrix row has allow and deny tests.
2. No operator path accepts or submits a milestone.
3. Consent-required commands fail without both consents.

## Assumptions & open decisions
- ASSUMPTION: mutual consent record stored as a CTR-EVT-001 event.
- Capability IDs PROVISIONAL pending F16 review.
- Payment checklist applies: claim requests are issued by the system, never directly by a participant.
