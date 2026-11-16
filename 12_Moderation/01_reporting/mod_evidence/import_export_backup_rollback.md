# PS-093-10 — Import, export, backup and rollback: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-10.R01** Evidence export is limited to the owner's own vault export, case bundles sent to a relay moderation key, and legal-hold exports approved under F10.S01.M02.
- **PS-093-10.R02** Import verifies every content hash and author signature and refuses bodies whose hash does not match.
- **PS-093-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section moderation.evidence in classrup-export/v1: snapshot metadata, decrypted body and media (it is the owner's own data), access log rows; relay case bundles are sealed to the moderation key.
- **import:** Bundles import as read-only evidence; each body hash and author signature is recomputed; mismatches are rejected with VALIDATION_FAILED; keys are re-wrapped under the target store key.
- **backup:** Vault export is the primary backup (IOX-6); relay SQLite and blob backups (CTR-IOX-001 IOX-3) hold only evidence received in reports; restore re-runs the integrity sweep.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields; relay migrations re-create the access log trigger on down scripts.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T14 | integration | PS-093-10.R01, PS-093-10.R02, PS-093-10.R03 | export evidence bundle for a case, import into fresh store, restore backup | hashes verify after round trip; import without keys marks bodies unreadable |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
