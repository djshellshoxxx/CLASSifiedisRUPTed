# PS-081-07 — Privacy, retention and abuse: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-07.R01** The library never stores or logs input values; it logs only counts and paths of dropped fields.
- **PS-081-07.R02** Fail-closed defaults prevent new fields from leaking before review.
- **PS-081-07.R03** Hostile inputs such as deep nesting are bounded so redaction cannot be used for denial of service.

## Specification

**Data classification**
- No data stored; classification maps are P0 metadata.

**Retention**
- None; maps are versioned with schemas.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Developer forgets to classify a new field and it leaks to logs or federation | default P3 deny plus CI lint that fails on unannotated fields |
| T02 | Event payload class understated to allow federation | CI rule that event class is at least the max field class, contract tests per event |
| T03 | Precise location leaks through a public projection | capLocation to L2 and tests that public sinks never carry coordinates |
| T04 | Redaction bypass through nested or renamed fields | per-path classification with unknown paths defaulting to P3 and fuzz tests on nested structures |
| T05 | Denial of service with deeply nested input | depth limit 32, size limit 1 MiB per record, checked before traversal |

**Abuse controls**
- Input bounds: depth 32, 1 MiB per record, 10 000 paths per map; callers apply request rate limits.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T10 | abuse | PS-081-07.R03, PS-081-07.R01 | 40-level nesting and 5 MiB record | rejected within 1 ms; no values logged |
| TEST-PS-081-09.T11 | unit | PS-081-06.R02, PS-081-07.R02 | classification map missing for a schema | fail closed with all fields P3 |
| TEST-PS-081-09.T12 | integration | PS-081-07.R02, PS-081-03.R03 | CI lint on the repository schemas | fails for an injected unannotated field and an event class below its max field class; passes otherwise |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
