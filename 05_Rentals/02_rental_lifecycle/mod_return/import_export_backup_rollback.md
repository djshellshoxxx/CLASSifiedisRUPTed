# PS-043-10 — Import, export, backup and rollback: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-10.R01** The vault export contains returns, return reports, attestations, receipts, fee adjustments, waivers, declarations, completion signatures and photo references with MediaBlob ids.
- **PS-043-10.R02** Import verifies every signature and cid before restoring and recomputes the late fee from the stored terms, flagging mismatches.
- **PS-043-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section rentals.returns in classrup-export/v1 (ExportSectionPort); one line per RentalReturn with the signed envelopes of each statement and the relay transport receipts.
- **import:** Closed returns import as history; due, overdue, awaiting_owner, renter_reported_unconfirmed, contested, attested, completion_pending and frozen returns import as is and resume their clocks from stored signed times.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext (IOX-7).
- **migration rollback:** Additive optional fields only in v1; records with attestedBy renter_only_silent_owner written by earlier builds are migrated to renter_reported_unconfirmed and their rentals.return.attested is not re-derived; rollback is safe because statements are immutable and older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T14 | integration | PS-043-10.R01, PS-043-10.R02, PS-043-10.R03 | export, import into fresh vault, restore | returns and statements round-trip; overdue flag preserved |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
