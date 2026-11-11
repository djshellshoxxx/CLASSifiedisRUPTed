# PS-051-02 — Validation rules: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-02.R01** Every parameter has a documented numeric range and violations are rejected as a whole; nothing is clamped.
- **PS-051-02.R02** Scoring inputs are validated so that NaN or negative values cannot enter a score.
- **PS-051-02.R03** Only relay operators of the relay hosting the config can publish; vault users cannot alter the bundled default.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | weights.text, weights.recency and weights.distance are each in 0.05..0.90 and sum to 1.0 within 1e-9 | RANKING_CONFIG_INVALID |
| V02 | bm25.titleWeight and bodyWeight are in 1..10 and k is in 1..10 | RANKING_CONFIG_INVALID |
| V03 | recencyHalfLifeDays is an integer in 1..90 | RANKING_CONFIG_INVALID |
| V04 | distanceWeights are each in 0.05..1.0 and non-increasing from lt5 to gt50 | RANKING_CONFIG_INVALID |
| V05 | promotionBoost is in 0..0.25 | RANKING_CONFIG_INVALID |
| V06 | rollback target version exists in this relay's history | NOT_FOUND |
| V07 | at most 10 config publications per 24 h per relay, enforced through RateLimitPort (F12.S03.M03) | RATE_LIMITED |
| V08 | rollback target version is not the currently active version | CONFLICT_STATE |
| V09 | score inputs (bm25, age in days, bucket) are finite and non-negative; a missing center or empty cell drops the distance term and renormalises the remaining weights | VALIDATION_FAILED |
| V10 | a fetched relay config statement verifies against that relay's key over JCS bytes (F11.S01.M03) before it is cached or displayed | RANKING_CONFIG_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T01 | unit | PS-051-01.R01, PS-051-02.R01 | publish valid config | version 4 active, previous version 3 retired, one active row |
| TEST-PS-051-09.T02 | unit | PS-051-02.R01, PS-051-02.R02 | weights sum 1.1, boost 0.3, half-life 0, non-monotonic distance weights, NaN bm25 | RANKING_CONFIG_INVALID each time and VALIDATION_FAILED for the NaN input, nothing stored |
| TEST-PS-051-09.T16 | abuse | PS-051-02.R03 | vault principal tries to publish, roll back or write the bundled config | no vault command exists, FORBIDDEN, bundled version 1 unchanged |
| TEST-PS-051-09.T17 | unit | PS-051-01.R01, PS-051-02.R02 | browse query without center, document with empty cell, query without text | distance or text term dropped and remaining weights renormalised; golden values match |
| TEST-PS-051-09.T18 | unit | PS-051-03.R02, PS-051-02.R01 | rollback to the active version and to a missing version | CONFLICT_STATE and NOT_FOUND, nothing changes |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F11.S01.M01, F11.S01.M03, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
