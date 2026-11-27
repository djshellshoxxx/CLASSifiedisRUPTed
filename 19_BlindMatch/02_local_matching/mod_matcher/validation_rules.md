# PS-150-02 — Validation rules: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-02.R01** Accept at most 128 dense candidates with bounded fields and a valid safe clock; reject malformed or oversized input.
- **PS-150-02.R02** Apply every hard criterion and exact same-currency price bounds without FX or inferred negotiated prices.
- **PS-150-02.R03** Reject duplicate owner/listing identities and inconsistent evidence references instead of choosing an input-order winner.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | snapshot is dense, bounded and valid | VALIDATION_FAILED |
| V02 | candidate count does not exceed 128 | PAYLOAD_TOO_LARGE |
| V03 | session and intent remain current | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T02 | unit | PS-150-02.R01, PS-150-02.R02, PS-150-02.R03 | Use dense/sparse arrays, 129 candidates, conflicting identities and exact currency boundaries | Bounded validation fails closed and every hard criterion applies without FX |

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
