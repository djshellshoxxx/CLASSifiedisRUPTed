# F01.S01.M01 — Listing creation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S01](../SPEC.md). **Process IDs:** PS-002-01…PS-002-10. **Code:** `packages/bazaar/src/listings/create`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Creates and owns the Listing record in the principal's local vault. A listing starts as a private draft (P3, vault only, schema classrup.bazaar.listing_record/v1) with kind, title, description, category, condition, media references and a coarse region (L1 or L2 geohash). It never stores an exact address. Later lifecycle changes (publish, renew, expire, close, archive) are applied by sibling modules through narrow system commands on this module, so Listing keeps a single owner. Publishing is done by F01.S01.M03 as a separate signed public projection statement (classrup.bazaar.listing/v1); this module never talks to a relay, and no relay notice can change a Listing (ADR-0016 §3, §8).

## Responsibilities

- [object Object]
- Enforce draft limits (50 drafts per vault), field limits and the location ceiling of L2 (geohash length 5).
- Expose the vault-local commands apply_status and apply_edit that F01.S01.M02, F01.S01.M03 and F01.S01.M04 use inside their own transactions.
- Purge drafts untouched for 180 days after a 14-day in-app warning.
- Register the F10 privacy ports (export section, deletion plan, retention purge) for Listing records and classify every field (N6).

## Not responsible for

- Revision history and material-change detection (F01.S01.M02).
- Policy checks, signing and relay submission of the public projection (F01.S01.M03).
- Expiry, archive, restore and sold/given/traded marking (F01.S01.M04).
- [object Object]
- Storing listings authored by other principals; verified mirrors of them are kept by F11.S01.M02.
- Relay hosting decisions; a relay's removal of a projection changes only that relay's delivery state in F01.S01.M03.
- Future: photo upload pipeline owner; this module only holds content-addressed media references.

## User stories

- As a seller, I can start a listing offline, add photos and a coarse region, and finish it later; nothing leaves my device until I publish.
- As a seller without location permission, I can pick my region by name and the app stores only a 5-character area cell, never coordinates.
- As a member, I can delete a draft I no longer want and know it is gone from my vault.

## Edge cases

- Client sends latitude/longitude or a street address field; the whole command is rejected with BAZAAR_LISTING_LOCATION_TOO_PRECISE and nothing is stored.
- A photo still carries GPS EXIF data; the media reference is rejected with BAZAAR_LISTING_MEDIA_INVALID until the image is re-encoded.
- The category was retired by a newer policy pack between picking and saving; creation fails with BAZAAR_LISTING_CATEGORY_INVALID and the UI offers the replacement category.
- The same create command is replayed after a crash with the same Idempotency-Key; the original result is returned and one draft exists.
- The 51st draft is created; BAZAAR_LISTING_DRAFT_LIMIT is returned and the UI offers to delete old drafts.
- Two devices of the same principal edit the same draft; the second apply_edit gets CONFLICT_REVISION and is never auto-merged.
- A relay removes the published projection from its index; the Listing stays published in the vault and only that relay's delivery in F01.S01.M03 becomes relay_removed.
- A listing expired before the owner sold it in person; the owner closes it directly from expired without republishing.

## UX and accessibility

- Create listing wizard: kind chooser, title (3-120), description (up to 5000, counter), category picker (tree, depth 4), condition, up to 10 photos, region picker (name search or map snapped to 5-character cell, shows the approximate area size).
- Drafts list: sorted by last edit, shows days until automatic purge when under 14, delete with confirm dialog.

**States:** loading; empty; saving-local; saved-local; error; conflict; over-limit

**Accessibility:** Every field has a visible label; character counters are announced politely (aria-live polite) at 90 percent and 100 percent of the limit.; Region picker is operable by keyboard and offers a text search alternative to the map.; Delete draft uses an accessible confirm dialog with buttons of at least 44x44 px.

## Owned data

- `Listing` (classrup.bazaar.listing_record/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `bazaar.listing.create`, `bazaar.listing.delete`, `bazaar.listing.apply_status`, `bazaar.listing.apply_edit`
- Queries: `bazaar.listing.get`, `bazaar.listing.list_mine`
- Emits: `bazaar.listing.created`, `bazaar.listing.deleted`
- Consumes: none

## Dependencies

F18.S01.M03, F15.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-002-01 | [Domain schema](domain_schema.md) | 3 |
| PS-002-02 | [Validation rules](validation_rules.md) | 3 |
| PS-002-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-002-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-002-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-002-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-002-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-002-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-002-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-002-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listings/create/index.ts`.

## Acceptance criteria

- All tests T01-T19 pass in CI.
- No draft or listing payload leaves the device from this module (network spy test).
- No stored Listing field can hold coordinates or an address, region cells never exceed 5 characters, and no relay notice changes Listing.status.
