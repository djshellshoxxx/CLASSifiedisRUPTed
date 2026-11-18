# PS-046-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention, logs), CTR-FED-001 (no federation of audit rows), CTR-CAP-001.

**Decision labels:** Key rotation daily ASSUMPTION. D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-07.R01 | Audit rows RET-OPS (30 days); bucket keys rotate daily and old keys destroyed at rotation. | MVP |
| PS-046-07.R02 | Audit and policy data never federated (local operational data). | MVP |
| PS-046-07.R03 | No ranking input or audit field carries PRIVATE_PERSONAL or LOCATION_PRECISE data (PS-046-05 R03). | MVP |
| PS-046-07.R04 | Logs carry policy ID, page ID and counts; never seller bucket values. | MVP |
| PS-046-07.R05 | Promotion status shown to viewers as label only; promotion purchase data stays in F09 claims (CTR-COM-001). | MVP |

## Data / schema
Retention metadata per row; key metadata with `key_destroyed_at`.

## Commands / queries / events
None personal.

## States & transitions
Retention active → expired → purged.

## Validation & errors
Not applicable beyond PS-046-02.

## Authorization
PS-046-05.

## Failure, idempotency, concurrency, offline
Key destruction is verified by test; rows cannot be re-keyed.

## Privacy, retention, abuse
Abuse controls:
- Sellers gaming order by splitting into many accounts: same-seller caps apply per account and per bucket of linked accounts when F07 signals linkage (ASSUMPTION).
- Paid placement hiding: label required and cap enforced (R05 and PS-046-02 R02).
- Operator favoritism: policy changes need two approvers and are auditable.
- Audit probing: aggregated reads only; query budget per operator (ASSUMPTION).

## Observability & budgets
`fairness_privacy_log_violations_total` must be 0.

## Tests
- TEST-PS-046-07-01 (lint): no sensitive class in ranking inputs or audit fields.
- TEST-PS-046-07-02 (log scan): no seller bucket values in logs.
- TEST-PS-046-07-03 (key destruction): after rotation, bucket values cannot be linked across days (test vector).
- TEST-PS-046-07-04 (label): promoted items always rendered with label.

## Acceptance criteria
1. Zero sensitive fields in ranking config or audit rows.
2. Keys destroyed at rotation.
3. Label present on every promoted item.

## Assumptions & open decisions
- ASSUMPTION: daily key rotation; linkage signal from F07.
- OPEN (F10, F12): linkage detection rules.
