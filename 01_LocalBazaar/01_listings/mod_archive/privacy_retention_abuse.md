# PS-001-07 — Privacy, retention and abuse: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-07.R01** Close references and reasons are P1 vault data and are never put in public events beyond the reason enum.
- **PS-001-07.R02** Archived listings keep content for 90 days, then are purged and replaced by a tombstone kept 180 days (CTR-PRV-001).
- **PS-001-07.R03** A sold marking is an owner assertion; the UI never presents it as verified payment or delivery.

## Specification

**Data classification**
- ArchiveRecord: P1; closedWithRef is an owner assertion unless verified is true.
- bazaar.listing.closed payload: reason enum and optional reference id only.

**Retention**
- ArchiveRecord: RET-EVIDENCE; purge of listing content at restoreUntil (90 days after archive).
- Tombstone {id, type, deletedAt}: 180 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Fake sold marking to hide a listing from competitors or to fake popularity | marking is local, labelled owner-asserted, never feeds reputation without the counterparty's signed receipt (F09/F07) |
| T02 | Resurrecting a listing a relay removed under its policy | restore returns to unpublished; publication re-runs policy checks and each relay applies its own policy again |
| T03 | Content kept after the owner asked for deletion | purge sweep at 30 days after privacy.deletion.requested; crypto-shred of blob keys |

**Abuse controls**
- At most 100 close/archive/restore commands per hour per vault.
- Restore count per listing limited to 5 to prevent repost churn.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T02 | unit | PS-001-01.R03, PS-001-07.R02 | read stored records and events | no content beyond P1 fields; event carries reason enum only |
| TEST-PS-001-09.T11 | integration | PS-001-07.R01, PS-001-07.R03 | privacy.deletion.requested then 30 days | listings archived and then purged with tombstones; UI never shows sold as verified |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
