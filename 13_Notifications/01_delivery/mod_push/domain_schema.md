# PS-104-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-EVT-001, CTR-SCH-001. Prefixes `psb_` and `pda_` are PENDING CTR-ID-001 registration.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-01.R01 | One `push_subscription` per (account, device, endpoint). A repeated registration returns the existing row; no second row is created. | MVP |
| PS-104-01.R02 | Stores `endpoint` (https URL, 1–2048 chars), `p256dh` (65 bytes, base64url), `auth` (16 bytes, base64url). Other lengths are rejected. | MVP |
| PS-104-01.R03 | At most 10 subscriptions with `status=active` per account. | MVP |
| PS-104-01.R04 | `push_attempt` stores status, attempt number, HTTP status and timestamps. It never stores payload bodies or endpoint URLs. | MVP |
| PS-104-01.R05 | Each subscription references its device by `dev_` ID (owner F07). Device revocation revokes the subscription within 60 s. | MVP |
| PS-104-01.R06 | `channel` enum reserves `apns` and `fcm`. Both are Future; MVP writes only `web_push`. | Future |

## Data / schema
```json
push_subscription  (psb_, class ulid, PENDING CTR-ID-001)
{
  "psb_id": "psb_<26 Crockford>", "account_id": "acc_<26>", "device_id": "dev_<26>",
  "channel": "web_push", "endpoint": "https://<push-host>/...",
  "p256dh": "<base64url, 87 chars>", "auth": "<base64url, 22 chars>",
  "status": "active|expired|revoked", "consecutive_failures": 0,
  "created_at": "<RFC 3339 UTC>", "last_success_at": "<RFC 3339>|null", "revoked_at": "<RFC 3339>|null",
  "revision": 1, "schema_version": "1.0.0"
}
```
Constraints: `endpoint` unique where `status=active`; `p256dh` and `auth` encrypted at rest, class SECRET (CTR-PRV-001); `revision` follows CTR-EVT-001 R02.

```json
push_attempt  (pda_, PENDING CTR-ID-001)
{ "pda_id": "pda_<26>", "psb_id": "psb_<26>", "ntf_id": "ntf_<26>",
  "attempt_no": 1, "status": "queued|sent|retry_scheduled|expired|failed",
  "http_status": 201, "scheduled_at": "<RFC 3339>", "finished_at": "<RFC 3339>|null", "schema_version": "1.0.0" }
```
Constraints: unique (`ntf_id`, `psb_id`, `attempt_no`); `attempt_no` 1–5; `ntf_id` owned by F13 notification records (not duplicated here).

Provenance: subscriptions are written by the owning account through its client. Attempts are written only by the `sys_` dispatcher.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md). Schema changes follow CTR-SCH-001.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Row writes use optimistic concurrency via `revision`. Full policy in [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Endpoint and key material are SECRET-adjacent. Retention per [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Row counts and state gauges only; see [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-104-01-01 (unit): `p256dh` of 64 or 66 bytes is rejected with `PUSH.KEY_INVALID`.
- TEST-PS-104-01-02 (unit): second registration of same device and endpoint returns existing `psb_id`.
- TEST-PS-104-01-03 (property): `attempt_no` above 5 is never persisted.
- TEST-PS-104-01-04 (integration): device revocation sets subscription `revoked` within 60 s.

## Acceptance criteria
1. Schema validates against `schema_version` 1.0.0 with no extra fields accepted.
2. Eleventh active subscription per account is rejected.
3. No row in `push_attempt` contains a URL or payload body (automated scan).

## Assumptions & open decisions
- ASSUMPTION: Web Push (VAPID) is the only MVP channel; native push is Future.
- Retention of keys: D07 default, PROVISIONAL (D07 default, unapproved).
- Prefix registration for `psb_`/`pda_`: PENDING CTR-ID-001.
