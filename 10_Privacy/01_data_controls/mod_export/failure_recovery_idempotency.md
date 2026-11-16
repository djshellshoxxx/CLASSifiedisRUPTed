# PS-078-06 — Failure recovery and idempotency: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-06.R01** Commands are idempotent per CTR-IDM-001 using vault command IDs; a repeated request returns the active job.
- **PS-078-06.R02** Collection is resumable by section; a section either completes with its hash or is rerun from its start.
- **PS-078-06.R03** A failed or cancelled job leaves no files and no key material behind.

## Specification

- **idempotency:** Vault command ID recorded for 24 h; request while a job is active returns that job.
- **concurrency:** Partial unique index on active jobs per vault; Web Lock privacy-export; sections read a consistent IndexedDB snapshot per section (read-only transactions).
- **retries:** Section production: 3 attempts with 1 s, 5 s, 30 s backoff, then job failed with the module named.
- **offline:** Export is fully offline; it reads local data only.
- **partial failure:** No partial bundles: the stream is written to a temporary file and moved into place only after the manifest verifies; otherwise the temporary file and key are deleted.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T08 | integration | PS-078-04.R03, PS-078-06.R02 | PWA closed mid-collection and reopened within 24 h | resumes from the last completed section and produces identical hashes |
| TEST-PS-078-09.T10 | integration | PS-078-06.R01, PS-078-06.R03 | repeated request with same command ID; cancel mid-job | active job returned; cancel leaves no files or keys |
| TEST-PS-078-09.T11 | chaos | PS-078-06.R03 | storage quota exhausted midway | job failed with PRIVACY_EXPORT_QUOTA and temporary file removed |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
