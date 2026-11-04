# PS-104-06 — Failure recovery and idempotency: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-06.R01** Subscribe is idempotent on (userDid, endpoint hash) and send attempts are idempotent through the Topic header and per-attempt IDs.
- **PS-104-06.R02** Transient failures (429, 5xx, timeouts) retry with backoff and honor Retry-After, up to 3 attempts within 10 minutes; permanent failures never retry.
- **PS-104-06.R03** A relay restart loses no accepted sends because attempts are recorded before transmission and unfinished attempts are retried once on start.

## Specification

- **idempotency:** Relay commands require Idempotency-Key with 24 h replay window; subscribe is naturally idempotent on endpoint hash; send is deduplicated by (subscriptionId, tpl, ck) within 10 minutes and by the Topic header at the push service.
- **concurrency:** Each send updates counters with compare-and-set on revision in one SQLite transaction; concurrent subscribes for the same endpoint resolve through the unique index; the 10-subscription limit is checked inside the same transaction.
- **retries:** Backoff 5 s, 30 s, 120 s with jitter for 429 (honoring Retry-After up to 300 s), 5xx and network errors; 3 attempts maximum; 400, 401, 403 are not retried and raise operator alerts; 404 and 410 expire the subscription.
- **offline:** Subscriptions are created only online; sends are relay-side and do not depend on the vault being online; if the device is offline the push service stores the message for the TTL of 86 400 s (3 600 s for urgent security alerts) and drops it afterwards.
- **partial failure:** If a user has several subscriptions each is attempted independently and per-subscription outcomes are recorded; a failure on one device never affects others; if the push service is unreachable the in-app inbox is unaffected.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T05 | integration | PS-104-04.R02, PS-104-06.R02 | push service returns 429 with Retry-After 120 then 201 | one retry after 120 s, one notify.push.sent event, attempts recorded |
| TEST-PS-104-09.T08 | integration | PS-104-06.R01, PS-104-06.R03 | subscribe twice with same endpoint, send to user with 3 subscriptions where one returns 410 | one subscription; others delivered; failure isolated |
| TEST-PS-104-09.T09 | chaos | PS-104-06.R03 | relay restart mid-send | unfinished attempts retried once; no duplicate beyond Topic collapse |
| TEST-PS-104-09.T11 | abuse | PS-104-07.R03, PS-104-06.R02 | VAPID rejected 401 | operator alert raised, no subscription expired, sends paused 15 minutes |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
