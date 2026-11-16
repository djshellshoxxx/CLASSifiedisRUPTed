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
- Explanation cache is deleted together with its CycleSuggestion (RET-SHORT, 30 days).

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
| TEST-PS-020-09.T06 | unit | PS-020-02.R03, PS-020-07.R01 | JPY fixture | absolute minimum is 5 minor units and formatting follows the currency |
| TEST-PS-020-09.T07 | integration | PS-020-03.R02, PS-020-03.R03, PS-020-06.R03, PS-020-07.R02, PS-020-07.R03 | engine started without provider | engine default profile used and degraded diagnostic logged |
| TEST-PS-020-09.T08 | abuse | PS-020-05.R01, PS-020-05.R02, PS-020-05.R03, PS-020-07.R01 | other principal queries; explanation inspected for exclusions | NOT_FOUND; no negative information about absent people |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
