# PS-017-07 — Privacy, retention and abuse: Four-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M02 Four-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/four` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-017-07.R01** Explanations expose no block or exclusion information and no other trades of the principal.
- **PS-017-07.R02** Cached explanations are P2, device-only and deleted with their suggestion.
- **PS-017-07.R03** Participant load (other open cycles) is never evaluated by the proposer or the engine; each participant's own vault enforces the limit of 2 other open cycles at consent time from local counts (F02.S03.M01), so no counter is published or inferred.

## Specification

**Data classification**
- Explanation cache: P2 derived.
- Profile constants: P0.

**Retention**
- Explanation cache follows CycleSuggestion RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Overload rule used to infer how many cycles a person has open | the rule runs only in each participant's own vault at consent time and its refusal is shown only to that participant; no counter is published |
| T02 | Tampered override loosens the tolerance or the stricter distance | bounds enforced and effective values shown in every explanation |

**Abuse controls**
- Query rate limit 120 per minute per vault.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-017-09.T08 | abuse | PS-017-05.R01, PS-017-05.R02, PS-017-05.R03, PS-017-07.R01 | other principal queries; explanation inspected | NOT_FOUND; no block or exclusion information |
| TEST-PS-017-09.T09 | integration | PS-017-06.R01, PS-017-06.R03, PS-017-07.R02, PS-017-08.R02 | crash and restart | explanations rebuilt within 10 ms and cache purged with suggestion |
| TEST-PS-017-09.T10 | unit | PS-017-07.R03, PS-017-08.R01, PS-017-08.R03 | suggestion with a participant holding 3 other open cycles; run statistics | suggestion produced, no load input read; consent-time guard of F02.S03.M01 refuses only in that participant's vault; profile version p4.2 in stats; latency recorded locally |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
