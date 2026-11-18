# PS-110-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-01.R01 | Every announcement is produced from a published template record `ann_` (PENDING CTR-ID-001 prefix); no free-text announcements. | MVP |
| PS-110-01.R02 | Accessible names exist for 100% of catalog components with a non-text control (CI gate). | MVP |
| PS-110-01.R03 | Template placeholders reference only fields with class PUBLIC or PSEUDONYMOUS. | MVP |

## Data / schema
Announcement template `ann_` (data class PUBLIC):
```json
{"template_id":"ann_01...","event_key":"cycle.consent_recorded","politeness":"polite|assertive",
 "text_key":"a11y.cycle.consent_recorded","placeholders":["participant_pseudonym","participant_count"],
 "max_length":140,"status":"draft|published|deprecated","revision":1}
```
Accessible name record: `component_id` (from PS-109-01 catalog) → `name_key`, `role`, `description_key` (nullable).
Ownership: this module owns templates and name keys. Listing alt text belongs to the F01 listing record. Settlement state labels belong to CTR-COM-001 label catalog.

## Commands / queries / events
See [PS-110-04](commands_queries_events.md).

## States & transitions
See [PS-110-03](workflow_state_machine.md).

## Validation & errors
See [PS-110-02](validation_rules.md). Prefix `SCRN.`

## Authorization
See [PS-110-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-110-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Templates carry no personal data. See [PS-110-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-110-08](observability_performance.md).

## Tests
- TEST-PS-110-01-01 unit: template schema rejects a placeholder outside the allowed class set.
- TEST-PS-110-01-02 CI: every non-text control in the catalog has a `name_key`.

## Acceptance criteria
1. No announcement string is built from user content outside declared placeholders.
2. 100% of catalog non-text controls have accessible names.
3. Template schema has no field of class above PSEUDONYMOUS.

## Assumptions & open decisions
- ASSUMPTION: `ann_` prefix is added to CTR-ID-001 (PENDING).
- No Dxx decision directly affects this schema.
