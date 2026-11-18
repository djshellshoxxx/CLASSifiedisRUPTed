# PS-106-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-10.R01 | Account export includes preferences and inbox items within retention (schema 1.0.0), class PSEUDONYMOUS. | MVP |
| PS-106-10.R02 | Inbox items are not imported from other accounts or nodes. Import of preferences only, validated by PS-106-02. | MVP |
| PS-106-10.R03 | Inbox is excluded from federation (CTR-FED-001 has no mapping). | MVP |
| PS-106-10.R04 | Rollback: flag `inbox_projection` off stops new projections; clients fall back to live `notification` queries; existing items are kept until retention. | MVP |

## Data / schema
Export: `{ "inbox_preference": {...}, "items": [ { "ntf_id", "category", "inbox_state", "created_at" } ], "schema_version": "1.0.0" }`. No `group_key` or `object_ref`.

## Commands / queries / events
`account.export` includes section `inbox.export` (self).

## States & transitions
Rollback freezes state; no transitions to pruned except by retention.

## Validation & errors
Import errors use INPREF codes.

## Authorization
Export self only; rollback operator global scope with dual control.

## Failure, idempotency, concurrency, offline
Export read-only and repeatable. Import idempotent by digest.

## Privacy, retention, abuse
Backups follow platform backup policy; `group_key` HMAC key excluded from exports.

## Observability & budgets
Export ≤ 3 s p95 for 1000 items.

## Tests
- TEST-PS-106-10-01 (contract): export schema validation; no `group_key`.
- TEST-PS-106-10-02 (integration): import attempting to set `security: false` rejected.
- TEST-PS-106-10-03 (integration): rollback keeps existing items and stops new projections.
- TEST-PS-106-10-04 (negative): federation import attempt rejected.

## Acceptance criteria
1. Export round-trip for preferences lossless.
2. Rollback verified in staging (not run yet).
3. No HMAC key material in any export.

## Assumptions & open decisions
- ASSUMPTION: inbox excluded from federation in MVP and Future.
- D07 PROVISIONAL (D07 default, unapproved).
