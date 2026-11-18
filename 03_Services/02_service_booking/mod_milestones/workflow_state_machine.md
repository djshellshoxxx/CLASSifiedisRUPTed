# PS-031-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001, CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-03.R01 | `milestone.state` ∈ {`planned`, `in_progress`, `submitted`, `accepted`, `rejected`, `auto_accepted`, `cancelled`, `disputed`}. `rejected` is transient and returns to `in_progress`. | MVP |
| PS-031-03.R02 | `accepted`, `auto_accepted`, `cancelled` are terminal for the milestone. `disputed` exits only to F03.S02.M03 outcome states. | MVP |
| PS-031-03.R03 | Acceptance does not create a payment. It records participant acceptance and may request a claim from F09 (CTR-COM-001 R06: starts at `CLAIMED`). | MVP |
| PS-031-03.R04 | A milestone never reaches `FINAL` or `EXTERNALLY_VERIFIED` through this module (CTR-COM-001 R07 for cash/in-kind). | MVP |
| PS-031-03.R05 | Auto-acceptance: `submitted` for ≥ 7 days with no response and no open dispute → `auto_accepted` (ASSUMPTION). | MVP |
| PS-031-03.R06 | Each transition emits one event; `revision` +1. | MVP |
| PS-031-03.R07 | Max 2 rejections per milestone; third submission cycle requires dispute or mutual cancellation. | MVP |

## Data / schema
`state`, `rejection_count`, `revision` per [domain_schema.md](domain_schema.md). Transition log append-only.

## Commands / queries / events
Events: `milestone.submitted`, `milestone.accepted`, `milestone.rejected`, `milestone.auto_accepted`, `milestone.cancelled`, `milestone.disputed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| planned | start | plan accepted, prior milestone accepted | in_progress | lock plan |
| in_progress | submit | provider is owner | submitted | notify client (generic text) |
| submitted | accept | client is owner | accepted | request F09 claim (CLAIMED) |
| submitted | reject | client, reason valid, rejection_count < 2 | rejected → in_progress | count +1 |
| submitted | timer 7 d | no dispute open | auto_accepted | request F09 claim |
| submitted | open dispute | window open | disputed | F03.S02.M03 link opened |
| planned | cancel | both parties consent | cancelled | no claim |
| in_progress | cancel | both parties consent | cancelled | no claim; refund amounts by F09 only |
| disputed | outcome received | F03.S02.M03 outcome | accepted / cancelled | per outcome record |

## Validation & errors
Invalid transition → `MILESTON.INVALID_TRANSITION` (retryable false).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Auto-accept timer is idempotent per milestone and revision; double firing produces one event. Concurrent accept and reject: revision conflict, loser gets `EVT.REVISION_CONFLICT`.

## Privacy, retention, abuse
Acceptance text is not included in events.

## Observability & budgets
Histogram time-in-`submitted`. Alert if auto-accept job lags > 1 h (ASSUMPTION).

## Tests
- TEST-PS-031-03-01 unit: every transition row.
- TEST-PS-031-03-02 property: rejection count never exceeds 2.
- TEST-PS-031-03-03 integration: auto-accept at 7 d fires once; a dispute opened at day 6 blocks it.

## Acceptance criteria
1. No transition outside the table.
2. Acceptance never sets a claim state above `CLAIMED` locally.
3. No event or label contains "paid", "payment received" or "settled" (CTR-COM-001 R15).

## Assumptions & open decisions
- ASSUMPTION: 7-day auto-accept; 2 rejections.
- D04 (partial execution) PROVISIONAL: milestone acceptance is attestation, not atomic handover.
- Payment checklist applies.
