# PS-060-06 — Failure recovery and idempotency: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-06.R01** Vault commands commit locally first and relay delivery is a retried outbox step; mailbox put is idempotent on (mailboxId, digest of the ciphertext) so replays return the original receipt.
- **PS-060-06.R02** Inbound processing is idempotent on messageId and fetch followed by acknowledge is at-least-once; a lost acknowledgement only causes a duplicate fetch.
- **PS-060-06.R03** Offline vaults queue sends and replay them in creation order; the author chain is per device, so devices of one principal sending offline never collide, no shared counter or distributed lock is used, and only one device signing two different envelopes for one seq is a fork that is frozen.
- **PS-060-06.R04** A resend reuses the identical signed envelope bytes and messageCid; only wrappedKeys, which lie outside the signature, may be rebuilt, so a resend after a lost relay receipt is deduplicated by every mailbox and every recipient vault.
- **PS-060-06.R05** Deletion residue stays deliverable after the device keys are destroyed - every queued statement is already signed in the sign step, the per-relay request keys that authorize puts stay in the F10 residue store until residue delivery ends 30 days after signing, and each mailbox close is the pre-signed classrup.comms.mailbox_close/v1 that the relay accepts for 30 days.

## Specification

- **idempotency:** Vault commands are idempotent on messageId and resend on (messageId, messageCid); relay commands require Idempotency-Key with a 24 h replay window, put is also naturally idempotent on (mailboxId, digest) and returns the stored receipt, register on (ownerDid, Idempotency-Key) and a pre-signed close on its nonce.
- **concurrency:** Within a vault each command runs in one IndexedDB transaction; seq is allocated per (threadId, senderDeviceId) in that transaction, so two devices of one principal never share or synchronize a counter; a collision is possible only for one device signing two envelopes with one seq, which is a fork and is surfaced; on the relay put uses INSERT with the unique index and fetch is read-only.
- **retries:** Delivery uses F11.S02.M01 on the F15.S01.M01 outbox with CTR-IDM-001 IDM-4 backoff (base 500 ms, cap 30 s, full jitter, 6 attempts); unsent entries expire 7 days after creation after a day-6 prompt and transport_acknowledged entries leave the outbox 30 days after the relay receipt; a row whose entry failed or expired shows failed with resend; this module adds no timers of its own.
- **offline:** Compose and queue offline; the message shows saved on this device; fetch resumes from the last stored envelope ID; decrypted history exists only in the vault.
- **partial failure:** If some recipient mailboxes accept and others do not, the per-recipient delivery rows and outbox entries retry independently, the message shows the minimum state with k of n, and accepted copies are not re-sent; if the relay stops entirely, delivery status becomes unknown and local records are unaffected.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T09 | integration | PS-060-06.R01, PS-060-06.R02 | 50 concurrent sends plus 10 replays of mailbox put and duplicate fetches | one envelope per messageId, contiguous seq per device, duplicates deduplicated |
| TEST-PS-060-09.T10 | e2e | PS-060-06.R03, PS-060-03.R01 | relay down for 4 days then restored; second run with relay down for 8 days | first: rows stay prepared then become transport acknowledged and the recipient receives 30 messages in sender order; second: day-6 prompt, entries expire at 7 days, message shows failed with resend; UI never shows delivered early |
| TEST-PS-060-09.T13 | chaos | PS-060-06.R03, PS-060-01.R05 | one of two recipient mailboxes rejects with 503 while the other accepts | message shows prepared with 1 of 2, accepted copy not re-sent, retry completes the other row |
| TEST-PS-060-09.T19 | integration | PS-060-06.R03, PS-060-06.R04, PS-060-01.R01 | A1 and A2 both send three messages in TH while offline, then sync; A1 resends after a lost relay receipt | no fork and no freeze; per-device seq 1..3 each; resend has the identical messageCid and is deduplicated by R and B |
| TEST-PS-060-09.T23 | integration | PS-060-04.R06, PS-060-07.R04, PS-060-06.R05 | account deletion of A with messages and two mailboxes, once online and once with the device offline until after destroy_keys | the sign step signs the delete requests and two classrup.comms.mailbox_close/v1 before revoke_keys; offline, the residue outbox later delivers them with A's request keys and both relays close the mailboxes; privacy.deletion.completed signs nothing and calls no relay; export section comms.messages present before deletion |
| TEST-PS-060-09.T32 | integration | PS-060-06.R05, PS-060-04.R07 | after A's keys are destroyed the residue outbox sends a classrup.privacy.deletion_notice/v1 to counterparty C | the notice is sealed to the agreement keys derived from C's listed device keys, put with A's request key, unsealed by C and handed to F11.S01.M02 ingestion |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F12.S03.M04, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
