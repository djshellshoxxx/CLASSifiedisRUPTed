# PS-111-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-01.R01 | Each conformance record `acr_` covers all 50 WCAG 2.1 Level A and AA success criteria (ASSUMPTION: 2.1 pinned; 2.2 evaluation PENDING research). | MVP |
| PS-111-01.R02 | Each finding `acf_` links exactly one criterion and one screen. | MVP |
| PS-111-01.R03 | Records contain no user content; evidence is referenced by digest only. | MVP |

## Data / schema
Conformance record `acr_` (PENDING CTR-ID-001 prefix; `ulid`, data class PUBLIC):
```json
{"record_id":"acr_01...","screen_id":"string dotted","app_version":"semver",
 "criteria":[{"sc":"1.4.3","result":"pass|fail|not_applicable|not_tested","evidence_digest":"sha256 hex|null","na_reason_key":"string|null"}],
 "reviewer_role":"QA Lead|Accessibility Lead","submitted_at":"recorded at commit"}
```
Finding `acf_` (PENDING prefix; PUBLIC): `{finding_id, sc, screen_id, severity: blocker|major|minor, status, accepted_until (≤ 90 days, ASSUMPTION), owner_role, test_id}`.

## Commands / queries / events
See [PS-111-04](commands_queries_events.md).

## States & transitions
See [PS-111-03](workflow_state_machine.md).

## Validation & errors
See [PS-111-02](validation_rules.md). Prefix `WCAG.`

## Authorization
See [PS-111-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-111-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
No personal data. See [PS-111-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-111-08](observability_performance.md).

## Tests
- TEST-PS-111-01-01 unit: a record missing any of the 50 criteria fails schema validation.
- TEST-PS-111-01-02 property: finding with two criteria rejected.

## Acceptance criteria
1. Every submitted record has exactly 50 criterion entries.
2. Findings reference exactly one criterion and one screen.
3. No free-text field exceeds 280 characters.

## Assumptions & open decisions
- ASSUMPTION: WCAG 2.1 A and AA = 50 success criteria.
- No Dxx decision directly affects this schema.
