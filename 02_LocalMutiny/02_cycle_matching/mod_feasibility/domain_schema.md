# PS-016-01 — Domain schema: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-01.R01** A FeasibilityReport stores the subject reference with its revision hash, evaluation time on the local clock, overall result, and one entry per executed check with status, basis, affected participant or leg and parameters.
- **PS-016-01.R02** Reports are deterministic functions of their input hash and the local clock, are local derived data, and become stale after 10 minutes.
- **PS-016-01.R03** The check set is fixed at C01..C13 and every code is stable; adding a check is additive and follows the schema compatibility rules.

## Specification

### FeasibilityReport

Schema `classrup.mutiny.feasibility_report/v1` · storage **derived** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| subjectType | enum — suggestion \| trade_proposal \| cycle |
| subjectId | uuidv7 — id of the subject in this vault |
| subjectRevisionHash? | cid — digest of the proposal revision checked, required for trade_proposal and cycle |
| evaluatedAt | timestamp — local clock, RFC 3339 UTC |
| staleAt | timestamp — evaluatedAt + 10 min |
| overall | enum — feasible \| feasible_with_conditions \| infeasible |
| checks | array — 13 items {code C01..C13, status pass\|warn\|fail, basis local\|signed_projection\|peer_claim\|unverifiable, participantId? did, legId?, params object ≤ 1 KiB} |
| valueGaps | array — items {participantId, givesMinor string, receivesMinor string, gapMinor string, toleranceMinor string, withinTolerance boolean} |
| suggestedFix? | object — {kind add_compensation \| refresh_quote \| remove_item, params} |
| inputHash | cid — sha256 of JCS(canonical inputs); equal inputHash and equal evaluatedAt bucket give equal checks |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- overall is infeasible iff at least one check has status fail, and feasible only if no check has status warn or basis unverifiable.
- checks contains each of C01..C13 exactly once per participant or leg scope it applies to, in ascending code order.
- staleAt equals evaluatedAt plus 10 minutes.

**Note:** LengthProfile registry (port, no records): register({length, toleranceBps, absoluteMinRef: Money (reference amount, default 500 EUR minor), maxPairBucket 0..4, imbalanceQuantumPermille, minWantAgeMinutes, maxOtherOpenCycles?, version}) is called at startup by F02.S02.M01 (length 3), F02.S02.M02 (length 4) and F02.S02.M03 (engine default for all other lengths); get(length) returns the registered profile or the engine default, never another length's profile. checkFeasibility(input, ports, effectiveProfile?) uses an explicit effectiveProfile when the caller passes one.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T01 | unit | PS-016-01.R01, PS-016-01.R03, PS-016-02.R01, PS-016-09.R03 | each check C01..C13 failed in turn | corresponding error code returned and check marked fail |
| TEST-PS-016-09.T03 | property | PS-016-01.R02, PS-016-06.R01 | random subjects, same inputs twice | identical checks and inputHash |
| TEST-PS-016-09.T04 | unit | PS-016-01.R01, PS-016-09.R02 | 3-party fixture 12000, 11800, 11500 | all three participants within tolerance, overall feasible only when all bases are local or signed_projection |
| TEST-PS-016-09.T17 | a11y | PS-016-01.R01 | checklist screen | axe zero serious issues, basis chips announced |
| TEST-PS-016-09.T20 | unit | PS-016-01.R01, PS-016-04.R02 | registry with profiles 3 and 4 registered, get(5), explicit effectiveProfile, explanation of a 4-party suggestion with the 3-party profile | engine default for 5; explicit profile used; MUTINY_PROFILE_LENGTH_MISMATCH |

## Dependencies

Module depends on: F02.S02.M04, F02.S01.M02, F02.S01.M03, F02.S04.M02, F02.S04.M03, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
