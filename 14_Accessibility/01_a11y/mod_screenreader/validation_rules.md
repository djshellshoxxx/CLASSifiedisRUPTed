# PS-110-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-110-02. **Owner:** [14_Accessibility/01_a11y/mod_screenreader](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_screenreader. **Consumers:** feature surfaces F01–F13 that resolve or announce catalog labels by `label_id`; shared cross-cutting contracts F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and [registry](../../../planning/SPEC_REGISTRY.csv).

## Purpose and scope
Defines every server-side and client-side validation rule for `sr_label`, `sr_release`, `sr_preference` and announcement requests, with the exact error code returned. Field definitions live in [domain_schema.md](domain_schema.md). Error envelope and retryability follow CTR-ERR-001 (owner F15). The codes below are module-local and use the form `SCREENREADER_<CODE>`.

## Requirements
- PS-110-02.R01: **Business outcome.** Every control name and announcement reaching assistive technology is plain text, correctly localized, privacy-safe, and tied to a valid state. Invalid content is rejected at write time, never at render time. Validation guarantees that an announcement cannot carry free text or personal data.
  **Exclusions:** semantic correctness of the wording (editorial review, see the release gate); WCAG contrast or target size (mod_wcag).
- PS-110-02.R02: **Cases.** Normal: valid label written as draft. Invalid: bad regex, markup, unknown placeholder, disallowed role or priority. Expired: not applicable. Duplicate: second draft for the same (`label_id`, `locale`). Concurrent: stale `expected_revision`; publish while another release is staging. Offline: client validates preference patches before queuing them. Adversarial: `<script>` or `javascript:` text; control characters (U+0000–U+001F, U+007F–U+009F); Unicode bidi overrides (U+202A–U+202E, U+2066–U+2069); placeholder names not in vocabulary; a feature writing another feature's prefix; oversized bodies (> 16 KiB).
- PS-110-02.R03: **Budgets.** Per-row validation ≤ 2 ms p95. Release-gate validation of 2 000 rows ≤ 5 s p95. Validation runs identically on client and server; the server result is authoritative. Error messages are localized from the caller's locale when a label exists, otherwise returned in en-US with the error code.

## Rules

| Rule ID | Rule | Error code | HTTP |
|---|---|---|---|
| VR-01 | `label_id` matches the `sr_label` regex and begins with `sr.f` plus the caller's own feature number | `SCREENREADER_LABEL_ID_INVALID` | 400 |
| VR-02 | Caller's feature prefix must equal the `label_id` prefix (feature owners write only their prefix) | `SCREENREADER_OWNER_MISMATCH` | 403 |
| VR-03 | `locale` matches the BCP 47 subset and is enabled in locale configuration | `SCREENREADER_LOCALE_UNSUPPORTED` | 400 |
| VR-04 | At least one of `accessible_name` or `message_template` is present | `SCREENREADER_TEXT_MISSING` | 422 |
| VR-05 | Text fields: length within bounds; no markup (`<`, `>`, `&` entity forms rejected); no control or bidi-override characters; no leading or trailing whitespace | `SCREENREADER_TEXT_INVALID` | 422 |
| VR-06 | Every `{placeholder}` in `message_template` is in the vocabulary `count`, `state`, `day`, `hours` | `SCREENREADER_PLACEHOLDER_UNKNOWN` | 422 |
| VR-07 | Every placeholder used is listed in `allowed_params`, and every `allowed_params` entry is used | `SCREENREADER_PARAM_NOT_ALLOWED` | 422 |
| VR-08 | `announce_priority = assertive` only when the `label_id` contains the segment `error` and `role` is `alert`; `polite` requires `role` of `status` or `alert`; `none` is always allowed | `SCREENREADER_PRIORITY_INVALID` | 422 |
| VR-09 | `role` is in the enumerated set | `SCREENREADER_ROLE_INVALID` | 422 |
| VR-10 | `(label_id, locale)` has at most one row in `draft` and at most one in `active` | `SCREENREADER_LABEL_EXISTS` | 409 |
| VR-11 | `expected_revision`, when supplied, equals the stored revision | `SCREENREADER_REVISION_CONFLICT` | 409 |
| VR-12 | Publish gate: every `label_id` in the required manifest has an en-US active or staged row; required-set coverage for each enabled locale ≥ 95 % | `SCREENREADER_RELEASE_INCOMPLETE` | 422 |
| VR-13 | Publish requires `state = staging` and matching `checksum_sha256` | `SCREENREADER_RELEASE_STATE_INVALID` | 409 |
| VR-14 | Release containing an assertive row has two distinct release-manager approvers, neither the stager | `SCREENREADER_TWO_PERSON_REQUIRED` | 403 |
| VR-15 | Only one release may be `staging` at a time | `SCREENREADER_RELEASE_IN_PROGRESS` | 409 |
| VR-16 | Preference patch: enum values, booleans, `locale_override` pattern, no unknown keys | `SCREENREADER_PREFERENCE_INVALID` | 422 |
| VR-17 | Announcement params: keys subset of `allowed_params`; types match (count int 0–999, state enum, day `YYYY-MM-DD` valid calendar date, hours int 1–720); no string values except `state` enum and `day` | `SCREENREADER_PARAM_TYPE_INVALID` | 422 |
| VR-18 | Request body ≤ 16 KiB and valid UTF-8 | `SCREENREADER_PAYLOAD_TOO_LARGE` / `SCREENREADER_TEXT_INVALID` | 413 / 422 |
| VR-19 | Idempotency key is a ULID and body hash matches any prior use of the key | `SCREENREADER_IDEMPOTENCY_CONFLICT` | 409 |
| VR-20 | Downloaded release checksum recomputed on the client equals `checksum_sha256` | `SCREENREADER_CATALOG_CHECKSUM_MISMATCH` | client-side |

## Example rejection
Request writes `"message_template": "Listing expired <b>now</b>"` with `allowed_params: []`.
```json
{
  "error": {
    "code": "SCREENREADER_TEXT_INVALID",
    "retryable": false,
    "field": "message_template",
    "detail_key": "sr.error.text_invalid.markup",
    "locale": "en-US"
  }
}
```
`detail_key` is an internal key, not the user's input, so the rejected text is not echoed back.

## Open decisions
- **A-screenreader-04:** Announcement parameter vocabulary is limited to `count`, `state`, `day` and `hours`. No free text and no monetary amounts are allowed, so every announcement stays privacy-safe. If feature owners need a new parameter type, that requires a schema-version change through CTR-SCH-001.
- **A-screenreader-05:** `assertive` priority is reserved for error-class labels and requires a two-person publish (VR-14). This is a conservative default because assertive announcements interrupt the user. Revisit after AT testing (see contract_and_acceptance_tests.md).
