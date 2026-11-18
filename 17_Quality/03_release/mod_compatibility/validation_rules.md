# PS-142-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-02.R01 | A matrix cannot be published with a `supported` row lacking a passing result in the last 14 days (ASSUMPTION) for its `row_key`. | MVP |
| PS-142-02.R02 | A `deprecated` row requires `deprecation_end` no earlier than 90 days after publish (ASSUMPTION). | MVP |
| PS-142-02.R03 | A result with `commit_sha` different from the release candidate is recorded but flagged `stale` for gates. | MVP |
| PS-142-02.R04 | `peer_protocol` values must be listed in CTR-FED-001 version registry; unknown values are rejected. | MVP |

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| COMPAT.ROW_WITHOUT_RESULT | false | precondition_failed / 412 | err.compat.row_without_result | row_key |
| COMPAT.DEPRECATION_TOO_SHORT | false | validation / 400 | err.compat.deprecation_too_short | row_key |
| COMPAT.UNKNOWN_PROTOCOL | false | validation / 400 | err.compat.unknown_protocol | value rejected (not echoed) |
| COMPAT.STALE_RESULT | false | unprocessable_state / 422 | err.compat.stale_result | commit_sha mismatch flag |
| SYS.CONFLICT | false | conflict / 409 | err.sys.conflict | revision mismatch |

Diagnostics exclude device identifiers and free text from test output (CTR-ERR-001 R06).

## Assumptions & open decisions
- ASSUMPTION: 14-day result age and 90-day deprecation window are defaults to confirm with QA Lead and F15.
- D01 governs which peer protocol values are valid: PROVISIONAL (D01 default, unapproved).
