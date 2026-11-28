# PS-020-07 — Privacy, retention and abuse: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-07.R01** Explanations reveal no block lists, exclusion lists or other trades of the principal.
- **PS-020-07.R02** Cached explanations are P2, device-only and purged with their suggestion.
- **PS-020-07.R03** Profile numbers are public and carry no personal data.

## Specification

**Data classification**
- Explanation cache: P2, derived from CycleSuggestion.
- Profile constants: P0.

**Retention**
- Explanation cache is deleted together with its CycleSuggestion (RET-SHORT, 30 days) and dropped as soon as the suggestion is no longer status suggested (on read and by a 60 s sweep).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Explanation leaks why a participant was excluded or blocked | explanations list only included participants and never negative information about absent people |
| T02 | Tampered override loosens tolerance to manipulate selection | bounds are enforced and the effective values are recorded and shown to the user in each explanation |

**Abuse controls**
- Query rate limit 120 per minute per vault to bound cache churn.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T01 | unit | PS-020-01.R01, PS-020-03.R01, PS-020-07.R03 | read default profile as principal and as relay-client | toleranceBps 500, absoluteMinRef 500 EUR minor, maxPairBucket 3, quantum 10, minWantAgeMinutes 15, version p3.2; output carries no personal data |
| TEST-PS-020-09.T06 | unit | PS-020-02.R03, PS-020-07.R01 | JPY fixture with pinned EUR->JPY 163/1 (golden) | absolute minimum 815 JPY, gaps computed in bigint and formatting follows the currency; no negative information about absent people |
| TEST-PS-020-09.T08 | abuse | PS-020-05.R01, PS-020-05.R02, PS-020-05.R03, PS-020-07.R01 | other principal queries; explanation inspected for exclusions | NOT_FOUND; no negative information about absent people |
| TEST-PS-020-09.T15 | integration | PS-020-07.R02 | suggestion expires and is superseded with an injected clock | cached explanation dropped on next read and by the 60 s sweep; nothing remains after the suggestion is purged |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
