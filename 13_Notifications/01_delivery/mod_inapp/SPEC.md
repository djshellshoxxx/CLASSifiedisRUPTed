# F13.S01.M03 — in-app notice consumer

**Status:** SPECIFIED — REVIEW PENDING. **Owner:** F13.S01.M03. **No application implementation or product test evidence.** Process IDs/statuses remain in the canonical registry.

## Purpose and boundary

While the PWA is running and the local vault is unlocked, turn a small allowlist of already validated F15 local events into generic, local-only in-app notices for the active local principal. Notices help a person revisit state recorded on this device. They do not notify another person, prove delivery, create consent, confirm payment, establish handoff, or promise that an event will be processed while the browser is closed.

This module does not call a network endpoint, schedule a service worker, use browser/OS push, send email, or require a product backend, central account, server key, remote identity, or global clock. User-selected external notification transports are outside this contract and remain disabled until separately specified and opted into.

## Event allowlist and exact display meaning

Consume only F15 CR-003 event version 1, in the current vault and principal, when the event has passed F15 schema and local authorization checks. The allowlist is closed:

| Source event | Category / localization key | Generic meaning shown in this device |
|---|---|---|
| `listing.published` | `listing` / `listing.published.local` | A listing was published into this device's approved local view; no remote audience is implied. |
| `reservation.created` | `reservation` / `reservation.created.local` | A reservation was recorded in this vault only. |
| `cycle.proposed` | `cycle` / `cycle.proposed.local` | A cycle proposal was saved locally; remote participants were not notified. |
| `cycle.consent_recorded` | `cycle` / `cycle.consent_recorded.local` | Consent evidence was recorded in this vault; this does not identify who signed, mean all parties agreed, or mean anything is globally locked. |

All other event names, versions, malformed events, remote acknowledgments, `message.sent`, payment evidence, imports, and unknown future events produce no notice. Unknown events are not interpreted by prefix or alias. Event payload strings are never used to form UI copy. The bundled, versioned localization catalog owns the four generic title/body pairs; this module stores only the catalog key. No sensitive title, message text, address, payment detail, identity key, or arbitrary event payload appears in notice content, previews, logs, or accessibility labels.

## Preference boundary

F13.S02 owns the user's preference record, opt-in, category controls and quiet-hours rules. This module consumes a read-only resolver contract and does not store or reinterpret those settings:

`resolveInApp({vault_id, principal_id, category, advisory_local_time_ms}) -> PreferenceDecision`, where the exact tagged union is `{state: READY, inbox: DISABLED, banner: DISABLED}`, `{state: READY, inbox: ENABLED, banner: ENABLED|DISABLED|QUIET}`, or `{state: UNAVAILABLE}`. `DISABLED/DISABLED` is the only valid disabled combination; a disabled inbox with an enabled or quiet banner is malformed. An absent/unconfigured preference resolves to `DISABLED/DISABLED`; a resolver error, unknown enum, malformed combination, or unavailable preference returns `POLICY_UNAVAILABLE` and leaves the event cursor unadvanced for retry. `ENABLED/QUIET` stores an item silently in the inbox. The resolver alone decides quiet hours from advisory local wall time; that time is not trusted for expiry, deadlines, settlement, or cross-device ordering. If the resolver is not implemented, notices fail closed. Preferences are not inferred from operating-system settings.

## Local operation and guarantees

The consumer runs only in an unlocked, active PWA session. It reads committed events from the F15 local event store, processes at most 100 events in one transaction, and continues in bounded batches while the app is active. On a later open/unlock, it may catch up from the persisted local cursor. There is no background execution, closed-browser delivery, push, email, remote fanout, or guaranteed catch-up deadline.

Notice insertion and the local `(consumer_id, event_id)` processing marker commit atomically in the same vault transaction. `consumer_id` is `F13.inapp.v1`. Duplicate delivery of the same event returns the existing result and never creates a second notice. A retry with a new command ID cannot create a duplicate. If a source event conflicts with an already processed event ID, quarantine it and do not replace the existing notice. The cursor advances atomically with a terminal committed notice, explicit preference suppression, or bounded terminal rejection marker. F15 supplies an opaque local source_position for its iterator. Unsupported/malformed events commit a rejected outcome keyed by (consumer_id,source_position), with event_id only if valid, then advance past that exact source position in the same transaction; no raw payload is retained. Restart skips the marked rejection and can reach the next event. Policy/storage unavailability and cap pause never advance or create terminal suppression. Iterator position is local only and its producer contract still requires F15 review.

Persistent notices may use only F15's approved protected-local-store capability. Until F15 defines and reviews that capability, no durable notice storage is approved. A F15-provided volatile mode may display only generic allowlisted copy in memory, visibly labelled “This session only; not saved”; it is cleared on reload, lock, or close and creates no persisted read state. No fallback writes to localStorage, plaintext IndexedDB, a service worker, or a remote store.

## Read model, access and lifecycle

The owner is the active local vault/principal. Queries and mutations always bind to that unlocked context; callers cannot supply a different owner. The inbox returns a stable, cursor-paged list ordered by a per-vault local creation sequence, not by timestamp. F15 increments that vault-local counter atomically with a stored notice and consumer marker. This sequence is only local to that vault and establishes no cross-vault or global order. Each page cursor is the exact bounded form specified in [commands and queries](commands_queries_events.md). `unread` and `read` are local view states only. A notice can transition `unread -> read -> deleted` or, after explicit confirmation, `unread -> deleted`; deletion is terminal. Opening the inbox does not mark all items read. Explicit “Mark read” changes only this vault's notice view. It is never a source-event ACK, peer receipt, consent record, payment evidence, handoff claim, or remote read receipt.

On app lock, clear volatile notice content. On principal switch, clear the old principal's in-memory view before binding the new one. Missing, deleted, expired, quarantined, or foreign-owner targets resolve as unavailable and are not disclosed. A notice may link only to a still-authorized local object; it does not make that object current or valid.

## Bounds and retention summary

Each stored notice is at most 4,096 UTF-8 bytes in its canonical representation; at most 1,000 notices are retained per vault. If space is needed, prune oldest read rows by local_sequence in the same transaction. Unread items are never automatically evicted or age-purged; the person must explicitly delete them. If the cap remains full, processing pauses with RATE_LIMITED_LOCAL and the cursor stays pending. The proposed default auto-purge age is 30 advisory local days for read rows only; F10 must approve the actual setting. If local clock validity/order is uncertain, automatic age cleanup pauses. Clock changes are housekeeping only, never a trusted time guarantee. The event dedupe marker remains while its source event can be replayed. NoticeSequenceStateV1.last_local_sequence is a per-vault ordering token, not global sequence or time.

## Ownership and dependencies

F15 owns vault persistence, local transaction boundaries, event storage, ID generation, revisions, command receipts and the protected-store capability. F07 supplies the unlocked local principal context. F16 supplies default-deny local capabilities. F10 owns retention, export and deletion policy. F13.S02 owns preference records and the resolver implementation. F14 owns accessible presentation and localization behavior. F17 owns future test evidence. This module defines the consumer boundary only and does not duplicate those records or promise their unfinished interfaces are implemented.

The ten process contracts below specify schema, validation, state, commands, capabilities, recovery, privacy, local budgets, test oracles, and import/export behavior. **Specified** means a reviewable proposal; independent architecture/privacy review and implementation remain outstanding.

## Process specification inventory (planning/SPEC_REGISTRY.csv is canonical)

**Inventory:** 10 registered contracts; status reflects the registry only.
- [domain_schema.md](domain_schema.md) — `PS-103-01`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [validation_rules.md](validation_rules.md) — `PS-103-02`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [workflow_state_machine.md](workflow_state_machine.md) — `PS-103-03`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [commands_queries_events.md](commands_queries_events.md) — `PS-103-04`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [authorization_capabilities.md](authorization_capabilities.md) — `PS-103-05`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — `PS-103-06`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — `PS-103-07`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [observability_performance.md](observability_performance.md) — `PS-103-08`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — `PS-103-09`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — `PS-103-10`; registry status: **SPECIFIED_REVIEW_PENDING**.
