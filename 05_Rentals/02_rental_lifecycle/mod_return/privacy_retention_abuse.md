# PS-043-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (coarse cells, retention, logs), CTR-FED-001 (R03), CTR-CAP-001.

**Decision labels:** D05 PROVISIONAL (coarse place only). D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-07.R01 | Return place stored as coarse cell only. | MVP |
| PS-043-07.R02 | `renter_note` PRIVATE_PERSONAL, RET-PRIV (365 days after last access). Status and late minutes PRIVATE_PERSONAL. | MVP |
| PS-043-07.R03 | Never federated (CTR-FED-001 R03). | MVP |
| PS-043-07.R04 | Logs carry `return_id`, status, code only. No notes, checklist or late minutes per person. | MVP |
| PS-043-07.R05 | Renter may declare return at most once per rental; owner may open at most 3 damage reports per return (ASSUMPTION). | MVP |

## Data / schema
Retention metadata: `retention_class`, `final_state_at`, `purge_after`, `legal_hold_ref`.

## Commands / queries / events
`record.deleted` carries counts only.

## States & transitions
Retention active → expired → purged; holds override.

## Validation & errors
`SYS.RATE_LIMITED` for owner damage-report cap (429).

## Authorization
Notes limited to participants and case scope.

## Failure, idempotency, concurrency, offline
Purge propagates within 24 h (CTR-PRV-001 R06).

## Privacy, retention, abuse
Abuse controls:
- Owner stalling to hold deposit: window close releases the record to deposit escalation; no owner-only hold extension.
- Renter false "no issue" declarations: owner can open damage inside window; no automatic close on renter declaration alone.
- Location history: only last cell kept on the record.

## Observability & budgets
`return_privacy_log_violations_total` must be 0.

## Tests
- TEST-PS-043-07-01 (lint): only coarse place field in schema.
- TEST-PS-043-07-02 (log scan): seeded notes absent from logs.
- TEST-PS-043-07-03 (retention): note purged at 365 days; hold extends.
- TEST-PS-043-07-04 (abuse): fourth damage report on one return → `SYS.RATE_LIMITED`.

## Acceptance criteria
1. No exact location in storage, logs or exports.
2. Zero forbidden values in logs.
3. Retention matches class default or documented hold.

## Assumptions & open decisions
- ASSUMPTION: limits in R05.
- OPEN (F10): retention of renter notes tied to disputes.
