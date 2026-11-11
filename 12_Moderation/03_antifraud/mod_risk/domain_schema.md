# PS-100-01 — Domain schema: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-01.R01** A RiskAssessment stores subject (key, transaction reference or own listing publication), level, score, factors with per-factor points, model version, input digest, frictions, validity window and next threshold crossing, with tenant and revision per CTR-ID-001.
- **PS-100-01.R02** Assessments are derived data, P3 in a vault (owner only) and P2 on a relay (the subject and that relay's moderators), retained 30 days under RET-SHORT, and recomputable from signals.
- **PS-100-01.R03** The sum of factor points equals the score before clamping to 0..100, and every factor names a signal kind and count, never a content item.
- **PS-100-01.R04** Points follow the published table risk/1: per signal kind floor of the summed decayed weights (compensations netted, a kind never below 0); deal credit −2 per unexpired deal_completed signal together with manual_positive weights, never below −20; new_key 10 under 24 h and 5 under 7 days since the relay's first observation (relay opt-in, keys only); amount_bucket small 0, medium 5, large 10 (transactions only); for listing_publication, publication_velocity 3 per publication beyond 5 in 24 h up to 45, new_principal 10 under 7 days and spam_score floor(score / 2).

## Specification

### RiskAssessment

Schema `classrup.moderation.riskassessment/v1` · storage **derived** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope |
| subjectType | enum — key \| transaction \| listing_publication |
| subjectRef | string — did:key, transaction reference (deal, cycle proposal or auction ID) or own publication draft ID |
| level | enum — low \| medium \| high |
| score | int — 0..100 |
| factors | object[] — { kind, count, points }; sum of points = score before clamping |
| frictions | string[] — extra_confirmation \| lower_limits \| review_queue \| show_caution |
| modelVersion | string — risk/1 |
| inputDigest | string — SHA-256 hex of ordered signal IDs, first-seen bucket, amount bucket, publication inputs and model version |
| computedAt | timestamp — RFC 3339 UTC, store clock |
| validUntil | timestamp — computedAt + 24 h for keys, + 15 min for transactions and listing publications |
| nextCrossingAt? | timestamp — earliest time decay moves the score across a hysteresis threshold, at most computedAt + 24 h (keys only) |
| previousLevel? | enum — low \| medium \| high |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- level is a pure function of score and the hysteresis state: high at ≥ 70 (leaves below 60), medium at ≥ 35 (leaves below 25), otherwise low.
- frictions for level low is empty; high never includes any action that hides, bans or removes.
- Same inputDigest produces the same score, level and factors.
- Vault rows are P3 and never leave the vault; relay rows are readable only by the subject and that relay's moderators.

**Note:** Store-local derived first-seen map (subject key hash → firstSeenAt), recorded by this store's own observation (relay: identity.session.started of kind relay_token or the first verified signed request; vault: the first verified statement from the key), kept while the key has signals or assessments plus 30 days.

### Storage DDL

```sql
CREATE TABLE moderation_risk_assessment (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_type TEXT NOT NULL, subject_ref TEXT NOT NULL, level TEXT NOT NULL,
  score INTEGER NOT NULL, input_digest TEXT NOT NULL, computed_at TEXT NOT NULL, valid_until TEXT NOT NULL, next_crossing_at TEXT,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_risk_subject ON moderation_risk_assessment(tenant_id, subject_type, subject_ref, input_digest);
CREATE INDEX moderation_risk_latest ON moderation_risk_assessment(tenant_id, subject_type, subject_ref, computed_at);
CREATE INDEX moderation_risk_crossing ON moderation_risk_assessment(tenant_id, next_crossing_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T01 | unit | PS-100-01.R01, PS-100-01.R03, PS-100-02.R01, PS-100-02.R02 | key assessment of B; transaction assessment of B with amountBucket medium | key: no_show 17, dispute_opened 8, deal_credit −6, score 19, low; transaction: plus amount_bucket 5, score 24, low; model risk/1 recorded; frictions empty |
| TEST-PS-100-09.T02 | property | PS-100-01.R03, PS-100-03.R02 | random signal sets and times | factors sum to score before clamping; level function of score and hysteresis state; same digest same output |
| TEST-PS-100-09.T10 | unit | PS-100-07.R02, PS-100-01.R02 | injected clock 31 days after computation; consumer payload | assessment purged; payload has level and kinds only |
| TEST-PS-100-09.T14 | e2e | PS-100-01.R02, PS-100-04.R01 | mobile user confirms a trade with a high-level counterparty | caution banner and extra confirmation shown, factor sentences readable, axe zero serious issues |
| TEST-PS-100-09.T15 | abuse | PS-100-07.R01, PS-100-01.R02 | F12 privacy suite after recomputes in a vault and on a relay: scan federation payloads, public projections, notifications and logs | no assessment field, score, level or factor appears in any of them |
| TEST-PS-100-09.T17 | unit | PS-100-01.R04 | one fixture per points-table row: compensated kind, 12 deal_completed signals, manual_positive, new key at 2 h and 3 days on X and in a vault, amount buckets, 20 own publications in 24 h with spamScore 40 by a 2-day-old principal | each factor gets the documented points; credit floors at −20; no new_key in the vault; listing_publication 45 + 10 + 20 = 75 high |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
