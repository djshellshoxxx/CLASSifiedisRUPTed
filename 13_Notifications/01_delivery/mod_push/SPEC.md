# F13.S01.M01 — Web push delivery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S01](../SPEC.md). **Process IDs:** PS-104-01…PS-104-10. **Code:** `packages/notify/src/delivery/push`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Web Push delivery through a relay the user selected. The vault holds the authoritative push target record for each device (relay, device key, label, enabled flag, relay subscription reference and status mirror); the browser holds the endpoint and keys. The relay holds only a disclosed service copy of the subscription (RFC 8030 endpoint plus RFC 8291 keys), disclosed under the CTR-PRV-001 PRV-10 notification channel exception: sent sealed to the relay key under the granted notify_push consent, stored P3-equivalent by that one relay and erased when the withdrawal is registered there. The relay owns its VAPID key pair (RFC 8292) through RelayKeyStorePort and registers the public key with purpose vapid in F16.S02.M02. Payloads are content-free: a sealed box the relay cannot open for vault-originated alerts, a hook payload with only data the relay hook already holds, or a digest count; the Topic header is an opaque per-subscription HMAC. Subscriptions are created only after a registered channel consent (F13.S02.M03), expire on 404 and 410, and sends are gated by F13.S02.M01. Without a relay that offers push the feature is disabled and in-app notifications still work.

## Responsibilities

- Own the vault push target record (classrup.notify.push_target/v1) per device and the relay PushSubscription service copy (classrup.notify.push_subscription/v1) with their lifecycles; the vault record is authoritative and the relay copy is rebuilt from it.
- Run the vault commands enable and disable that drive the browser PushManager, check privacy.consent.check for notify_push and the registered channel consent, seal the subscription to the relay key and call the relay.
- Accept sealed subscribe, unsubscribe and list requests signed with the F11.S01.M03 RFC 9421 profile (tag classrup/relay-request/v1) by a device key that F16.S02.M02 reports active, and serve the public VAPID key.
- Own VAPID private-key storage and rotation through RelayKeyStorePort and register each VAPID public key with purpose vapid in F16.S02.M02.
- Send payloads with web-push 3.6.7 using a VAPID JWT (ES256, 12 h expiry), aes128gcm encryption, TTL, Urgency and an opaque Topic header, to allowlisted push-service origins only, with the endpoint address re-resolved and re-checked on every send.
- Handle push service responses (201, 404, 410, 413, 429, 5xx, 400, 401, 403) per subscription, and pause an origin only on a multi-user VAPID rejection pattern.
- Emit relay-local notify.push.sent and notify.push.failed per attempt outcome without endpoint, collapse key, reference or user content.

## Not responsible for

- Deciding whether to send now or later, the urgent bypass and what to seal (F13.S02.M01), and channel consent and its registration (F13.S02.M03).
- Choosing what an alert says; the service worker opens the sealed box or reads the hook template key and renders local text with t() (F14.S02.M01), and routing happens in F13.S01.M03.
- Email (F13.S01.M02) and the in-app inbox (F13.S01.M03).
- Key status, revocation lists and the registry of the VAPID public key (F16.S02.M02); device key labels (F07.S01.M01 device keys), which the vault joins locally and never sends to the relay.
- Blocks (N7) do not apply because this module never acts on counterparty statements; block filtering happens in routing (F13.S01.M03).
- Future: Declarative Web Push, per-device payload localization, native app tokens (APNs, FCM) behind a provider port.

## User stories

- As a member, I can enable push on my phone for the relay I chose and I see which relay will send alerts and what it learns.
- As a member, I get an alert that says only that something needs my attention and tapping it opens the right screen inside the app.
- As a member, I can disable push on one device without touching my other devices.
- As a member whose phone was stolen, I revoke its device key and its push subscription stops at once.
- As a relay operator, I can see that subscriptions expire automatically and that no content passes through my push sends.

## Edge cases

- Browser reports a subscription expiration time; the relay stores it and stops sending after that time.
- Push service returns 410 Gone; the subscription is expired at once and the vault learns it from notify.push.list_mine on next open and shows Re-enable push.
- Push service returns 429 with Retry-After 120; the send is retried once after the delay, then dropped with outcome throttled.
- Payload would exceed 1 024 bytes because of a long sealed box; it is rejected as a programmer error and never truncated.
- One subscription's endpoint returns 401 or 403; only that subscription's failure counter increments and sending to every other subscription continues.
- Subscriptions of 5 distinct users on fcm.googleapis.com are rejected with 403 within 5 minutes; the relay raises an operator alert and pauses sends to that origin only for 15 minutes.
- An attacker registers an endpoint on their own server; subscribe is refused with NOTIFY_PUSH_ENDPOINT_REJECTED because the origin is not on the push-service allowlist.
- The DNS name of an allowlisted endpoint later resolves to 10.0.0.5 (rebinding); the send is refused before connecting and counted as a failure of that subscription.
- Same user has 10 subscriptions and tries an 11th; the oldest unused subscription is replaced after explicit confirmation, otherwise NOTIFY_PUSH_SUBSCRIPTION_LIMIT.
- User revokes browser notification permission; the next send returns 410 or 404 and the subscription expires.
- The device key that created a subscription is revoked; the relay revokes that subscription and refuses later subscribe, unsubscribe and list requests signed by the key with UNAUTHENTICATED.
- Relay rotates its VAPID key; existing subscriptions keep working with the retained old key for up to 30 days while vaults re-subscribe on open; a compromised key is revoked at once and its subscriptions expire.

## UX and accessibility

- Push settings: relay name, per-device list with the device label known to this vault, last success time, Enable on this device, Disable, and test notification button.
- Permission prompt explainer shown before the browser prompt: the relay receives this browser's push endpoint (sealed in transit, encrypted at rest, erased when you turn push off), the push service sees only an opaque topic, alerts are content-free, and how to turn it off.
- Re-enable banner when a subscription expired, and a note that while the vault is locked alerts show only generic text.

**States:** loading; not-supported; permission-default; permission-denied; subscribing; active; expired-reenable; relay-unavailable; offline

**Accessibility:** Settings controls are native buttons and switches with labels that include the device name.; The permission explainer is plain text read before the browser prompt, and failure states have text instructions.; Test notification result is announced in a polite live region.

## Owned data

- `PushSubscription` (classrup.notify.push_subscription/v1, P3, RET-STANDARD)
- `PushSubscription` (classrup.notify.push_target/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `notify.push.enable`, `notify.push.disable`, `notify.push.subscribe`, `notify.push.unsubscribe`, `notify.push.send`, `notify.push.rotate_key`
- Queries: `notify.push.get_key`, `notify.push.list_mine`, `notify.push.get_local`
- Emits: `notify.push.sent`, `notify.push.failed`
- Consumes: `notify.channel.opted_out`, `notify.channel.opted_in`, `security.key.revoked`, `privacy.deletion.completed`

## Dependencies

F13.S02.M03, F16.S02.M02, F16.S02.M01, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-104-01 | [Domain schema](domain_schema.md) | 5 |
| PS-104-02 | [Validation rules](validation_rules.md) | 4 |
| PS-104-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-104-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-104-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-104-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 5 |
| PS-104-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-104-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-104-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-104-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/delivery/push/index.ts`.

## Acceptance criteria

- All tests T01 to T22 pass in CI.
- Decrypted push payloads in tests contain only the keys of the sealed, hook or digest form and never text, names or amounts, and sealed boxes open only on the target device.
- Endpoints, keys and topic keys never appear in logs, events, exports or query results, and the vault record never holds them.
- VAPID JWT expiry is at most 12 hours and signed with ES256 in all tests, and the VAPID private key exists only in RelayKeyStorePort.
