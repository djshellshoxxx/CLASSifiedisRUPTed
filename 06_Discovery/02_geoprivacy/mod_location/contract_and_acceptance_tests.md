# PS-048-09 — Contract and acceptance tests: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-09.R01** Every requirement is covered by at least one automated test with an injected clock and a fake geolocation provider.
- **PS-048-09.R02** Contract tests check statements and events against the schema registry.
- **PS-048-09.R03** Privacy tests prove that no raw coordinates, L3 or L4 data appears in logs, events other than the share events, exports of others, or relay requests in readable form.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P with DID, counterparties Q and R, fake geolocation returning 57.64911,10.40744, fake consent port, fake F11 record intake, fake relay mailbox, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T01 | unit | PS-048-01.R01, PS-048-02.R01 | set home from GPS once with level L1 and consent granted | stored homeCell5 u4pru, publicCell u4pr (assertPublicCell passed), raw coordinates absent from storage |
| TEST-PS-048-09.T02 | unit | PS-048-02.R01 | 6-character cell, level L3, and a 4th change within 24 h without and with confirmFrequentChange | DISCOVERY_PRECISION_FORBIDDEN with nothing stored; DISCOVERY_HOME_CHANGE_CONFIRM_REQUIRED, then saved after confirmation |
| TEST-PS-048-09.T03 | unit | PS-048-01.R02, PS-048-02.R02, PS-048-03.R01 | grant share ttl 2 h, then ttl 25 h, 20 min, and a blocked recipient | first succeeds; others return DISCOVERY_SHARE_TTL_INVALID or BLOCKED_PARTY |
| TEST-PS-048-09.T04 | property | PS-048-01.R03, PS-048-03.R01, PS-048-03.R02, PS-048-03.R03 | random sequences of grant, revoke, block, expiry on one share | only declared transitions succeed; ciphertext and per-share key are absent in every ended state |
| TEST-PS-048-09.T05 | contract | PS-048-04.R01, PS-048-04.R02, PS-048-09.R02 | each command and event runs | outputs, statements and event payloads validate against registry schemas; old alias names accepted |
| TEST-PS-048-09.T06 | integration | PS-048-04.R03 | block added, meetup cancelled, deal cancelled, deal completed and thread archived events delivered | affected shares end with reasons blocked and context_cancelled |
| TEST-PS-048-09.T07 | abuse | PS-048-02.R03, PS-048-05.R01, PS-048-05.R03 | incoming share with a bad signature, wrong addressee, claimed expiry 5 days ahead, a record F11 did not accept, and one from a blocked sender | rejected, clamped to receipt time plus 24 h, or ignored; the blocked sender's statement is dropped silently and quarantined with no UI trace |
| TEST-PS-048-09.T08 | abuse | PS-048-05.R02, PS-048-07.R01, PS-048-07.R02 | inspect relay-visible bytes, logs, events, and export of another user | only ciphertext visible to relay; no coordinates in logs or events; no shares in others' exports |
| TEST-PS-048-09.T09 | integration | PS-048-06.R01, PS-048-06.R02, PS-048-06.R03 | grant offline, replay same key, deliver later, revoke offline, recipient acknowledges | one share and one statement; UI states follow local_committed, prepared, transport_acknowledged; peer_accepted only after the recipient vault's signed peer acknowledgement; local expiry works with no network |
| TEST-PS-048-09.T10 | abuse | PS-048-02.R02 | 11 grants in one hour and 21 incoming shares from one DID | RATE_LIMITED from RateLimitPort on the 11th grant; excess incoming quarantined |
| TEST-PS-048-09.T11 | integration | PS-048-08.R03 | expiry with the clock advanced past effectiveExpiresAt while app open and after unlock | share ended within 30 s or before the first read |
| TEST-PS-048-09.T12 | a11y | PS-048-07.R03 | location settings and share sheet with axe-core and keyboard-only map alternative | zero serious or critical violations, list alternative works, warning about copies on the other device is visible text and announced |
| TEST-PS-048-09.T13 | unit | PS-048-09.R01, PS-048-09.R03 | traceability run over PS-048 | every requirement maps to a passing test |
| TEST-PS-048-09.T14 | integration | PS-048-10.R01, PS-048-10.R02, PS-048-10.R03 | export then import in a fresh vault; import a vault with an expired share | LocationSetting round-trips; shares are never exported or imported |
| TEST-PS-048-09.T15 | integration | PS-048-04.R04, PS-048-02.R03 | verified revoke for an active incoming share; revoke arriving before its grant; revoke signed by R for Q's share | share ended and per-share key deleted; pending marker stored and the later grant refused with CONFLICT_STATE; DISCOVERY_SHARE_SIGNATURE_INVALID and quarantined |
| TEST-PS-048-09.T16 | abuse | PS-048-02.R02, PS-048-06.R01 | grant replayed from a relay mailbox 30 h after the share ended and its record was purged; claimedIssuedAt 11 minutes ahead; claimedExpiresAt before receipt; outgoing mailbox put inspected | refused by the 8-day ended marker; DISCOVERY_SHARE_TIME_INVALID; EXPIRED; mailbox expiresAt equals claimedExpiresAt |
| TEST-PS-048-09.T17 | integration | PS-048-05.R04 | grant L4 and set_home with device_gps_once while location_precise consent is not granted, then after inline consent | PRECONDITION_FAILED with nothing stored; both succeed after consent |
| TEST-PS-048-09.T18 | integration | PS-048-07.R04 | deletion requested, then cancelled; a second request executed; export run | shares end with reason erased and LocationSetting is kept after the cancelled request; the setting is deleted only when the DeletionPort plan executes; export has section discovery.location_setting; every field classified |
| TEST-PS-048-09.T19 | load | PS-048-08.R02 | 1 000 set_home and 1 000 grant calls on the reference Moto G-class device | set_home p95 <= 100 ms and grant p95 <= 300 ms excluding transport |
| TEST-PS-048-09.T20 | abuse | PS-048-08.R01 | network capture during set_home, grant, revoke, receive and expiry | no telemetry or analytics request; the only network traffic is sealed statements through the outbox |
| TEST-PS-048-09.T21 | unit | PS-048-01.R03, PS-048-07.R01 | end a share, then try to decrypt the stored ciphertext; scan IndexedDB, logs and events after a GPS-once | per-share key absent from the keystore and decryption fails; no raw point stored or logged |

## Acceptance criteria

- All tests T01-T21 pass in CI.
- No location finer than L2 appears in any public projection, event class below P3, log or relay-readable payload.
- Every share ends by expiry or revocation locally within 30 seconds with its per-share key deleted, and the UI states what the other device may still hold.

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
