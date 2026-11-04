# PS-122-10 — Import, export, backup and rollback: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-10.R01** The restore report is exportable and contains no content; user data export remains the vault's responsibility (CTR-IOX-001 IOX-6).
- **PS-122-10.R02** Restore is the only data rollback path and always produces a new instance with event replay, never an in-place downgrade (IOX-4).
- **PS-122-10.R03** Application rollback uses the previous release and requires N-1 compatible schemas, verified by opening restored data with the previous binary.

## Specification

- **export:** restore-report.json plus relay deadletter list --json (metadata only).
- **import:** Not applicable: restore reads backup artifacts of F15.S03.M02; the operator may import a restore report into the drill log only.
- **backup:** Covered by F15.S03.M02; this module has no state to back up besides reports, which the operator archives with the drill record.
- **migration rollback:** Runbook step 9 rolls back by pointing traffic to the previous instance if it still exists; otherwise redeploy N-1 against the restored data. Schema expand/contract keeps N-1 readable for at least 180 days.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T15 | integration | PS-122-09.R02, PS-122-09.R03, PS-122-10.R03 | CI restore drill against fixture set with rpo and rto assertion | achieved data loss ≤ 6 h, elapsed time recorded in the report, N-1 binary opens the restored data |
| TEST-PS-122-09.T16 | integration | PS-122-10.R01, PS-122-10.R02 | export restore report, restore with --new-identity | report exportable without payloads; new identity creates a new key id and prints a fingerprint warning |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
