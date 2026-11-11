# PS-060-09 — Contract and acceptance tests: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-060-09.R02** Contract tests verify that vault and relay command inputs, outputs, statements and event payloads validate against schema registry entries.
- **PS-060-09.R03** Cryptographic round trips use fixed known-answer vectors plus property tests.
- **PS-060-09.R04** Screens meet CTR-UX-001 (WCAG 2.2 AA, 44 px targets, explicit async states, polite announcements) and the a11y items listed for this module.

## Specification

See the module test table below (all processes).

**Fixtures:** Three vaults A (devices A1, A2), B (device B1) and C (device C1), one in-memory relay R with registered mailboxes for A, B and C, active two-party thread TH between A and B and group thread TG of A, B and C, fixed clock 2026-11-04T10:00:00Z, deterministic noble RNG seeded for vectors, a crafted two-key ciphertext fixture.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T01 | unit | PS-060-01.R01, PS-060-01.R02, PS-060-01.R04, PS-060-02.R01 | encrypt 8 192-byte plaintext on A1, commit, wrap for A2 and B1, sign, decrypt on B1 | plaintext recovered; envelope fields have exact lengths; key commitment verifies; relay row contains no plaintext; createdAtClaim stored as claim |
| TEST-PS-060-09.T02 | property | PS-060-01.R02, PS-060-09.R03 | random plaintexts 1..8 192 bytes and random single-bit corruption of ciphertext, nonce, additional data or key commitment | decryption and commitment check succeed unmodified and always fail when corrupted |
| TEST-PS-060-09.T03 | unit | PS-060-01.R03, PS-060-03.R02 | inbound envelope moves pending_verification to active, then the author delete statement is applied | body erased, tombstone kept, seq not reused, comms.message.deleted emitted |
| TEST-PS-060-09.T04 | unit | PS-060-02.R02, PS-060-02.R03 | each rule V01 to V16 violated in turn | documented error code returned and nothing stored |
| TEST-PS-060-09.T05 | property | PS-060-03.R01, PS-060-03.R03 | random sequences of send, relay outcomes per recipient, receipts and delete | rows only move forward as declared; message state equals the minimum row state; deleted never returns; UI state equals the reached state |
| TEST-PS-060-09.T06 | contract | PS-060-04.R01, PS-060-04.R02, PS-060-09.R02 | each vault command, relay command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-060-09.T07 | integration | PS-060-04.R03 | security.key.registered and security.key.revoked for B's devices and identity.device_key.added for A's own new device, then send | B's revoked key excluded and its later-seen envelopes quarantined; new keys wrapped for later sends only; own device list updated from identity.device_key.* only |
| TEST-PS-060-09.T08 | abuse | PS-060-05.R01, PS-060-05.R02, PS-060-05.R03 | fetch with unregistered key; put without proof; put to unknown mailbox; rotate by a non-owner key; statement signed by non-participant; relay operator tries to read blobs | UNAUTHENTICATED, NOT_FOUND or quarantine; operator sees only ciphertext |
| TEST-PS-060-09.T09 | integration | PS-060-06.R01, PS-060-06.R02 | 50 concurrent sends plus 10 replays of mailbox put and duplicate fetches | one envelope per messageId, contiguous seq per device, duplicates deduplicated |
| TEST-PS-060-09.T10 | e2e | PS-060-06.R03, PS-060-03.R01 | relay down for 4 days then restored; second run with relay down for 8 days | first: rows stay prepared then become transport acknowledged and the recipient receives 30 messages in sender order; second: day-6 prompt, entries expire at 7 days, message shows failed with resend; UI never shows delivered early |
| TEST-PS-060-09.T11 | abuse | PS-060-07.R01, PS-060-07.R03 | inspect relay database, logs and metrics after 1 000 messages; report a message | no plaintext or keys present; report contains plaintext and K only after confirmation |
| TEST-PS-060-09.T12 | abuse | PS-060-02.R05, PS-060-05.R01 | 61st send in a minute; B has blocked A and A sends in TH and TG | A sees the UX guard notice; A's vault state, responses and delivery rows equal a control run without the block; B's vault drops silently; C receives the TG message |
| TEST-PS-060-09.T13 | chaos | PS-060-06.R03, PS-060-01.R05 | one of two recipient mailboxes rejects with 503 while the other accepts | message shows prepared with 1 of 2, accepted copy not re-sent, retry completes the other row |
| TEST-PS-060-09.T14 | load | PS-060-08.R01, PS-060-08.R02, PS-060-08.R03 | 100 puts per second for 5 minutes then fetch of 100 envelopes then sweep of 50 000 | p95 within budgets, metrics exported |
| TEST-PS-060-09.T15 | unit | PS-060-09.R01 | traceability tool run | every PS-060 requirement maps to a passing test |
| TEST-PS-060-09.T16 | integration | PS-060-10.R01, PS-060-10.R02, PS-060-10.R03 | export, re-import into fresh vault, restore from backup | messages round trip identical; import quarantines envelopes with invalid signatures |
| TEST-PS-060-09.T17 | a11y | PS-060-09.R04 | conversation screen on mobile with screen reader | new message announced in polite region, sync state and k of n have text, targets ≥ 44 px, zero serious axe issues |
| TEST-PS-060-09.T18 | integration | PS-060-01.R05, PS-060-03.R01, PS-060-04.R01 | A sends in TG; B acknowledges, C does not; then C sends a receipt for a different messageCid | message shows transport acknowledged with 1 of 2 acknowledged; C's mismatched receipt rejected with COMMS_MESSAGE_RECEIPT_MISMATCH; peer accepted only after C's matching receipt |
| TEST-PS-060-09.T19 | integration | PS-060-06.R03, PS-060-06.R04, PS-060-01.R01 | A1 and A2 both send three messages in TH while offline, then sync; A1 resends after a lost relay receipt | no fork and no freeze; per-device seq 1..3 each; resend has the identical messageCid and is deduplicated by R and B |
| TEST-PS-060-09.T20 | abuse | PS-060-02.R04, PS-060-07.R03 | A sends the crafted two-key ciphertext to B and C; C reports it | at least one recipient quarantines with commitment_mismatch; the report with K lets the reviewer verify Dec(K, C) and the commitment |
| TEST-PS-060-09.T21 | abuse | PS-060-01.R06, PS-060-02.R05, PS-060-05.R02 | 50 freshly generated DIDs with valid proofs flood B's mailbox while A (a contact) keeps sending | unknown senders capped at 200 per day and 20 % capacity; A's puts still succeed; B's vault keeps at most 5 requests per DID and 100 in total |
| TEST-PS-060-09.T22 | integration | PS-060-04.R05, PS-060-01.R06 | register, rotate (new ID, 7 forward days) and close a mailbox; put to it | every put triggers one dispatch call with owner DID, category and template key only; rotated ID forwards then expires; close purges envelopes |
| TEST-PS-060-09.T23 | integration | PS-060-04.R06, PS-060-07.R04 | account deletion of A with messages and two mailboxes | DeletionPort.execute signs delete requests and closes both mailboxes before keys are destroyed; privacy.deletion.completed finds nothing left to sign; export section comms.messages present before deletion |
| TEST-PS-060-09.T24 | unit | PS-060-07.R02 | render the encryption info sheet in en and de | text states no forward secrecy, relay-visible metadata (sender DID, mailbox, times, padded sizes), stolen device exposes history and deletion cannot recall copies |
| TEST-PS-060-09.T25 | unit | PS-060-03.R04, PS-060-04.R04 | author deletes messages in local_committed, prepared, failed, transport_acknowledged and peer_accepted; inspect statement registry entries | comms.message.deleted with reason author in every case; registry lists message, delete and receipt statements with signer roles |

## Acceptance criteria

- All tests T01 to T25 pass in CI.
- A relay database and log dump after test traffic contains no plaintext, message keys or private keys.
- The sender UI never shows delivered or accepted before the matching relay receipt or a signed peer acknowledgement of the exact envelope cid exists for every recipient counted.
- Documentation shown in the encryption info sheet states no forward secrecy, relay-visible metadata and that deletion cannot recall copies.

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
