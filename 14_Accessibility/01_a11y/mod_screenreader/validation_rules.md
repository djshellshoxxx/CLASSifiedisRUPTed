# PS-110-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-COM-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-02.R01 | Reject a template whose placeholder is not in the allowed class set (`SCRN.PRIVATE_FIELD_FORBIDDEN`). | MVP |
| PS-110-02.R02 | Reject rendered text longer than 140 characters (`SCRN.TEXT_TOO_LONG`). | MVP |
| PS-110-02.R03 | Reject any template that announces a LOCATION_PRECISE or FINANCIAL_EVIDENCE value, including amounts. | MVP |

## Data / schema
Allowed placeholder classes: PUBLIC, PSEUDONYMOUS. Forbidden: PRIVATE_PERSONAL, LOCATION_COARSE in announcements (exact region names are not spoken), LOCATION_PRECISE, FINANCIAL_EVIDENCE, SECRET.

## Commands / queries / events
Validation runs on `scr.template.publish` ([PS-110-04](commands_queries_events.md)).

## States & transitions
Publish allowed only from `draft` after validation passes ([PS-110-03](workflow_state_machine.md)).

## Validation & errors
| Rule | Code | Retryable | Message key | Diagnostic |
|---|---|---|---|---|
| Placeholder not in allowed set | SCRN.PRIVATE_FIELD_FORBIDDEN | false | err.scrn.private_field_forbidden | placeholder name |
| Unknown placeholder | SCRN.TEMPLATE_UNKNOWN_FIELD | false | err.scrn.template_unknown_field | placeholder name |
| Rendered length > 140 | SCRN.TEXT_TOO_LONG | false | err.scrn.text_too_long | length only |
| Event has no published template | SCRN.TEMPLATE_NOT_PUBLISHED | false | err.scrn.template_not_published | event_key |

Template text is never echoed to the client in error bodies.

## Authorization
Validation runs for every principal; publishing requires the capability in [PS-110-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Client validates against the bundled template catalog; mismatched versions fall back to the last published template.

## Privacy, retention, abuse
Rejected template text is not stored outside the draft record.

## Observability & budgets
Counter per error code. Validation p95 ≤ 5 ms (ASSUMPTION).

## Tests
- TEST-PS-110-02-01 unit: one fixture per error code.
- TEST-PS-110-02-02 property: any template with a LOCATION_PRECISE placeholder is rejected.
- TEST-PS-110-02-03 unit: rendered 141-character string is rejected; 140 accepted.

## Acceptance criteria
1. All four codes return the documented retryable value.
2. No allowed template can render a LOCATION_PRECISE or FINANCIAL_EVIDENCE value.
3. Length limit enforced at publish and at render time.

## Assumptions & open decisions
- ASSUMPTION: 140-character limit covers screen reader verbosity targets across common readers; verification PENDING manual testing.
- No Dxx decision directly affects validation.
