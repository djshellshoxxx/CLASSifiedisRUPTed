# PS-108-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-SCH-001. Prefix `qpd_` is PENDING CTR-ID-001 registration.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-01.R01 | At most one active `quiet_period` per account. | MVP |
| PS-108-01.R02 | Stores absolute UTC `starts_at` and `ends_at`; duration ≤ 7 days from `starts_at`. | MVP |
| PS-108-01.R03 | Presets: `1h`, `8h`, `until_morning` (next 08:00 in the account zone from mod_hours), `custom`. | MVP |
| PS-108-01.R04 | Pause state is PRIVATE_PERSONAL and is never visible to other accounts. | MVP |
| PS-108-01.R05 | Last ended period is kept 30 days for undo and support-free history (ASSUMPTION), then purged. | MVP |

## Data / schema
```json
quiet_period  (qpd_, class ulid, PENDING CTR-ID-001)
{
  "qpd_id": "qpd_<26>", "account_id": "acc_<26>", "preset": "1h|8h|until_morning|custom",
  "starts_at": "<RFC 3339 UTC>", "ends_at": "<RFC 3339 UTC>",
  "end_reason": null, "revision": 2, "schema_version": "1.0.0"
}
```
Constraints: `ends_at` > `starts_at`; `ends_at` − `starts_at` ≤ 7 days; `end_reason` ∈ {null, expired, resumed, account_deleted}.

Deferred notification record (owned here, references `ntf_`): `ntf_id`, `qpd_id`, `category`, `channel`, `held_until`, `drop_after`.

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
See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-108-01-01 (unit): duration of 7 days + 1 minute is rejected.
- TEST-PS-108-01-02 (unit): second active period replaces the first (single active row).
- TEST-PS-108-01-03 (unit): `until_morning` across DST computes correct absolute instant.
- TEST-PS-108-01-04 (contract): no event or query for other accounts exposes `qpd_` state.

## Acceptance criteria
1. Schema valid for each preset.
2. At most one active row enforced by unique constraint.
3. Absolute instants used in all evaluations.

## Assumptions & open decisions
- ASSUMPTION: 7-day cap; 30-day history.
- D07 PROVISIONAL (D07 default, unapproved).
