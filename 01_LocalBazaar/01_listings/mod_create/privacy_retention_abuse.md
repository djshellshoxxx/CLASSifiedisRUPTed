# PS-002-07 — Privacy, retention and abuse: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-07.R01** Drafts are P3 and never enter logs, events with payload content, exports to others or relay storage.
- **PS-002-07.R02** Records are retained RET-STANDARD until the owner deletes them; deletion writes a tombstone and purges content and blob keys within 30 days.
- **PS-002-07.R03** Location precision is capped at L2 in the schema and re-checked before any projection leaves the vault.
- **PS-002-07.R04** The module registers ExportSectionPort (section bazaar.listings), DeletionPort and RetentionPurgePort with F10 (N6) and annotates every Listing field with its F10.S02.M02 class; unannotated fields fail the CI lint.

## Specification

**Data classification**
- Listing draft: P3 (owner only); published fields are copied into a signed P0 projection by F01.S01.M03; field classes annotated per F10.S02.M02.
- media alt text: P3 in the draft and P0 inside the signed projection; it is author-written plain text and is never interpreted as markup.
- regionCell: at most geohash 5 (about 4.9 km x 4.9 km); coordinates are never stored.

**Retention**
- Listing: RET-STANDARD; deleted listings keep a tombstone {id, type, deletedAt} for 180 days.
- Command-key table: RET-SHORT 24 h.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Location leak through precise region or EXIF | schema rejects cells longer than 5 and any coordinate key; media check rejects GPS tags (PRV-4); region picker snaps to the cell before the command is built |
| T02 | Draft content exposed to a relay or third party | drafts have no statement type and no sync-outbox destination; contract test asserts no network call during create/edit/delete |
| T03 | Draft flooding exhausting device storage | 50-draft cap, 10 media per listing, 5 MiB per image, storage quota warning at 80 percent |
| T04 | Malicious imported listing carrying another owner's id | import re-validates ownerId equals local principal, else records are kept only as read-only mirrors by F11.S01.M02 |
| T05 | A relay unpublishes a user's own listing by notice | relay notices are not an apply_status reason (V12); only the delivery state of that relay changes in F01.S01.M03 |

**Abuse controls**
- Local-only rate guard: at most 30 create commands per hour per vault to stop runaway scripts.
- Text fields are stored as plain text; HTML is never interpreted.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T04 | integration | PS-002-03.R03, PS-002-07.R02 | delete draft | tombstone with id, type, deletedAt exists; content and blob keys purged after 30 days (clock advance) |
| TEST-PS-002-09.T10 | abuse | PS-002-07.R01, PS-002-07.R03, PS-002-09.R03 | create with lat/lon, region of 6 characters and GPS jpeg | all rejected; log scan finds no P3 values |
| TEST-PS-002-09.T19 | integration | PS-002-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.listings lists every own listing with field classes; deletion plan tombstones and purges all; CI lint fails on an injected unannotated field |

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
