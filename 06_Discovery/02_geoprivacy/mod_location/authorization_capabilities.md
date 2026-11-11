# PS-048-05 — Authorization and capabilities: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-05.R01** Vault policy - only the unlocked local principal may set the home region or grant and revoke shares; incoming shares and revokes are accepted only from records F11.S01.M02 accepted, signed by the sharer and addressed to the principal.
- **PS-048-05.R02** There is no relay role and no relay command in this module; relays carry the encrypted envelope as opaque ciphertext and cannot read, create or alter shares.
- **PS-048-05.R03** A blocked party can never create an incoming share on this vault.
- **PS-048-05.R04** Precise sharing and one-shot GPS require a granted privacy.consent.check for purpose location_precise (N6); without it the command is refused with PRECONDITION_FAILED.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| discovery.location_setting.write_own | principal | unlocked local principal; device_gps_once additionally needs location_precise consent |
| discovery.location_setting.read_own | principal | unlocked local principal |
| discovery.location_share.grant | principal | unlocked principal; location_precise consent granted; recipient not blockedWith; fewer than 5 active shares |
| discovery.location_share.revoke | principal | unlocked principal and share.direction is outgoing |
| discovery.location_share.receive | principal | record accepted by F11.S01.M02 with signer role sharer (sharerDid), addressed to the principal, sharer not blocked; covers receive and receive_revoke |
| discovery.location_share.read_own | principal | unlocked local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T07 | abuse | PS-048-02.R03, PS-048-05.R01, PS-048-05.R03 | incoming share with a bad signature, wrong addressee, claimed expiry 5 days ahead, a record F11 did not accept, and one from a blocked sender | rejected, clamped to receipt time plus 24 h, or ignored; the blocked sender's statement is dropped silently and quarantined with no UI trace |
| TEST-PS-048-09.T08 | abuse | PS-048-05.R02, PS-048-07.R01, PS-048-07.R02 | inspect relay-visible bytes, logs, events, and export of another user | only ciphertext visible to relay; no coordinates in logs or events; no shares in others' exports |
| TEST-PS-048-09.T17 | integration | PS-048-05.R04 | grant L4 and set_home with device_gps_once while location_precise consent is not granted, then after inline consent | PRECONDITION_FAILED with nothing stored; both succeed after consent |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
