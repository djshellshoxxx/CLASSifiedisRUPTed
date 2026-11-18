# PS-087-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R05, R06), CTR-EVT-001 (R02).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-03.R01 | Index row: unseen → recorded → (hit_count increments) → expired, or recorded → equivocated (terminal evidence). | MVP |
| PS-087-03.R02 | Equivocated rows are never expired while peer is quarantined. | MVP |
| PS-087-03.R03 | `expired` only after event `expires_at` plus horizon has passed. | MVP |

## Data / schema
States in index row, see [domain_schema.md](domain_schema.md).

## Commands / queries / events
`dedup.check_and_record` → `dedup.duplicate_seen` or `dedup.equivocation_detected`; expiry job emits none.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | check_and_record | new key | recorded | result accepted |
| recorded | check_and_record | same digest | recorded | hit_count + 1; result duplicate |
| recorded | check_and_record | different digest or event_id under same revision | equivocated | quarantine peer; retain pair |
| recorded | expiry job | `expires_at` + horizon passed | expired | row removed; digest archived |
| equivocated | (none) | terminal | equivocated | evidence retained |

## Validation & errors
`DEDUP.INVALID_TRANSITION` (internal, 500 if reached; should not occur).

## Authorization
Internal `sys_` only.

## Failure, idempotency, concurrency, offline
Upsert is atomic (PS-087-06). Expiry job idempotent.

## Privacy, retention, abuse
Transitions carry IDs and digests only.

## Observability & budgets
Gauge rows by state; equivocations count (alert on any).

## Tests
- TEST-PS-087-03-01 (state): table rows pass.
- TEST-PS-087-03-02 (retention): equivocated row survives expiry job while peer quarantined.
- TEST-PS-087-03-03 (expiry): row expires only after horizon.

## Acceptance criteria
1. Table exhaustive.
2. Evidence rows preserved.

## Assumptions & open decisions
- ASSUMPTION: horizon value.
