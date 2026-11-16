# PS-072-02 — Validation rules: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-02.R01** Run requests are validated for scope and rate before scanning starts.
- **PS-072-02.R02** Each mismatch kind has an explicit, testable detection rule evaluated over read-only snapshots.
- **PS-072-02.R03** Dismiss input is validated and attributable to the local principal only.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | scope.type is all or deal and a deal scope names an existing Deal | VALIDATION_FAILED |
| V02 | at most 1 manual run per 5 minutes per vault | RATE_LIMITED |
| V03 | no other run is currently running in this vault | CONFLICT_STATE |
| V04 | dismiss targets a mismatch key present in the report and the report is the latest completed one | NOT_FOUND |
| V05 | dismiss note is at most 280 code points | VALIDATION_FAILED |
| V06 | report with more than 500 mismatches keeps the 500 highest severity and sets truncated | COMMERCE_RECON_TRUNCATED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T01 | unit | PS-072-01.R01, PS-072-01.R02, PS-072-02.R01 | run on the seeded vault | report has counts and keys for M01 to M10 as expected, scope validated |
| TEST-PS-072-09.T02 | unit | PS-072-02.R02, PS-072-03.R02 | each kind fixture and its clean twin | mismatch present only for the triggering fixture |
| TEST-PS-072-09.T03 | unit | PS-072-02.R03, PS-072-02.R01 | dismiss with valid and invalid key and over-long note | valid stored; invalid return NOT_FOUND or VALIDATION_FAILED |
| TEST-PS-072-09.T10 | abuse | PS-072-07.R03, PS-072-02.R02 | 2 manual runs within 5 minutes | second returns RATE_LIMITED |

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
