# PS-106-07 — Privacy, retention and abuse: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-07.R01** The in-app column and the existence of preferences for categories never leave the device; relays learn only seven booleans per channel for users who consented to that channel.
- **PS-106-07.R02** Mirror statements are signed and contain no content, no thread or listing identifiers and no schedule.
- **PS-106-07.R03** Preferences are deleted from the relay 30 days after the channel consent ends and on vault wipe requests.

## Specification

**Data classification**
- NotificationPreference: P2; in-app flags device only; push and email flags mirrored to consented relays.

**Retention**
- Vault records: RET-STANDARD until the user deletes the vault.
- Relay mirror: deleted 30 days after the corresponding channel consent ends.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay learns usage patterns from the matrix | only seven booleans per channel are mirrored and only to relays with consent; the UI states this |
| T02 | Attacker disables a victim's security alerts | edits require the vault; mirror requires a device-key signature; in-app security cannot be turned off; push security can be disabled only by the owner and the UI warns |
| T03 | Replay of an old mirror to re-enable categories | strictly increasing seq per user at the relay |
| T04 | Dark patterns re-enabling categories after updates | defaults apply only to new vaults and to categories added later; existing user choices are never reset by app updates |

**Abuse controls**
- Rate limit 60 edits per hour per vault and 30 mirror calls per hour per user at the relay.
- Relay can refuse mirror from blocked device keys under its hosting policy.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T09 | abuse | PS-106-07.R01, PS-106-07.R02, PS-106-07.R03 | inspect mirror statement and relay storage; app update with a new category | only 7 booleans per channel present; user choices preserved |
| TEST-PS-106-09.T10 | abuse | PS-106-07.R03, PS-106-02.R03 | 61st edit in an hour | RATE_LIMITED |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
