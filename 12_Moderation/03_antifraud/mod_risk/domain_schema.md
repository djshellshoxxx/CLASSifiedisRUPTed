# PS-100-01 — Domain schema: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-01.R01** A RiskAssessment stores subject (key or transaction reference), level, score, factors with per-factor points, model version, input digest, frictions and validity window, with tenant and revision per CTR-ID-001.
- **PS-100-01.R02** Assessments are derived data of P3 in a vault and P3 on a relay, retained 30 days under RET-SHORT, and recomputable from signals.
- **PS-100-01.R03** The sum of factor points equals the score before clamping to 0..100, and every factor names a signal kind and count, never a content item.

## Specification

### RiskAssessment

Schema `classrup.moderation.riskassessment/v1` · storage **derived** · privacy **P3** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope |
| subjectType | enum — key \| transaction |
| subjectRef | string — did:key or transaction reference (deal, cycle proposal or auction ID) |
| level | enum — low \| medium \| high |
| score | int — 0..100 |
| factors | object[] — { kind, count, points }; sum of points = score before clamping |
| frictions | string[] — extra_confirmation \| lower_limits \| review_queue \| show_caution |
| modelVersion | string — risk/1 |
| inputDigest | string — SHA-256 hex of ordered signal IDs, account age bucket and model version |
| computedAt | timestamp — RFC 3339 UTC, store clock |
| validUntil | timestamp — computedAt + 24 h for keys, + 15 min for transactions |
| previousLevel? | enum — low \| medium \| high |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- [object Object]
- frictions for level low is empty; high never includes any action that hides, bans or removes.
- Same inputDigest produces the same score, level and factors.

### Storage DDL

```sql
CREATE TABLE moderation_risk_assessment (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_type TEXT NOT NULL, subject_ref TEXT NOT NULL, level TEXT NOT NULL,
  score INTEGER NOT NULL, input_digest TEXT NOT NULL, computed_at TEXT NOT NULL, valid_until TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_risk_subject ON moderation_risk_assessment(tenant_id, subject_type, subject_ref, input_digest);
CREATE INDEX moderation_risk_latest ON moderation_risk_assessment(tenant_id, subject_type, subject_ref, computed_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T01 | unit | PS-100-01.R01, PS-100-01.R03, PS-100-02.R01, PS-100-02.R02 | compute assessment for fixture | score equals documented sum of factor points; level per thresholds; model risk/1 recorded |
| TEST-PS-100-09.T02 | property | PS-100-01.R03, PS-100-03.R02 | random signal sets and times | factors sum to score before clamping; level function of score and hysteresis state; same digest same output |
| TEST-PS-100-09.T10 | unit | PS-100-07.R02, PS-100-01.R02 | assessment retention at 30 days and consumer payload | purged; payload has level and kinds only |
| TEST-PS-100-09.T14 | e2e | PS-100-01.R02, PS-100-04.R01 | mobile user confirms a trade with a high-level counterparty | caution banner and extra confirmation shown, factor sentences readable, axe zero serious issues |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
