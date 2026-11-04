# PS-060-05 — Authorization and capabilities: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-05.R01** Vault policy lets only the unlocked local principal send, delete or acknowledge in threads where it is a participant; inbound statements are accepted only when signed by a key authorized for the sender role in the thread.
- **PS-060-05.R02** Relay policy lets anyone holding a mailbox ID put an envelope within rate limits, but only a device key registered for the mailbox can fetch or acknowledge; moderators of a relay cannot read ciphertext and may only remove envelopes under that relay's hosting policy.
- **PS-060-05.R03** Non-participants and relay operators learn nothing beyond routing metadata; unknown mailbox IDs return NOT_FOUND to prevent enumeration.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.message.send | local principal | vault policy; participant(thread); not blocked by recipient in one-to-one threads |
| comms.message.delete | local principal | message.senderDid is the local principal |
| comms.message.acknowledge | local principal | participant(thread); message authored by another participant |
| comms.message.read_thread | local principal | participant(thread) |
| comms.mailbox.put | anonymous | relay policy; mailbox exists; body at most 16 384 bytes; 120 puts per hour per mailbox and sender DID |
| comms.mailbox.fetch | mailbox owner | relay policy; request signed by a device key registered for the mailbox |
| comms.mailbox.ack | mailbox owner | relay policy; request signed by a device key registered for the mailbox |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T08 | abuse | PS-060-05.R01, PS-060-05.R02, PS-060-05.R03 | fetch with unregistered key; put to unknown mailbox; statement signed by non-participant; relay operator tries to read blobs | UNAUTHENTICATED, NOT_FOUND or quarantine; operator sees only ciphertext |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
