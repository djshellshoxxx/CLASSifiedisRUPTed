# PS-142-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-FED-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-01.R01 | Each matrix row names one dimension: `client_platform`, `assistive_tech`, `schema_version`, or `peer_protocol`. | MVP |
| PS-142-01.R02 | Each support status is one of `supported`, `deprecated` (with end date), `unsupported`. | MVP |
| PS-142-01.R03 | Result records reference a `commit_sha` and matrix `version`; a result for an older commit cannot satisfy a newer release. | MVP |
| PS-142-01.R04 | `max_data_class` is `PUBLIC`; no device identifiers or user data. | MVP |

## Data / schema
`compat_matrix` (versioned):
- `matrix_key`: string; `version`: semver; `revision`: integer ≥ 1.
- `rows`: array of `{row_key, dimension, value, support_status, deprecation_end?}`.
- `value` examples: browser major version, OS major version, `screen-reader-current`, `schema 1.x`, `protocol 1.0.0`.
- `published_at`: RFC 3339 UTC; `published_by`: `acc_` ID.

`compat_result`:
- `result_id`: entity ID `<prefix>_<body>`; prefix PENDING CTR-ID-001 registry entry.
- `matrix_key`, `matrix_version`, `row_key`, `commit_sha` (40 hex), `outcome`: `pass`, `fail`, `not_run`.
- `suite_ref`: test suite key from mod_ci; `runner_ref`: `sys_` ID; `recorded_at`.

Schema reader compatibility is checked against CTR-SCH-001 minor and major rules; this module stores results only.
