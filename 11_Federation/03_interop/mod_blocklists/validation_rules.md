# PS-089-02 — Validation rules: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-02.R01** Rule input is validated strictly against the schema and value formats per type.
- **PS-089-02.R02** Imports are bounded and signature-checked before any entry is shown for review.
- **PS-089-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | ruleType peer has a relay id format, author is did:key Ed25519, cid and content_hash start with sha256- and decode to 32 bytes | VALIDATION_FAILED |
| V02 | no non-removed rule with the same type and value exists | FEDERATION_BLOCK_DUPLICATE |
| V03 | peer rule value is not the local relay id | FEDERATION_BLOCK_SELF |
| V04 | imported list statement signature verifies and entries ≤ 10000 | FEDERATION_BLOCKLIST_TOO_LARGE |
| V05 | tenant has fewer than 100000 non-removed rules | FEDERATION_BLOCK_LIMIT |
| V06 | note ≤ 280 code points plain text | VALIDATION_FAILED |
| V07 | imported rules are approved only by an explicit review command naming each rule id | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T01 | unit | PS-089-01.R01, PS-089-01.R03, PS-089-02.R01 | add one rule of each type with valid values | rules active with exact-match values and event emitted |
| TEST-PS-089-09.T02 | unit | PS-089-02.R02, PS-089-02.R03, PS-089-01.R02 | each rule V01–V07 violated | documented code and no rule changed |
| TEST-PS-089-09.T06 | integration | PS-089-04.R03, PS-089-02.R01 | identity.block.added then removed for a party with a did | local hide rule created then removed; federated content hidden then visible |

## Dependencies

Module depends on: F11.S01.M03, F07.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
