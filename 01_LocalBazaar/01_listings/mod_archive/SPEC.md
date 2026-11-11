# F01.S01.M04 — Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S01](../SPEC.md). **Process IDs:** PS-001-01…PS-001-10. **Code:** `packages/bazaar/src/listings/archive`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Ends the visible life of a listing in the owner's vault: automatic expiry at the publication deadline, owner archive, restore within 90 days, and marking a listing sold, given, traded or fulfilled, also directly from expired. Closing and archiving first end the publication (tombstone statement to the relays that received it) through F01.S01.M03. The expiry sweep never expires a listing that still carries Deal-linked or cycle holds: it renews within the publication cap or defers the local expiry. Holds are never released silently: the hold of the Deal that closed the sale is converted and other Deal-linked holds need an explicit Deal cancellation. Stale sweeps close sold-out listings and archive old expired or closed ones; purge keeps what offers, negotiations and deals cite as evidence. Removal from search happens because relays and local indexes consume the signed tombstone and the local events; copies already fetched by others cannot be recalled.

## Responsibilities

- Own ArchiveRecord, the end-of-life record of a listing (deferred, expired, closed or archived) with restoreUntil, purgeAt and evidenceUntil.
- Run the local expiry sweep (every 5 minutes while the app is open and at app start) that moves published listings past expiresAt to expired, unless Deal-linked or cycle holds require renewal or deferral.
- Archive on request, auto-archive expired and closed listings after 30 days, restore archived listings within 90 days, and purge unreferenced content after 90 days.
- Mark listings sold, given, traded or fulfilled with an optional reference to the Deal or trade that closed them, converting the matching hold, and close sold-out listings after 7 days with no stock.
- Handle principal deletion requests by ending publications and archiving all own listings.
- Register the F10 privacy ports and pseudonymize retained evidence records after principal deletion (N6).

## Not responsible for

- Listing record and status field (F01.S01.M01), publication and tombstone signing (F01.S01.M03).
- Inventory quantities and holds (F01.S03.M01); this module reads holds and asks for conversion or release, it never edits them directly.
- Cycle holds (F02.S03.M02 is their only driver); a listing with an active cycle hold cannot be closed or archived here until the owner leaves the cycle in LocalMutiny.
- Search index removal (F06.S01.M01 consumes the events).
- Deal completion, cancellation semantics and trade execution (F09, F02); a close reference is evidence supplied by the owner, not proof.
- Future: bulk archive and automatic relisting rules.

## User stories

- As a seller, I can mark my item sold and know buyers who had offers are told the listing is closed.
- As a seller, I can archive a listing and restore it within 90 days without losing its history.
- As a seller, I am told 3 days before my listing expires and can renew it.
- As a giver, I can mark a giveaway as given to the chosen recipient.
- As a cycle participant, my listing does not expire under me while my item is reserved for a cycle I consented to.

## Edge cases

- The app was closed for a week; at start the expiry sweep expires every overdue listing in one batch and emits one event per listing.
- Owner marks a listing sold to the buyer of Deal D; the hold linked to D is converted and the close succeeds without releasing anything.
- Owner marks a listing sold while a hold is linked to a different open Deal; the close is refused with BAZAAR_ARCHIVE_HOLD_ACTIVE unless the owner also cancels that Deal, which sends a signed release to its buyer.
- Restore is requested on day 91; BAZAAR_ARCHIVE_RESTORE_EXPIRED is returned and the owner can relist as a new draft copy.
- Restore is requested while the owner already has 50 drafts or 100 publications; the restored listing becomes unpublished and publishing is limited by F01.S01.M03.
- Device clock jumps back or forward; the sweep never un-expires and never expires earlier than expiresAt judged against the median of the latest receipts of at least 2 relays; one relay with receipts far in the future is ignored.
- Close command replayed after a crash; one ArchiveRecord and one tombstone exist.
- Mark traded with a reference to a cycle that was not completed; the record stores the reference as owner-asserted and labels it unverified.
- A listing with a 14-day cycle hold reaches its expiry on day 10; the sweep renews the publication instead of expiring it, and records the extension.
- An expired listing is published again through F01.S01.M03; the expired record closes as superseded and the listing is live again.
- A listing expired before the in-person sale; the owner closes it as sold directly from expired.

## UX and accessibility

- My listings with tabs Active, Ended, Archived; actions Renew, Mark sold or given, Archive, Restore.
- Mark as sheet: reason (sold, given, traded, fulfilled, other), optional link to a deal or trade, list of active holds with what will happen to each (converted, Deal cancelled and buyer told, cycle hold blocks the close).
- Expiry reminder banner 3 days before expiry with Renew button; extended-because-reserved note when the sweep renewed or deferred.

**States:** loading; empty; saving-local; expiring-soon; deferred; expired; closed; archived; restorable; restore-expired; conflict

**Accessibility:** Tabs follow the ARIA tabs pattern and are keyboard operable.; Expiry countdown is text with a date, not only a visual bar; reminders are announced politely.; Destructive actions use accessible confirm dialogs with 44x44 px buttons.

## Owned data

- `ArchiveRecord` (classrup.bazaar.archive_record/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.listing.close`, `bazaar.listing.archive`, `bazaar.listing.restore`, `bazaar.listing.expire`
- Queries: `bazaar.archive_record.list_mine`, `bazaar.archive_record.get`
- Emits: `bazaar.listing.expired`, `bazaar.listing.archived`, `bazaar.listing.restored`, `bazaar.listing.closed`
- Consumes: `bazaar.inventory.depleted`, `bazaar.inventory.restocked`, `bazaar.listing.published`, `privacy.deletion.requested`, `privacy.deletion.completed`

## Dependencies

F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-001-01 | [Domain schema](domain_schema.md) | 3 |
| PS-001-02 | [Validation rules](validation_rules.md) | 4 |
| PS-001-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-001-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-001-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-001-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-001-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-001-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-001-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-001-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listings/archive/index.ts`.

## Acceptance criteria

- All tests T01-T21 pass in CI.
- Closing or archiving a published listing always ends its publication and queues a tombstone, and never releases a Deal-linked hold without the Deal's cancellation.
- Restore never republishes, no listing with an active cycle or Deal-linked hold expires under the sweep, and no sold marking is displayed as verified without a signed counterparty record.
