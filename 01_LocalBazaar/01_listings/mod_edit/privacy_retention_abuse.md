# PS-003-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes R01–R06, R09, R11, R12), CTR-EVT-001 R06 and R11, CTR-FED-001 R02.

**Decision labels:** Retention of `listing.updated` events PROVISIONAL (D07 default, unapproved). Federation off for drafts (CTR-FED-001 R02). Rate limits ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-07.R01 | Logs, traces and metrics for this module carry field names, revision and outcome only. No title, description, price or region values. | MVP |
| PS-003-07.R02 | `listing.updated` payload contains no field values (PS-003-04 R03). `max_data_class` = PUBLIC. | MVP |
| PS-003-07.R03 | Module accepts and stores region at LOCATION_COARSE only. Any precision-bearing key → `EDIT.FIELD_NOT_EDITABLE`. | MVP |
| PS-003-07.R04 | Idempotency records retained 7 days (RET-OPS). No prior field values are stored by this module. | MVP |
| PS-003-07.R05 | Rate limit: 20 edits per listing per hour and 200 edits per `acc_` per day (ASSUMPTION). Excess → `SYS.RATE_LIMITED`. | MVP |
| PS-003-07.R06 | Bait-and-switch control: material edits blocked while offers are open (PS-003-03 R03). Repeated material edits on the same listing emit a churn signal to 12_Moderation mod_signals (ASSUMPTION). | MVP |
| PS-003-07.R07 | Listing owner appears to others as `prf_` view only. Edit events carry the opaque `acc_` ref, never name or contact (CTR-EVT-001 R06). | MVP |
| PS-003-07.R08 | When a listing is deleted, pending idempotency records for it are purged by RET-OPS expiry; no edit is accepted after deletion. | MVP |

## Data / schema
Classes per field in [domain_schema.md](domain_schema.md). Module adds no PRIVATE_PERSONAL, FINANCIAL_EVIDENCE or LOCATION_PRECISE field.

## Commands / queries / events
Event payload per [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Not applicable. See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Error responses name keys, never values (PS-003-02 R01, R08).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-003-06).
Offline queue held on device only. See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See Requirements R01–R08 above; this file is the authoritative source for the topic.

## Observability & budgets
No actor or listing ID as metric label. See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-003-07-01 (privacy): log capture during 100 edits contains no title, description or price text.
- TEST-PS-003-07-02 (negative): precision coordinate in `region_cell` rejected, not stored, not logged.
- TEST-PS-003-07-03 (abuse): 21st edit within an hour → `SYS.RATE_LIMITED`.
- TEST-PS-003-07-04 (abuse): material edit with open offer → blocked; churn signal emitted at threshold.
- TEST-PS-003-07-05 (retention): idempotency record absent after 7 days.

## Acceptance criteria
1. No content value reaches logs, metrics or events.
2. No coordinates or addresses are stored by this module.
3. Abuse controls (R05, R06) are tested and configurable by F12 and F15 without redeploy (ASSUMPTION).

## Assumptions & open decisions
- ASSUMPTION: rate-limit values in R05 and churn threshold.
- D07 (PROVISIONAL, Dxx default, unapproved): minimal retention with legal-hold exceptions.
- D05 (PROVISIONAL, Dxx default, unapproved): coarse region only.
