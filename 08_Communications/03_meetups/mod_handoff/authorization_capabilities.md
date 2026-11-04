# PS-065-05 — Authorization and capabilities: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-05.R01** Vault policy lets only the unlocked local principal check in as itself, report no-show about another party, and create or revoke its own shares.
- **PS-065-05.R02** Relay policy lets a relay-registered device put its own shares and delete only shares it created, while view is open to anyone holding the unguessable share ID but returns ciphertext only.
- **PS-065-05.R03** Inbound check-in and no-show statements are accepted only when signed by a key of a party of the meetup.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.meetup.check_in | local principal | vault policy; party of the meetup with status pending; inside the check-in window |
| comms.meetup.report_no_show | local principal | vault policy; checked-in party; target pending; after the 30 minute grace period |
| comms.meetup.read_checkin | local principal | party of the meetup |
| comms.meetup_share.create | local principal | vault policy; party of the meetup; at most 3 active shares |
| comms.meetup_share.revoke | local principal | share.ownerDid is the local principal |
| comms.meetup_share.put | registered relay device | relay policy; valid relay access token; shares limited to 3 per meetup and 20 per device |
| comms.meetup_share.view | anonymous | relay public read by share ID; 30 requests per minute per IP and share |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T06 | abuse | PS-065-05.R01, PS-065-05.R02, PS-065-05.R03 | check-in signed by non-party; delete share with another device key; view with random share ID | quarantine, FORBIDDEN, NOT_FOUND |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F08.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
