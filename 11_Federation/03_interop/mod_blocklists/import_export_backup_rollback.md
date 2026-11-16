# PS-089-10 — Import, export, backup and rollback: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-10.R01** A vault export contains the owner's rules for the owner only, never in any shared or federated section.
- **PS-089-10.R02** Import of rules from another vault or from an export keeps local rules as written and returns imported-source rules to pending_review.
- **PS-089-10.R03** Schema changes follow expand/contract and v1 stays readable for 180 days.

## Specification

- **export:** Section federation.block_rules in classrup-export/v1, one line per BlockRule (schema classrup.federation.block_rule/v1); personal export only.
- **import:** Local rules import as written after validation; imported-source rules import as pending_review; duplicates are skipped and counted.
- **backup:** Vault export is the primary backup (IOX-6); relay rules are covered by relay SQLite backup (CTR-IOX-001 IOX-3).
- **migration rollback:** Additive fields only in v1; rollback is safe because unknown optional fields are ignored and active rules stay active.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T16 | integration | PS-089-10.R01, PS-089-10.R02, PS-089-10.R03 | export rules, import into fresh vault | rules round trip as written; imported-source rules return to pending_review |

## Dependencies

Module depends on: F11.S01.M03, F07.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
