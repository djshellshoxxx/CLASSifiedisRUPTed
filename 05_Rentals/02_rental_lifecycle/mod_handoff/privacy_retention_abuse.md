# PS-042-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (coarse location, EXIF, retention), CTR-FED-001 (R03), CTR-CAP-001.

**Decision labels:** D05 geoprivacy PROVISIONAL (coarse only). D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-07.R01 | Place is a coarse region cell only; exact meeting point is not stored in this module (it stays in the messaging thread, F08, if used). | MVP |
| PS-042-07.R02 | Photo bytes lose GPS and device-location EXIF before storage (PS-042-01 R04). | MVP |
| PS-042-07.R03 | Records retained RET-PRIV (365 days after last access); held longer only under a case legal hold. | MVP |
| PS-042-07.R04 | Never federated; never logged with checklist or photo content. | MVP |
| PS-042-07.R05 | Each party may schedule at most 3 active handoffs per counterparty (ASSUMPTION). | MVP |

## Data / schema
Retention metadata: `retention_class`, `final_state_at`, `purge_after`, `legal_hold_ref`.

## Commands / queries / events
`record.deleted` carries IDs and counts only.

## States & transitions
Retention active → expired → purged; hold overrides.

## Validation & errors
`SYS.RATE_LIMITED` for R05 (429).

## Authorization
Photos to participants and case scope only.

## Failure, idempotency, concurrency, offline
Purge propagates within 24 h (CTR-PRV-001 R06).

## Privacy, retention, abuse
Abuse controls:
- Scheduling spam to harass a counterparty: R05 cap and cancel-by-counterparty not allowed to repeat more than twice per week (ASSUMPTION).
- Fake completion (one party attests for both): impossible by design; each party signs its own side.
- Location inference from region history: only the last cell is kept on the record; history of cells not retained.
- Photo of a person: same blur rule as damage module R06.

## Observability & budgets
`rental_handoff_privacy_violations_total` must be 0.

## Tests
- TEST-PS-042-07-01 (lint): schema contains only coarse place field.
- TEST-PS-042-07-02 (EXIF): GPS tags absent from stored photos.
- TEST-PS-042-07-03 (retention): record purged at 365 days absent hold; held under hold.
- TEST-PS-042-07-04 (abuse): fourth active handoff with one counterparty → `SYS.RATE_LIMITED`.

## Acceptance criteria
1. No exact location in storage, logs or exports.
2. Zero GPS tags in stored photos.
3. Retention meets class defaults or documented hold.

## Assumptions & open decisions
- ASSUMPTION: rate caps in R05 and abuse limits.
- OPEN (F10): retention of checklists tied to disputes.
