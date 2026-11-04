# F08.S01.M01 — Private messages

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S01](../SPEC.md). **Process IDs:** PS-060-01…PS-060-10. **Code:** `packages/comms/src/messaging/private`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Private end-to-end encrypted messages between members, authored and stored in the users' local vaults and carried as signed encrypted envelopes through user-selected relay mailboxes (ADR-0016). The sender's vault encrypts text with a random per-message key (XChaCha20-Poly1305), wraps that key for each recipient device with x25519, signs the envelope with its Ed25519 device key and queues one copy per recipient mailbox. A relay mailbox stores only ciphertext and routing metadata until the recipient fetches and acknowledges it. Text is limited to 8 KiB. The MVP has no forward secrecy and no metadata protection from the relay; both are documented to users. Sync status shown to the sender never claims more than local committed, prepared, transport acknowledged or peer accepted.

## Responsibilities

- Own the Message record in the vault (plaintext, envelope, sync state) and its delete lifecycle.
- Compose, encrypt, sign and queue envelopes per recipient mailbox through the vault sync outbox, with the sync states local committed, prepared, transport acknowledged, peer accepted.
- Verify, decrypt and store inbound envelopes; quarantine envelopes with invalid signatures, unknown threads, blocked senders or undecryptable bodies.
- Provide the relay mailbox commands put, fetch and acknowledge that store ciphertext envelopes for a recipient and delete them on acknowledgement or after 30 days.
- Offer optional signed delivery and read acknowledgements that the recipient can switch off.
- Delete a message locally and publish a signed delete request that recipient vaults honour on a best-effort basis.

## Not responsible for

- Thread membership, context binding, mute and archive (F08.S01.M02 threads).
- Encrypted image attachments (F08.S01.M03); a message only carries an attachment reference inside its encrypted body.
- Device key generation, storage and revocation (F07.S01.M01 identity, F16.S02.M01 key lifecycle).
- Alerts about new messages (F13 notifications consume comms.message.received locally; push through a relay is content-free).
- Relay selection, relay registration and mailbox ID publication (F07 profile statements and F15 relay adapters).
- Future: forward secrecy via double ratchet, sealed sender, mailbox ID rotation per conversation, post-quantum hybrid key wrap, relay-to-relay mailbox forwarding.

## User stories

- As a member, I can send a text message to the other party of a listing thread and know that only our devices can read it and which delivery stage it reached.
- As a member, I can delete a message I sent so it disappears from my vault and a delete request is sent, understanding that a copy already on the other device cannot be forced away.
- As a member who reopens the app after two days offline, I receive every missed message from my relay mailbox in sender order.
- As a member, I can turn delivery receipts off so the other party cannot see when I read messages.
- As a member, I can see that a relay outage leaves my messages queued as prepared instead of falsely marked as sent.

## Edge cases

- Recipient adds a new device after the message was sent; the new device cannot read old messages because wrapped keys exist only for devices known at send time.
- Sender's cached device list for the recipient is stale and omits a new device; that device cannot decrypt, the recipient's other device shows a notice, and the sender is asked to resend after refreshing the device list.
- Recipient device key is revoked before delivery; its wrapped key is ignored and remaining devices still decrypt.
- Plaintext of exactly 8192 bytes is accepted; 8193 bytes is refused in the vault and a relay refuses mailbox put bodies over 16 384 bytes with PAYLOAD_TOO_LARGE.
- Same envelope fetched twice because an acknowledgement was lost; the vault deduplicates on messageId and acknowledges again.
- Sender is blocked by one recipient of a three-party thread; the blocker's vault drops the envelope silently, the others receive it, and the sender is never told.
- Sender's clock is 3 hours wrong; the claimed createdAt is shown as a claim, local receivedAt and relay receipt time are stored separately, and per-sender seq orders messages.
- Relay is unreachable for 4 days; messages stay prepared in the outbox, are retried with backoff, and expire after 14 days with a visible failed state and a resend button.

## UX and accessibility

- Conversation view: message bubbles grouped by day, composer with 8 192-byte counter, send button, per-message sync state icon (saved on this device, queued, accepted by relay, acknowledged by recipient).
- Message actions sheet: copy, delete, report (attaches decrypted text to the report only with the user's confirmation).
- Encryption info sheet: states what is protected (message text, attachment content) and what the relay can see (sender and recipient mailbox identifiers, timestamps, sizes), that history is not protected if a device key is stolen, and that deletion cannot recall copies.
- Receipts setting: two toggles, delivery receipts and read receipts, both off by default.

**States:** loading; empty; sending; local-committed; prepared-queued; transport-acknowledged; peer-accepted; failed-retry; deleted-tombstone; offline; decrypt-failed; quarantined

**Accessibility:** New incoming messages are announced through an aria-live polite region with sender pseudonym and no message text unless the user enabled it.; Sync state is conveyed by text and icon together, never by color alone.; Composer has a visible label and a character counter exposed to screen readers when within 500 bytes of the limit.; Message actions are reachable by keyboard and by long press; all targets are at least 44 by 44 px.

## Owned data

- `Message` (classrup.comms.message/v1, P2, RET-STANDARD)
- `MailboxEnvelope` (classrup.comms.mailbox_envelope/v1, P2, RET-SHORT)
- `MessageReceipt` (classrup.comms.message_receipt/v1, P2, RET-SHORT)

## Interfaces

- Commands: `comms.message.send`, `comms.message.delete`, `comms.message.acknowledge`, `comms.mailbox.put`, `comms.mailbox.fetch`, `comms.mailbox.ack`
- Queries: `comms.message.list_thread`
- Emits: `comms.message.sent`, `comms.message.deleted`, `comms.message.received`
- Consumes: `comms.thread.archived`, `identity.device_key.revoked`, `identity.device_key.added`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-060-01 | [Domain schema](domain_schema.md) | 4 |
| PS-060-02 | [Validation rules](validation_rules.md) | 3 |
| PS-060-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-060-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-060-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-060-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-060-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-060-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-060-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-060-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/messaging/private/index.ts`.

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- A relay database and log dump after test traffic contains no plaintext, message keys or private keys.
- The sender UI never shows delivered or accepted before the matching relay receipt or signed peer acknowledgement exists.
- Documentation shown in the encryption info sheet states no forward secrecy, relay-visible metadata and that deletion cannot recall copies.
