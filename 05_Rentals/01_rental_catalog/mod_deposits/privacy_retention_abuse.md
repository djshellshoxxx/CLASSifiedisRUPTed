# PS-040-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention, disclosure), CTR-COM-001 (evidence, R15 labels), CTR-FED-001 (R03 no federation of financial evidence), CTR-CAP-001.

**Decision labels:** D07 retention PROVISIONAL (unapproved). D09 PROVISIONAL. Legal retention is OPEN (R07 jurisdiction review).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-07.R01 | Every deposit field has a class; amounts, status and refs are FINANCIAL_EVIDENCE; `notes` is PRIVATE_PERSONAL. | MVP |
| PS-040-07.R02 | Deposit records are never federated and never exported to peers (CTR-FED-001 R03). | MVP |
| PS-040-07.R03 | Retention: RET-EVD 24 months after final state; personal fields redacted at 12 months, hashes kept. `notes`: RET-PRIV (365 days after last access). | MVP |
| PS-040-07.R04 | Logs carry `deposit_id`, status and error code only. Amounts, party IDs and notes are never logged (CTR-PRV-001 R09). | MVP |
| PS-040-07.R05 | Proposals capped at 10 per `acc_` per 24 h (ASSUMPTION), returning `SYS.RATE_LIMITED`. | MVP |
| PS-040-07.R06 | UI labels for `HELD` read "recorded as given", never "paid" or "settled" (CTR-COM-001 R15). | MVP |

## Data / schema
Retention metadata per record: `retention_class`, `final_state_at`, `redact_after`, `purge_after`, `legal_hold_ref` (nullable, CTR-PRV-001 R07).

## Commands / queries / events
Deletion or expiry emits `record.deleted` with IDs and counts only (CTR-PRV-001). Redaction keeps the envelope and replaces payload with digest (CTR-EVT-001 R08).

## States & transitions
Retention lifecycle: active → expired → purged; `legal_hold` overrides expiry until released (CTR-PRV-001 R07).

## Validation & errors
`SYS.RATE_LIMITED` (429, retryable with `retry_after_ms`). `PRV.QUERY_BUDGET_EXCEEDED` not used here.

## Authorization
Export to owner only per PS-040-10. Operator access follows dual control.

## Failure, idempotency, concurrency, offline
Deletion propagates to replicas, caches and exports within 24 h (ASSUMPTION, CTR-PRV-001 R06). Offline caches of deposit data are purged on logout.

## Privacy, retention, abuse
Abuse controls:
- Inflated deposits: cap (PS-040-02 R02).
- Deposit as disguised fee or payment channel: no fee field, no in-kind method.
- Fake "given" claims: cash cannot verify; only counterparty attestation counts.
- Owner withholding: escalation only; no automatic deduction.
- Repeated disputes by one party: review alert (CTR-COM-001 abuse rule).

## Observability & budgets
`deposit_privacy_log_violations_total` must be 0. `deposit_redaction_lag_seconds` p95 ≤ 86400 (ASSUMPTION).

## Tests
- TEST-PS-040-07-01 (lint): every field classified; none federated.
- TEST-PS-040-07-02 (log scan): seeded amounts and notes absent from logs after full flow.
- TEST-PS-040-07-03 (retention): record redacted at 12 months and purged at 24 months in fixtures.
- TEST-PS-040-07-04 (abuse): 11th proposal in 24 h → `SYS.RATE_LIMITED`.

## Acceptance criteria
1. Zero FINANCIAL_EVIDENCE values in logs (TEST-PS-040-07-02).
2. Federation export excludes all deposit records (TEST-PS-040-07-01).
3. Retention matches RET-EVD defaults or documented legal hold.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): RET-EVD defaults.
- OPEN (F10, R07): jurisdiction review of 24-month retention.
- ASSUMPTION: 10 proposals per 24 h limit.
