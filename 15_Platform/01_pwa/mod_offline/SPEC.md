# F15.S01.M01 — Offline outbox

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S01](../SPEC.md). **Process IDs:** PS-116-01…PS-116-10. **Code:** `apps/pwa/src/platform/offline`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The PWA is the product and works with no server after install: every domain command commits first in the user's IndexedDB vault. This module is the vault's sync outbox. Whatever must reach another party or a user-selected relay (a signed statement such as a published listing, offer or consent, or a relay command such as an index write) is placed in a per-destination outbox (idb 8.0.4) and moves through the honest states prepared, transport_acknowledged (relay receipt) and peer_accepted (signed peer acknowledgement). The UI never shows more certainty than the reached state. Entries replay in creation order with the original Idempotency-Key for relay commands (CTR-IDM-001 IDM-1, IDM-4, IDM-5, IDM-7), conflicts are never merged automatically, and unsent entries expire after 7 days following a prompt. The module also reports storage status (persistence grant, quota, eviction warnings, last-export age with a 30-day warning).

## Responsibilities

- Own the OutboxEntry record in the IndexedDB database classrup-outbox (stores entries and meta; indexes bySeq, byDestination, byStatus) and its lifecycle from prepared to a terminal state.
- Queue signed statements (CTR-FED-001 envelopes) and relay commands per destination (relay id or direct peer), capped at 200 entries and 5 MiB per principal, and expose the reached sync state to the UI.
- Deliver strictly in creation order per destination with CTR-IDM-001 IDM-4 backoff (base 500 ms, cap 30 s, full jitter, 6 attempts), serialized across tabs by the Web Locks API, and record relay receipts and verified peer acknowledgements.
- Surface conflicts (relay CONFLICT_*, peer rejection, forked conflicting signed promise reported by the receiving module) as a resolve-or-discard prompt and expire unsent entries 7 days after creation after a day-6 warning.
- Report vault storage status through navigator.storage.persist() and estimate(), eviction warnings and last-export age (warn at 30 days, per CTR-IOX-001 IOX-6).

## Not responsible for

- Verifying incoming signed statements and quarantine (F11 federation modules and the receiving domain module); this module only accepts an already verified acknowledgement reference.
- Relay-side idempotency storage, mailboxes and receipts (relay modules F15.S02.M01 and F15.S02.M02).
- Service worker caching (F15.S01.M02) and install flow (F15.S01.M03); the outbox does not rely on the Background Sync API, which is missing in some supported browsers.
- Deciding which commands may be queued; each module flags its statements and relay commands deliveryEligible, and consent, payment-claim and acceptance statements are signed only after live user confirmation on the exact revision, but may then be queued for delivery.
- Producing the vault export itself (F10.S01.M03); this module only shows the export age it is told about.
- Future: outbox encryption at rest with a passphrase-derived key; Future: automatic encrypted backup to a user-selected location.

## User stories

- As a member on a train without signal, I can publish a listing and see it as saved on my device and waiting to send, then see "reached relay" when my phone reconnects, and "peer confirmed" only when the counterparty's signed acknowledgement arrives.
- As a member, when a queued offer collides with a newer signed revision from the other party, I see both versions and choose to rebase or discard, never a silent overwrite.
- As a member, I am warned a day before an unsent action expires and can send it, keep it or discard it.
- As a member, I see whether my browser granted persistent storage, how much space is left and when I last exported my vault, with a warning after 30 days.

## Edge cases

- Browser kills the tab while an entry is sending; at next start entries in sending older than 60 s return to prepared and are resent with the same Idempotency-Key (relay command) or the same statement cid (statement), so the destination deduplicates.
- Two tabs are open on reconnect; only the tab holding the Web Lock classrup-outbox-replay sends, the other observes through BroadcastChannel.
- IndexedDB is unavailable or over quota; enqueue returns PLATFORM_OUTBOX_STORAGE_UNAVAILABLE, the domain command that needed it aborts before commit, and the UI says nothing was saved.
- The destination relay is stopped or removed; entries stay prepared with "relay unreachable, status unknown", other destinations keep flowing, and the user may re-route an entry to a different relay or discard it.
- A relay receipt arrives but the peer never acknowledges; the entry stays transport_acknowledged and shows "delivered to relay, peer has not confirmed" until the 30-day timeout moves it to expired.
- Two vaults signed conflicting promises (for example two acceptances for the same inventory); the receiving module reports the fork, the entry becomes conflict, dependent coordination is frozen and nothing is resolved by last-writer-wins.
- The browser evicts site data under storage pressure without persistence granted; on next start the module detects a missing database marker, shows a data-loss warning with the restore-from-export action and never fabricates entries.
- The relay clock is wrong; relay-signed receipt time is stored as evidence of that relay's clock only, never used to order or expire entries.

## UX and accessibility

- Sync status chip on every item with queued statements, with three distinct labels and icons: Saved on this device, Reached relay (receipt), Confirmed by peer; a fourth Needs attention state for conflict and failed.
- Outbox sheet: entries per destination, newest first, with command label, creation time, state, attempts, and buttons Retry now, Cancel, Change relay and for conflicts Review.
- Conflict dialog: shows 'Your signed version' and 'Their signed version' for the changed fields, buttons Prepare a new version on theirs and Discard mine.
- Expiry prompt: at day 6 lists unsent entries expiring within 24 h with Send now, Keep until expiry, Discard.
- Storage status panel: persistence granted yes/no with a Request persistence button, used and available space from estimate(), last export date with Export now, and warning banner after 30 days without export.

**States:** empty; prepared-offline; sending; transport-acknowledged; peer-accepted; completed; conflict; failed; expired; storage-unavailable; storage-not-persistent; export-overdue

**Accessibility:** Sync state changes are announced through one aria-live polite region; conflicts use role=alertdialog with focus on the first action.; Sync state is conveyed by text and icon, never color alone, and the accessible names read "Saved on this device only", "Delivered to relay, peer has not confirmed", "Confirmed by peer".; All outbox and storage buttons are at least 44x44 px, keyboard operable with visible focus.; Timestamps use locale formatting through F14.S02.M01 and relative text carries the absolute time in a title.

## Owned data

- `OutboxEntry` (classrup.platform.outbox_entry/v1, P2, RET-SHORT)

## Interfaces

- Commands: `platform.outbox.enqueue`, `platform.outbox.deliver`, `platform.outbox.record_peer_ack`, `platform.outbox.resolve`, `platform.outbox.discard`, `platform.storage.request_persistence`, `platform.storage.record_export`
- Queries: `platform.outbox.list`, `platform.outbox.count_by_state`, `platform.storage.get_status`
- Emits: none
- Consumes: none

## Dependencies

F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-116-01 | [Domain schema](domain_schema.md) | 3 |
| PS-116-02 | [Validation rules](validation_rules.md) | 3 |
| PS-116-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-116-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-116-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-116-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-116-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-116-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-116-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-116-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/pwa/src/platform/offline/index.ts`.

## Acceptance criteria

- All tests T01-T21 pass in CI on Chromium, WebKit and Firefox profiles.
- A statement queued offline is delivered at most once per destination after reconnect, in creation order, regardless of tab crashes or duplicate deliveries, and the UI shows only the state actually reached.
- A conflicting queued action is never applied without the user's explicit choice, and relay receipts are never presented as peer acceptance.
- Storage status shows persistence, quota and a warning after 30 days without export; no queued data remains after the vault is erased.
