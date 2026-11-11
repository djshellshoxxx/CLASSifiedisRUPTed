# PS-100-07 — Privacy, retention and abuse: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-07.R01** Assessments are P3 derived data kept 30 days and contain only factor kinds and counts, never content or counterparties' identities beyond the subject key.
- **PS-100-07.R02** Consumers receive the minimum, level and factor kinds, not signal sources.
- **PS-100-07.R03** Misuse of levels (as a de facto ban, or to shame) is limited by friction-only semantics, subject visibility and no federation.

## Specification

**Data classification**
- RiskAssessment: P3 derived (vault owner; relay moderators with case; subject on relay).
- moderation.risk.elevated: P3, consumed by F12.S03.M04 and by local UI only.

**Retention**
- Assessments: 30 days (RET-SHORT).
- Level history rows for hysteresis: the latest one is always kept.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Silent shadow penalty | frictions are enumerated and shown to the subject; no friction hides content or blocks access; schema forbids ban-like friction values |
| T02 | Gaming the model by farming positive signals | positive credit capped at 20 points and only from completed dealings; negative signals dominate by design |
| T03 | Using levels to defame | levels never leave the store; relay does not publish them; the UI says levels are not findings |
| T04 | Model drift or opacity | fixed versioned model risk/1 with published formula, input digest, factors that sum to the score |
| T05 | Flapping levels cause UI churn or friction oscillation | hysteresis thresholds (70/60 and 35/25) and 5 second debounce |

**Abuse controls**
- Recompute is rate limited to 60 per hour per principal (F12.S03.M03) to prevent probing of the model with fake signals.
- Transaction assessments reveal only the level and factor kinds of the counterparty from the requester's own history.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T08 | abuse | PS-100-07.R01, PS-100-07.R02, PS-100-07.R03 | schema with a ban-like friction value; 61 recomputes in an hour | schema rejects; 61st RATE_LIMITED |
| TEST-PS-100-09.T10 | unit | PS-100-07.R02, PS-100-01.R02 | assessment retention at 30 days and consumer payload | purged; payload has level and kinds only |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
