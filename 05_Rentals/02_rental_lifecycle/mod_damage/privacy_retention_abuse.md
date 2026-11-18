# PS-041-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, EXIF, retention), CTR-COM-001 (evidence), CTR-FED-001 (R03), CTR-CAP-001.

**Decision labels:** D07 PROVISIONAL (unapproved). OPEN (R07, F10): retention of photos showing home interiors.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-07.R01 | Amounts and status: FINANCIAL_EVIDENCE, RET-EVD. Descriptions and photo bytes: PRIVATE_PERSONAL, RET-PRIV (365 days after last access). | MVP |
| PS-041-07.R02 | Photos stored without GPS or device-location EXIF (PS-041-01 R04); test on every upload. | MVP |
| PS-041-07.R03 | Never federated (CTR-FED-001 R03). | MVP |
| PS-041-07.R04 | Logs: `damage_id`, status, code. No descriptions, photo digests or amounts. | MVP |
| PS-041-07.R05 | A report is limited to 3 open reports per rental and 10 per owner per 24 h (ASSUMPTION). | MVP |
| PS-041-07.R06 | Photos of persons: renter may request blur; blur does not change digest of original (original kept for dispute, access restricted to case scope). | MVP |

## Data / schema
Retention metadata: `retention_class`, `final_state_at`, `purge_after`, `legal_hold_ref`.

## Commands / queries / events
`record.deleted` payload has IDs and counts only (CTR-PRV-001 R12).

## States & transitions
Retention: active → expired → purged; legal hold overrides (CTR-PRV-001 R07).

## Validation & errors
`SYS.RATE_LIMITED` for R05 breaches (429, retryable after `retry_after_ms`).

## Authorization
Photo originals are visible only in case scope (PS-041-05).

## Failure, idempotency, concurrency, offline
Purge propagates within 24 h to replicas, caches and exports (CTR-PRV-001 R06).

## Privacy, retention, abuse
Abuse controls:
- Inflated charges: line caps and baseline rule (PS-041-02, PS-041-03 R04).
- Fabricated photos: digest chain and capture-time check only as a signal; no automated verdict.
- Retaliatory reports: contest-rate alert per owner; escalation to case review.
- Renter collusion to avoid charges: owner-side escalation path; no auto-acceptance.

## Observability & budgets
`damage_privacy_log_violations_total` must be 0. `damage_photo_exif_violations_total` must be 0.

## Tests
- TEST-PS-041-07-01 (EXIF): GPS tags absent in every stored photo.
- TEST-PS-041-07-02 (log scan): seeded descriptions and amounts absent from logs.
- TEST-PS-041-07-03 (retention): photo purged at 365 days; amount record retained 24 months.
- TEST-PS-041-07-04 (abuse): 4th open report on one rental → `SYS.RATE_LIMITED`.

## Acceptance criteria
1. Zero GPS tags in stored photos (TEST-PS-041-07-01).
2. Zero forbidden values in logs (TEST-PS-041-07-02).
3. Retention matches class defaults or a documented hold.

## Assumptions & open decisions
- ASSUMPTION: rate limits in R05 and blur rule in R06 (OPEN, F10).
- PROVISIONAL (D07 default, unapproved).
