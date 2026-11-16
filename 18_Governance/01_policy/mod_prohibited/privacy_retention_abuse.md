# PS-146-07 — Privacy, retention and abuse: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-07.R01** Evaluated listing text is processed only in memory in the user's vault; the module stores no copy and logs no matched text.
- **PS-146-07.R02** Rule packs are public signed configuration; sensitive keyword lists may be published as salted hashes so the list itself does not help evaders or spread harmful terms.
- **PS-146-07.R03** Rule versions are retained RET-STANDARD with the last 3 packs kept locally; decisions that created them are RET-EVIDENCE in F18.S02.M01.

## Specification

**Data classification**
- ProhibitedRule: P0 signed configuration.
- Evaluation input and result: P3, memory only; result summary is stored in the PublicationRecord by F01.S01.M03.

**Retention**
- ProhibitedRule mirror and last 3 packs: RET-STANDARD.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Evasion with look-alike characters, spacing or misspelling | normalization pipeline, whole-word and phrase modes, publishers can add variants; honest limit stated in the UI |
| T02 | Overblocking and censorship through broad rules | proposal and comment period for activation, public rule list, strictest-wins reporting with reason keys, user can choose another publisher |
| T03 | Rule pack tampering or downgrade | signature over JCS, version monotonic, trusted publishers only |
| T04 | Denial of service with huge input or pathological rules | 8 000 code-point input limit, 1 MiB pack limit, literal phrase matching without regular expressions, evaluation budget 20 ms |
| T05 | Emergency rule abused as permanent control | review-level only, 7-day expiry, automatic retirement and public announcement |

**Abuse controls**
- Evaluate limited to 600 calls per minute per vault; pack applications limited to 20 per day.
- Publisher limit of 2 000 active rules; emergency rules limited to 5 active at once.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T11 | abuse | PS-146-07.R01, PS-146-07.R02, PS-146-07.R03 | scan logs, storage and events after evaluating text | no listing text or keywords stored or logged; sensitive keywords only as hashes in public copy |
| TEST-PS-146-09.T12 | abuse | PS-146-07.R03 | 100 000-code-point input; 2 001 rules; 601 evaluations in a minute | rejected before matching; pack rejected; RATE_LIMITED |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
