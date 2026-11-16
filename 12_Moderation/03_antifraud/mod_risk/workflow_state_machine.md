# PS-100-03 — Workflow state machine: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-03.R01** Assessments have no transitions; a new computation creates a new row only when its inputDigest differs from the latest one.
- **PS-100-03.R02** Level rises are applied immediately and level drops use hysteresis so that borderline scores do not flap.
- **PS-100-03.R03** Recomputation is triggered by moderation.signal.recorded after a 5 second debounce per subject and by a daily decay sweep for subjects with level other than low.

## Specification

**Note:** Assessments are immutable derived rows without lifecycle; level changes by computing a new assessment, and hysteresis uses the latest previous level.

### Timeouts and scheduled transitions

- Daily decay sweep at 03:00 UTC (relay) or on app idle once per 24 h (vault) recomputes assessments whose level is medium or high.
- Transaction assessments expire after 15 minutes and are recomputed on demand.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T02 | property | PS-100-01.R03, PS-100-03.R02 | random signal sets and times | factors sum to score before clamping; level function of score and hysteresis state; same digest same output |
| TEST-PS-100-09.T04 | integration | PS-100-03.R01, PS-100-03.R03 | burst of 20 signal events within 5 seconds | one recompute; assessment unique per digest |
| TEST-PS-100-09.T06 | integration | PS-100-04.R03, PS-100-03.R02 | score crossing 70 up and 60 down | elevated event once on rise; level stays high until below 60 |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
