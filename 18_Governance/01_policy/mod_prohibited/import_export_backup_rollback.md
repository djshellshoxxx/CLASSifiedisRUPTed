# PS-146-10 — Import, export, backup and rollback: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-10.R01** The user export contains the applied rule mirror with provenance; the trusted-publisher list is exported by F18.S02.M01; publisher vaults also export drafts, the plaintext of their own sensitive keywords and signing history.
- **PS-146-10.R02** Import re-verifies pack signatures, publisher trust, size limits and recorded decisions; failing packs are stored as pending or rejected.
- **PS-146-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days; the last 3 packs allow review of what changed.

## Specification

- **export:** Section governance.prohibited_rules in classrup-export/v1, one line per ProhibitedRule (schema classrup.governance.prohibited_rule/v1) and the latest rule pack statement of each publisher with its receipt.
- **import:** Signature, trust and limits re-verified; packs from publishers not trusted in the importing vault go to the pending inbox; emergency rules past their effective expiry import as retired.
- **backup:** Vault export is the primary backup (IOX-6); relays hold public signed packs that vaults can re-fetch.
- **migration rollback:** Additive optional fields only in v1; rollback is by reinstalling the previous release; to undo a rule change the publisher releases the earlier content as a higher pack version with a decision.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T15 | integration | PS-146-10.R01, PS-146-10.R02, PS-146-10.R03 | export, import to fresh vault, import pack with bad signature | rules round-trip with provenance; bad pack rejected |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, F11.S01.M01, F07.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
