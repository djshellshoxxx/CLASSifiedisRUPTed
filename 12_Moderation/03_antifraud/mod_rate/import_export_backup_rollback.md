# PS-099-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (policy schema versions), CTR-EVT-001 (R08 for policy events), CTR-FED-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-10.R01 | No bucket state is exported or backed up. Backups contain only policy files and their signatures. | MVP |
| PS-099-10.R02 | Policy import is allowed only as a signed artifact from F16; no free-form import exists. | MVP |
| PS-099-10.R03 | Rollback = activate a previously signed policy version; the old version is re-verified before activation. | MVP |
| PS-099-10.R04 | Policy schema changes follow CTR-SCH-001 with a one-MINOR compatibility window. | MVP |
| PS-099-10.R05 | Restore after data-center failover starts with empty buckets and the last active policy. | MVP |

## Data / schema
Backup content: signed policy files (JSON, version history of 10 entries kept). No other data.

## Commands / queries / events
`rate.policy_load` (PS-099-04) is the only import path.

## States & transitions
Rollback sets a new active version identical to the old file (new `policy_version` label with `rollback_of` field).

## Validation & errors
Signature failure → `rate.policy_rejected` with `reason_code` `SIGNATURE_INVALID`.

## Authorization
Policy load requires F16 signing key (PS-099-05).

## Failure, idempotency, concurrency, offline
Empty bucket start after failover is a fairness event for one window; accepted per PS-099-07 R01 trade-off.

## Privacy, retention, abuse
Policy files contain no subject data, so export is not a privacy concern. Class definitions published for transparency only if F10 approves.

## Observability & budgets
Restore of policy set ≤ 1 min (ASSUMPTION).

## Tests
- `TEST-PS-099-10-01` integration: failover with empty buckets and last policy: limits resume within one window.
- `TEST-PS-099-10-02` negative: unsigned policy import rejected.
- `TEST-PS-099-10-03` rollback: prior signed version reactivates with the same behavior on the reference corpus.
- `TEST-PS-099-10-04` schema migration: old-minor policy loads under new minor.

## Acceptance criteria
1. Backups contain zero bucket data.
2. Rollback produces identical decisions to the earlier version on the test corpus.
3. Unsigned import rejected in test.

## Assumptions & open decisions
- ASSUMPTION: RPO and RTO are not meaningful for buckets; RTO for policy restore is ≤ 1 min.
- D07 (retention), PROVISIONAL default: policy history retained 12 months (unapproved).
