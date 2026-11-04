# PS-016-06 — Failure recovery and idempotency: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-06.R01** Check is idempotent for the same subject, revision hash and inputHash within the same 10 minute window and returns the stored report.
- **PS-016-06.R02** A failing port, such as an unavailable quote service, yields a warn with basis unverifiable rather than a pass.
- **PS-016-06.R03** Checks never block the UI thread; evaluation of 8 participants completes in one pass.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; additionally the same inputHash within the same minute returns the existing report.
- **concurrency:** Pure function; concurrent evaluations are independent and the later report supersedes the earlier for decisions; no locks.
- **retries:** No automatic retries; the user can re-run. Port timeouts of 2 s degrade the affected check to unverifiable.
- **offline:** Runs fully offline; quote freshness and projection age are judged by the local clock and retained data and flagged with their age.
- **partial failure:** If a port fails the report is still stored with the affected checks marked warn and basis unverifiable, and overall can never be feasible.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T03 | property | PS-016-01.R02, PS-016-06.R01 | random subjects, same inputs twice | identical checks and inputHash |
| TEST-PS-016-09.T08 | integration | PS-016-04.R03, PS-016-06.R01 | replay check with same key, then new key within same minute | stored report replayed, then same report returned by inputHash |
| TEST-PS-016-09.T10 | unit | PS-016-06.R02, PS-016-06.R03 | quote service port times out | affected check warn unverifiable, overall not feasible |

## Dependencies

Module depends on: F02.S02.M04, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
