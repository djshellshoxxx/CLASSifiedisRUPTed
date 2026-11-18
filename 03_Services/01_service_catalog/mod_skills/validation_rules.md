# PS-029-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-02. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines the input checks, normalization rules and typed error codes for skill-offer commands. Field types and limits are the source of truth in [domain_schema.md](domain_schema.md); this file defines how violations are detected, ordered and reported. Error envelope follows CTR-ERR-001 (owner F15).

Exclusions: moderation of content meaning (moderation module), identity checks (F07), and state-transition rules (see [workflow](workflow_state_machine.md)), except where a validation code is raised by a guard.

## Requirements
- PS-029-02.R01: Business outcome: a participant gets every invalid field reported at once, with a localized explanation, so they can fix an offer in one pass. Actors: owner participant (client), command service, moderation (for appeals of contact-data blocks). Exclusions as above.
- PS-029-02.R02: Case coverage: empty title; title of 2 or 81 code points; control characters; description of 1001 code points; unknown category; inactive category; tag count 6; duplicate tags; negative rate; rate with amount and no currency; coordinates or street address typed into title or description; email address in description; phone number in tags; expired offer resumed; duplicate offer publish; concurrent edits on the same field; offline submission of an invalid payload (rejected on replay, not silently dropped).
- PS-029-02.R03: Accessibility and localization: each error has `message_key` and `field`. Error text is never the only signal; the field is identified by `field` for screen readers. Limits are shown to the user in the same unit used by the check (code points, not bytes).
- PS-029-02.R04: Validation is server-side. Client-side checks are advisory and may differ in timing but never in result.
- PS-029-02.R05: Normalization happens before every check and before storage: NFC, trim, collapse internal whitespace in title and tags, and normalize description line endings to `\n`.
- PS-029-02.R06: Contact-data and precision checks run on every text field and tag, on create and on update.
- PS-029-02.R07: Stored values must pass the same checks that accepted them. Imported records are re-validated (see [import/export](import_export_backup_rollback.md)).

## Check order
1. Envelope: `schema_version`, `idempotency_key` format, unknown fields (`SKILLS_PAYLOAD_UNKNOWN_FIELD`, `SKILLS_SCHEMA_VERSION_UNSUPPORTED`, `SKILLS_IDEMPOTENCY_KEY_INVALID`).
2. Normalization (R05).
3. Field checks, all fields, collected into one response (maximum 10 field errors, A-skills-08).
4. Cross-field checks: rate completeness, publish completeness, tag uniqueness.
5. Policy checks: contact data, location precision, duplicate offer (publish only).
6. State and quota guards (from workflow).

Field checks at step 3 do not stop at the first failure.

## Error codes
All codes are prefixed `SKILLS_`. `retryable` is the envelope flag. HTTP status is the mapping used by the command service.

| Code | HTTP | Retryable | Field | Rule |
|---|---|---|---|---|
| `SKILLS_TITLE_REQUIRED` | 400 | no | title | Empty after trim |
| `SKILLS_TITLE_LENGTH` | 400 | no | title | Outside 3 to 80 code points |
| `SKILLS_DESCRIPTION_LENGTH` | 400 | no | description | More than 1000 code points or more than 20 lines |
| `SKILLS_TEXT_CONTROL_CHARACTER` | 400 | no | title, description, tags | Any Cc, Cf or Co character (tabs in description allowed as whitespace) |
| `SKILLS_CONTACT_DATA_DETECTED` | 400 | no | title, description, tags | Email, phone or http(s) URL pattern (A-skills-06) |
| `SKILLS_LOCATION_PRECISION_REJECTED` | 400 | no | title, description, tags | Coordinates (decimal pair or DMS), street-number-plus-street pattern, or postal-code pattern |
| `SKILLS_CATEGORY_UNKNOWN` | 400 | no | category_code | Not in taxonomy version, or not active |
| `SKILLS_TAXONOMY_VERSION_UNKNOWN` | 400 | no | taxonomy_version | Version does not exist |
| `SKILLS_TAG_LIMIT` | 400 | no | tags | More than 5 tags |
| `SKILLS_TAG_FORMAT` | 400 | no | tags | Fails `^[a-z0-9-]{2,24}$` or duplicate after normalization |
| `SKILLS_PROFICIENCY_INVALID` | 400 | no | proficiency | Not in enum |
| `SKILLS_RATE_AMOUNT_RANGE` | 400 | no | rate_amount_minor | Negative, non-integer or above 100000000 |
| `SKILLS_RATE_INCOMPLETE` | 400 | no | rate | Amount without currency or unit, or unit or currency without amount |
| `SKILLS_RATE_CURRENCY_INVALID` | 400 | no | rate_currency_code | Not in enabled ISO 4217 list |
| `SKILLS_REGION_UNKNOWN` | 400 | no | discovery_region_code | Not in approved region catalog |
| `SKILLS_PUBLISH_INCOMPLETE` | 422 | no | multiple | Draft lacks title, category or region when publishing |
| `SKILLS_DUPLICATE_OFFER` | 409 | no | title, category_code | Same owner, category and normalized title in a non-retired offer (A-skills-26) |
| `SKILLS_OFFER_EXPIRED` | 409 | no | state | Resume after `expires_at` |
| `SKILLS_QUOTA_EXCEEDED` | 422 | no | state | Published or non-retired quota reached (A-skills-10) |
| `SKILLS_PAYLOAD_UNKNOWN_FIELD` | 400 | no | any | Field not in the schema, including `participant_id` in body |
| `SKILLS_SCHEMA_VERSION_UNSUPPORTED` | 400 | no | schema_version | Value other than 1 |
| `SKILLS_IDEMPOTENCY_KEY_INVALID` | 400 | no | idempotency_key | Length or charset outside rule |

Commands also use the state, concurrency, access and availability codes defined in [workflow](workflow_state_machine.md), [authorization](authorization_capabilities.md) and [failure handling](failure_recovery_idempotency.md) (for example `SKILLS_REVISION_CONFLICT`, `SKILLS_STATE_TRANSITION_INVALID`, `SKILLS_NOT_FOUND`, `SKILLS_RATE_LIMITED`). Import-specific codes are in [import/export](import_export_backup_rollback.md).

## Error response shape
```json
{
  "error": {
    "code": "SKILLS_RATE_INCOMPLETE",
    "retryable": false,
    "http_status": 400,
    "errors": [
      { "field": "rate_currency_code", "code": "SKILLS_RATE_INCOMPLETE", "message_key": "skills.err.rate_incomplete" }
    ],
    "correlation_id": "01J9T7A2V6E8KQZ4NHW1RXM3BD"
  }
}
```
`errors[]` holds at most 10 items. The echoed value is never returned in an error (privacy: no reflection of rejected text).

## Normalization and detection details
- Title and tags: NFC, trim, internal whitespace collapsed; tags lowercased.
- Duplicate key (A-skills-26): owner_participant_id, category_code, and title after NFC, trim, collapse and Unicode case-fold. Checked on publish, resume and renew, and on update of a published offer.
- Contact data (A-skills-06): email `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`; phone = 7 or more digits with optional `+ ( ) . -` or spaces; `https?://` URL. False positives can be appealed through the moderation module.
- Location precision: decimal coordinate pairs, degree-minute-second notation, and a number followed by a street suffix word from the locale list.

## Assumptions
- A-skills-06: Contact-data detection blocks email, phone and http(s) URLs in title, description and tags. The detection is heuristic; false positives are accepted and appealable.
- A-skills-07: Normalization is NFC, trim and whitespace collapse; description line limit is 20 lines.
- A-skills-08: The error envelope follows CTR-ERR-001. Up to 10 field errors are returned in one response. `message_key` values are localized by the client.
- A-skills-26: Duplicate detection uses owner, category and case-folded normalized title. It does not detect near-duplicates.

## Open decisions
- Whether URLs should be allowed in descriptions after moderation review (currently blocked). Linked to D05 for location text policy.
- Locale list for street-suffix detection is not yet defined per region. Default: start with the regions in the F10 catalog only.

## Testing
- TEST-PS-029-02-T01: Each row of the error table has at least one fixture that triggers exactly that code and no other. Pass when the observed code matches for every row.
- TEST-PS-029-02-T02: Payload with six errors returns all six in `errors[]` in one response, capped at 10. Pass when the count and codes match.
- TEST-PS-029-02-T03: Title `"  Bike   tune-up  "` is stored as `Bike tune-up`. Pass when the stored value equals the normalized value.
- TEST-PS-029-02-T04: Description containing an email address is rejected with `SKILLS_CONTACT_DATA_DETECTED`, and the email is not echoed. Pass when the error body contains no substring of the input.
- TEST-PS-029-02-T05: Duplicate publish of the same owner, category and case-folded title returns `SKILLS_DUPLICATE_OFFER`. Pass when the second offer stays draft.
- TEST-PS-029-02-T06: Mixed-direction and combining-character titles of 3 and 80 code points are accepted; 2 and 81 are rejected. Pass on both boundaries.
