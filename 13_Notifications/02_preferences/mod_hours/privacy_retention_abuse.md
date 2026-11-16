# PS-105-07 — Privacy, retention and abuse: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-07.R01** The schedule reveals sleep rhythm and coarse region through the time zone, so it is P2, mirrored only to relays the user consented to for push or email, and deleted there when that consent ends.
- **PS-105-07.R02** No location is read to choose the time zone; the default is the browser setting and the user can change it.
- **PS-105-07.R03** The schedule is never part of notification payloads or events beyond the changed event with counts.

## Specification

**Data classification**
- QuietHoursSchedule: P2; vault authoritative, mirror at consented relays.

**Retention**
- Vault: RET-STANDARD until deletion.
- Relay mirror: deleted within 30 days after the push or email consent at that relay ends.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay operator infers sleep schedule and region | mirror only to consented relays, disclosed in the settings screen, deleted when consent ends, user can choose a self-hosted relay or disable the mirror and rely on in-app only |
| T02 | Attacker sets quiet hours to mute victim's notifications | only the vault can edit; mirror needs a device-key signature; security alerts bypass quiet hours |
| T03 | DST error causes alerts at night or missed alerts | boundary tests across 12 zones and 24 transitions with a reference implementation; tzdata version pinned and recorded |
| T04 | Replay of an old mirror to change the schedule | strictly increasing seq at the relay |

**Abuse controls**
- Rate limit 30 changes per day per vault and 30 mirror calls per hour per user at the relay.
- Relay operators can ignore mirrors from blocked device keys.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T11 | abuse | PS-105-07.R01, PS-105-07.R02, PS-105-07.R03 | inspect mirror payload, relay logs and notification payloads | no location, no content, schedule absent from payloads; 31st change in a day returns RATE_LIMITED |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
