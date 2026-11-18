# PS-107-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-CAP-001, CTR-PRV-001, CTR-EVT-001. Prefix `npf_` is PENDING CTR-ID-001 registration. Consent evidence is owned by F10.S01.M01 (`10_Privacy/01_data_controls/mod_consent`); this module stores a reference only.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-01.R01 | One `notification_preference` row per account holding a fixed 3 × 4 matrix: channels {push, email, inapp} by categories {security, transactional, deadline, activity}. | MVP |
| PS-107-01.R02 | `inapp`/`security` is fixed `on`; it cannot be stored as off. | MVP |
| PS-107-01.R03 | Each cell stores `state` ∈ {off, pending_confirm, on}, `consent_ref` (F10 ID or null), `source`, `changed_at`. | MVP |
| PS-107-01.R04 | The category registry (security, transactional, deadline, activity) is owned by this module; other modules reference it by name. | MVP |
| PS-107-01.R05 | Default state on account creation: inapp all on; push all off; email `security` on, others off (ASSUMPTION). | MVP |

## Data / schema
```json
notification_preference  (npf_, class ulid, PENDING CTR-ID-001)
{
  "npf_id": "npf_<26>", "account_id": "acc_<26>", "revision": 4,
  "cells": [
    { "channel": "push", "category": "deadline", "state": "off", "consent_ref": null,
      "source": "settings", "changed_at": "<RFC 3339>" }
  ],
  "schema_version": "1.0.0"
}
```
Constraints: exactly 12 cells, unique (`channel`, `category`); `consent_ref` must match the F10 consent prefix when non-null.

Confirmation tokens: stored as SHA-256 hash only, class SECRET, RET-SEC.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Preferences reveal contact-channel choices. See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Counts by channel and state only; see [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-107-01-01 (unit): storing `inapp`/`security` as `off` is rejected.
- TEST-PS-107-01-02 (unit): matrix with 11 or 13 cells is rejected.
- TEST-PS-107-01-03 (unit): new account receives default matrix in R05.
- TEST-PS-107-01-04 (contract): `consent_ref` with non-F10 prefix rejected.

## Acceptance criteria
1. Schema validated; default matrix matches R05.
2. Token values absent from all rows (scan).
3. Category registry referenced, not duplicated, by consumers.

## Assumptions & open decisions
- ASSUMPTION: default matrix in R05.
- Consent evidence owner: F10 mod_consent (canonical).
- D07 PROVISIONAL (D07 default, unapproved) for retention.
