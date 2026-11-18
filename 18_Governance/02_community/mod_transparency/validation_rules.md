# PS-148-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-148-02. **Owner:** [18_Governance/02_community/mod_transparency](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_transparency. **Consumers:** F12 moderation, [mod_governance](../mod_governance/SPEC.md), F13 notifications, F15 platform gateway (schema registry, CTR-SCH-001), F16 security (PII detector configuration); declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Guarantee that no governance record is published unless it is well formed, policy-linked, privacy-safe and in a state that permits the write. Every rejection returns one typed error code (CTR-ERR-001 envelope) that the client can show as an actionable message. Validation does not decide whether a moderation outcome is correct; that is F12 and mod_governance.

Exclusions: content moderation of free-text beyond the PII and location detectors; translation; legal sufficiency of a policy text.

## Requirements
- PS-148-02.R01: Business outcome: a reviewer receives a precise reason when a draft cannot be submitted or published, and no invalid or identifying record reaches the public. Actors: author, reviewer, client applications, public readers.
- PS-148-02.R02: Cases: normal input; missing required fields; unknown enum values; text at boundary lengths (0, 1, 500, 501, 1000, 1001 code points); duplicate `source_ref`; expired review; concurrent write with stale `expected_revision`; replayed request with the same idempotency key; PII or location inside text; forged `source_ref` that does not resolve.
- PS-148-02.R03: Accessibility and localization: error `message_key` values are stable identifiers so clients localize text in the viewer locale; error payloads never rely on colour or icons alone. Performance of validation is included in the command budget of PS-148-08.R05.
- PS-148-02.R04: Validation order is fixed: (1) envelope and idempotency key, (2) schema version and type, (3) enum and pattern checks, (4) cross-field and semantic checks, (5) source resolution, (6) PII and location scan, (7) state and revision checks, (8) authorization checks last so that unauthorized callers learn nothing about record state (see PS-148-05.R08).
- PS-148-02.R05: Category and outcome compatibility is enforced by table (below). Example: `LISTING_OVERRIDE` accepts only REMOVED, RESTRICTED or NO_ACTION.
- PS-148-02.R06: PII and location scan runs on `public_summary` and `participant_explanation`. Detectors are the set on the active redaction profile (domain_schema). A match rejects the write; the matched text is never echoed in the error.
- PS-148-02.R07: `subject_token` and `region_code` are validated by pattern only; the module never resolves them to a person or place.
- PS-148-02.R08: Retryable flag is set per code below. Clients retry only retryable codes, with the same idempotency key.

## Category and outcome compatibility
| category_code | Allowed outcome values |
|---|---|
| CONTENT_REMOVAL | REMOVED, UPHELD, REVERSED |
| ACCOUNT_RESTRICTION | RESTRICTED, UPHELD, REVERSED |
| LISTING_OVERRIDE | REMOVED, RESTRICTED, NO_ACTION |
| APPEAL_OUTCOME | UPHELD, REVERSED, NO_ACTION |
| GOVERNANCE_DECISION | UPHELD, REVERSED, NO_ACTION |
| POLICY_CHANGE | POLICY_UPDATED only |
| RECORD_CORRECTION | NO_ACTION only |

## Error code catalogue
Codes follow `<MODULE>_<CODE>` with MODULE = TRANSPARENCY. HTTP status is the suggested transport mapping.

| Code | HTTP | Retryable | Trigger |
|---|---|---|---|
| TRANSPARENCY_ENTRY_ID_INVALID | 400 | no | entry_id does not match ULID pattern |
| TRANSPARENCY_REPORT_ID_INVALID | 400 | no | report_id does not match ULID pattern |
| TRANSPARENCY_SCHEMA_VERSION_UNSUPPORTED | 400 | no | MAJOR version not served by this deployment |
| TRANSPARENCY_FIELD_REQUIRED | 400 | no | required field absent or null without allowed null |
| TRANSPARENCY_FIELD_TYPE_INVALID | 400 | no | wrong JSON type or unknown field in strict mode |
| TRANSPARENCY_IDEMPOTENCY_KEY_INVALID | 400 | no | key empty, longer than 64 characters or outside `[A-Za-z0-9_-]` |
| TRANSPARENCY_IDEMPOTENCY_KEY_REUSED | 409 | no | same key with a different request hash (PS-148-06.R06) |
| TRANSPARENCY_SOURCE_TYPE_UNKNOWN | 400 | no | source_type not in enum |
| TRANSPARENCY_SOURCE_REF_INVALID | 422 | no | source_ref does not resolve in its owning module, or is already linked |
| TRANSPARENCY_CATEGORY_UNKNOWN | 400 | no | category_code not in enum |
| TRANSPARENCY_OUTCOME_UNKNOWN | 400 | no | outcome not in enum |
| TRANSPARENCY_OUTCOME_NOT_ALLOWED_FOR_CATEGORY | 422 | no | outcome violates the compatibility table |
| TRANSPARENCY_POLICY_REF_INVALID | 422 | no | policy_version_ref malformed or not an existing policy version |
| TRANSPARENCY_SUBJECT_TOKEN_INVALID | 400 | no | token not 43 base64url characters, or set on POLICY_CHANGE |
| TRANSPARENCY_SUMMARY_LENGTH_INVALID | 400 | no | public_summary empty or above max_summary_chars |
| TRANSPARENCY_EXPLANATION_LENGTH_INVALID | 400 | no | participant_explanation above 1000 code points |
| TRANSPARENCY_SUMMARY_CONTAINS_PERSONAL_DATA | 422 | no | PII detector matched in a text field |
| TRANSPARENCY_SUMMARY_CONTAINS_LOCATION_DATA | 422 | no | location-like pattern (street, postal code, coordinates) matched |
| TRANSPARENCY_DISCLOSURE_CLASS_INVALID | 400 | no | disclosure_class not in enum |
| TRANSPARENCY_DISCLOSURE_CLASS_MISMATCH | 422 | no | class requires a field that is absent (e.g. PUBLIC_REDACTED without summary) |
| TRANSPARENCY_REGION_CODE_INVALID | 422 | no | region_code not on the F10 coarse list |
| TRANSPARENCY_REDACTION_PROFILE_UNKNOWN | 422 | no | profile missing or inactive |
| TRANSPARENCY_PERIOD_INVALID | 422 | no | period_end before period_start, or span above 366 days |
| TRANSPARENCY_PERIOD_OVERLAP | 409 | no | a PUBLISHED report already covers an overlapping period and supersedes_report_id is absent |
| TRANSPARENCY_SUPERSEDES_INVALID | 422 | no | target is not PUBLISHED, or has a different source_type or period |
| TRANSPARENCY_PRECONDITION_FAILED | 422 | no | publish or freeze precondition unmet (PS-148-03 guards) |
| TRANSPARENCY_SELF_APPROVAL_FORBIDDEN | 403 | no | reviewer or approver equals author |
| TRANSPARENCY_STATE_INVALID | 409 | no | transition not in the state table |
| TRANSPARENCY_REVISION_CONFLICT | 409 | yes | expected_revision differs from stored revision |
| TRANSPARENCY_NOT_FOUND | 404 | no | record missing, or caller may not see it (no enumeration) |
| TRANSPARENCY_NOT_AUTHORIZED | 403 | no | caller lacks the capability (PS-148-05) |
| TRANSPARENCY_LEGAL_HOLD_ACTIVE | 409 | no | purge or hard delete requested while legal_hold is true |
| TRANSPARENCY_RATE_LIMITED | 429 | yes | rate limit from PS-148-07.R07 exceeded |
| TRANSPARENCY_MODULE_DISABLED | 503 | yes | feature flag for the module is off (writes only; public reads return 404) |
| TRANSPARENCY_UNAVAILABLE | 503 | yes | dependency (identity, outbox, store) unavailable |
| TRANSPARENCY_TIMEOUT | 504 | yes | server budget exceeded (PS-148-06.R05) |
| TRANSPARENCY_INTERNAL_ERROR | 500 | yes | unexpected failure; request_id logged, no payload logged |

Warning (not an error): `TRANSPARENCY_CELL_SUPPRESSED` is returned in aggregate responses when a cell is withheld under min_cell_size; the response is HTTP 200 with `suppressed: true`.

## Error payload rules
Error details may include field names, enum allowed values and `request_id`. They never include the submitted text, the matched PII fragment, the subject_token or any participant identifier.

## Open decisions
- A-TRANSPARENCY-17: Schema versions use MAJOR.MINOR with additive minor changes only, pending the CTR-SCH-001 owner (F15). Unknown fields are rejected in strict mode for MAJOR 1.
- A-TRANSPARENCY-07 applies to TRANSPARENCY_IDEMPOTENCY_KEY_REUSED (window 72 hours).
