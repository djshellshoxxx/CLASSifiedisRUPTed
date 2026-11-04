# PS-144-10 — Import, export, backup and rollback: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-10.R01** The user export contains the applied Category mirror with provenance and the trusted publisher list; publisher vaults also export staged changes and their signing history.
- **PS-144-10.R02** Import re-verifies the pack signature and tree invariants; categories failing verification are not applied.
- **PS-144-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days; the last 3 packs allow reverting by applying an older signed snapshot re-released with a higher version.

## Specification

- **export:** Sections governance.categories and governance.trusted_publishers in classrup-export/v1, one line per Category (schema classrup.governance.category/v1) and the latest pack statement.
- **import:** Pack signature and publisher are re-verified; untrusted publishers import as pending; id reuse or tree violations reject the pack; the dry-run lists changed categories.
- **backup:** Vault export is the primary backup (IOX-6); relays hold only signed public packs and are recoverable from the publisher's vault.
- **migration rollback:** Additive optional fields only in v1; rollback to the previous app release is safe because the mirror is readable; to undo a taxonomy change the publisher re-releases the earlier content under a higher version.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T14 | integration | PS-144-10.R01, PS-144-10.R02, PS-144-10.R03 | export, import to fresh vault, import pack with id reuse | categories round-trip with provenance; id reuse rejected |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
