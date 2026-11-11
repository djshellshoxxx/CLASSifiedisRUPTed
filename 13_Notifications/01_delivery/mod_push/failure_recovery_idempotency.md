# PS-104-06 — Failure recovery and idempotency: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-06.R01** Subscribe is idempotent on (userDid, endpointHash) and send attempts are idempotent per (subscriptionId, dispatch reference) and collapse at the push service through the opaque Topic header.
- **PS-104-06.R02** Transient failures (429, 5xx, timeouts) retry with backoff and honor Retry-After, up to 3 attempts within 10 minutes; permanent failures never retry.
- **PS-104-06.R03** A relay restart loses no accepted sends because attempts are recorded before transmission and unfinished attempts are retried once on start.
- **PS-104-06.R04** Sending to a push-service origin pauses for 15 minutes only when subscriptions of at least 5 distinct users on that allowlisted origin are rejected with 401 or 403 within 5 minutes, which indicates a VAPID problem; a single subscription's rejection never pauses sends to others.
- **PS-104-06.R05** Every event consumer of this module is registered with externalSideEffects true, so F15.S03.M03 restore re-delivery excludes it (V11) and no push is sent twice after a relay restore; instead, before the first send after a restore, the relay revokes every subscription whose push consent is not granted in the restored registrations or whose createdByKeyId F16.S02.M02 reports revoked, erasing its secret.

## Specification

- **idempotency:** Relay commands require Idempotency-Key with a 24 h replay window; subscribe is naturally idempotent on endpointHash for the user; send is deduplicated by (subscriptionId, collapseTag) within 10 minutes and by the Topic header at the push service; enable and disable are idempotent on the push target.
- **concurrency:** Each send updates counters with compare-and-set on revision in one SQLite transaction; concurrent subscribes for the same endpoint resolve through the unique index; the 10-subscription limit is checked inside the same transaction; in the vault two tabs serialize enable and disable with a Web Lock per relay.
- **retries:** Backoff 5 s, 30 s, 120 s with jitter for 429 (honoring Retry-After up to 300 s), 5xx and network errors; 3 attempts maximum; 400 is not retried; 401 and 403 count as a failure of that subscription and are not retried; 404 and 410 expire the subscription; the origin pause applies only on the multi-user rejection pattern.
- **offline:** Subscriptions are created only online; disable works offline, unsubscribes the browser at once and queues the relay unsubscribe in the sync outbox; sends are relay-side; if the device is offline the push service stores the message for the TTL of 86 400 s (3 600 s for urgent security alerts) and drops it afterwards.
- **partial failure:** Each of a user's subscriptions is attempted independently and per-subscription outcomes are recorded; a failure on one device never affects others; if the push service is unreachable the in-app inbox is unaffected; if the relay lost its copy the vault rebuilds it from the push target record after user confirmation.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T05 | integration | PS-104-04.R02, PS-104-06.R02 | push service returns 429 with Retry-After 120 then 201 | one retry after 120 s, one notify.push.sent with form and no tpl for sealed, attempts recorded |
| TEST-PS-104-09.T08 | integration | PS-104-06.R01, PS-104-06.R03 | subscribe twice with the same endpoint; send to a user with 3 subscriptions where one returns 410 | one subscription; others delivered; failure isolated |
| TEST-PS-104-09.T09 | chaos | PS-104-06.R03 | relay restart mid-send | unfinished attempts retried once; no duplicate beyond Topic collapse |
| TEST-PS-104-09.T11 | abuse | PS-104-06.R04, PS-104-07.R04 | an attacker endpoint returns 401 to every send; then subscriptions of 5 distinct users on one allowlisted origin return 403 within 5 minutes | first case only the attacker's subscription accrues failures and others keep sending; second case operator alert and a 15-minute pause for that origin only |
| TEST-PS-104-09.T22 | chaos | PS-104-06.R05, PS-104-04.R04 | restore the relay from a backup taken before a push withdrawal and a device-key revocation, with archived notify.channel.opted_out and security.key.revoked events in the replay range; then send to the user; verify a subscribe request against the F11.S01.M03 RFC 9421 vectors | the restore report lists this module's consumers as excluded; no event is re-delivered to them and no push is sent twice; the withdrawn and revoked-key subscriptions are revoked with secrets erased before the first send; the request signature verifies with tag classrup/relay-request/v1 |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F16.S02.M01, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
