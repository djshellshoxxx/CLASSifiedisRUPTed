# PS-106-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-PRV-001, CTR-SCH-001. Prefix `inp_` is PENDING CTR-ID-001 registration. Notification records `ntf_` are owned by F13 (CTR-ID-001).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-01.R01 | One `inbox_preference` row per account. | MVP |
| PS-106-01.R02 | `security` inbox inclusion is constant `true` and cannot be stored as `false`. | MVP |
| PS-106-01.R03 | `retention_days` ∈ {7, 30, 90, 365}; default 90. | MVP |
| PS-106-01.R04 | `inbox_state` on `ntf_` ∈ {unread, read, archived}; pruned items are removed, not kept as tombstones beyond the record's retention. | MVP |
| PS-106-01.R05 | Inbox items reference objects by ID (`object_ref`) and never embed object content. | MVP |

## Data / schema
```json
inbox_preference  (inp_, class ulid, PENDING CTR-ID-001)
{
  "inp_id": "inp_<26>", "account_id": "acc_<26>",
  "categories": { "transactional": true, "deadline": true, "activity": false, "security": true },
  "retention_days": 90, "revision": 2, "updated_at": "<RFC 3339>", "schema_version": "1.0.0"
}
```
Inbox item (projection on `ntf_`, owner F13):
```json
{ "ntf_id": "ntf_<26>", "account_id": "acc_<26>", "category": "transactional",
  "object_ref": "cyc_<26>|lst_<26>|dsp_<26>|null", "group_key": "<opaque hash>",
  "inbox_state": "unread", "created_at": "<RFC 3339>", "read_at": null }
```
Constraints: `object_ref` must match a registered prefix (CTR-ID-001 R04 check). `group_key` = HMAC of (`object_ref`, 24-hour bucket) under a server key, so it is not reversible.

Provenance: items are created by `sys_` from `ntf_` events; preferences are written by the owner.

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
Items reference activity on the user's own objects. See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Counts only; see [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-106-01-01 (unit): storing `security: false` is rejected with `INPREF.SECURITY_REQUIRED`.
- TEST-PS-106-01-02 (unit): `retention_days` = 60 is rejected.
- TEST-PS-106-01-03 (property): `group_key` values for two objects in the same bucket never collide in fixtures.
- TEST-PS-106-01-04 (contract): `object_ref` with unregistered prefix is rejected with `ID.PREFIX_MISMATCH`.

## Acceptance criteria
1. Schema validated against 1.0.0; extra fields rejected.
2. No inbox item stores object text.
3. `group_key` not reversible without server key (review).

## Assumptions & open decisions
- ASSUMPTION: HMAC key rotation every 90 days under F16.
- Retention: D07 default, PROVISIONAL (D07 default, unapproved).
