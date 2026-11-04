# PS-104-09 — Contract and acceptance tests: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-104-09.R02** Protocol tests use a fake push service that decrypts RFC 8291 messages and validates RFC 8030 and RFC 8292 headers.
- **PS-104-09.R03** Contract tests check commands, events and payload shape against the schema registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay R with VAPID key vapid-2026-11, fake push service P accepting aes128gcm, user U with granted push consent, browser key pairs generated from fixed seeds, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T01 | unit | PS-104-01.R01, PS-104-01.R02, PS-104-01.R03, PS-104-02.R01, PS-104-02.R02 | subscribe with valid and malformed endpoint and keys | valid stored encrypted; invalid refused VALIDATION_FAILED; secrets absent from queries |
| TEST-PS-104-09.T02 | unit | PS-104-02.R03, PS-104-02.R01 | each rule V01 to V08 violated in turn including private-IP endpoint and 11th subscription | documented error code returned and nothing stored |
| TEST-PS-104-09.T03 | contract | PS-104-01.R03, PS-104-04.R01, PS-104-09.R02 | send a normal offers alert | fake push service decrypts payload with only keys v, ref, tpl, ck, urg; headers TTL 86400, Urgency normal, Topic, Content-Encoding aes128gcm; VAPID JWT valid ES256 with exp ≤ 12 h |
| TEST-PS-104-09.T04 | property | PS-104-03.R01, PS-104-03.R02, PS-104-03.R03 | random sequences of subscribe, send outcomes (201, 404, 410, 429, 500), unsubscribe, consent withdrawal | expired and revoked never change; 410 expires at once; 5 failures over 24 h expire |
| TEST-PS-104-09.T05 | integration | PS-104-04.R02, PS-104-06.R02 | push service returns 429 with Retry-After 120 then 201 | one retry after 120 s, one notify.push.sent event, attempts recorded |
| TEST-PS-104-09.T06 | integration | PS-104-04.R03, PS-104-03.R03 | channel opted out and VAPID key revoked events delivered | subscriptions revoked or expired and secrets erased |
| TEST-PS-104-09.T07 | abuse | PS-104-05.R01, PS-104-05.R02, PS-104-05.R03 | send called by external client; subscribe signed by unknown key; list by another user; inspect key store | refused; no private key or endpoint exposed |
| TEST-PS-104-09.T08 | integration | PS-104-06.R01, PS-104-06.R03 | subscribe twice with same endpoint, send to user with 3 subscriptions where one returns 410 | one subscription; others delivered; failure isolated |
| TEST-PS-104-09.T09 | chaos | PS-104-06.R03 | relay restart mid-send | unfinished attempts retried once; no duplicate beyond Topic collapse |
| TEST-PS-104-09.T10 | abuse | PS-104-07.R01, PS-104-07.R02, PS-104-07.R03 | inspect database, logs, events and metrics; SSRF endpoint attempts to 169.254.169.254 and redirects | no endpoint or payload outside encrypted storage; SSRF blocked |
| TEST-PS-104-09.T11 | abuse | PS-104-07.R03, PS-104-06.R02 | VAPID rejected 401 | operator alert raised, no subscription expired, sends paused 15 minutes |
| TEST-PS-104-09.T12 | load | PS-104-08.R01, PS-104-08.R02, PS-104-08.R03 | 200 pushes per second for 5 minutes to fake service | p95 ≤ 500 ms, metrics exported, alert rule fires on injected VAPID rejection |
| TEST-PS-104-09.T13 | unit | PS-104-09.R01, PS-104-09.R03 | traceability tool run | every PS-104 requirement maps to a passing test |
| TEST-PS-104-09.T14 | integration | PS-104-10.R01, PS-104-10.R02, PS-104-10.R03 | export from vault, restore relay from backup, rotate VAPID key | export has no endpoints; restored subscriptions are re-verified or expired; rotation expires old-key subscriptions |
| TEST-PS-104-09.T15 | a11y | PS-104-04.R01 | push settings and permission explainer with screen reader and keyboard | controls labelled, states announced, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- Decrypted push payloads in tests contain only the keys v, ref, tpl, ck and urg and never text, names or amounts.
- Endpoints and keys never appear in logs, events, exports or query results.
- VAPID JWT expiry is at most 12 hours and signed with ES256 in all tests.

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
