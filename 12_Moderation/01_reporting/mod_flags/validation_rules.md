# PS-094-02 — Validation rules: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-02.R01** Report input is validated strictly against the schema in the vault and again by the receiving relay; unknown fields are rejected with VALIDATION_FAILED.
- **PS-094-02.R02** The target must be a record the vault holds with a verifiable author signature and must not belong to the reporter.
- **PS-094-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | reasonCode is in the 12-code taxonomy and details is at most 1000 code points of plain text | VALIDATION_FAILED |
| V02 | the vault holds the target with a verifiable author signature for targetCid | MODERATION_TARGET_UNAVAILABLE |
| V03 | reporterKey differs from the author key of the target | MODERATION_REPORT_SELF |
| V04 | no open report by the same reporter key for the same relay, target and reason | MODERATION_REPORT_DUPLICATE |
| V05 | relay policy: fewer than 20 reports from this key in 24 h (3 after five dismissed reports in 30 days) | RATE_LIMITED |
| V06 | relay id is a known relay with a published moderation key; the sealed report is at most 64 KiB | PAYLOAD_TOO_LARGE |
| V07 | a received outcome or receipt statement carries a valid relay signature and references an existing report | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T01 | unit | PS-094-01.R01, PS-094-01.R03, PS-094-02.R01 | file a valid scam report in the vault | Report stored with syncState local_committed, snapshot reference set, details unchanged |
| TEST-PS-094-09.T02 | unit | PS-094-02.R02, PS-094-02.R03 | each rule V02–V07 violated in turn | the documented error code is returned and nothing is stored |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
