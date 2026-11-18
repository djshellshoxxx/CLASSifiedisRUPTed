# PS-083-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (verification order), CTR-EVT-001 (R02).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-03.R01 | Export: requested → building → signed → delivered, or → expired, or → revoked (key compromise). | MVP |
| PS-083-03.R02 | Import: received → verified → imported, or → rejected. A rejected bundle is never partially applied. | MVP |
| PS-083-03.R03 | A bundle whose `key_id` is revoked moves to `revoked` and is not delivered further. | MVP |

## Data / schema
`status` on bundle record; per-item results in [domain_schema.md](domain_schema.md).

## Commands / queries / events
`portable.create_bundle` → `bundle.created`; `portable.import_bundle` → `bundle.imported` or `bundle.rejected`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | create_bundle | PS-083-02 passes | requested | none |
| requested | build complete | all items committed | building → signed | sign manifest |
| signed | delivery ack | peer trusted | delivered | emit `bundle.delivered` |
| signed, delivered | expiry job | now ≥ `expires_at` | expired | none |
| signed, delivered | key revoked | `key_id` revoked | revoked | stop delivery |
| received | verify | FED steps 1–9 pass | verified | none |
| verified | import | items commit | imported | emit `bundle.imported` |
| received, verified | any failure | FED error code | rejected | emit `bundle.rejected` (code only) |

## Validation & errors
`PORTABLE.INVALID_TRANSITION` (409).

## Authorization
Export by item owner; import by peer in `trusted` state.

## Failure, idempotency, concurrency, offline
Build is restartable from `requested`. Import is all-or-nothing per bundle (per-event dedupe in PS-087).

## Privacy, retention, abuse
Transitions carry IDs and codes only.

## Observability & budgets
Gauge of bundles per state; build p95 ≤ 2 s for 1000 items (ASSUMPTION).

## Tests
- TEST-PS-083-03-01 (state): table rows pass.
- TEST-PS-083-03-02 (rejection): one bad event rejects whole bundle; no rows written.
- TEST-PS-083-03-03 (revocation): key revoked mid-delivery stops delivery.

## Acceptance criteria
1. Table exhaustive.
2. All-or-nothing import verified.
3. Revocation stops delivery.

## Assumptions & open decisions
- ASSUMPTION: all-or-nothing import.
- PROVISIONAL (D01 default, unapproved).
