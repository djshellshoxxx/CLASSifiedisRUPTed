# PS-047-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (forbidden feature classes), CTR-ID-001 (`rmv_` PENDING registry entry, proposed owner F06), CTR-SCH-001, CTR-EVT-001.

**Decision labels:** Weights and decay constants are ASSUMPTION (OPEN, F06). No ranking quality is claimed.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-01.R01 | `ranking_model` holds weights for exactly five features: `text`, `recency`, `distance`, `quality`, `reputation_band`. | MVP |
| PS-047-01.R02 | Weights are decimals with 2 places in [0.00, 1.00] and sum to 1.00 exactly. | MVP |
| PS-047-01.R03 | Feature definitions are versioned; a model references feature versions by ID. | MVP |
| PS-047-01.R04 | Model status ∈ {DRAFT, SHADOW, ACTIVE, RETIRED}; at most one ACTIVE per locale and category group. | MVP |
| PS-047-01.R05 | Distance input is cell-hop distance (0, 1, 2, or beyond) from registered cells only; no coordinates. | MVP |
| PS-047-01.R06 | Reputation input is a band 0–3 from F07, never a raw score or identity field. | MVP |

## Data / schema
```json
{
  "model_id": "rmv_<26> (PENDING)",
  "status": "DRAFT | SHADOW | ACTIVE | RETIRED",
  "scope": {"locale": "BCP 47", "category_group": "string"},
  "weights": {"text": "0.00-1.00", "recency": "0.00-1.00", "distance": "0.00-1.00", "quality": "0.00-1.00", "reputation_band": "0.00-1.00"},
  "recency_tau_days": "integer 7-90 (ASSUMPTION default 30)",
  "distance_scores": {"0": 1.0, "1": 0.6, "2": 0.3, "beyond": 0.0},
  "feature_versions": {"text": "v", "recency": "v", "distance": "v", "quality": "v", "reputation_band": "v"},
  "state_version": "integer >= 1",
  "schema_version": "1.0.0"
}
```
Data classes: model config PUBLIC. Ranking candidates reference listings (PUBLIC or per listing class). No personal data is stored in the model.

## Commands / queries / events
Not applicable; see PS-047-04.

## States & transitions
See PS-047-03.

## Validation & errors
See PS-047-02.

## Authorization
Model read by service; model writes by F06 operators with dual approval (PS-047-05).

## Failure, idempotency, concurrency, offline
Model snapshot id stored with every served ranking for reproducibility.

## Privacy, retention, abuse
Config RET-ACC (life of model). Per-query ranking logs: model ID and reason codes only.

## Observability & budgets
`relevance_model_invalid_total{code}`.

## Tests
- TEST-PS-047-01-01 (unit): weights sum to 1.00; 1.01 rejected.
- TEST-PS-047-01-02 (lint): no coordinate, identity or raw score field.
- TEST-PS-047-01-03 (unit): distance table uses cell hops only.
- TEST-PS-047-01-04 (integration): two ACTIVE models in one scope rejected.

## Acceptance criteria
1. Model schema registered with owner F06 and digest.
2. Forbidden fields absent (TEST-PS-047-01-02).
3. TEST-PS-047-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: five-feature model, default weights to be set by F06 (OPEN).
- PENDING CTR-ID-001 `rmv` prefix registration.
