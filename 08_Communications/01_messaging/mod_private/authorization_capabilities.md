# PS-060-05 — Authorization and capabilities: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-05.R01** Vault policy lets only the unlocked local principal send, resend, delete or acknowledge in threads where it is a participant; inbound statements are accepted only when signed by a key authorized for the sender role in the thread.
- **PS-060-05.R02** Relay policy lets a sender put an envelope only with a put proof signed by a device key of the stated senderDid within per-mailbox quotas; only a device key registered for the mailbox can fetch, acknowledge, rotate or close it; moderators of a relay cannot read ciphertext and may only remove envelopes under that relay's hosting policy.
- **PS-060-05.R03** Non-participants and relay operators learn nothing beyond routing metadata; unknown mailbox IDs return NOT_FOUND to prevent enumeration.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.message.send | local principal | vault policy; participant(thread); the local principal has not blocked the recipient in its own block list; being blocked by someone else is never checked or revealed |
| comms.message.delete | local principal | message.senderDid is the local principal |
| comms.message.acknowledge | local principal | participant(thread); message authored by another participant |
| comms.message.read_thread | local principal | participant(thread) |
| comms.mailbox.register | registered relay device | relay policy; request signed by an active device key of ownerDid; at most 3 active mailboxes per principal at this relay |
| comms.mailbox.rotate | mailbox owner | relay policy; request signed by a device key registered for the mailbox |
| comms.mailbox.close | mailbox owner | relay policy; request signed by a device key registered for the mailbox |
| comms.mailbox.put | proven sender | relay policy; mailbox exists and is open; put proof by a device key of senderDid with a fresh nonce; 120 puts per hour per mailbox and sender DID; 200 per day per mailbox for unknown senders; 80 % capacity reserved for contacts |
| comms.mailbox.fetch | mailbox owner | relay policy; request signed by a device key registered for the mailbox |
| comms.mailbox.ack | mailbox owner | relay policy; request signed by a device key registered for the mailbox |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T08 | abuse | PS-060-05.R01, PS-060-05.R02, PS-060-05.R03 | fetch with unregistered key; put without proof; put to unknown mailbox; rotate by a non-owner key; statement signed by non-participant; relay operator tries to read blobs | UNAUTHENTICATED, NOT_FOUND or quarantine; operator sees only ciphertext |
| TEST-PS-060-09.T12 | abuse | PS-060-02.R05, PS-060-05.R01 | 61st send in a minute; B has blocked A and A sends in TH and TG | A sees the UX guard notice; A's vault state, responses and delivery rows equal a control run without the block; B's vault drops silently; C receives the TG message |
| TEST-PS-060-09.T21 | abuse | PS-060-01.R06, PS-060-02.R05, PS-060-05.R02 | 50 freshly generated DIDs with valid proofs flood B's mailbox while A (a contact) keeps sending | unknown senders capped at 200 per day and 20 % capacity; A's puts still succeed; B's vault keeps at most 5 requests per DID and 100 in total |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
