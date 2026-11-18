# PS-079-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (record lifecycle `active`→`expired`→`purged`; `legal_hold` overrides `expired`; R07), CTR-EVT-001 (R02), CTR-SCH-001 (R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-03.R01 | Policy states: `draft`, `approved`, `active`, `superseded`. Only one `active` version per class. | MVP |
| PS-079-03.R02 | Hold states: `requested`, `applied`, `released`, `auto_released`. `auto_released` fires at `ends_at` without operator action. | MVP |
| PS-079-03.R03 | A record under an `applied` hold is never purged, regardless of `expired` status. | MVP |
| PS-079-03.R04 | Record lifecycle per CTR-PRV-001: `active` → `expired` (class maximum or deletion) → `purged` within 24 h across replicas, caches and indexes. | MVP |
| PS-079-03.R05 | Each transition emits exactly one event with `aggregate_revision + 1` (CTR-EVT-001 R02). | MVP |

## Data / schema
State on `retention_policy.state` and `retention_hold.state` (PS-079-01). Record expiry computed as `created_at` (or class-specific anchor) + class maximum; anchor per class documented in the field registry.

## Commands / queries / events
Events: `retention.policy_published`, `retention.policy_superseded`, `hold.applied`, `hold.released`, `hold.auto_released`, `record.expired`, `record.purged`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| draft | publish | PS-079-02 R04–R06 pass | approved | Approver IDs recorded |
| approved | activate | effective_from reached | active | Previous active → superseded |
| applied hold | release | two approvers | released | Held records re-evaluated |
| applied hold | clock reaches ends_at | no re-approval | auto_released | Held records re-evaluated |
| active record | class maximum reached | no hold | expired | Queued for purge |
| expired record | purge job | no hold | purged | Replica and index removal |
| expired record | hold applied | selector matches | expired (held) | Purge skipped |

## Validation & errors
Invalid transitions → `RETAIN.INVALID_TRANSITION` (409).

## Authorization
Activation by sys scheduler; publish and release by dual-approved operators (PS-079-05).

## Failure, idempotency, concurrency, offline
Sweeps are idempotent per (class, version, run window). Concurrent hold and sweep: hold check is performed inside the purge transaction.

## Privacy, retention, abuse
Events carry counts and IDs only.

## Observability & budgets
`retention_records_expired_total{class}`; purge lag p95 ≤ 24 h (CTR-PRV-001 metric).

## Tests
- TEST-PS-079-03-01 (property): no path purges a record with an applied hold.
- TEST-PS-079-03-02 (clock): hold auto-releases at `ends_at`; unrelated overlapping records purge on schedule.

## Acceptance criteria
1. Transition table covered by tests.
2. Only one active policy version per class (TEST-PS-079-03-01 extension).
3. Auto-release test passes (matches CTR-PRV-001 TEST-08).

## Assumptions & open decisions
- ASSUMPTION: sweep runs hourly.
- PROVISIONAL (D07 default): legal-hold exceptions.
