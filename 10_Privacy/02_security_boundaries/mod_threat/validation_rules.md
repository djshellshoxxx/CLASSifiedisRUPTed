# PS-082-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-02.R01 | Reject duplicate `threat_id` with `THREAT.DUPLICATE_ID` (409). | MVP |
| PS-082-02.R02 | Reject a threat with zero `flow_refs` with `THREAT.UNLINKED_FLOW` (422). | MVP |
| PS-082-02.R03 | Reject `likelihood` or `impact` outside 1–5 with `THREAT.SCORE_OUT_OF_RANGE` (400). | MVP |
| PS-082-02.R04 | Reject a mitigation marked `mitigated` that has no passing `TEST-*` ID with `THREAT.MITIGATION_UNTESTED` (422). | MVP |
| PS-082-02.R05 | Reject a `title` containing an email, phone or coordinate pattern with `THREAT.TITLE_CONTAINS_DATA` (422). | MVP |

## Data / schema
Rules apply to fields in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `threat.register`, `threat.update_mitigation`, `threat.accept_risk`.

## States & transitions
Validation runs before each transition in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP |
|---|---|---|
| THREAT.DUPLICATE_ID | false | conflict / 409 |
| THREAT.UNLINKED_FLOW | false | unprocessable_state / 422 |
| THREAT.SCORE_OUT_OF_RANGE | false | validation / 400 |
| THREAT.MITIGATION_UNTESTED | false | unprocessable_state / 422 |
| THREAT.TITLE_CONTAINS_DATA | false | unprocessable_state / 422 |

## Authorization
Validation runs for authorized writers only; unauthorized callers receive authorization errors first.

## Failure, idempotency, concurrency, offline
Deterministic; no offline writes.

## Privacy, retention, abuse
Errors never echo the title or exploit text (CTR-ERR-001 R07).

## Observability & budgets
Counter `threat_validation_failures_total{code}`.

## Tests
- TEST-PS-082-02-01 (unit): each R01–R05 returns its code.
- TEST-PS-082-02-02 (negative): mitigation with test ID absent cannot reach `mitigated`.
- TEST-PS-082-02-03 (privacy): seeded email-like title rejected.

## Acceptance criteria
1. All five codes tested.
2. No error echoes user input.

## Assumptions & open decisions
- ASSUMPTION: regex set for data detection is a shared list with PS-081-02.
