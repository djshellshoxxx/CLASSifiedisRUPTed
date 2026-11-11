# PS-095-10 — Import, export, backup and rollback: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-10.R01** Policy export contains all versions with statements and is portable between relays as a starting template, not as authority.
- **PS-095-10.R02** Import verifies statement signatures when keeping them as history, and templates import as drafts under the new relay's keys.
- **PS-095-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section moderation.policy in the relay configuration export: all versions, change types, texts, statements and changelogs; users can download the current policy as JSON from the public page.
- **import:** Importing another relay's policy creates drafts only, with changelog 'adopted from <relay>' and changeType initial when the importing relay has no in-force policy, otherwise restrictive; original signatures are kept as provenance but never as this relay's statements.
- **backup:** Covered by relay SQLite backup (CTR-IOX-001 IOX-3); restoring re-verifies all statement signatures and recomputes inForce.
- **migration rollback:** Additive fields only in v1 (changeType defaults to restrictive for existing versions after the first, initial for version 1 rows published before the first in-force policy; publishedAt; inForce derived); rollback is safe because older readers ignore new optional fields and unknown families display as 'other'.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T13 | integration | PS-095-10.R01, PS-095-10.R02, PS-095-10.R03 | export policy, import into fresh relay, restore backup | all versions and statements verify; ruleIds unchanged; imports become drafts |

## Dependencies

Module depends on: F18.S01.M02, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
