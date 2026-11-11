# PS-060-05 — Authorization and capabilities: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-05.R01** Vault policy lets only the unlocked local principal send, resend, delete or acknowledge in threads where it is a participant; inbound statements are accepted only when signed by a key authorized for the sender role in the thread.
- **PS-060-05.R02** Relay policy lets a sender put a sealed wrapper only with an RFC 9421 request signature by a request key within the per-mailbox, per-key, new-recipient and tenant limits, without learning the sender DID; only a device key registered for the mailbox, or its pre-signed close statement, can fetch, acknowledge, rotate or close it; moderators of a relay cannot read ciphertext and may only remove envelopes under that relay's hosting policy.
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
| comms.mailbox.close | mailbox owner | relay policy; RFC 9421 request by a device key registered for the mailbox, or its classrup.comms.mailbox_close/v1 statement signed within the last 30 days with an unused nonce |
| comms.mailbox.put | request key holder | relay policy; mailbox exists and is open; RFC 9421 signature by a request key with a fresh (keyid, nonce); 120 puts per hour per mailbox and request key; 200 per day per mailbox for unknown keys; new_mailbox_recipients_per_day per request key (F12.S03.M04); tenant maxEnvelopeBytes and maxMailboxBytesPerRecipient; 80 % capacity reserved for contacts |
| comms.mailbox.fetch | mailbox owner | relay policy; request signed by a device key registered for the mailbox |
| comms.mailbox.ack | mailbox owner | relay policy; request signed by a device key registered for the mailbox |
| comms.mailbox.read_own | local principal | vault policy; in-process query over the local principal's own mailbox rows; no network |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T08 | abuse | PS-060-05.R01, PS-060-05.R02, PS-060-05.R03 | fetch with unregistered key; put without a request signature or with a reused (keyid, nonce); put to unknown mailbox; rotate by a non-owner key; statement signed by non-participant; relay operator tries to read blobs | UNAUTHENTICATED, NOT_FOUND or quarantine; operator sees only ciphertext |
| TEST-PS-060-09.T12 | abuse | PS-060-02.R05, PS-060-05.R01 | 61st send in a minute; B has blocked A and A sends in TH and TG | A sees the UX guard notice; A's vault state, responses and delivery rows equal a control run without the block; B's vault drops silently; C receives the TG message |
| TEST-PS-060-09.T21 | abuse | PS-060-01.R06, PS-060-02.R05, PS-060-05.R02, PS-060-02.R07 | 50 freshly generated request keys with valid signatures flood B's mailbox while A (a contact) keeps sending | unknown keys capped at 200 per day and 20 % capacity and each new key counted once against new_mailbox_recipients_per_day; A's puts still succeed; B's vault keeps at most 5 requests per DID and 100 in total |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F12.S03.M04, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
