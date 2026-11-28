# PS-100-04 — Commands, queries and events: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-04.R01** The module exposes one recompute command, the N19 query moderation.risk.assess and two read queries; level rises and drops are the only events.
- **PS-100-04.R02** Recompute is vault-local or relay-local and produces no signed statement; levels are never sent to other parties.
- **PS-100-04.R03** The module consumes signal events to recompute, and emits moderation.risk.elevated or moderation.risk.lowered in the same transaction as the new assessment.
- **PS-100-04.R04** moderation.risk.assess is the in-process query named by N19 (it replaces moderation.riskassessment.assess_transaction, kept as an alias for one release) for transaction and listing_publication subjects, and F01.S01.M03 tests against its contract.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.riskassessment.recompute` | moderation.riskassessment.recompute | { subjectType: key, subjectRef, refresh?: boolean } | { assessmentId, level, score, factors[], frictions[], validUntil, nextCrossingAt? } | VALIDATION_FAILED, FORBIDDEN, MODERATION_RISK_ASSESSMENT_STALE | moderation.risk.elevated, moderation.risk.lowered | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.riskassessment.get` | moderation.riskassessment.read | { subjectType, subjectRef } | { assessment: RiskAssessment, explanation: localized factor sentences } | NOT_FOUND, MODERATION_RISK_ASSESSMENT_STALE |
| `moderation.riskassessment.get_mine` | moderation.riskassessment.read_own | { includeFactors?: boolean } | { assessment: RiskAssessment for the caller's own key on this relay, nextCrossingAt? } | NOT_FOUND |
| `moderation.risk.assess` | moderation.risk.assess | { subjectType: transaction\|listing_publication, dealOrProposalRef?, partyKeys?: [a, b], amountBucket?: small\|medium\|large, publication?: { draftId, spamScore, publicationsLast24h } } | { level: low\|medium\|high, score, factors[], frictions[], validUntil, modelVersion } | VALIDATION_FAILED, FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.risk.elevated` | P2 | { assessmentId, subjectType: key, subjectRef, previousLevel, level, score, frictions, modelVersion } — store-local (EVT-8), keys only |
| `moderation.risk.lowered` | P2 | { assessmentId, subjectType: key, subjectRef, previousLevel, level, score, frictions, modelVersion } — store-local (EVT-8), keys only, emitted when hysteresis lets a level drop |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.signal.recorded` | schedule a debounced recompute for the signal's subject key |
| `identity.session.started` | relay, kind relay_token: record firstSeenAt for did in the first-seen map when absent (relay's own observation for the new_key factor) |
| `federation.record.accepted` | vault: record firstSeenAt for the author key when absent (first verified statement from that key), used only for the 'no history' explanation |
| `identity.account.created` | vault only: record the local principal's own creation time for the new_principal factor of listing_publication assessments; never used as any other key's age |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_RISK_ASSESSMENT_STALE | 409 | yes | stored assessment is past its validity; retry with refresh |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Deal credit counts deal_completed signals that F12.S03.M02 records from the parties[] of commerce.deal.completed (N3); this module does not consume deal events itself. Frictions risk/1: vault keys medium show_caution, high show_caution and extra_confirmation; relay keys medium lower_limits, high lower_limits and review_queue; listing_publication medium or high extra_confirmation (F01.S01.M03 holds for owner confirmation).

### Example

```
query moderation.risk.assess (vault-local, in-process; fixture subject B: 2 no_show and 1 dispute_opened signals 10 days old, 3 deal_completed signals)
{ "subjectType": "transaction", "dealOrProposalRef": "0192f3f0-8888-7000-8000-000000000008", "partyKeys": ["did:key:z6MkMe", "did:key:z6MkOther"], "amountBucket": "medium" }
-> { "level": "low", "score": 24, "factors": [ { "kind": "no_show", "count": 2, "points": 17 }, { "kind": "dispute_opened", "count": 1, "points": 8 }, { "kind": "amount_bucket", "count": 1, "points": 5 }, { "kind": "deal_credit", "count": 3, "points": -6 } ], "frictions": [], "validUntil": "2026-11-04T10:15:00Z", "modelVersion": "risk/1" }
(17 = floor(2 × 10 × 0.5^(10/60)), 8 = floor(10 × 0.5^(10/60)), 17 + 8 + 5 − 6 = 24, below 35 so low)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T05 | contract | PS-100-04.R01, PS-100-04.R02, PS-100-09.R02 | command, queries and both events | validate against registry schemas; no signed statement produced |
| TEST-PS-100-09.T06 | integration | PS-100-04.R03, PS-100-03.R02, PS-100-03.R04 | score crossing 70 up, 65, then below 60, then below 25 | elevated once on rise; no event at 65; lowered to medium below 60 and lowered to low below 25, each in the assessment transaction |
| TEST-PS-100-09.T14 | e2e | PS-100-01.R02, PS-100-04.R01 | mobile user confirms a trade with a high-level counterparty | caution banner and extra confirmation shown, factor sentences readable, axe zero serious issues |
| TEST-PS-100-09.T19 | contract | PS-100-04.R04 | F01.S01.M03 contract fixture calls moderation.risk.assess for listing_publication and for a transaction; the alias assess_transaction | outputs match the documented contract with level low |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
