# PS-064-05 — Authorization and capabilities: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-05.R01** Vault policy lets only the unlocked local principal propose, agree, reschedule or cancel, and only as a party of the meetup.
- **PS-064-05.R02** Inbound proposals and cancellations are accepted only when signed by an active key of a party of the meetup (F16.S02.M02); others are quarantined.
- **PS-064-05.R03** Relays hold no meetup data beyond encrypted envelopes; no relay or global role can change a meetup.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.meetup.propose | local principal | vault policy; participant(thread); the local principal has not blocked any party; signs the proposer's agreement consent in the same transaction |
| comms.meetup.agree | local principal | party of the meetup; the proposer's own agreement is signed together with propose and reschedule |
| comms.meetup.reschedule | local principal | party of the meetup; meetup not cancelled, expired or elapsed |
| comms.meetup.cancel | local principal | party of the meetup; meetup not cancelled, expired or elapsed |
| comms.meetup.read | local principal | participant(thread) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T07 | abuse | PS-064-05.R01, PS-064-05.R02, PS-064-05.R03 | stranger-signed proposal; cancellation signed by non-party; relay operator inspects storage | quarantined; relay holds only ciphertext |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, F06.S02.M01, F07.S02.M02, F16.S02.M02, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
