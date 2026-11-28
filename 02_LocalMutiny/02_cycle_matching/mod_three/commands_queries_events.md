# PS-020-04 — Commands, queries and events: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-04.R01** The module exposes two read-only queries and no commands because it carries no state and produces no statements.
- **PS-020-04.R02** The catalog lists mutiny.cycle.suggested for this module, but the single producer is the engine F02.S02.M03; this module emits nothing itself.
- **PS-020-04.R03** Queries run in the vault for the local principal and on a relay only for the relay's public profile description.

## Specification

### Commands

_None._

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.cycle3.get_profile` | mutiny.cycle3.read_profile | { tenantId? default current } | { length: 3, toleranceBps, absoluteMinRef: Money, maxPairBucket, imbalanceQuantumPermille, minWantAgeMinutes, version, overridden: boolean } |  |
| `mutiny.cycle3.explain` | mutiny.cycle3.read_explanation | { suggestionId } | { suggestionId, profileVersion, absoluteMinConverted: Money, participants: { actorId, gives, receives, gap, tolerance, withinTolerance, distanceBucket 0..4 (label discovery.bucket.*), bases[] }[3], summaryKey } | NOT_FOUND, MUTINY_PROFILE_LENGTH_MISMATCH |

### Events produced

_None._

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.suggested` | pre-compute and cache the explanation for length-3 suggestions so the detail screen opens within 100 ms |
| `mutiny.matching_profile.updated` | invalidate cached explanations for the affected participant |

### Module errors

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 3-party explanation (values EUR minor units): Alice gives guitar 12000, Bob gives bike 11800, Carol gives desk 11500
mutiny.cycle3.explain { "suggestionId": "0192f3c0-…" }
-> { "profileVersion": "p3.2", "participants": [
     { "actorId": "did:key:z6MkAlice", "gives": "12000", "receives": "11500", "gap": "500", "tolerance": "600", "withinTolerance": true, "distanceBucket": 1 },
     { "actorId": "did:key:z6MkBob",   "gives": "11800", "receives": "12000", "gap": "200", "tolerance": "600", "withinTolerance": true, "distanceBucket": 2 },
     { "actorId": "did:key:z6MkCarol", "gives": "11500", "receives": "11800", "gap": "300", "tolerance": "590", "withinTolerance": true, "distanceBucket": 1 } ] }
# tolerance = max(500 bps of the larger side, 5.00 EUR reference = 500 EUR minor, no conversion in EUR): Alice max(600, 500)=600, Carol max(590, 500)=590.
# JPY settlement with pinned EUR->JPY 163/1: absolute minimum 500 x 163 x 10^0 / (1 x 10^2) = 815 JPY; BTC with EUR->BTC 1/60000: 500 x 10^8 / (60000 x 10^2) = 8333 satoshi.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T04 | unit | PS-020-02.R02, PS-020-04.R03 | explain a 4-party suggestion | MUTINY_PROFILE_LENGTH_MISMATCH |
| TEST-PS-020-09.T05 | contract | PS-020-04.R01, PS-020-04.R02, PS-020-09.R03 | queries and engine events | outputs validate against registry; module emits no events and sends no statement |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
