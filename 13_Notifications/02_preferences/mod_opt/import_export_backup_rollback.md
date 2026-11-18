# PS-107-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-10.R01 | Export includes the 12-cell matrix with state, source and changed_at (schema 1.0.0). No address, token or token hash. | MVP |
| PS-107-10.R02 | Import never sets a cell to `on` for push or email; imported states are set to `off` and the user is asked to re-enable. | MVP |
| PS-107-10.R03 | Preferences are not federated. | MVP |
| PS-107-10.R04 | Rollback may only restrict behavior. Rolling back this module must never enable a channel. | MVP |

## Data / schema
Export: `{ "cells": [ { "channel", "category", "state", "source", "changed_at" } ], "schema_version": "1.0.0" }`.

## Commands / queries / events
`account.export` includes section `notification_preference.export` (self).

## States & transitions
Import sets all push/email cells to `off`; inapp/security stay on.

## Validation & errors
Import errors use OPT codes.

## Authorization
Export self; import self with explicit re-enable step; rollback operator global with dual control.

## Failure, idempotency, concurrency, offline
Export repeatable; import idempotent by digest.

## Privacy, retention, abuse
Backups hold the matrix; token hashes excluded from backups (purged on expiry, not backed up).

## Observability & budgets
Export p95 ≤ 500 ms.

## Tests
- TEST-PS-107-10-01 (contract): export schema validation; no token or address.
- TEST-PS-107-10-02 (integration): import with `push/activity` = on results in off.
- TEST-PS-107-10-03 (integration): rollback drill never results in new `on` cells.
- TEST-PS-107-10-04 (negative): federation import attempt rejected.

## Acceptance criteria
1. Export lossless for valid matrix.
2. Import never enables push or email.
3. Rollback drill recorded (not yet run).

## Assumptions & open decisions
- ASSUMPTION: import never enables channels.
- D07 PROVISIONAL (D07 default, unapproved).
