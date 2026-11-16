# F01.S01.M04 — Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S01](../SPEC.md). **Process IDs:** PS-001-01…PS-001-10. **Code:** `packages/bazaar/src/listings/archive`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Ends the visible life of a listing in the owner's vault: automatic expiry at the publication deadline, owner archive, restore within 90 days, and marking a listing sold, given, traded or fulfilled. Closing and archiving first end the publication (tombstone statement to the relays that received it) through F01.S01.M03. Stale sweeps close sold-out listings and archive old expired or closed ones. Removal from search happens because relays and local indexes consume the signed tombstone and the local events; copies already fetched by others cannot be recalled.

## Responsibilities

- Own ArchiveRecord, the end-of-life record of a listing (expired, closed or archived) with restoreUntil and purgeAt.
- Run the local expiry sweep (every 5 minutes while the app is open and at app start) that moves published listings past expiresAt to expired.
- Archive on request, auto-archive expired and closed listings after 30 days, restore archived listings within 90 days, and purge after 90 days.
- Mark listings sold, given, traded or fulfilled with an optional reference to the Deal or trade that closed them, and close sold-out listings after 7 days with no stock.
- Handle account deletion requests by ending publications and archiving all own listings.

## Not responsible for

- Listing record and status field (F01.S01.M01), publication and tombstone signing (F01.S01.M03).
- Inventory quantities and holds (F01.S03.M01); this module only reads whether stock is zero.
- Search index removal (F06.S01.M01 consumes the events).
- Deal completion and trade execution (F09, F02); a close reference is evidence supplied by the owner, not proof.
- Future: bulk archive and automatic relisting rules.

## User stories

- As a seller, I can mark my item sold and know buyers who had offers are told the listing is closed.
- As a seller, I can archive a listing and restore it within 90 days without losing its history.
- As a seller, I am told 3 days before my listing expires and can renew it.
- As a giver, I can mark a giveaway as given to the chosen recipient.

## Edge cases

- The app was closed for a week; at start the expiry sweep expires every overdue listing in one batch and emits one event per listing.
- Owner marks a listing sold while it has an active inventory hold; the close is refused with BAZAAR_ARCHIVE_HOLD_ACTIVE unless the owner confirms releasing the hold.
- Restore is requested on day 91; BAZAAR_ARCHIVE_RESTORE_EXPIRED is returned and the owner can relist as a new draft copy.
- Restore is requested while the owner already has 50 drafts or 100 publications; the restored listing becomes unpublished and publishing is limited by F01.S01.M03.
- Device clock jumps back; the sweep never un-expires and never expires earlier than expiresAt as seen in the last signed receipt time minus 24 h.
- Close command replayed after a crash; one ArchiveRecord and one tombstone exist.
- Mark traded with a reference to a cycle that was not completed; the record stores the reference as owner-asserted and labels it unverified.

## UX and accessibility

- My listings with tabs Active, Ended, Archived; actions Renew, Mark sold or given, Archive, Restore.
- Mark as sheet: reason (sold, given, traded, fulfilled, other), optional link to a deal or trade, warning about active holds.
- Expiry reminder banner 3 days before expiry with Renew button.

**States:** loading; empty; saving-local; expiring-soon; expired; closed; archived; restorable; restore-expired; conflict

**Accessibility:** Tabs follow the ARIA tabs pattern and are keyboard operable.; Expiry countdown is text with a date, not only a visual bar; reminders are announced politely.; Destructive actions use accessible confirm dialogs with 44x44 px buttons.

## Owned data

- `ArchiveRecord` (classrup.bazaar.archive_record/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.listing.close`, `bazaar.listing.archive`, `bazaar.listing.restore`, `bazaar.listing.expire`
- Queries: `bazaar.archive_record.list_mine`, `bazaar.archive_record.get`
- Emits: `bazaar.listing.expired`, `bazaar.listing.archived`, `bazaar.listing.restored`, `bazaar.listing.closed`
- Consumes: `bazaar.inventory.depleted`, `bazaar.inventory.restocked`, `privacy.deletion.requested`

## Dependencies

F01.S01.M01, F01.S01.M03, F01.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-001-01 | [Domain schema](domain_schema.md) | 3 |
| PS-001-02 | [Validation rules](validation_rules.md) | 3 |
| PS-001-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-001-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-001-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-001-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-001-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-001-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-001-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-001-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listings/archive/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Closing or archiving a published listing always ends its publication and queues a tombstone.
- Restore never republishes, and no sold marking is displayed as verified without a signed counterparty record.
