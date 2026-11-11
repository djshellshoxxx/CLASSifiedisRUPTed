# F08.S01.M01 — Private messages

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S01](../SPEC.md). **Process IDs:** PS-060-01…PS-060-10. **Code:** `packages/comms/src/messaging/private`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Private end-to-end encrypted messages between members, authored and stored in the users' local vaults and carried as signed encrypted envelopes through user-selected relay mailboxes (ADR-0016). The sender's vault encrypts text with a random per-message key K (XChaCha20-Poly1305), commits to K inside the signed statement, wraps K for each recipient device with x25519 to the agreement key that F16.S02.M01 derives from that device's Ed25519 key listed active in the recipient's root-signed portable identity document, signs the envelope with its Ed25519 device key and queues one copy per recipient mailbox through F11.S02.M01 delivery on the F15.S01.M01 sync outbox. This module is the single owner of relay mailboxes and implements the MailboxPort that F11.S02.M01 uses: it registers, rotates (per relay and per period) and closes them, seals every participant envelope into a sealed-sender wrapper {v, mailboxId, ciphertext, size, sentAt}, accepts puts only with an RFC 9421 request signature (F11.S01.M03, tag classrup/relay-request/v1) by the sender's per-relay request key, returns a ReceiptPort receipt for every put and stores only the wrapper until the recipient fetches and acknowledges it or 30 days pass. Delivery is tracked per recipient, and the message shows the lowest state reached across recipients with "k of n acknowledged"; peer accepted needs a receipt bound to the exact envelope digest. Each sender device keeps its own author chain, so a principal's devices never share a counter. Text is limited to 8 KiB. The MVP has no forward secrecy, and the relay still sees mailbox IDs, times, padded sizes and the request key of each put; both are documented to users.

## Responsibilities

- Own the Message record in the vault (plaintext, envelope, per-device author chain, per-recipient delivery rows) and its delete lifecycle.
- Compose, encrypt, commit, sign and queue envelopes per recipient mailbox through F11.S02.M01 delivery on the F15.S01.M01 sync outbox, with the sync states local committed, prepared, transport acknowledged, peer accepted tracked per recipient.
- Verify, decrypt and store inbound envelopes; quarantine envelopes with invalid signatures, revoked keys, unknown threads, failed key commitments, forked device chains or undecryptable bodies.
- Provide the relay mailbox commands register, rotate, close, put, fetch and acknowledge; as the single owner of MailboxEnvelope it stores sealed-sender wrappers for a recipient and deletes them after fetch plus acknowledgement or after 30 days (RET-SHORT), and every other module and F11.S02.M01 delivery use them through the MailboxPort this module implements instead of their own mailboxes.
- Offer optional signed delivery and read acknowledgements, bound to the exact envelope cid, that the recipient can switch off.
- Delete a message locally and publish a signed delete request that recipient vaults honour on a best-effort basis.
- Register the F10 privacy ports (ExportSectionPort, DeletionPort, RetentionPurgePort) so that the DeletionPort sign step signs remote deletes and mailbox closes while the device keys still exist (N6a).
- [object Object]
- Keep the vault's own mailbox registrations with a distinct mailbox ID at every relay, rotate each one every 30 days (PT-15) and expose the current {relayId, mailboxId} pairs through the in-process vault query comms.mailbox.list_own for listing projection hints (N15, F01.S01.M03).

## Not responsible for

- Thread membership, context binding, mute and archive (F08.S01.M02 threads).
- Encrypted image attachments (F08.S01.M03); a message only carries an attachment reference inside its encrypted body.
- Device key generation, storage and X25519 derivation (F07.S01.M01 identity, F16.S02.M01 agreementPublicKeyOf), and counterparty key validity (F07.S02.M01 portable identity documents and KeyStatusPort, read through F16.S02.M02 security.keyrecord.get_status).
- Outbox scheduling, retry timers and expiry (F15.S01.M01 sync outbox, F11.S02.M01 delivery); this module provides the mailbox they deliver to and adds no timers of its own.
- Alerts about new messages (F13 notifications consume comms.message.received locally; the content-free activity wake after a mailbox put is sent by F13.S02.M01 notify.notification.dispatch through the relay hook with category activity and template notify.tpl.activity.wake).
- Relay receipt signing and relay identity keys (F15.S02.M01 ReceiptPort), tenant limit values (F15.S04.M03 TenantPort.limits), rate-limit buckets (F12.S03.M03 RateLimitPort) and graduated limits (F12.S03.M04); this module calls them on every put.
- Relay selection and publication of the mailbox ID in the portable profile and in listing projections (F15 relay adapters, F07.S02.M02 profile statements, F01.S01.M03 reading comms.mailbox.list_own).
- Future: forward secrecy via double ratchet, request keys unlinkable across puts, mailbox ID rotation per conversation, post-quantum hybrid key wrap, relay-to-relay mailbox forwarding.

## User stories

- As a member, I can send a text message to the other party of a listing thread and know that only our devices can read it and which delivery stage it reached.
- As a member, I can delete a message I sent so it disappears from my vault and a delete request is sent, understanding that a copy already on the other device cannot be forced away.
- As a member who reopens the app after two days offline, I receive every missed message from my relay mailbox in sender order.
- As a member, I can turn delivery receipts off so the other party cannot see when I read messages.
- As a member, I can see that a relay outage leaves my messages queued as prepared instead of falsely marked as sent.
- As a member of a three-party cycle thread, I see "1 of 2 acknowledged" until every recipient confirmed, never "acknowledged" on the strength of one recipient.
- As a member using a phone and a laptop, I can write from both while offline without my own conversation freezing.
- As a member, I know that the relay holding my mailbox stores no sender for any envelope, and that it can only link puts made with one sender's request key on that relay.

## Edge cases

- Recipient adds a new device after the message was sent; the new device cannot read old messages because wrapped keys exist only for devices known at send time.
- Sender's cached device list for the recipient is stale and omits a new device; that device cannot decrypt, the recipient's other device shows a notice, and the sender is asked to resend after refreshing the device list; the resend reuses the identical signed envelope and rebuilds only the wrapped keys.
- Recipient device key is revoked before delivery; its wrapped key is ignored and remaining devices still decrypt.
- Plaintext of exactly 8192 bytes is accepted; 8193 bytes is refused in the vault; a chat message wrapper never exceeds 16 384 bytes, and a relay refuses any wrapper larger than its tenant's maxEnvelopeBytes (TenantPort.limits, at most 262 144) with PAYLOAD_TOO_LARGE.
- Same envelope fetched twice because an acknowledgement was lost; the vault deduplicates on messageId and acknowledges again.
- Sender is blocked by one recipient of a three-party thread; the blocker's vault drops the envelope silently, the others receive it, and the sender's vault state and responses are identical to the case without a block (that recipient's delivery row simply stays transport acknowledged).
- Sender's clock is 3 hours wrong; the claimed createdAt is shown as a claim, local receivedAt and relay receipt time are stored separately, and messages are ordered by (createdAtClaim, senderDeviceId, seq).
- Relay is unreachable for 8 days; delivery rows stay prepared, the user is prompted on day 6 and the F15.S01.M01 outbox expires the entries after 7 days; the message shows failed with a resend button that re-queues the identical envelope.
- Two devices of one principal send in the same thread while offline; each extends its own device chain (seq 1, 2, ... per device), so both are accepted and nothing freezes.
- A relay receipt is lost after a successful put and the sender resends; the identical envelope (same messageCid) is deduplicated by the mailbox and by the recipient vault.
- A malicious sender crafts one ciphertext that decrypts to different text under two keys wrapped for two recipients; the key commitment check fails for at least one recipient and the message is quarantined there.
- Fifty freshly generated request keys flood a publicly advertised mailbox; each put needs an RFC 9421 request signature, unknown keys share an aggregate cap of 200 puts per day per mailbox, each new key is held to the F12.S03.M04 new_mailbox_recipients_per_day limit, and known contacts keep 80 % of the capacity.
- A relay-served mailbox hint carries an X25519 key for a recipient device that differs from the key derived from that device's listed Ed25519 key; the hint key is refused and the wrap targets only the derived key.
- An owner blocks a renter after a confirmed rental; the renter's chat messages are dropped silently, while sealed rental lifecycle statements in the same mailbox are still fetched, acknowledged and handed to F11.S01.M02 ingestion with notifications suppressed (N7a).
- The account is deleted while the device is offline; the delete statements and pre-signed mailbox closes are signed in the DeletionPort sign step and the F10 residue outbox delivers them later with the per-relay request key, after the device keys are gone.

## UX and accessibility

- Conversation view: message bubbles grouped by day, composer with 8 192-byte counter, send button, per-message sync state icon showing the lowest state across recipients (saved on this device, queued, accepted by relay, acknowledged by recipient) plus 'k of n acknowledged' in group threads.
- Message actions sheet: copy, delete, report (attaches decrypted text and the message key to the report only with the user's confirmation), delivery details per recipient.
- Encryption info sheet: states what is protected (message text, attachment content and who wrote to the mailbox, which travels sealed inside the wrapper) and what the relay can see (recipient mailbox identifier, timestamps, padded sizes and the per-relay request key that signed each put, which links puts by one sender on that relay but not to a DID), that history is not protected if a device key is stolen, and that deletion cannot recall copies.
- Receipts setting: two toggles, delivery receipts and read receipts, both off by default.
- Message requests: messages from unknown senders wait here with Accept, Decline and Block.

**States:** loading; empty; sending; local-committed; prepared-queued; transport-acknowledged; partially-acknowledged; peer-accepted; failed-retry; deleted-tombstone; offline; decrypt-failed; quarantined; message-request

**Accessibility:** New incoming messages are announced through an aria-live polite region with sender pseudonym and no message text unless the user enabled it.; Sync state is conveyed by text and icon together, never by color alone, including the 'k of n acknowledged' count.; Composer has a visible label and a character counter exposed to screen readers when within 500 bytes of the limit.; Message actions are reachable by keyboard and by long press; all targets are at least 44 by 44 px.

## Owned data

- `Message` (classrup.comms.message/v1, P2, RET-STANDARD)
- `MailboxEnvelope` (classrup.comms.mailbox_envelope/v1, P2, RET-SHORT)
- `MessageReceipt` (classrup.comms.message_receipt/v1, P2, RET-SHORT)

## Interfaces

- Commands: `comms.message.send`, `comms.message.resend`, `comms.message.delete`, `comms.message.acknowledge`, `comms.mailbox.register`, `comms.mailbox.rotate`, `comms.mailbox.close`, `comms.mailbox.put`, `comms.mailbox.fetch`, `comms.mailbox.ack`
- Queries: `comms.message.list_thread`, `comms.mailbox.list_own`
- Emits: `comms.message.sent`, `comms.message.deleted`, `comms.message.received`
- Consumes: `comms.thread.archived`, `identity.portable_doc.published`, `identity.device_key.added`, `identity.device_key.revoked`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F08.S01.M02, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F12.S03.M04, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001, CTR-UX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-060-01 | [Domain schema](domain_schema.md) | 8 |
| PS-060-02 | [Validation rules](validation_rules.md) | 7 |
| PS-060-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-060-04 | [Commands, queries and events](commands_queries_events.md) | 8 |
| PS-060-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-060-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 5 |
| PS-060-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-060-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-060-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-060-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/messaging/private/index.ts`.

## Acceptance criteria

- All tests T01 to T32 pass in CI.
- A relay database and log dump after test traffic contains no plaintext, message keys or private keys, and no sender DID or request key next to any stored wrapper.
- The sender UI never shows delivered or accepted before the matching relay receipt or a signed peer acknowledgement of the exact envelope cid exists for every recipient counted.
- Documentation shown in the encryption info sheet states no forward secrecy, relay-visible metadata and that deletion cannot recall copies.
