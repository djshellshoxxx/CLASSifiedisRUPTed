# PS-104-09 — Contract and acceptance tests: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-104-09.R02** Protocol tests use a fake push service that decrypts RFC 8291 messages and validates RFC 8030 and RFC 8292 headers.
- **PS-104-09.R03** Contract tests check commands, events and payload shape against the schema registry.
- **PS-104-09.R04** The screens listed under ux meet the listed a11y items, verified by an axe scan with zero serious issues and a keyboard and screen-reader walk-through.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay R with VAPID key vapid-2026-11 in a test RelayKeyStorePort, fake push service P on an allowlisted test origin accepting aes128gcm, fake DNS resolver, F16.S02.M02 registry double with active and revoked device keys, users U1 and U2 with registered push consent, browser key pairs from fixed seeds, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T01 | unit | PS-104-01.R01, PS-104-01.R02, PS-104-02.R01 | subscribe with valid and malformed sealed bodies | valid stored with secret encrypted and pushOrigin set; malformed refused VALIDATION_FAILED; secrets absent from every query |
| TEST-PS-104-09.T02 | unit | PS-104-02.R03, PS-104-02.R01 | each rule V01 to V10 violated in turn including an off-allowlist origin, private-IP endpoint and 11th subscription | documented error code returned and nothing stored or sent |
| TEST-PS-104-09.T03 | contract | PS-104-01.R03, PS-104-02.R02, PS-104-04.R01, PS-104-09.R02, PS-104-09.R03 | send a sealed, a hook and a digest payload; run every command, query and event of this module | fake push service decrypts exactly the keys of each form; headers TTL, Urgency, Topic and Content-Encoding aes128gcm; VAPID JWT valid ES256 with exp ≤ 12 h; inputs, outputs and event payloads validate against the schema registry entries |
| TEST-PS-104-09.T04 | property | PS-104-03.R01, PS-104-03.R02 | random sequences of subscribe, send outcomes (201, 401, 403, 404, 410, 429, 500) and unsubscribe | expired and revoked never change; 410 expires at once; 5 failures over 24 h expire; 401 and 403 affect only that subscription |
| TEST-PS-104-09.T05 | integration | PS-104-04.R02, PS-104-06.R02 | push service returns 429 with Retry-After 120 then 201 | one retry after 120 s, one notify.push.sent with form and no tpl for sealed, attempts recorded |
| TEST-PS-104-09.T06 | integration | PS-104-04.R03, PS-104-03.R03, PS-104-01.R02 | relay-local notify.channel.opted_out for push, security.key.revoked with purpose vapid and relationship relay_owned, and security.key.revoked with purpose device_signing delivered to the relay instance; vault-local opted_out to the vault instance | relay subscriptions revoked or expired with secrets erased in the same transaction without any key status lookup; vault target disabled and PushManager.unsubscribe called |
| TEST-PS-104-09.T07 | abuse | PS-104-05.R01, PS-104-05.R02, PS-104-05.R03 | send called by an external client; subscribe signed by an unknown key; list by another user; inspect the relay database and key store | refused or NOT_FOUND; no private key or endpoint exposed; VAPID private key only in RelayKeyStorePort |
| TEST-PS-104-09.T08 | integration | PS-104-06.R01, PS-104-06.R03 | subscribe twice with the same endpoint; send to a user with 3 subscriptions where one returns 410 | one subscription; others delivered; failure isolated |
| TEST-PS-104-09.T09 | chaos | PS-104-06.R03 | relay restart mid-send | unfinished attempts retried once; no duplicate beyond Topic collapse |
| TEST-PS-104-09.T10 | abuse | PS-104-07.R01, PS-104-07.R02, PS-104-07.R03, PS-104-07.R04 | inspect database, logs, events and metrics; endpoint at 169.254.169.254; an allowlisted host re-resolving to 10.0.0.5 at send time (DNS rebinding); a redirecting endpoint | no endpoint, topic key or payload outside encrypted storage; each blocked endpoint refused with NOTIFY_PUSH_ENDPOINT_REJECTED without a connection |
| TEST-PS-104-09.T11 | abuse | PS-104-06.R04, PS-104-07.R04 | an attacker endpoint returns 401 to every send; then subscriptions of 5 distinct users on one allowlisted origin return 403 within 5 minutes | first case only the attacker's subscription accrues failures and others keep sending; second case operator alert and a 15-minute pause for that origin only |
| TEST-PS-104-09.T12 | load | PS-104-08.R01, PS-104-08.R02, PS-104-08.R03 | 200 pushes per second for 5 minutes to the fake service with an injected multi-user rejection | p95 ≤ 500 ms, metrics exported, origin pause alert fires |
| TEST-PS-104-09.T13 | unit | PS-104-09.R01 | traceability tool run | every PS-104 requirement maps to a passing test |
| TEST-PS-104-09.T14 | integration | PS-104-10.R01, PS-104-10.R02, PS-104-10.R03 | export from the vault, restore the relay from backup, vault import into a fresh device, scheduled VAPID rotation | export has push targets without endpoints; restored subscriptions are probed or expired; import rebuilds the relay copy only after confirmation; old-key subscriptions keep working 30 days then expire |
| TEST-PS-104-09.T15 | a11y | PS-104-09.R04 | push settings, permission explainer and re-enable banner with screen reader and keyboard | controls labelled with the device name, explainer read before the prompt, result announced, zero serious axe issues |
| TEST-PS-104-09.T16 | contract | PS-104-02.R04, PS-104-07.R01 | property over 10 000 collapse tags of 1..64 valid characters and two users with the same tag | every Topic matches ^[A-Za-z0-9_-]{1,32}$; the two users' Topics differ; no Topic equals or contains the tag |
| TEST-PS-104-09.T17 | abuse | PS-104-05.R04, PS-104-03.R03 | device key K is revoked in F16.S02.M02; K then signs subscribe, list and unsubscribe; a request signed before revocationEffectiveFrom arrives late | the subscription created by K is revoked; every later request refused UNAUTHENTICATED; the late pre-revocation request is refused because the key is no longer active |
| TEST-PS-104-09.T18 | unit | PS-104-01.R04, PS-104-03.R04, PS-104-04.R04 | enable, disable and expiry discovered by list_mine in the vault; inspect the push target record and the outgoing request | target moves pending, active, then disabled or expired; record holds no endpoint or keys; subscribe body is sealed and the request carries no device label |
| TEST-PS-104-09.T19 | integration | PS-104-01.R05, PS-104-04.R05, PS-104-05.R03 | operator rotates the VAPID key; DeletionPort plan and purge, export section and retention purge with F10 registry doubles | new key registered with purpose vapid in F16.S02.M02; private key never leaves RelayKeyStorePort; purge removes targets and calls PushManager.unsubscribe; section notify.push exported; targets purged 30 days after endedAt |
| TEST-PS-104-09.T21 | e2e | PS-104-07.R02, PS-104-07.R03 | open the permission explainer and the push settings before and after enabling | text names the relay that receives the endpoint, says the push service sees only an opaque topic and can link the endpoint to the browser vendor, and that the relay links the pseudonym to the endpoint |
| TEST-PS-104-09.T20 | contract | PS-104-04.R05, PS-104-02.R01 | enable with privacy.consent.check returning not granted, and with the channel consent not yet registered; 11th subscribe call in a day | PRECONDITION_FAILED before any browser prompt; RATE_LIMITED from RateLimitPort |
| TEST-PS-104-09.T22 | chaos | PS-104-06.R05, PS-104-04.R04 | restore the relay from a backup taken before a push withdrawal and a device-key revocation, with archived notify.channel.opted_out and security.key.revoked events in the replay range; then send to the user; verify a subscribe request against the F11.S01.M03 RFC 9421 vectors | the restore report lists this module's consumers as excluded; no event is re-delivered to them and no push is sent twice; the withdrawn and revoked-key subscriptions are revoked with secrets erased before the first send; the request signature verifies with tag classrup/relay-request/v1 |

## Acceptance criteria

- All tests T01 to T22 pass in CI.
- Decrypted push payloads in tests contain only the keys of the sealed, hook or digest form and never text, names or amounts, and sealed boxes open only on the target device.
- Endpoints, keys and topic keys never appear in logs, events, exports or query results, and the vault record never holds them.
- VAPID JWT expiry is at most 12 hours and signed with ES256 in all tests, and the VAPID private key exists only in RelayKeyStorePort.

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F16.S02.M01, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
