# PS-001-07 — Privacy, retention and abuse: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-07.R01** Close references and reasons are P1 vault data and are never put in public events beyond the reason enum.
- **PS-001-07.R02** Archived listings keep content for 90 days; unreferenced content is then purged at purgeAt = min(restoreUntil, deletionRequestedAt + 30 d) and replaced by a tombstone kept 180 days (CTR-PRV-001), while records cited by an Offer, Negotiation or Deal keep their evidence fields until evidenceUntil.
- **PS-001-07.R03** A sold marking is an owner assertion; the UI never presents it as verified payment or delivery.
- **PS-001-07.R04** The module registers ExportSectionPort (section bazaar.archive_records), DeletionPort and RetentionPurgePort with F10 (N6), annotates every ArchiveRecord field with its F10.S02.M02 class, and pseudonymizes retained records on privacy.deletion.completed.

## Specification

**Data classification**
- ArchiveRecord: P1; closedWithRef is an owner assertion unless verified is true; field classes annotated per F10.S02.M02.
- bazaar.listing.closed payload: listingId, ownerId and the reason enum only; no reference to a Deal, cycle or request.

**Retention**
- ArchiveRecord: RET-EVIDENCE when referenced (until evidenceUntil, pseudonymized after principal deletion); otherwise purged with the listing content at purgeAt.
- Tombstone {id, type, deletedAt}: 180 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Fake sold marking to hide a listing from competitors or to fake popularity | marking is local, labelled owner-asserted, never feeds reputation without the counterparty's signed receipt (F09/F07) |
| T02 | Resurrecting a listing a relay removed under its policy | restore returns to unpublished; publication re-runs policy checks and each relay applies its own policy again |
| T03 | Content kept after the owner asked for deletion | purge sweep at 30 days after privacy.deletion.requested; crypto-shred of blob keys; only evidence fields of referenced records remain, pseudonymized |
| T04 | Public close event links a listing to a counterparty transaction | closedWithRef kept only in the P1 ArchiveRecord; contract test asserts the closed payload key set |
| T05 | Close silently breaks a buyer's reservation | Deal-linked holds are converted for the closing Deal or released only with commerce.deal.cancel and a signed release to the buyer |

**Abuse controls**
- At most 100 close/archive/restore commands per hour per vault.
- Restore count per listing limited to 5 to prevent repost churn.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T02 | contract | PS-001-07.R01 | close A and inspect bazaar.listing.closed | payload key set equals {listingId, ownerId, closeReason}; no closedWithRef or reference id |
| TEST-PS-001-09.T11 | integration | PS-001-07.R03 | mark sold and view the listing and its history | UI never shows sold as verified without a signed counterparty record |
| TEST-PS-001-09.T19 | integration | PS-001-01.R03, PS-001-07.R02 | purge C with an accepted offer citing it and D without references, then privacy.deletion.requested and completed | C keeps evidence fields until evidenceUntil with ownerId pseudonymized and keepEvidence passed to F01.S01.M01; D purged at min(restoreUntil, request + 30 d) with a tombstone |
| TEST-PS-001-09.T20 | integration | PS-001-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.archive_records present with field classes; deletion plan archives and pseudonymizes; purge honours purgeAt and evidenceUntil |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
