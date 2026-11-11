# PS-016-04 — Commands, queries and events: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-04.R01** check is a vault-local command that stores a report and emits one event; no statement is produced and nothing is sent to any peer.
- **PS-016-04.R02** The same pure function is exported as a library so F02.S01.M01, F02.S02.M03 and F02.S03.M01 can run it inside their own transactions.
- **PS-016-04.R03** get and list queries return only reports stored in this vault.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.feasibility.check` | mutiny.feasibility.check | { subjectType: suggestion\|trade_proposal\|cycle, subjectId, revisionHash? } — vault command; no statement | { reportId, overall, checks, valueGaps, suggestedFix?, staleAt } | NOT_FOUND, VALIDATION_FAILED, MUTINY_FEASIBILITY_STALE | mutiny.cycle.feasibility_checked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.feasibility.get` | mutiny.feasibility.read | { reportId } | { report: FeasibilityReport, stale: boolean } | NOT_FOUND |
| `mutiny.feasibility.latest_for_subject` | mutiny.feasibility.read | { subjectType, subjectId, revisionHash? } | { report?: FeasibilityReport, stale: boolean } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.cycle.feasibility_checked` | P2 | { reportId, subjectType, subjectId, subjectRevisionHash?, overall, failedCodes[], warnedCodes[] } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.proposal.revised` | mark earlier reports of the subject as superseded for decisions; a new check is required for the new revision hash |
| `mutiny.values.normalized` | invalidate reports of the same subject so quote and tolerance checks re-run |
| `mutiny.normalization.expired` | invalidate reports of the subject so C06 fails until a quote_refresh revision exists |
| `mutiny.valuation.flagged` | invalidate reports of subjects containing the item so C12 re-runs |
| `privacy.deletion.completed` | purge the erased principal's reports; reports are derived and regenerable |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_VALUE_OUT_OF_TOLERANCE | 422 | no | value gap exceeds MNY-5 tolerance without compensation or acceptance |
| MUTINY_QUOTE_STALE | 410 | no | a pinned FX quote is expired or about to expire |
| MUTINY_DISTANCE_EXCEEDED | 422 | no | a participant pair is farther apart than allowed |
| MUTINY_PARTICIPANT_INELIGIBLE | 422 | no | a participant is not opted in, is paused, or lacks a verified projection |
| MUTINY_CYCLE_TOO_LONG | 422 | no | cycle length exceeds a participant preference or tenant maximum |
| MUTINY_DEADLINE_INVALID | 422 | no | consent deadline or execution window out of range |
| MUTINY_VALUATION_DISPUTED | 409 | no | a valuation is disputed and not acknowledged by its owner |
| MUTINY_FEASIBILITY_STALE | 409 | yes | the report is older than 10 minutes |
| MUTINY_PROFILE_LENGTH_MISMATCH | 422 | no | the subject's length does not match the requested length profile |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
mutiny.feasibility.check  { "subjectType": "cycle", "subjectId": "0192f3b0-…", "revisionHash": "sha256-Qm3…" }
-> 200 { "reportId": "0192f3b1-…", "overall": "feasible_with_conditions",
         "checks": [ { "code": "C03", "status": "pass", "basis": "local", "participantId": "did:key:z6MkAlice" },
                     { "code": "C03", "status": "warn", "basis": "unverifiable", "participantId": "did:key:z6MkCarol" },
                     { "code": "C05", "status": "pass", "basis": "signed_projection" } ],
         "valueGaps": [ { "participantId": "did:key:z6MkAlice", "givesMinor": "12000", "receivesMinor": "11500", "gapMinor": "500", "toleranceMinor": "600", "withinTolerance": true } ],
         "staleAt": "2026-11-04T10:10:00.000Z" }
# 2-party, 3-party, 4-party and N-party subjects use the same call; the value table has one row per participant (2, 3, 4 or N rows).
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T07 | contract | PS-016-04.R01, PS-016-04.R02, PS-016-09.R02 | check command and event | output and event validate against registry |
| TEST-PS-016-09.T08 | integration | PS-016-04.R03, PS-016-06.R01 | replay check with same key, then new key within same minute | stored report replayed, then same report returned by inputHash |
| TEST-PS-016-09.T20 | unit | PS-016-01.R01, PS-016-04.R02 | registry with profiles 3 and 4 registered, get(5), explicit effectiveProfile, explanation of a 4-party suggestion with the 3-party profile | engine default for 5; explicit profile used; MUTINY_PROFILE_LENGTH_MISMATCH |

## Dependencies

Module depends on: F02.S02.M04, F02.S01.M02, F02.S01.M03, F02.S04.M02, F02.S04.M03, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
