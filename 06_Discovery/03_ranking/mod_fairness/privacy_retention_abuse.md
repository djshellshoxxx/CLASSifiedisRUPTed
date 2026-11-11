# PS-050-07 — Privacy, retention and abuse: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-07.R01** Inputs are public fields only; outputs reveal no private information and no user-specific signals.
- **PS-050-07.R02** Exposure rules do not use protected characteristics, pseudonym text or reputation.
- **PS-050-07.R03** The fairness rules are published in the product's help page and in this spec, and limits against Sybil gaming are stated.

## Specification

**Data classification**
- Candidates: P0 document fields and score components; explanation keys: no personal data.

**Retention**
- None; no state is kept.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | One author floods a page | max 3 results per author per page, 100-document relay cap per author in the index (F06.S01.M01) |
| T02 | Many throwaway authors capture new-author slots (Sybil, Douceur 2002) | only 2 slots per 20-result page, 50 percent minimum score ratio, 30 day window by local first-seen; honest limit - without a trusted identity authority the library cannot prove the authors are distinct people |
| T03 | Promotion crowds out organic results | promoted share at most 20 percent of a page, multiplier cap 1.25 in F06.S03.M01, mandatory label |
| T04 | Explanation used to deceive | explanation is generated from the same score components used for ranking, never free text from authors |
| T05 | A self-hosted relay skips these rules in its own code | vaults run auditPage on every relay page and label the relay 'ranking policy not followed' |

**Abuse controls**
- Constants are code-level and need a decision record to change; relays cannot raise the promoted share above 20 percent.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T08 | abuse | PS-050-05.R01, PS-050-05.R02, PS-050-05.R03, PS-050-07.R01, PS-050-07.R02 | candidate objects with extra fields such as userId, reputation, bio | extra fields rejected by schema (V05); ranking identical with and without them |
| TEST-PS-050-09.T15 | manual | PS-050-07.R03 | review the product help page against the constants file | the page lists 3 per author, 2 new-author slots per 20, the 50 percent ratio, the 30-day window, promoted at most 20 percent and the stated Sybil limit, matching the constants |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
