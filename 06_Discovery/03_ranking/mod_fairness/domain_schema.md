# PS-046-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes; no sensitive ranking inputs), CTR-COM-001 (promotion money only via claims), CTR-ID-001 (`rpo_` policy and `fxa_` audit PENDING, proposed owner F06), CTR-SCH-001.

**Decision labels:** Promotion and exposure caps are ASSUMPTION (OPEN, F06). D06 PROVISIONAL for any promotion receipt (no receipt is produced here).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-01.R01 | `rank_policy` record holds the caps in the schema below; exactly one ACTIVE policy per locale and category group. | MVP |
| PS-046-01.R02 | `promoted_share_max` ∈ [0.00, 0.20] (decimal, 2 places; ASSUMPTION). Higher → `FAIRNESS.CONFIG_INVALID`. | MVP |
| PS-046-01.R03 | `same_seller_max_run` ∈ {1, 2, 3}; `same_seller_max_top20` ∈ [1, 4] (ASSUMPTION). | MVP |
| PS-046-01.R04 | `exposure_audit` stores per-page counts per seller bucket and promoted flags, never per user, never per search text. | MVP |
| PS-046-01.R05 | Seller bucket = keyed hash of `acc_` with a rotating daily key (ASSUMPTION), so audit rows cannot be joined across days. | MVP |
| PS-046-01.R06 | No field carries PRIVATE_PERSONAL or LOCATION_PRECISE data. | MVP |

## Data / schema
```json
{
  "policy_id": "rpo_<26> (PENDING)",
  "status": "DRAFT | ACTIVE | RETIRED",
  "scope": {"locale": "BCP 47", "category_group": "string"},
  "promoted_share_max": "decimal 0.00-0.20",
  "same_seller_max_run": "1 | 2 | 3",
  "same_seller_max_top20": "1-4",
  "page_size": "integer 10-50",
  "state_version": "integer >= 1",
  "schema_version": "1.0.0"
}
```
```json
{
  "audit_id": "fxa_<26> (PENDING)",
  "page_id": "string",
  "policy_id": "rpo_<26>",
  "page_size": "integer",
  "promoted_count": "integer",
  "seller_bucket_counts": [{"bucket": "hex", "count": "integer"}],
  "constraint_status": "PASS | VIOLATED_AUTO_REPAIRED",
  "recorded_at": "RFC 3339"
}
```
Data class: PUBLIC-aggregated for counts; PSEUDONYMOUS for seller bucket.

## Commands / queries / events
Not applicable; see PS-046-04.

## States & transitions
See PS-046-03.

## Validation & errors
See PS-046-02.

## Authorization
Policies read by ranking service; audits readable by F06 operators in aggregate only (PS-046-05).

## Failure, idempotency, concurrency, offline
Policy activation is versioned; a page uses the policy version active at request time and records it.

## Privacy, retention, abuse
Audit rows RET-OPS (30 days). Daily key destroyed at rotation (ASSUMPTION).

## Observability & budgets
`fairness_policy_invalid_total{code}`.

## Tests
- TEST-PS-046-01-01 (unit): caps outside range rejected.
- TEST-PS-046-01-02 (lint): no PRIVATE_PERSONAL or LOCATION_PRECISE field.
- TEST-PS-046-01-03 (unit): daily key rotation makes bucket values non-joinable across days.
- TEST-PS-046-01-04 (integration): two ACTIVE policies for one scope rejected.

## Acceptance criteria
1. Policy and audit schemas registered with owner F06 and digest.
2. No sensitive data class fields (TEST-PS-046-01-02).
3. TEST-PS-046-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: cap values above; OPEN (F06, Trust & Safety consult).
- PENDING CTR-ID-001 prefix registration (`rpo`, `fxa`).
