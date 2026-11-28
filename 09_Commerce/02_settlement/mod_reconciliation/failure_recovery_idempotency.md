# PS-072-06 — Failure recovery and idempotency: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-06.R01** Runs are idempotent for identical vault state, so the same mismatch keys are produced and events are emitted only for keys not seen before.
- **PS-072-06.R02** An interrupted run is marked failed and restarted from scratch; there is nothing to roll back because the scan is read-only.
- **PS-072-06.R03** Two tabs cannot run concurrently; the second joins the first.

## Specification

- **idempotency:** Vault command ID recorded for 24 h; mismatch events are deduplicated by key against the previous completed report.
- **concurrency:** Single-flight through the Web Lock commerce-recon; unique running report per vault.
- **retries:** A failed daily run is retried at the next unlock and after 1 h while the PWA stays open, at most 3 times a day.
- **offline:** Fully offline; reconciliation reads local data only.
- **partial failure:** Failure discards partial mismatches and marks the report failed; previous completed report remains the latest.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T04 | unit | PS-072-03.R01, PS-072-03.R03, PS-072-06.R02 | interrupt a run at 40 percent and rerun | first report failed with no partial list; second identical to a fresh run |
| TEST-PS-072-09.T05 | integration | PS-072-03.R01, PS-072-06.R01 | complete a run twice with no changes | second run emits no new events; report keys identical |
| TEST-PS-072-09.T09 | integration | PS-072-06.R03 | two tabs run simultaneously | single report; second tab joins |

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
