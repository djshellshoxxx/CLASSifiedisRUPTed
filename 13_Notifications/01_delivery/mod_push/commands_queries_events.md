# PS-104-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-04.R01 | Every state-changing command carries `idempotency_key` (≤ 64 chars) and `expected_revision` (null on create). | MVP |
| PS-104-04.R02 | Commands return within 300 ms p95 for registration and revocation. Dispatch is asynchronous and returns `202` with `pda_` IDs. | MVP |
| PS-104-04.R03 | Events never carry endpoint URLs or key material; they carry IDs and codes only. `max_data_class` is PSEUDONYMOUS. | MVP |
| PS-104-04.R04 | Queries return subscription metadata (device label, created_at, status); `p256dh`, `auth` and `endpoint` are never returned. | MVP |

## Data / schema
**Commands**

| Command | Actor | Idempotency key | expected_revision | Errors |
|---|---|---|---|---|
| `push.register_subscription` | user (self) | sha256(account, device, endpoint) | null | PUSH.ENDPOINT_INVALID, PUSH.ENDPOINT_HOST_NOT_ALLOWED, PUSH.KEY_INVALID, PUSH.SUBSCRIPTION_LIMIT, SYS.NOT_FOUND |
| `push.revoke_subscription` | user (self), sys (device revoked) | client `idempotency_key` | required | SYS.NOT_FOUND, PUSH.INVALID_STATE_TRANSITION |
| `push.dispatch_notification` | sys (`ntf_` published) | `ntf_id` + `psb_id` | n/a (attempt rows) | PUSH.PAYLOAD_FORBIDDEN_FIELD, PUSH.CATEGORY_UNKNOWN |

**Queries**: `push.list_subscriptions` (self, paginated 50, returns status and device label). `push.get_attempt_summary` (self, returns status and counts per ntf_, no endpoint).

**Events** (CTR-EVT-001 envelope; `aggregate_type` must match registry prefix)

| event_type | aggregate_type | Emitted by | max_data_class |
|---|---|---|---|
| push_subscription.registered | push_subscription | register | PSEUDONYMOUS |
| push_subscription.revoked | push_subscription | revoke | PSEUDONYMOUS |
| push_subscription.expired | push_subscription | transition engine | PSEUDONYMOUS |
| notification.push_accepted | push_attempt | dispatcher | PSEUDONYMOUS |
| notification.push_failed | push_attempt | dispatcher | PSEUDONYMOUS |

Payload example (`push_subscription.expired`): `{"psb_id":"psb_…","device_id":"dev_…","reason_code":"PROVIDER_GONE"}`. Schema versions per CTR-SCH-001.

## States & transitions
Event emission matches [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Schemas per [validation_rules.md](validation_rules.md). Error envelope per CTR-ERR-001.

## Authorization
Capabilities per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate command with same key and digest returns original result (CTR-EVT-001 R03). Different digest returns `EVT.IDEMPOTENCY_KEY_REUSED`. Full policy in failure_recovery_idempotency.md.

## Privacy, retention, abuse
Event envelopes exclude `endpoint`, `p256dh`, `auth` and payload text (CTR-EVT-001 R06, R11).

## Observability & budgets
Each command logs `code`, `request_id`, duration. Command p95 ≤ 300 ms.

## Tests
- TEST-PS-104-04-01 (contract): each event validates against CTR-EVT-001 schema and has `max_data_class` PSEUDONYMOUS.
- TEST-PS-104-04-02 (integration): replay of `push.register_subscription` with same key returns same `psb_id` and emits no second event.
- TEST-PS-104-04-03 (contract): query response snapshot contains no `endpoint`, `p256dh` or `auth` fields.
- TEST-PS-104-04-04 (integration): dispatch returns 202 before any provider call completes.

## Acceptance criteria
1. Five events listed, each with a registry-valid `event_type`.
2. Zero occurrences of endpoint or key fields in any event or query response (automated scan).
3. Idempotent replay produces zero additional events.

## Assumptions & open decisions
- ASSUMPTION: 64-character idempotency key limit.
- Event names use aggregate `push_subscription` (PENDING CTR-ID-001 prefix `psb_`).
- No Dxx blocks this file.
