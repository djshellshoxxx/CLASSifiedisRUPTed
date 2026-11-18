# PS-131-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-02.R01 | Reject `severity` outside SEV1–SEV4. | MVP |
| PS-131-02.R02 | Reject declaration of SEV1/SEV2 without commander. | MVP |
| PS-131-02.R03 | Reject `affected_scope` containing any field not in the closed set. | MVP |
| PS-131-02.R04 | Reject timeline text containing pattern-matched precise coordinates, email addresses or phone numbers (CTR-PRV-001 R03). | MVP |
| PS-131-02.R05 | Reject status transitions not in the state table. | MVP |

## Data / schema
Applies to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `incident.declare`, `incident.update_scope`, `incident.append_timeline`, `incident.change_severity`.

## States & transitions
Validation failure writes nothing.

## Validation & errors
| Code | Category | Retryable | message_key | Rule |
|---|---|---|---|---|
| INCIDENT.SEVERITY_INVALID | validation (400) | false | err.incident.severity_invalid | R01 |
| INCIDENT.COMMANDER_REQUIRED | precondition_failed (412) | false | err.incident.commander_required | R02 |
| INCIDENT.SCOPE_INVALID | validation (400) | false | err.incident.scope_invalid | R03 |
| INCIDENT.PRECISE_DATA_IN_TEXT | validation (400) | false | err.incident.precise_data_in_text | R04 (no value echoed) |
| INCIDENT.TRANSITION_INVALID | conflict (409) | false | err.incident.transition_invalid | R05 |

## Authorization
Validation after authentication; denial of visibility returns `SYS.NOT_FOUND` (CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Deterministic. Offline reporters may queue a report locally (D08), which is validated on arrival.

## Privacy, retention, abuse
Error responses never echo the offending text; only the field path and rule are returned.

## Observability & budgets
Counter `incident_validation_fail_total{rule}`.

## Tests
- TEST-PS-131-02-01: unit, one fixture per rule.
- TEST-PS-131-02-02: privacy, a fixture containing a coordinate pair is rejected and not echoed.

## Acceptance criteria
1. Each rule has failing and passing fixtures.
2. No rejected text appears in any response or log.

## Assumptions & open decisions
- ASSUMPTION: regex set for precise data is conservative and reviewed by F10.
- D05 (geoprivacy): PROVISIONAL (D05 default, unapproved).
