# PS-105-07 — Privacy, retention and abuse: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-07.R01** The schedule reveals sleep rhythm and a time zone region, so it is P2, mirrored only as the canonical zone to relays where the user holds a registered push or email consent, and deleted there as soon as the last such consent at that relay ends.
- **PS-105-07.R02** No location is read to choose the time zone; the default is the browser setting and the user can change it.
- **PS-105-07.R03** The schedule is never part of notification payloads, and the changed event carries neither the time zone nor the windows.

## Specification

**Data classification**
- QuietHoursSchedule vault record: P2; vault authoritative.
- Relay copy: P2 for the consented relay only; canonical zone, windows and tzdata version per device chain.

**Retention**
- Vault: RET-STANDARD until deletion.
- Relay copy: deleted at once when no granted push or email consent of the user remains at that relay.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay operator infers sleep schedule and region | mirror only to consented relays with the canonical zone, disclosed in the settings screen, deleted when consent ends, user can choose a self-hosted relay or disable quiet hours and rely on in-app only |
| T02 | Attacker sets quiet hours to mute victim's notifications | only the vault can edit; mirror needs an active device-key signature; security alerts bypass quiet hours |
| T03 | DST error causes alerts at night or missed alerts | boundary tests across 12 zones and 24 transitions with a reference implementation; tzdata version pinned and recorded |
| T04 | Replay of an old mirror or a forked chain changes the schedule | seq and prev chain per device key, fork refused with CONFLICT_STATE |
| T05 | A single-municipality zone locates the user more precisely than L2 | canonical rule-equivalent zone covering at least L1, verified over all pinned zones |
| T06 | A stolen device key mirrors a schedule that silences push | revoked keys are refused and their rows stop being effective |

**Abuse controls**
- Rate limit 30 changes per day per vault and 30 mirror calls per hour per user at the relay through RateLimitPort (F12.S03.M03).
- Relay operators can ignore mirrors from blocked device keys.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T11 | abuse | PS-105-07.R01, PS-105-07.R02, PS-105-07.R03 | inspect mirror payload, relay storage, relay logs, events and notification payloads | no location, no content, schedule absent from payloads and events; 31st change in a day returns RATE_LIMITED |
| TEST-PS-105-09.T18 | e2e | PS-105-01.R02, PS-105-07.R01, PS-105-07.R02 | open the quiet hours screen with Europe/Busingen selected and a relay with push consent | the relay note names Europe/Zurich as the region the relay learns and states that the windows are sent; no location permission is requested |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
