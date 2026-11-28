# PS-100-07 — Privacy, retention and abuse: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-07.R01** Assessments are derived data (P3 in a vault, P2 on a relay) kept 30 days and contain only factor kinds and counts, never content or counterparties' identities beyond the subject key.
- **PS-100-07.R02** Consumers receive the minimum, level and factor kinds, not signal sources.
- **PS-100-07.R03** Misuse of levels (as a de facto ban, or to shame) is limited by friction-only semantics, subject visibility and no federation.

## Specification

**Data classification**
- RiskAssessment: P3 in a vault (owner only); P2 on a relay (subject and that relay's moderators with a case).
- moderation.risk.elevated and moderation.risk.lowered: P2 store-local, consumed by F12.S03.M04, F12.S02.M01 and local UI only.
- First-seen map: P2 derived, store-local, hashed keys.

**Retention**
- Assessments: 30 days (RET-SHORT) through the store sweep.
- Level history rows for hysteresis: the latest one is always kept.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Silent shadow penalty | frictions are enumerated and shown to the subject; no friction hides content or blocks access; schema forbids ban-like friction values |
| T02 | Gaming the model by farming positive signals | deal credit capped at −20 points (10 completed dealings) and only from deal_completed signals; negative signals dominate by design |
| T03 | Using levels to defame | levels never leave the store; relay does not publish them; the UI says levels are not findings |
| T04 | Model drift or opacity | fixed versioned model risk/1 with the published points table, input digest and factors that sum to the score |
| T05 | Flapping levels cause UI churn or friction oscillation | hysteresis thresholds (70/60 and 35/25) and 5 second debounce |
| T06 | Frictions kept after the level dropped | crossing scheduler and moderation.risk.lowered lift them when the drop happens |

**Abuse controls**
- Recompute is rate limited to 60 per hour per principal (F12.S03.M03) to prevent probing of the model with fake signals.
- Transaction assessments reveal only the level and factor kinds of the counterparty from the requester's own history.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T08 | abuse | PS-100-07.R01, PS-100-07.R03 | schema with a ban-like friction value; 61 recomputes in an hour | schema rejects; 61st RATE_LIMITED |
| TEST-PS-100-09.T10 | unit | PS-100-07.R02, PS-100-01.R02 | injected clock 31 days after computation; consumer payload | assessment purged; payload has level and kinds only |
| TEST-PS-100-09.T15 | abuse | PS-100-07.R01, PS-100-01.R02 | F12 privacy suite after recomputes in a vault and on a relay: scan federation payloads, public projections, notifications and logs | no assessment field, score, level or factor appears in any of them |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
