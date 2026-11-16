# PS-078-02 — Validation rules: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-02.R01** Requests are validated for recent unlock, limits and size estimate before collection starts.
- **PS-078-02.R02** Each module section is validated against its registered schema list and its own line format before it is accepted.
- **PS-078-02.R03** The manifest is validated and its signature verified before the job becomes ready.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | principal unlocked the vault within the last 5 minutes | UNAUTHENTICATED |
| V02 | no job is requested or collecting in this vault | PRECONDITION_FAILED |
| V03 | at most 3 export requests per 24 hours per vault | RATE_LIMITED |
| V04 | estimated size at most 2 GiB and free storage at least 1.2 times the estimate | PRIVACY_EXPORT_QUOTA |
| V05 | every section line is valid JSON with schema from the module's registered list | PRIVACY_EXPORT_SECTION_FAILED |
| V06 | no line contains another user's P2 or higher content outside the user's own shared copies | PRIVACY_EXPORT_SECTION_FAILED |
| V07 | manifest sha256 per section matches the streamed bytes and the Ed25519 signature verifies | PRIVACY_EXPORT_SIGNATURE_INVALID |
| V08 | download requested while status ready and not past expiresAt | EXPIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T01 | unit | PS-078-01.R01, PS-078-01.R03, PS-078-02.R01 | request an export with fresh and stale unlock | fresh creates job with sections; stale returns UNAUTHENTICATED |
| TEST-PS-078-09.T03 | unit | PS-078-02.R02, PS-078-02.R03 | rules V01 to V08 violated in turn | documented error code returned and no partial file left |
| TEST-PS-078-09.T04 | integration | PS-078-02.R02, PS-078-03.R01 | module section throws after 3 attempts | job failed naming the module; no partial bundle; PRIVACY_EXPORT_SECTION_FAILED |
| TEST-PS-078-09.T13 | integration | PS-078-07.R02, PS-078-02.R02 | bundle scanned for P4 fields and other users' private content | none present; user's own shared copies present |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
