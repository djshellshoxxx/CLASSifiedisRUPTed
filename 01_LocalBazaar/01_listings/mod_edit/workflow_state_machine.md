# PS-003-03 — Workflow state machine: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-03.R01** ListingRevision has no lifecycle beyond creation; the listing's status machine is owned by F01.S01.M01.
- **PS-003-03.R02** Whether a listing has unsent changes is derived by comparing the latest revision with the revision in the last signed projection of F01.S01.M03, learned from the listingRevision of consumed bazaar.listing.published and bazaar.publication.renewed events.
- **PS-003-03.R03** An edit never changes Listing.status.

## Specification

**Note:** ListingRevision is append-only and has no states. Listing status is governed by F01.S01.M01.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T04 | property | PS-003-03.R01, PS-003-03.R03 | random edits on listings in every status | Listing.status never changes; edits on expired, closed or archived give CONFLICT_STATE |
| TEST-PS-003-09.T15 | integration | PS-003-03.R02 | edit published L to revision 5, then deliver bazaar.listing.published with listingRevision 5, then edit again | unsentChanges true, then false, then true; renewed event with the latest revision also clears it |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
