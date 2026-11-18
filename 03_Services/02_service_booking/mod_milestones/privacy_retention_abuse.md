# PS-031-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-07.R01 | No location fields; service location is referenced through the booking only (CTR-PRV-001 R03). | MVP |
| PS-031-07.R02 | Milestones and amounts are not federated in MVP (CTR-FED-001 R02, R03). | MVP |
| PS-031-07.R03 | Acceptance text classed PRIVATE_PERSONAL; never in events, logs or search. | MVP |
| PS-031-07.R04 | Plan manipulation abuse: > 3 `plan_set` calls per booking per day → `MILESTON.RATE_LIMITED` (ASSUMPTION). | MVP |
| PS-031-07.R05 | Milestone fraud signals (e.g. repeated auto-accept on one counterparty) go to F12 by full ID; this module applies no sanctions. | MVP |
| PS-031-07.R06 | Erasure: milestone rows retained while a claim is non-terminal or a dispute is open (CTR-PRV-001 R07); otherwise acceptance text removed and IDs tombstoned. | MVP |
| PS-031-07.R07 | Evidence digests are retained as digests; media stays in evidence stores (F12/F09). | MVP |

## Data / schema
Classes: `acceptance_text` PRIVATE_PERSONAL; `amount_minor` FINANCIAL_EVIDENCE; `state`, `order_index` PSEUDONYMOUS; digests PSEUDONYMOUS. Retention: 90 days after terminal state unless claim or dispute open (ASSUMPTION; D07 PROVISIONAL).

## Commands / queries / events
Event payloads exclude acceptance text and `amount_minor` may appear only inside F09-bound events.

## States & transitions
Tombstoning does not change `state`.

## Validation & errors
`MILESTON.RATE_LIMITED` (retryable true, retry-after).

## Authorization
Read only by participants ([authorization_capabilities.md](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Tombstoning idempotent per milestone ID.

## Privacy, retention, abuse
Threats: pressure via plan changes, fake submissions, leakage of work details through acceptance text, graph linking between provider and client through repeated bookings. Controls: R03, R04, R05, R06.

## Observability & budgets
Logs: IDs hashed, enum codes, no text. Rate-limit counter per booking.

## Tests
- TEST-PS-031-07-01 unit: `plan_set` rate limit at 4th call.
- TEST-PS-031-07-02 privacy: log scan finds no acceptance text.
- TEST-PS-031-07-03 integration: erasure keeps rows with open claim; tombstones otherwise.

## Acceptance criteria
1. No event or log includes acceptance text.
2. Federation of milestones impossible in MVP.
3. Erasure matches R06 in both branches.

## Assumptions & open decisions
- ASSUMPTION: 90-day retention after terminal state; 3 `plan_set` per day.
- D07 PROVISIONAL.
- Payment checklist applies: amount visibility participant-only.
