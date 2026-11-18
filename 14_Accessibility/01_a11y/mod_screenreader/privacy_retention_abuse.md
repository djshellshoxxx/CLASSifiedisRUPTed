# PS-110-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-07.R01 | Spoken output never includes exact location, home address, contact details or amounts. | MVP |
| PS-110-07.R02 | Announcements for private events are generic (for example "New message"), per CTR-PRV-001 R10. | MVP |
| PS-110-07.R03 | Announcement text is not logged or sent to analytics. | MVP |

## Data / schema
Templates are PUBLIC. No new personal data.

## Commands / queries / events
None beyond PS-110-04.

## States & transitions
Not applicable.

## Validation & errors
Enforced by [PS-110-02](validation_rules.md).

## Authorization
See [PS-110-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Shared-device risk: spoken messages can be overheard. Default spoken text for private events is generic. Users may opt in to content announcements per device (ASSUMPTION, aligned with CTR-PRV-001 R10). Retention: templates kept while published plus 12 months after deprecation (ASSUMPTION). Abuse: template publishing is audited; a malicious template cannot inject markup because text is rendered as text, never HTML.

## Observability & budgets
No text in telemetry.

## Tests
- TEST-PS-110-07-01 static: template text rendered via text nodes only (no innerHTML path).
- TEST-PS-110-07-02 integration: private-event template uses generic text by default.
- TEST-PS-110-07-03 log scan: no announcement text in logs.

## Acceptance criteria
1. Zero announcement text in logs in the test run.
2. Private events announce generic text by default in 100% of fixtures.
3. Rendering path has no HTML injection sink.

## Assumptions & open decisions
- ASSUMPTION: opt-in content announcements per device.
- D07 (retention): PROVISIONAL (D07 default, unapproved) for deprecated templates.
