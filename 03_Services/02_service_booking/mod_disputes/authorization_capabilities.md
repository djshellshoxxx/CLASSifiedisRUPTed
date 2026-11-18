# PS-030-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-COM-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-05.R01 | Default deny (CTR-CAP-001 R01). Only the two participants of the subject may open, respond to or withdraw a dispute on it. | MVP |
| PS-030-05.R02 | Participant scope (CTR-CAP-001 R04) is derived at decision time from the booking's client and provider `acc_` (R05), not stored as a grant. | MVP |
| PS-030-05.R03 | Capability `dispute.create` for participants of a subject in an eligible state. | MVP |
| PS-030-05.R04 | Capability `dispute.update` (respond, add evidence) for the non-opening participant and the opener until `OPEN` moves on. | MVP |
| PS-030-05.R05 | Capability `dispute.withdraw` for the opener only, while state is `OPEN` or `AWAITING_RESPONSE`. | MVP |
| PS-030-05.R06 | Operators (`mod`/`ope`) have no grant in this module; decisions are F09 or F12 actions with purpose and expiry (CTR-CAP-001 R06). | MVP |
| PS-030-05.R07 | Reads of `reason_code` and amounts: `participant` visibility only; never `public`. | MVP |
| PS-030-05.R08 | Revocation of a participant's account access is effective at next decision (CTR-CAP-001 R09). | MVP |

## Data / schema
No grant table in this module. Capability IDs registered in F16 matrix: `dispute.create`, `dispute.update`, `dispute.withdraw`, `dispute.read`.

## Commands / queries / events
Each command in [commands_queries_events.md](commands_queries_events.md) checks one capability before validation.

## States & transitions
Capability checks gate transitions in [workflow_state_machine.md](workflow_state_machine.md). Denied calls cause no transition.

## Validation & errors
Non-participant: `SYS.NOT_FOUND` (CTR-ERR-001 R08). Participant without capability in current state: `SYS.FORBIDDEN`, retryable false.

## Authorization
| Actor | Action | Scope | Condition |
|---|---|---|---|
| participant (client) | create | participant | subject eligible |
| participant (provider) | create | participant | subject eligible (counter-dispute is not allowed in MVP) |
| either participant | update | participant | state OPEN or AWAITING_RESPONSE |
| opener | withdraw | self | state OPEN or AWAITING_RESPONSE |
| either participant | read | participant | always |

## Failure, idempotency, concurrency, offline
Capability re-check on replay if no stored result exists. Revoked principal's queued commands fail with `SYS.FORBIDDEN` (D08 PROVISIONAL for drafts only).

## Privacy, retention, abuse
Operator reads for moderation are not granted here; F12 requests access through its own purpose-bound grant. Audit: every denial of a participant read logged without content.

## Observability & budgets
Denied-decision counter per capability; alert on spikes > 3 standard deviations (ASSUMPTION).

## Tests
- TEST-PS-030-05-01 unit: matrix rows, table-driven.
- TEST-PS-030-05-02 integration: withdraw after `AWAITING_RESPONSE` refused.
- TEST-PS-030-05-03 negative: third party reads link → `SYS.NOT_FOUND`.

## Acceptance criteria
1. Matrix rows have one passing allow and one passing deny test each.
2. No operator path exists without purpose and expiry.
3. Participant identity visibility matches CTR-CAP-001 R10.

## Assumptions & open decisions
- ASSUMPTION: counter-dispute excluded from MVP.
- Capability IDs PROVISIONAL pending F16 review.
- Payment checklist applies: amounts visible only to participants (CTR-COM-001 scope).
