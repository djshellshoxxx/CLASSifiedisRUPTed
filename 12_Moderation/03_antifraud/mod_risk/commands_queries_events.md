# PS-100-04 — Commands, queries and events: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-04.R01** The module exposes one recompute command and three queries; level changes are the only events.
- **PS-100-04.R02** Recompute is vault-local or relay-local and produces no signed statement; levels are never sent to other parties.
- **PS-100-04.R03** The module consumes signal events to recompute, and emits moderation.risk.elevated in the same transaction as the new assessment.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.riskassessment.recompute` | moderation.riskassessment.recompute | { subjectType, subjectRef, counterpartyKey?, amountBucket?, refresh?: boolean } | { assessmentId, level, score, factors[], frictions[], validUntil } | VALIDATION_FAILED, FORBIDDEN, RISK_ASSESSMENT_STALE | moderation.risk.elevated | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.riskassessment.get` | moderation.riskassessment.read | { subjectType, subjectRef } | { assessment: RiskAssessment, explanation: localized factor sentences } | NOT_FOUND |
| `moderation.riskassessment.get_mine` | moderation.riskassessment.read_own | { includeFactors?: boolean } | { assessment: RiskAssessment for the caller's own key on this relay, nextImprovementAt? } | NOT_FOUND |
| `moderation.riskassessment.assess_transaction` | moderation.riskassessment.read | { dealOrProposalRef, partyKeys: [a, b], amountBucket } | { level, score, factors[], frictions[], validUntil } | VALIDATION_FAILED, FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.risk.elevated` | P3 | { assessmentId, subjectType, subjectRef, previousLevel, level, score, frictions, modelVersion } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.signal.recorded` | schedule a debounced recompute for the signal's subject key |
| `identity.account.created` | record first-seen time for the account age factor in this store |
| `commerce.deal.completed` | increment completed dealings used for the trust credit, capped at 10 credits |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RISK_ASSESSMENT_STALE | 409 | yes | stored assessment is past its validity; retry with refresh |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command moderation.riskassessment.assess_transaction (local)
{ "dealOrProposalRef": "0192f3f0-8888-7000-8000-000000000008", "partyKeys": ["did:key:z6MkMe", "did:key:z6MkOther"], "amountBucket": "medium" }
-> { "level": "high", "score": 74, "factors": [ { "kind": "no_show", "count": 2, "points": 17 }, { "kind": "dispute_opened", "count": 1, "points": 8 }, { "kind": "amount_bucket", "count": 1, "points": 5 } ], "frictions": ["extra_confirmation", "show_caution"], "validUntil": "2026-11-04T10:15:00Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T05 | contract | PS-100-04.R01, PS-100-04.R02, PS-100-09.R02 | command, queries and event | validate against registry schemas; no signed statement produced |
| TEST-PS-100-09.T06 | integration | PS-100-04.R03, PS-100-03.R02 | score crossing 70 up and 60 down | elevated event once on rise; level stays high until below 60 |
| TEST-PS-100-09.T14 | e2e | PS-100-01.R02, PS-100-04.R01 | mobile user confirms a trade with a high-level counterparty | caution banner and extra confirmation shown, factor sentences readable, axe zero serious issues |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
