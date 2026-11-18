# PS-081-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-02.R01 | A flow with no `data_class` is rejected with `MODEL.FLOW_UNCLASSIFIED` (422). | MVP |
| PS-081-02.R02 | A flow with class PRIVATE_PERSONAL, FINANCIAL_EVIDENCE or LOCATION_PRECISE that crosses `client_pwa` to `relay` without a listed transport control is rejected with `MODEL.BOUNDARY_CONTROL_MISSING` (422). | MVP |
| PS-081-02.R03 | A flow whose sink is `peer_node` may not carry LOCATION_PRECISE, SECRET or PRIVATE_PERSONAL (CTR-FED-001 R03); rejected with `MODEL.CLASS_NOT_CROSSABLE` (422). | MVP |
| PS-081-02.R04 | Republishing an existing `version` with a different digest is rejected with `MODEL.VERSION_IMMUTABLE` (409). | MVP |
| PS-081-02.R05 | Any field name matching an email, phone or coordinate pattern in sample data is rejected (`MODEL.SAMPLE_DATA_FORBIDDEN`, 422). | MVP |

## Data / schema
Rules apply to entities in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `model.propose_version`, `model.register_flow`, `model.retire_flow`.

## States & transitions
Validation runs at proposal, not at acceptance; acceptance can fail only on authorization or review rules.

## Validation & errors
| Code | Retryable | Category / HTTP |
|---|---|---|
| MODEL.FLOW_UNCLASSIFIED | false | validation / 400 |
| MODEL.BOUNDARY_CONTROL_MISSING | false | unprocessable_state / 422 |
| MODEL.CLASS_NOT_CROSSABLE | false | unprocessable_state / 422 |
| MODEL.VERSION_IMMUTABLE | false | conflict / 409 |
| MODEL.SAMPLE_DATA_FORBIDDEN | false | unprocessable_state / 422 |

## Authorization
Validation precedes authorization decision only for shape; object existence follows CTR-ERR-001 R08.

## Failure, idempotency, concurrency, offline
Pure function of input; identical inputs give identical codes. No offline writes.

## Privacy, retention, abuse
Error details never echo field values (CTR-ERR-001 R07).

## Observability & budgets
Counter `model_validation_failures_total{code}`. Target: 0 unclassified flows in main branch.

## Tests
- TEST-PS-081-02-01 (unit): each R01–R05 rule returns its code.
- TEST-PS-081-02-02 (matrix): every zone pair × class combination is evaluated against R02 and R03.
- TEST-PS-081-02-03 (negative): sample-data regex rejects seeded email-like value.

## Acceptance criteria
1. All five codes covered by tests.
2. Zone × class matrix complete.
3. No validation output echoes input values.

## Assumptions & open decisions
- ASSUMPTION: transport control list is `tls_1_3`, `e2e_encrypted`, `none` (values PROVISIONAL).
- PROVISIONAL (CTR-FED-001 R03, unapproved default): federation class restrictions.
