# PS-106-07 — Privacy, retention and abuse: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-07.R01** The in-app column and the other bucket never leave the device, and a relay learns only the eight booleans of each channel consented there, for users who consented to that channel.
- **PS-106-07.R02** Mirror statements are signed and contain no content, no thread or listing identifiers and no schedule.
- **PS-106-07.R03** Preferences are deleted from the relay as soon as the last consent for that channel at that relay ends, including when the deletion sign-step withdrawals are registered.

## Specification

**Data classification**
- NotificationPreference vault record: P2; in-app flags device only.
- Relay copy: P2 for the consented relay only; one channel column of 8 booleans per device chain.

**Retention**
- Vault records: RET-STANDARD until the user deletes the vault.
- Relay copy: deleted at once when the last consent for that channel at that relay ends.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay learns usage patterns from the matrix | only the consented channel's eight booleans are mirrored and only to relays with that consent; the UI states this |
| T02 | Attacker disables a victim's security alerts | edits require the vault; mirror requires an active device-key signature; in-app security cannot be turned off; push security can be disabled only by the owner and the UI warns |
| T03 | Replay of an old mirror or a forked chain to re-enable categories | seq and prev chain per device key; stale replays ignored, forks refused |
| T04 | Dark patterns re-enabling categories after updates | defaults apply only to new vaults and to categories added later; existing user choices are never reset by app updates |
| T05 | A stolen device key mirrors a matrix that silences security push | revoked keys are refused and their rows stop being effective |

**Abuse controls**
- Rate limit 60 edits per hour per vault and 30 mirror calls per hour per user at the relay through RateLimitPort (F12.S03.M03).
- Relay can refuse mirror from blocked device keys under its hosting policy.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T09 | abuse | PS-106-07.R01, PS-106-07.R02, PS-106-05.R02 | inspect mirror statements and relay storage at R (push only) and R2; app update with a new category | R holds only push booleans and no email flags; R2 one column per channel; no in-app column or other bucket anywhere; user choices preserved |
| TEST-PS-106-09.T10 | abuse | PS-106-07.R03, PS-106-02.R03 | relay-local opted_out for the last push consent at R; fake clock advanced 24 h; 61st edit in an hour | R's push rows deleted at once and absent after 24 h; RATE_LIMITED |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
