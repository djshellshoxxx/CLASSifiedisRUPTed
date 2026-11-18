# PS-028-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-028-04. **Owner:** [03_Services/01_service_catalog/mod_availability](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_availability. **Consumers:** 03_Services/02_service_booking (claim commands and claim queries); notifications and observability per [03_Services SPEC](../../SPEC.md).

## Purpose and scope
Defines the versioned command, query and event surface of this module, with signatures, request and response examples, idempotency keys and schema versions. Canonical envelope and error rules are CTR-EVT-001 and CTR-ERR-001 (owner F15, both OPEN). This file states what this module emits until F15 expands them.

Exclusions: transport (HTTP or message bus choice is F15), UI flows, and booking commands.

## Envelope (all commands)
```json
{
  "command": "availability.window.publish",
  "schema_version": "1.0.0",
  "idempotency_key": "pub-01J9Z4Q1M7X3B5N8-r3",
  "actor": {"actor_type": "provider", "actor_ref": "prov_01J9Z3K8QF7W2M4X6R0T5V8B2D"},
  "correlation_id": "corr_01J9Z8F0A1B2C3D4",
  "payload": {}
}
```
Rules:
- `idempotency_key` is required. Scope is `(command, actor_ref, idempotency_key)`. Retention of the key-to-result record is 24 hours (A-availability-08).
- Same key and same payload hash returns the stored result with `"replayed": true`.
- Same key and different payload hash returns AVAILABILITY_IDEMPOTENCY_KEY_REUSED.
- `schema_version` major 1. Minor increments are additive only.

## Response envelope
Success: `{"ok": true, "data": {...}, "replayed": false}`.
Failure: `{"ok": false, "error": {"code": "AVAILABILITY_...", "retryable": false, "message_key": "...", "details": {...}}}`.
`message_key` is a localization key. Raw input is never returned.

## Commands
| Command | Caller | Signature (payload) | Result | Idempotent by key |
|---|---|---|---|---|
| availability.schedule.create | provider | `ScheduleCreate{service_offering_id, region_code, timezone, weekday_mask, blocks[], capacity_per_window}` | `Schedule` | yes |
| availability.schedule.pause | provider | `{schedule_id, expected_revision}` | `Schedule` | yes |
| availability.schedule.resume | provider | `{schedule_id, expected_revision}` | `Schedule` | yes |
| availability.schedule.archive | provider | `{schedule_id, expected_revision}` | `Schedule` | yes |
| availability.window.create | provider | `WindowCreate{service_offering_id, region_code, timezone, start_at, end_at, capacity_total, note?}` | `Window` (UNPUBLISHED) | yes |
| availability.window.publish | provider | `{window_id, expected_revision}` | `Window` (PUBLISHED) | yes |
| availability.window.update | provider | `{window_id, expected_revision, capacity_total?, note?}` | `Window` | yes |
| availability.window.withdraw | provider | `{window_id, expected_revision}` | `Window` (WITHDRAWN) | yes |
| availability.window.suspend | moderator or operator | `{window_id, suspension_code, reason_ref}` | `Window` (SUSPENDED) | yes |
| availability.window.lift | moderator or operator | `{window_id, expected_revision, reason_ref}` | `Window` | yes |
| availability.claim.hold | booking_service | `{window_id, claimant_ref, quantity}` | `Claim` (HELD) | yes |
| availability.claim.confirm | booking_service | `{claim_id, booking_ref}` | `Claim` (CONFIRMED) | yes |
| availability.claim.release | booking_service or claimant | `{claim_id, release_reason}` | `Claim` (RELEASED) | yes |

`reason_ref` is an opaque moderation case reference from the moderation feature. It contains no personal data here.

## Queries
| Query | Caller | Signature | Result |
|---|---|---|---|
| availability.window.search | viewer or any | `{region_code, service_offering_id, from_date, to_date, cursor?, limit<=100}` | page of PUBLISHED windows, public fields only |
| availability.window.get | viewer (public fields) or provider (owner fields) | `{window_id}` | `Window` |
| availability.schedule.list | provider | `{status?, cursor?, limit<=100}` | page of `Schedule` |
| availability.claim.get | booking_service | `{claim_id}` | `Claim` |

Public search returns `available` (boolean) and `remaining_bucket` (`0`, `1-2`, `3+`) instead of exact remaining counts, to limit inventory scraping.

## Request and response examples
Hold request:
```json
{"command":"availability.claim.hold","schema_version":"1.0.0","idempotency_key":"bkg-hold-7d2f0c91-a","actor":{"actor_type":"service","actor_ref":"svc_booking_01"},"correlation_id":"corr_01J9Z8G1","payload":{"window_id":"01J9Z4Q1M7X3B5N8C0D2E4F6G8","claimant_ref":"clm_01J9Z6B2C3D4E5F6G7H8J9K0N2","quantity":1}}
```
Hold response:
```json
{"ok":true,"data":{"claim_id":"01J9Z6B2C3D4E5F6G7H8J9K0M1","status":"HELD","window_id":"01J9Z4Q1M7X3B5N8C0D2E4F6G8","hold_expires_at":"2026-11-10T08:15:00Z","window_status":"PUBLISHED","window_remaining":1,"window_revision":5},"replayed":false}
```
Publish request:
```json
{"command":"availability.window.publish","schema_version":"1.0.0","idempotency_key":"pub-01J9Z4Q1M7X3B5N8-r3","actor":{"actor_type":"provider","actor_ref":"prov_01J9Z3K8QF7W2M4X6R0T5V8B2D"},"correlation_id":"corr_01J9Z8F0A1B2C3D4","payload":{"window_id":"01J9Z4Q1M7X3B5N8C0D2E4F6G8","expected_revision":3}}
```
Error response (capacity):
```json
{"ok":false,"error":{"code":"AVAILABILITY_CAPACITY_EXHAUSTED","retryable":false,"message_key":"availability.capacity_exhausted","details":{"window_id":"01J9Z4Q1M7X3B5N8C0D2E4F6G8","remaining":0}}}
```

## Events
Names: `availability.<aggregate>.<fact>.v<major>`. Every event carries the CTR-EVT-001 envelope fields: `event_id` (ULID), `aggregate_id`, `aggregate_type`, `revision`, `actor_ref`, `occurred_at`, `correlation_id`, `schema_version`, and `payload`. Delivery is at-least-once through the F15 outbox (A-availability-10). Consumers dedupe on `event_id`.

| Event | Emitted by | Payload keys |
|---|---|---|
| availability.schedule.created.v1 | schedule.create | schedule_id, provider_ref, service_offering_id, region_code |
| availability.schedule.paused.v1 | schedule.pause | schedule_id |
| availability.schedule.resumed.v1 | schedule.resume | schedule_id |
| availability.schedule.archived.v1 | schedule.archive | schedule_id, discarded_count |
| availability.window.created.v1 | window.create or materialization | window_id, schedule_id?, start_at, end_at |
| availability.window.published.v1 | window.publish | window_id, service_offering_id, region_code, start_at, end_at, capacity_total |
| availability.window.updated.v1 | window.update | window_id, changed_fields[] |
| availability.window.sold_out.v1 | hold or confirm leaving remaining 0 | window_id |
| availability.window.reopened.v1 | release or expiry restoring remaining | window_id, remaining_bucket |
| availability.window.withdrawn.v1 | window.withdraw | window_id |
| availability.window.suspended.v1 | window.suspend | window_id, suspension_code |
| availability.window.lifted.v1 | window.lift | window_id |
| availability.window.expired.v1 | sweeper | window_id |
| availability.claim.held.v1 | claim.hold | claim_id, window_id, quantity, hold_expires_at |
| availability.claim.confirmed.v1 | claim.confirm | claim_id, window_id, booking_ref |
| availability.claim.released.v1 | claim.release, withdrawal or expiry of window | claim_id, window_id, release_reason |
| availability.claim.expired.v1 | sweeper | claim_id, window_id |

Event payloads never include `timezone`, `note`, or any free text. `claimant_ref` appears only in claim events and only as the opaque reference.

## Schema versioning
- Command, query and event schemas are versioned as `major.minor.patch` in the envelope and `vN` in event names.
- Breaking change requires a new major version and a dual-publish period of at least 30 days, under CTR-SCH-001 (OPEN).
- Unknown fields are ignored within a major version (R-ENV-03).

## Requirements
- [ ] PS-028-04.R01: Every command in the table has a stated caller, payload signature, result type and idempotency key scope.
- [ ] PS-028-04.R02: Duplicate delivery, replay, out-of-order events and unknown schema versions are handled as stated. Covered by TEST-PS-028-04-T02 and T03.
- [ ] PS-028-04.R03: Queries return public fields only to non-owners. Covered by TEST-PS-028-04-T04.
- [ ] PS-028-04.R04: Every state-changing command publishes exactly one event on success, in the same transaction as the outbox row.
- [ ] PS-028-04.R05: Event names and payload keys are stable within a major version and listed here as the source of truth.

## Open decisions
- A-availability-08: 24-hour idempotency retention.
- A-availability-10: At-least-once outbox delivery from F15 (OPEN in CTR-EVT-001).
- The response envelope shape above is this module's current proposal and must be reconciled with CTR-ERR-001 when F15 expands it.
