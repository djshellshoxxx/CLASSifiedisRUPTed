# PS-088-02 — Validation rules: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-02.R01** An entry is created only for a statement stored locally with a valid signature whose audience matches the destination kind (public to selected or peer relays, participants to recipient mailboxes).
- **PS-088-02.R02** Receipts and acknowledgements are verified before they change state, so a relay cannot claim recipient acceptance.
- **PS-088-02.R03** Each rule violation maps to one stable error code.
- **PS-088-02.R04** Public statements are routed and dispatched to a relay only after privacy.consent.check(federation_publish) for that relay, and a failed or unavailable check fails closed.
- **PS-088-02.R05** Participant statements leave the vault only through the MailboxPort as sealed wrappers, and recipient mailbox routes are re-resolved after a recipient moves.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | cid exists in F11.S01.M02 as a FederatedRecord with status accepted (authored locally, or on a relay accepted from a hosted device key), as a Tombstone in status applied or pending_target, or as another locally authored control statement (ack, relay_removal, peer_offer, peer_accept, key_rotation, relay_identity, move, move_cancel, blocklist), with a verified signature | NOT_FOUND |
| V02 | destination: vault — an active selected relay (F11.S03.M01 Peer kind selected_relay) or a recipient mailbox from ext.recipients, the recipient's latest verified portable document or a public-projection mailbox hint; relay — an active allowlisted peer relay with direction outbound or both | FEDERATION_PEER_NOT_ALLOWED |
| V03 | audience participants goes only to recipient_mailbox; audience public goes only to selected_relay (vault) or peer_relay (relay, flag F11 on); a record received from a peer relay is never queued to a peer relay | FEDERATION_DESTINATION_INVALID |
| V04 | batch has ≤ 100 envelopes and body ≤ 4194304 bytes | FEDERATION_BATCH_TOO_LARGE |
| V05 | transport receipt signature verifies against the destination relay's pinned key, names the cid and carries a per-envelope outcome; two verified receipts by one peer key for one cid with different outcomes fail the entry with reason receipt_equivocation | FEDERATION_RECEIPT_INVALID |
| V06 | acknowledgement is a classrup.federation.ack/v1 accepted by F11.S01.M02, signed by a principal named in ext.recipients of the acknowledged statement, over the exact cid | FEDERATION_RECEIPT_INVALID |
| V07 | destination quota available (6000 envelopes/hour, 10 batches/minute default, F11.S03.M01) | FEDERATION_QUOTA_EXCEEDED |
| V08 | destination is not blocked by an active peer block rule (F11.S03.M02) | FEDERATION_NOT_ACCEPTED |
| V09 | vault: privacy.consent.check(federation_publish, relayId) is granted before a public statement is routed and again before it is dispatched; when the check service is unavailable the step fails closed with DEPENDENCY_UNAVAILABLE | FEDERATION_NOT_OPTED_IN |
| V10 | a recipient mailbox route resolves; after a recipient move it is re-resolved from the updated portable document or mailbox hint and the entry waits while none is found | FEDERATION_RECIPIENT_UNRESOLVED |
| V11 | participants envelopes are handed to the MailboxPort only, as a sealed wrapper {v, mailboxId, ciphertext, size, sentAt} with no author, type or seq in cleartext, and never to POST /fed/v1/inbox | FEDERATION_DESTINATION_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T02 | unit | PS-088-02.R01, PS-088-02.R03 | enqueue with unknown cid, invalid destination, participants audience to peer_relay, public audience to a recipient mailbox | NOT_FOUND, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_DESTINATION_INVALID twice |
| TEST-PS-088-09.T03 | abuse | PS-088-02.R02, PS-088-07.R01 | relay returns a forged receipt and a forged acknowledgement signed by a non-recipient | FEDERATION_RECEIPT_INVALID; state does not advance |
| TEST-PS-088-09.T19 | integration | PS-088-02.R04 | consent federation_publish not granted for relay R; consent service unavailable; consent withdrawn between routing and dispatch | not routed (FEDERATION_NOT_OPTED_IN); DEPENDENCY_UNAVAILABLE and nothing sent; dispatch re-check stops the send |
| TEST-PS-088-09.T20 | integration | PS-088-02.R05, PS-088-04.R05 | participants statement to recipient Q; Q moves and publishes a new portable document with a new mailbox hint; Q moves with no resolvable mailbox | delivered through the MailboxPort stub, never /fed/v1/inbox; route re-resolved to the new mailbox; unresolved entries wait with FEDERATION_RECIPIENT_UNRESOLVED |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
