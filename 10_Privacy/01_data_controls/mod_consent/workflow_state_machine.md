# PS-076-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02 revisions), CTR-CAP-001 (R09 decision timing).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-03.R01 | Only the transitions in the table below are legal; any other request returns `CONSENT.INVALID_TRANSITION` (409). | MVP |
| PS-076-03.R02 | A withdrawal is effective for the next consent check; consent checks for `analytics` and `federation_item_optin` read live state (no cache). | MVP |
| PS-076-03.R03 | `superseded` is set for all `granted` records of a purpose when its notice version changes; subject must re-grant. | MVP |
| PS-076-03.R04 | `expired` is set by a scheduled job no later than 24 h after `expires_at` (ASSUMPTION). | MVP |

## Data / schema
State lives in `status` and `revision` of [domain_schema.md](domain_schema.md). Each transition appends one event (file 04).

## Commands / queries / events
Transitions are triggered by commands `consent.grant`, `consent.withdraw`, and system jobs `consent.expire`, `consent.supersede`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | consent.grant | notice current; purpose valid | granted | emit `consent.granted`; consent check cache invalidated |
| granted | consent.withdraw | subject owns record | withdrawn | emit `consent.withdrawn`; downstream stops processing |
| granted | consent.expire (job) | now ≥ `expires_at` | expired | emit `consent.expired`; notify subject |
| granted | consent.supersede (job) | notice version bumped | superseded | emit `consent.superseded`; prompt re-grant |
| withdrawn, expired, superseded | consent.grant | new record, new `revision` 1 | granted | new record; prior records unchanged |

Terminal per record: withdrawn, expired, superseded. A new grant always creates a new record.

## Validation & errors
Illegal transitions: `CONSENT.INVALID_TRANSITION` (409, non-retryable). Concurrent conflicting writes: `EVT.REVISION_CONFLICT` (409).

## Authorization
Grant and withdraw: subject only. Expire and supersede: system principal `sys_` only.

## Failure, idempotency, concurrency, offline
Each transition commits under the aggregate lock with `expected_revision`. A failed expire job retries idempotently (same record, same target state). Offline queued withdrawals are never discarded.

## Privacy, retention, abuse
Transition history is kept per file 07 retention rules. Transition events contain no content.

## Observability & budgets
Gauge of records per status; expire job lag p95 ≤ 24 h (R04).

## Tests
- TEST-PS-076-03-01 (state): every row of the table passes; every other pair is rejected.
- TEST-PS-076-03-02 (property): any sequence of commands leaves at most one `granted` record per (subject, purpose, scope).
- TEST-PS-076-03-03 (integration): withdrawal blocks analytics processing on next check.

## Acceptance criteria
1. Transition table is exhaustive and tested.
2. Withdrawal effective at next check (R02).
3. Superseding a notice removes `granted` status for that purpose within one job cycle.

## Assumptions & open decisions
- ASSUMPTION: 24 h expiry job bound.
- PROVISIONAL (D08 default, unapproved): offline withdrawals are pending until server acknowledgement.
