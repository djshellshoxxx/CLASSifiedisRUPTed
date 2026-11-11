# PS-058-10 — Import, export, backup and rollback: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-10.R01** The vault export contains the principal's own reviews, received reviews it chose to keep, review windows with their tickets, and not the derived summary, which is rebuilt.
- **PS-058-10.R02** Import re-verifies signatures and tickets and quarantines failures; open windows are restored with their original closesAt.
- **PS-058-10.R03** Algorithm changes bump algorithmVersion, recompute from stored reviews, and keep the previous version's results available for 30 days.

## Specification

- **export:** Sections identity.reviews and identity.review_windows in classrup-export/v1 (schemas classrup.identity.review/v1 and classrup.identity.review_window/v1, tickets classrup.identity.review_ticket/v1); ReputationSummary is excluded because it is derived, no-show claims are included as inputs.
- **import:** Each review and ticket is re-verified; invalid ones are reported and skipped; windows already past closesAt import as closed; summaries are recomputed after import.
- **backup:** The vault export is the primary backup (IOX-6); relays store public review statements only and losing a relay loses no private data (IOX-7).
- **migration rollback:** Algorithm and schema changes are additive; rollback is recompute with the previous algorithmVersion from the stored reviews.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T15 | integration | PS-058-10.R01, PS-058-10.R02, PS-058-10.R03 | export, import to a fresh vault, tombstone after import, and recompute with the previous algorithmVersion | reviews and windows re-verified and round-trip; summary rebuilt; withdrawn review removed from the summary; previous version reproduces the old results |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
