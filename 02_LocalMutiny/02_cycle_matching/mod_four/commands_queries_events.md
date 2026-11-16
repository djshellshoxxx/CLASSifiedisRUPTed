# PS-017-04 — Commands, queries and events: Four-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M02 Four-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/four` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-017-04.R01** The module exposes two read-only queries and no commands because it holds no state and produces no statements.
- **PS-017-04.R02** The catalog lists mutiny.cycle.suggested for this module, but the single producer is the engine F02.S02.M03; this module emits nothing itself.
- **PS-017-04.R03** Queries run in the vault for the local principal.

## Specification

### Commands

_None._

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.cycle4.get_profile` | mutiny.cycle4.read_profile | { tenantId? default current } | { length: 4, toleranceBps, absoluteMinMajor, maxPairBucket, imbalanceQuantumPermille, minWantAgeMinutes, maxOtherOpenCycles, version, overridden } |  |
| `mutiny.cycle4.explain` | mutiny.cycle4.read_explanation | { suggestionId } | { suggestionId, profileVersion, participants: { actorId, gives, receives, gap, tolerance, withinTolerance, distanceBucket, bases[] }[4], dropoutNoticeKey } | NOT_FOUND, MUTINY_PROFILE_LENGTH_MISMATCH |

### Events produced

_None._

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.suggested` | pre-compute and cache the explanation for length-4 suggestions |
| `mutiny.matching_profile.updated` | invalidate cached explanations for the affected participant |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_PROFILE_LENGTH_MISMATCH | 422 | no | the subject is not a 4-party suggestion |
| MUTINY_FOUR_LENGTH_PREFERENCE | 422 | no | a participant accepts fewer than 4 participants |
| MUTINY_FOUR_DISTANCE | 422 | no | an adjacent pair is farther than 10-25 km |
| MUTINY_PARTICIPANT_OVERLOADED | 409 | no | a participant already has more than 2 other open cycles |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 4-party ring b1->b2->b3->b4->b1 values EUR minor: 20000, 19800, 19500, 19900
mutiny.cycle4.explain { "suggestionId": "0192f3d0-…" }
-> participants: b1 gives 20000 receives 19900 gap 100 tolerance max(3% of 20000 = 600, 300)=600 within;
                 b2 gives 19800 receives 20000 gap 200 tolerance 600 within;
                 b3 gives 19500 receives 19800 gap 300 tolerance max(594, 300)=594 within;
                 b4 gives 19900 receives 19500 gap 400 tolerance max(597, 300)=597 within
   dropoutNoticeKey "mutiny.cycle4.dropout_notice" (one withdrawal before handover cancels all four trades; nothing is rerouted)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-017-09.T04 | unit | PS-017-02.R02, PS-017-04.R03 | a 3-party suggestion explained as 4-party | MUTINY_PROFILE_LENGTH_MISMATCH |
| TEST-PS-017-09.T06 | contract | PS-017-04.R01, PS-017-04.R02, PS-017-09.R03 | queries and engine events | outputs validate against registry; no events or statements from this module |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
