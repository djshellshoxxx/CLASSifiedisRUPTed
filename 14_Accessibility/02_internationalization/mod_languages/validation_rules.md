# PS-113-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-113-02. **Owner:** [14_Accessibility/02_internationalization/mod_languages](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_languages. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); specific subscribers unresolved.

## Purpose and scope
Defines the validation rules and the typed error catalogue for the languages capability. Every rejected command returns exactly one error code from this file. Field definitions are in [domain_schema.md](domain_schema.md); error envelope shape is owned by CTR-ERR-001.

## Requirements to specify
- [x] PS-113-02.R01: Describe observable business outcome, actors and exclusions.
- [x] PS-113-02.R02: Enumerate normal, invalid, expired, duplicate, concurrent, offline and adversarial cases.
- [x] PS-113-02.R03: Specify accessibility, localization, performance and operational budgets where applicable.
- [x] PS-113-02.R04: Validation rule table with stable rule IDs, trigger, error code and HTTP status.
- [x] PS-113-02.R05: Typed error catalogue with the `LANGUAGES_<CODE>` prefix, retryability and message keys.
- [x] PS-113-02.R06: Validation order, so that one request yields one deterministic error.

## Business outcome and exclusions
**Outcome:** Invalid language choices, catalog changes and fallback configurations are refused with a specific, actionable error before any state changes. Participants see the reason in their own preferred language where it is available.

**Exclusions:** validation of content language declared on listings or messages beyond tag well-formedness and catalog membership (owned by the content module); spam or abuse scoring (see [privacy_retention_abuse.md](privacy_retention_abuse.md)); authorization decisions (see [authorization_capabilities.md](authorization_capabilities.md)).

## Validation order
1. Envelope: JSON well-formed, size <= 2 KB, no unknown fields (V-17), `schema_version` supported (V-16).
2. Authentication and capability check (LANGUAGES_FORBIDDEN, LANGUAGES_NOT_FOUND). Runs before any content check so that responses do not reveal catalog state to unauthorized actors.
3. Idempotency key checks (see [failure_recovery_idempotency.md](failure_recovery_idempotency.md)).
4. Field rules V-01 to V-07 in listed order; first failure returns.
5. Business rules V-08 to V-15 against the stored state.
6. Revision check (`expected_revision`), then state transition check.

## Validation rules
| Rule | Applies to | Rule | Error code | HTTP | Retryable |
|---|---|---|---|---|---|
| V-01 | any tag | Well-formed BCP 47 per RFC 5646 after canonicalization (case-folded: language lowercase, script Title case, region uppercase). `PT-br` becomes `pt-BR`. `pt_br` is malformed. | `LANGUAGES_TAG_MALFORMED` | 400 | no |
| V-02 | preference write | Canonical tag exists in catalog with status `active`. `xx-ZZ` is well-formed but unknown. | `LANGUAGES_TAG_NOT_SUPPORTED` | 422 | no |
| V-03 | preference write | List length 1..5. Zero tags use `languages.preference.withdraw`; six or more fail. | `LANGUAGES_LIST_EMPTY` / `LANGUAGES_LIST_TOO_LONG` | 422 | no |
| V-04 | preference write | No duplicate canonical tags in list. | `LANGUAGES_TAG_DUPLICATE` | 422 | no |
| V-05 | catalog write | `native_name` length 1..80 characters, NFC, no Unicode control characters (Cc, Cf except ZWJ/ZWNJ), no `<` or `>`. | `LANGUAGES_NAME_INVALID` | 422 | no |
| V-06 | catalog write | `text_direction` equals the table value for the script (domain_schema R06). | `LANGUAGES_DIRECTION_MISMATCH` | 422 | no |
| V-07 | catalog write | `ui_coverage_pct` integer 0..100. | `LANGUAGES_COVERAGE_OUT_OF_RANGE` | 422 | no |
| V-08 | activate | `ui_coverage_pct >= 60` (A-languages-04). | `LANGUAGES_COVERAGE_BELOW_THRESHOLD` | 422 | no |
| V-09 | catalog write | `fallback_tag` is null or references a row with status `active` or `deprecated`. | `LANGUAGES_FALLBACK_TARGET_INVALID` | 422 | no |
| V-10 | catalog write | Following fallback links never revisits a tag. | `LANGUAGES_FALLBACK_CYCLE` | 422 | no |
| V-11 | catalog write | Fallback chain length <= 3 hops (A-languages-22). | `LANGUAGES_FALLBACK_DEPTH_EXCEEDED` | 422 | no |
| V-12 | deprecate, retire | Row with `is_platform_default = true` (`en`) cannot be deprecated or retired. | `LANGUAGES_DEFAULT_PROTECTED` | 409 | no |
| V-13 | retire | `deprecated_at` is at least 30 days before now (A-languages-06). | `LANGUAGES_RETIRE_TOO_EARLY` | 409 | yes, after the date |
| V-14 | draft create | Tag not used by any row with status `retired` (A-languages-07). | `LANGUAGES_TAG_RESERVED` | 409 | no |
| V-15 | draft create, activate | Non-retired rows after the change <= 200 (A-languages-09). | `LANGUAGES_CATALOG_CAPACITY` | 409 | no |
| V-16 | any | `schema_version` is 1. | `LANGUAGES_SCHEMA_VERSION_UNSUPPORTED` | 400 | no |
| V-17 | any | Body <= 2 KB; unknown fields rejected; required fields present. | `LANGUAGES_REQUEST_INVALID` | 400 | no |

## Typed error catalogue
Envelope fields (CTR-ERR-001): `code`, `http_status`, `retryable`, `message_key`, `correlation_id`. `message_key` has the form `languages.error.<lowercase code>`. Diagnostics never echo the submitted tag or name into logs (see [observability_performance.md](observability_performance.md)).

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| `LANGUAGES_TAG_MALFORMED` | 400 | no | V-01 |
| `LANGUAGES_REQUEST_INVALID` | 400 | no | V-17 |
| `LANGUAGES_SCHEMA_VERSION_UNSUPPORTED` | 400 | no | V-16 |
| `LANGUAGES_IDEMPOTENCY_KEY_MISSING` | 400 | no | command has no `command_id` |
| `LANGUAGES_FORBIDDEN` | 403 | no | actor lacks the capability in [authorization_capabilities.md](authorization_capabilities.md) |
| `LANGUAGES_NOT_FOUND` | 404 | no | target does not exist or is not visible to the actor (also used for other participants' preferences) |
| `LANGUAGES_FEATURE_DISABLED` | 404 | no | feature flag off for this environment |
| `LANGUAGES_TAG_NOT_SUPPORTED` | 422 | no | V-02 |
| `LANGUAGES_LIST_EMPTY` | 422 | no | V-03 |
| `LANGUAGES_LIST_TOO_LONG` | 422 | no | V-03 |
| `LANGUAGES_TAG_DUPLICATE` | 422 | no | V-04 |
| `LANGUAGES_NAME_INVALID` | 422 | no | V-05 |
| `LANGUAGES_DIRECTION_MISMATCH` | 422 | no | V-06 |
| `LANGUAGES_COVERAGE_OUT_OF_RANGE` | 422 | no | V-07 |
| `LANGUAGES_COVERAGE_BELOW_THRESHOLD` | 422 | no | V-08 |
| `LANGUAGES_FALLBACK_TARGET_INVALID` | 422 | no | V-09 |
| `LANGUAGES_FALLBACK_CYCLE` | 422 | no | V-10 |
| `LANGUAGES_FALLBACK_DEPTH_EXCEEDED` | 422 | no | V-11 |
| `LANGUAGES_DEFAULT_PROTECTED` | 409 | no | V-12 |
| `LANGUAGES_RETIRE_TOO_EARLY` | 409 | yes, after waiting period | V-13 |
| `LANGUAGES_TAG_RESERVED` | 409 | no | V-14 |
| `LANGUAGES_CATALOG_CAPACITY` | 409 | no | V-15 |
| `LANGUAGES_INVALID_STATE_TRANSITION` | 409 | no | transition not allowed from current status |
| `LANGUAGES_REVISION_CONFLICT` | 409 | yes, after re-read | `expected_revision` differs from stored revision |
| `LANGUAGES_IDEMPOTENCY_KEY_REUSED` | 409 | no | same `command_id` with different payload |
| `LANGUAGES_RATE_LIMITED` | 429 | yes, after `retry_after_s` | abuse limit (A-languages-14) |
| `LANGUAGES_TIMEOUT` | 504 | yes, same `command_id` | downstream did not answer within budget |
| `LANGUAGES_DEPENDENCY_UNAVAILABLE` | 503 | yes, with backoff | F07 or F15 store unreachable |

## Localized presentation (R03)
- Messages are looked up by `message_key`. If the viewer's preference has no translation for the key, the message falls back through the language fallback chain to `en`.
- Error text is not conveyed by colour alone. The client exposes it as an `aria-live="polite"` region tied to the field it describes, and focus moves to the first invalid field.
- Native names shown in error messages carry `lang` and `dir` attributes so screen readers pronounce them correctly.
- Validation responses are fast: p95 <= 50 ms for V-01 to V-07 (local checks, no I/O beyond the catalog cache).

## Adversarial and edge cases (R02)
- Homoglyph or bidi-override characters in `native_name`: rejected by V-05 (Cf except ZWJ/ZWNJ).
- Very long canonical tag (> 35 chars): rejected by V-01.
- Tag with private-use subtags (`x-` extensions): rejected by V-01 for catalog rows; accepted only if the catalog row exists exactly.
- Concurrent activation of two drafts that together exceed capacity: second write fails V-15 under the catalog row lock (see failure file).

## Assumptions
**Assumption A-languages-02:** The error code prefix is `LANGUAGES_`, the module name without the `mod_` directory prefix. This matches `<MODULE>_<CODE>` in the task brief.

**Assumption A-languages-04:** Activation requires `ui_coverage_pct >= 60`. Operators may not override this in this release.

**Assumption A-languages-06:** A deprecated tag must wait 30 days before retirement. Earlier retirement is refused.

**Assumption A-languages-07:** Retired tags are reserved permanently so historical revisions remain unambiguous.

**Assumption A-languages-14:** Participant write limit is 20 `languages.preference.set` calls per participant per hour (see privacy file).

## Open decisions
- A-languages-02 (error prefix), A-languages-04, A-languages-06, A-languages-07, A-languages-14.
- CTR-ERR-001 has not fixed the envelope field names; the names above are the proposed working set and need F15 confirmation.

## Test references
Each rule ID maps to tests `TEST-PS-113-02-Tnn` in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).
