# PS-070-10 — Import, export, backup and rollback: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-10.R01** The vault export contains the principal's cases with all signed statements and evidence references in the section commerce.disputes, and evidence blobs the user holds in the export blob list.
- **PS-070-10.R02** Import re-verifies every statement and quarantines those whose signer is not a party or the accepted mediator.
- **PS-070-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** ExportSectionPort section commerce.disputes in classrup-export/v1; one line per DisputeCase and per statement (schema classrup.commerce.dispute/v1) with evidence MediaBlob refs; the other parties' evidence is included only as the principal's own received copies.
- **import:** Terminal cases import as read-only evidence; open cases import as open with sync state reset to local_committed and deadlines recomputed from the original signed times as claims; mediator directory entries are re-verified.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext of statements in transit.
- **migration rollback:** Additive fields only in v1 (parties, contextCid, disposition, mediator trust); respondentSilent is read as noResponseReceivedHere; signed statement bytes are never rewritten by a migration; rollback is safe because older readers ignore new optional fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T17 | integration | PS-070-10.R01, PS-070-10.R02, PS-070-10.R03 | export, import into fresh vault with one forged statement, roll back one release | valid cases round-trip, forged statement quarantined, open cases import with sync state reset |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
