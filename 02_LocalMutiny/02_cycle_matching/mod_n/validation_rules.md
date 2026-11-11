# PS-018-02 — Validation rules: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-02.R01** Run parameters are validated before any search; Lmax outside 2..tenant maximum (8) or budgets above the ADR-0005 caps are refused.
- **PS-018-02.R02** Edge admission rules are pure functions of signed projections, profiles, valuations and local blocks, applied identically in vault and relay modes.
- **PS-018-02.R03** A relay-delivered suggestion is accepted for display only after its signature and every leg are re-verified locally; otherwise it is stored unverified and cannot be proposed.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | lmax is an integer in 2..tenant maximum (default tenant maximum 8, default run value 5) | MUTINY_LMAX_INVALID |
| V02 | expansionBudget ≤ 100000 and timeBudgetMs ≤ 250 | VALIDATION_FAILED |
| V03 | both endpoints of an edge have a verified, non-tombstoned matching_profile projection with optedIn true and not paused | MUTINY_PROFILE_NOT_ELIGIBLE |
| V04 | giver differs from receiver, item quantity available ≥ 1, listing published and flagged barterAcceptable, projection not older than 30 days and not dated in the future | MUTINY_EDGE_INVALID |
| V05 | want category equals or is an ancestor of the item category, item condition is at least the want minimum condition, and item indicative value ≤ want maxBudget when present | MUTINY_EDGE_INVALID |
| V06 | pair bucket = F02.S02.M04 ordinal of F06.S02.M01 bucketBetween(giver listing projection cell, receiver want projection cell), both checked with assertPublicCell and at most L2; an L1-only cell counts as at least 3; the bucket is ≤ both participants' maxDistanceBucket and the profile maxPairBucket | MUTINY_EDGE_INVALID |
| V07 | neither party is in the other's local block list or excluded set known to this vault | BLOCKED_PARTY |
| V08 | graph has ≤ 2000 nodes and ≤ 20000 edges after partitioning by L1 cell | MUTINY_GRAPH_TOO_LARGE |
| V09 | imported suggestion has a valid relay signature, cycleKey recomputes from its legs, and legs.length is within 2..8 | MUTINY_SUGGESTION_UNVERIFIED |
| V10 | the caller has opted in to matching (F02.S02.M04) | MUTINY_MATCHING_NOT_ENABLED |
| V11 | a counterparty with no history in this vault (projection first seen < 30 d and no completed trade known through F07.S03.M01) is excluded unless the principal set includeUnknownIdentities | MUTINY_EDGE_INVALID |
| V12 | a ring in which two or more participants are key-linked (shared device key, rotation chain or same-owner attestation per N11) is stored with keyLinked true and is never proposable without the principal's explicit confirmation | MUTINY_RING_KEY_LINKED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T02 | unit | PS-018-01.R04, PS-018-02.R01, PS-018-02.R02 | Lmax 1 and 9, and graph with 2001 nodes | MUTINY_LMAX_INVALID and MUTINY_GRAPH_TOO_LARGE respectively |
| TEST-PS-018-09.T06 | unit | PS-018-02.R02 | edges violating V03..V07 in turn | no edge is built for each violation and an explanation reason code is recorded |
| TEST-PS-018-09.T07 | unit | PS-018-02.R03, PS-018-02.R01 | relay suggestion with bad signature, with tombstoned listing, and valid one | first two MUTINY_SUGGESTION_UNVERIFIED or stored unverified and not proposable, third verified |
| TEST-PS-018-09.T17 | property | PS-018-09.R02, PS-018-02.R02 | budget 100000 expansions on adversarial dense graph | expansions never exceed 100000 and truncated is expansions or time |
| TEST-PS-018-09.T22 | abuse | PS-018-07.R04, PS-018-02.R02 | 2-Sybil ring: two fresh did:key identities sharing a device key form a 3-ring with a real member | with default settings the ring is not suggested; with includeUnknownIdentities on it is flagged keyLinked, trust panel shows first seen 0 days and 0 completed trades, MUTINY_RING_KEY_LINKED without confirmation, simultaneous handover recommended |
| TEST-PS-018-09.T23 | unit | PS-018-02.R02, PS-018-01.R01 | pair distance from L2 cells u4pru and u4prv, an L1-only listing cell, and a 6-character cell | ordinal 0, at least 3, and DISCOVERY_PRECISION_FORBIDDEN rejection of the projection edge |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F07.S02.M01, F07.S03.M01, F07.S03.M02, F09.S03.M02, F09.S03.M03, F11.S01.M01, F11.S01.M02, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
