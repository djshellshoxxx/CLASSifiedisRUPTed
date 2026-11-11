# PS-100-03 — Workflow state machine: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-03.R01** Assessments have no transitions; a new computation creates a new row only when its inputDigest differs from the latest one.
- **PS-100-03.R02** Level rises are applied immediately and level drops use hysteresis so that borderline scores do not flap.
- **PS-100-03.R03** Recomputation is triggered by moderation.signal.recorded after a 5 second debounce per subject and at the stored nextCrossingAt of decaying signals (at most 24 h after the last computation), so a level drop is detected when it happens.
- **PS-100-03.R04** Every level rise emits moderation.risk.elevated and every level drop that hysteresis allows emits moderation.risk.lowered, each in the same transaction as the new assessment.

## Specification

**Note:** Assessments are immutable derived rows without lifecycle; level changes by computing a new assessment, and hysteresis uses the latest previous level.

### Timeouts and scheduled transitions

- Crossing scheduler: relay timer at nextCrossingAt; vault on the first app use after nextCrossingAt and at most once per 24 h on idle.
- Transaction and listing publication assessments expire after 15 minutes and are recomputed on demand.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T02 | property | PS-100-01.R03, PS-100-03.R02 | random signal sets and times | factors sum to score before clamping; level function of score and hysteresis state; same digest same output |
| TEST-PS-100-09.T04 | integration | PS-100-03.R01, PS-100-03.R03 | burst of 20 signal events within 5 seconds; signals of a high subject decaying past 60 with the clock advanced to nextCrossingAt | one recompute for the burst; assessment unique per digest; a recompute runs at nextCrossingAt without waiting for a daily sweep |
| TEST-PS-100-09.T06 | integration | PS-100-04.R03, PS-100-03.R02, PS-100-03.R04 | score crossing 70 up, 65, then below 60, then below 25 | elevated once on rise; no event at 65; lowered to medium below 60 and lowered to low below 25, each in the assessment transaction |
| TEST-PS-100-09.T18 | contract | PS-100-03.R04 | moderation.risk.elevated high then moderation.risk.lowered low consumed by the F12.S03.M04 and F12.S02.M01 contract fixtures | limits move to 0.5× then back to base on the lowered event; a risk_review case is opened only on the rise |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
