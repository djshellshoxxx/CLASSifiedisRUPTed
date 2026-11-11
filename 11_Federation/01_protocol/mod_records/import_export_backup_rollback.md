# PS-084-10 — Import, export, backup and rollback: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-10.R01** A user's export contains the user's own federation settings, own signed statements with their chain keys and the tombstones they issued; mirrored third-party records are not part of a personal export.
- **PS-084-10.R02** Operator export and relay import re-verify every envelope signature and re-apply tombstones before records become readable; the owner's own vault import and restore re-verify signatures but are exempt from the V08 age limit.
- **PS-084-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section federation.records (own authored envelopes with chain key, seq and cid) and federation.tombstones in classrup-export/v1 through the ExportSectionPort; operator export adds public mirrors as JSON lines with provenance.
- **import:** Each envelope is re-verified (signature, cid, role); chain heads are rebuilt with F11.S02.M02 verifyChain; tombstones are applied before records so purged content cannot return; own statements are exempt from the age limit; failed items are listed in the import report and skipped.
- **backup:** Covered by relay SQLite backup (CTR-IOX-001 IOX-3); tombstone stubs must be in every backup so restore cannot resurrect content; restore replays tombstones before enabling ingest.
- **migration rollback:** Additive columns only in v1 (chain key, subject key and stub fields are new optional members); rollback to the previous release is safe because new optional columns are ignored; restore from backup triggers a tombstone replay sweep before the flag may be turned on.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T24 | integration | PS-084-10.R01, PS-084-10.R02, PS-084-10.R03 | export, import to fresh relay, restore backup; own-vault restore containing own statements 300 days old | records and tombstones round trip; imported records are re-verified; tombstones remain effective; the own restore is exempt from the age limit and loses nothing |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F07.S02.M02, F15.S04.M02, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
