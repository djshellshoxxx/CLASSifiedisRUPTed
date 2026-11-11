# PS-086-10 — Import, export, backup and rollback: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-10.R01** A vault export contains conflict records with candidate cids and decisions; the candidate envelopes themselves are exported by F11.S01.M02.
- **PS-086-10.R02** Import re-verifies every candidate signature and keeps open conflicts open, restoring their freeze before any domain action is allowed.
- **PS-086-10.R03** Schema changes follow expand/contract and v1 stays readable for 180 days.

## Specification

- **export:** Section federation.conflicts in classrup-export/v1 through the ExportSectionPort, one line per ConflictRecord (schema classrup.federation.conflict/v1).
- **import:** Candidates are re-verified; conflicts whose candidates fail verification import as resolved with decision drop_all and a warning in the import report; open conflicts re-emit federation.conflict.detected and is_frozen answers true for their subjects immediately.
- **backup:** Vault export is the primary backup (IOX-6); relay conflicts are covered by relay SQLite backup (CTR-IOX-001 IOX-3).
- **migration rollback:** Additive fields only in v1 (chainKey, requiredSigners, fromListedRelay are new optional members); rollback to the previous release is safe because new optional fields are ignored and open conflicts stay open.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T17 | integration | PS-086-10.R01, PS-086-10.R02, PS-086-10.R03 | export, import to fresh vault and relay restore | conflicts round trip with open ones still freezing; imported candidates re-verified |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
