# PS-020-03 — Workflow state machine: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-03.R01** There are no lifecycle states; a profile version change applies to suggestions generated after it, and earlier suggestions keep their recorded version.
- **PS-020-03.R02** Engine and explanation always read the profile through the registered provider so they cannot disagree.
- **PS-020-03.R03** Profile lookups for length 3 never fall back silently to another length's profile; a missing provider falls back to the engine default and logs a diagnostic.

## Specification

**Note:** No stateful entity. The profile is a constant per release and the explanation is computed on demand.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T01 | unit | PS-020-01.R01, PS-020-03.R01 | read default profile | toleranceBps 500, absoluteMinMajor 5, maxPairBucket 3, quantum 10, minWantAgeMinutes 15, version p3.1 |
| TEST-PS-020-09.T07 | integration | PS-020-03.R02, PS-020-03.R03, PS-020-06.R03, PS-020-07.R02, PS-020-07.R03 | engine started without provider | engine default profile used and degraded diagnostic logged |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
