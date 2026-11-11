# F15.S01.M01 — Offline outbox

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S01](../SPEC.md). **Process IDs:** PS-116-01…PS-116-10. **Code:** `apps/pwa/src/platform/offline`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The PWA is the product and works with no server after install: every domain command commits first in the user's IndexedDB vault. This module is the vault's single sync outbox (catalog owner of OutboxEntry). Whatever must reach another party or a user-selected relay (a signed statement such as a published listing, offer or consent, or a relay command such as an index write) becomes an OutboxEntry row in the vault's one IndexedDB database, written through the F15.S02.M03 transaction(fn) together with the domain record, and moves through the honest states prepared (export prepared), transport_acknowledged (verified relay receipt) and peer_accepted (verified signed acknowledgement of the exact digest by the acknowledger the statement registry names). The UI never shows more certainty than the reached state. Entries replay in creation order with the original Idempotency-Key or cid (CTR-IDM-001 IDM-1, IDM-4, IDM-5, IDM-7); relay commands older than the relay's 24 h idempotency window are resent only when replay is provably safe; conflicts are never merged automatically; unsent entries expire after 7 days following a prompt and no entry outlives 30 days. The module also reports storage status (persistence grant, quota, eviction warnings, last-export age with a 30-day warning, or 7 days when persistent storage is not granted).

## Responsibilities

- Own the OutboxEntry record and its single state machine; rows live in the vault's single IndexedDB database as F15.S02.M03 records (type platform.outbox_entry) and are enqueued inside the caller's storage.transaction(fn), so an entry commits or rolls back together with the domain record that produced it.
- Queue signed statements (CTR-FED-001 envelopes) and relay commands per canonical destination (relay destination strings of F15.S02.M01, or direct:<did> for QR or file transfer), capped at 200 entries and 5 MiB per principal or the lower LocalSettings.localLimits.maxOutboxEntries of F15.S04.M03, and expose the reached sync state to the UI.
- Enforce CTR-PRV-001 PRV-5 at enqueue using the statement registry of F11.S01.M01 and the field classes of F10.S02.M02, so statements of class P2 reach a relay only as end-to-end encrypted envelopes and P3/P4 data is never queued.
- Deliver strictly in creation order per destination with CTR-IDM-001 IDM-4 backoff (base 500 ms, cap 30 s, full jitter, 6 attempts), serialized across tabs by the Web Locks API, verify relay receipts (classrup.platform.relay_receipt/v1) against the relay's published key set, and record verified peer acknowledgements bound to the entry's exact cid.
- Surface conflicts (relay CONFLICT_*, peer rejection, forked conflicting signed promise reported by the receiving module, relay command whose replay is unsafe after 23 h) as a resolve-or-discard prompt, and expire unsent entries 7 days after creation after a day-6 warning.
- Apply verified relay restore announcements and key revocations published by the destination relay, returning entries whose receipts the relay lost to prepared for resending, and freezing delivery to a relay whose identity equivocates.
- Report vault storage status through navigator.storage.persist() and estimate(), eviction warnings and last-export age (warn at 30 days, or at 7 days without persistent storage, per CTR-IOX-001 IOX-6).
- [object Object]

## Not responsible for

- Verifying incoming signed statements and quarantine (F11 federation modules and the receiving domain module); this module only accepts a reference to an already verified acknowledgement and checks its binding to the entry.
- The persistence primitive (F15.S02.M03 owns repositories and transaction(fn); it holds no outbox state machine of its own) and relay-to-relay forwarding of public records (F11.S02.M01 PeerOutbox).
- Issuing relay receipts, relay identity documents and restore announcements (F15.S02.M01 and F15.S03.M03); relay-side idempotency storage (F15.S02.M02).
- Service worker caching (F15.S01.M02) and install flow (F15.S01.M03); the outbox does not rely on the Background Sync API, which is missing in some supported browsers.
- Deciding which commands may be queued; each module flags its statements and relay commands deliveryEligible and declares the replay safety of each relay command, and consent, payment-claim and acceptance statements are signed only after live user confirmation on the exact revision, but may then be queued for delivery.
- Encrypting P2 statements to the participants' mailbox keys (the producing module encrypts; this module checks the envelope).
- Producing the vault export itself (F10.S01.M03); this module only shows the export age it is told about.
- Future: outbox encryption at rest with a passphrase-derived key; Future: automatic encrypted backup to a user-selected location.

## User stories

- As a member on a train without signal, I can publish a listing and see it as saved on my device and waiting to send, then see "reached relay" when my phone reconnects, and "peer confirmed" only when the counterparty's (or, for a publication, the relay's) signed acknowledgement of exactly what I sent arrives.
- As a member, when a queued offer collides with a newer signed revision from the other party, I see both versions and choose to prepare a new version or discard, never a silent overwrite.
- As a member, I am warned a day before an unsent action expires and can send it, keep it or discard it.
- As a member, I see whether my browser granted persistent storage, how much space is left and when I last exported my vault, with a warning after 30 days, or after 7 days when the browser refused persistent storage.
- As a member whose relay was restored from an older backup, the deliveries that relay lost are sent again without my intervention.

## Edge cases

- Browser kills the tab while an entry is sending; at next start entries in sending older than 60 s return to prepared and are resent with the same Idempotency-Key (relay command) or the same statement cid (statement), so the destination deduplicates within its idempotency window.
- Two tabs are open on reconnect; only the tab holding the Web Lock classrup-outbox-replay sends, the other observes through BroadcastChannel.
- IndexedDB is unavailable or over quota; enqueue fails inside the domain command's storage.transaction(fn), the whole transaction including the domain record rolls back, enqueue reports PLATFORM_OUTBOX_STORAGE_UNAVAILABLE and the UI says nothing was saved.
- The destination relay is stopped or removed; entries stay prepared with "relay unreachable, status unknown", other destinations keep flowing, and the user may re-route an entry to a different relay (the old entry is discarded as rerouted and a new entry is prepared) or discard it.
- A relay receipt arrives but the peer never acknowledges; the entry stays transport_acknowledged and shows "delivered to relay, peer has not confirmed" until createdAt + 30 days moves it to expired.
- A peer acknowledgement arrives before the relay receipt is recorded (or for a direct QR or file transfer that never has a receipt); the entry moves straight to peer_accepted.
- Two vaults signed conflicting promises (for example two acceptances for the same inventory); the receiving module reports the fork, the entry becomes conflict, dependent coordination is frozen and nothing is resolved by last-writer-wins.
- A relay command first attempted 25 h ago is retried; the relay no longer holds its idempotency record, so the command is resent only if it carries expectedRevision or a deterministic resource id, or a read-back shows it was not applied; otherwise the entry becomes conflict with "may already have been applied".
- A counterparty replays its old acknowledgement for a superseded cid after a rebase; the cid does not match the new entry and the ack is rejected with PLATFORM_OUTBOX_ACK_MISMATCH.
- A domain-module bug enqueues a plaintext P2 offer for a relay destination or a statement with a P3 address field; enqueue refuses and nothing is stored or sent.
- The destination relay publishes a signed restore announcement after restoring an older backup; entries whose receipts fall in the lost window return to prepared and are resent with the same cid or Idempotency-Key.
- The relay's key history shows two rotations signed by the same previous key; delivery to that relay is frozen with a warning and no receipt from either branch advances an entry.
- The browser evicts site data under storage pressure without persistence granted; on next start the module detects a missing database marker, shows a data-loss warning with the restore-from-export action and never fabricates entries.
- The relay clock is wrong; relay-signed receipt time is stored as evidence of that relay's clock only, never used to order or expire entries.

## UX and accessibility

- Sync status chip on every item with queued statements, with three distinct labels and icons: Saved on this device (Export prepared for a direct transfer), Reached relay (receipt), Confirmed by peer; a fourth Needs attention state for conflict and failed (including Rejected by relay with the relay's reason).
- Outbox sheet: entries per destination, newest first, with command label, creation time, state, attempts, and buttons Retry now, Cancel, Change relay, Export (direct transfers) and for conflicts Review.
- Conflict dialog: shows 'Your signed version' and 'Their signed version' for the changed fields, buttons Prepare a new version on theirs and Discard mine; for an unsafe late replay it says 'This action may already have been applied' with Check on relay, Send anyway as a new action and Discard.
- Expiry prompt: at day 6 lists unsent entries expiring within 24 h with Send now, Keep until expiry, Discard.
- Storage status panel: persistence granted yes/no with a Request persistence button, used and available space from estimate(), last export date with Export now, and a warning banner after 30 days without export (7 days when persistence is not granted).
- Relay warning banner: 'This relay restored an older backup; N items are being sent again' or 'This relay's identity is inconsistent; sending is paused'.

**States:** empty; prepared-offline; export-prepared; sending; transport-acknowledged; peer-accepted; conflict; failed; relay-rejected; expired; relay-frozen; storage-unavailable; storage-not-persistent; export-overdue

**Accessibility:** Sync state changes are announced through one aria-live polite region; conflicts use role=alertdialog with focus on the first action.; Sync state is conveyed by text and icon, never color alone, and the accessible names read "Saved on this device only", "Delivered to relay, peer has not confirmed", "Confirmed by peer".; All outbox and storage buttons are at least 44x44 px, keyboard operable with visible focus.; Timestamps use locale formatting through F14.S02.M01 and relative text carries the absolute time in a title.

## Owned data

- `OutboxEntry` (classrup.platform.outbox_entry/v1, P2, RET-SHORT)

## Interfaces

- Commands: `platform.outbox.enqueue`, `platform.outbox.deliver`, `platform.outbox.export_direct`, `platform.outbox.record_peer_ack`, `platform.outbox.resolve`, `platform.outbox.discard`, `platform.storage.request_persistence`, `platform.storage.record_export`
- Queries: `platform.outbox.list`, `platform.outbox.count_by_state`, `platform.storage.get_status`
- Emits: none
- Consumes: `privacy.deletion.completed`

## Dependencies

F15.S02.M02, F15.S02.M03, F15.S02.M01, F15.S04.M03, F11.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-116-01 | [Domain schema](domain_schema.md) | 4 |
| PS-116-02 | [Validation rules](validation_rules.md) | 6 |
| PS-116-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-116-04 | [Commands, queries and events](commands_queries_events.md) | 7 |
| PS-116-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-116-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-116-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-116-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-116-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-116-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/pwa/src/platform/offline/index.ts`.

## Acceptance criteria

- All tests T01-T33 pass in CI on Chromium, WebKit and Firefox profiles.
- A statement queued offline is delivered at most once per destination after reconnect, in creation order, regardless of tab crashes or duplicate deliveries inside the relay's idempotency window, and a late relay command is never blindly re-applied.
- A conflicting queued action is never applied without the user's explicit choice, relay receipts are never presented as peer acceptance, and an acknowledgement counts only for the exact cid it signs.
- No P2 plaintext is ever queued for a relay and no P3/P4 data is ever queued.
- Storage status shows persistence, quota and a warning after 30 days without export (7 days without persistence); no queued data remains after the vault is erased.
