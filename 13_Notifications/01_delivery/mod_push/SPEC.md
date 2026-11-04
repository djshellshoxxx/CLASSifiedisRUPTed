# F13.S01.M01 — Web push delivery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S01](../SPEC.md). **Process IDs:** PS-104-01…PS-104-10. **Code:** `packages/notify/src/delivery/push`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Web Push delivery through a user-selected relay. The relay owns the VAPID key pair (RFC 8292), stores the user's browser push subscriptions (RFC 8030 endpoint plus RFC 8291 encryption keys) and sends content-free payloads: a reference, a template key, a collapse key and a version, encrypted for the browser with aes128gcm. The push service and the operator never receive message text, names or amounts. Subscriptions are created only after channel consent (F13.S02.M03), expired on 404 and 410 responses, and sends are gated by F13.S02.M01. Without a relay that offers push the feature is disabled and in-app notifications still work.

## Responsibilities

- Own the PushSubscription record at the relay (endpoint, p256dh key, auth secret, status, failure counters) and its lifecycle.
- Expose the relay VAPID public key and accept signed subscribe and unsubscribe requests from registered device keys, with the vault command that obtains the subscription from the browser PushManager.
- Send payloads with web-push 3.6.7 using VAPID JWT (ES256, 12 h expiry), aes128gcm encryption, TTL, Urgency and Topic headers, with content-free JSON of at most 1 024 bytes.
- Handle push service responses (201, 404, 410, 413, 429, 5xx, 400, 401, 403) with expiry, retry and alerting rules.
- Emit notify.push.sent and notify.push.failed per attempt outcome without endpoint or user content in the payload.

## Not responsible for

- Deciding whether to send now or later and the urgent bypass (F13.S02.M01) and consent (F13.S02.M03).
- Choosing what an alert says; the service worker renders local text from the template key and the vault's own data (F13.S01.M03 and F14 localization).
- Email (F13.S01.M02) and the in-app inbox (F13.S01.M03).
- Relay-owned VAPID private key storage and rotation operations (F16.S02.M01 key lifecycle for relay keys).
- Future: Declarative Web Push, per-device payload localization, native app tokens (APNs, FCM) behind a provider port.

## User stories

- As a member, I can enable push on my phone for the relay I chose and I see which relay will send alerts.
- As a member, I get an alert that says only that something needs my attention and tapping it opens the right screen inside the app.
- As a member, I can disable push on one device without touching my other devices.
- As a relay operator, I can see that subscriptions expire automatically and that no content passes through my push sends.

## Edge cases

- Browser reports a subscription expiration time; the relay stores it and stops sending after that time.
- Push service returns 410 Gone; the subscription is marked expired at once and the vault is told to prompt re-enabling on next open.
- Push service returns 429 with Retry-After 120; the send is retried once after the delay, then dropped with outcome throttled.
- Payload would exceed 1 024 bytes because of a long reference; it is rejected as a programmer error and never truncated.
- VAPID JWT is rejected with 401 or 403; the relay raises an operator alert, does not expire subscriptions and stops sending for 15 minutes.
- Same user has 10 subscriptions and tries an 11th; the oldest unused subscription is replaced after explicit confirmation, otherwise PUSH_SUBSCRIPTION_LIMIT.
- User revokes browser notification permission; the next send returns 410 or 404 and the subscription expires.
- Relay rotates its VAPID key; existing subscriptions bound to the old key stop working and the vault re-subscribes on next open, which is shown as Re-enable push.

## UX and accessibility

- Push settings: relay name, per-device list with device label, last success time, Enable on this device, Disable, and test notification button.
- Permission prompt explainer shown before the browser prompt: what the relay sees (push endpoint), that alerts are content-free, how to turn it off.
- Re-enable banner when a subscription expired.

**States:** loading; not-supported; permission-default; permission-denied; subscribing; active; expired-reenable; relay-unavailable; offline

**Accessibility:** Settings controls are native buttons and switches with labels that include the device name.; The permission explainer is plain text read before the browser prompt, and failure states have text instructions.; Test notification result is announced in a polite live region.

## Owned data

- `PushSubscription` (classrup.notify.push_subscription/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `notify.push.enable`, `notify.push.subscribe`, `notify.push.unsubscribe`, `notify.push.send`
- Queries: `notify.push.get_key`, `notify.push.list_mine`
- Emits: `notify.push.sent`, `notify.push.failed`
- Consumes: `notify.channel.opted_out`, `notify.channel.opted_in`, `security.key.revoked`

## Dependencies

F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-104-01 | [Domain schema](domain_schema.md) | 3 |
| PS-104-02 | [Validation rules](validation_rules.md) | 3 |
| PS-104-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-104-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-104-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-104-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-104-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-104-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-104-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-104-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/delivery/push/index.ts`.

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- Decrypted push payloads in tests contain only the keys v, ref, tpl, ck and urg and never text, names or amounts.
- Endpoints and keys never appear in logs, events, exports or query results.
- VAPID JWT expiry is at most 12 hours and signed with ES256 in all tests.
