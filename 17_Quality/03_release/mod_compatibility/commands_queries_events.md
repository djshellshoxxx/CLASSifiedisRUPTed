# PS-142-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-04.R01 | Each state-changing command carries `idempotency_key` and `expected_revision`. | MVP |
| PS-142-04.R02 | Commands are `v1`; breaking changes need a new name. | MVP |
| PS-142-04.R03 | Queries paginate at max 100 and never return device identifiers. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| PublishCompatMatrix | `(matrix_key, version, rows[], expected_revision)` | `matrix_key` + `version` | `compat_matrix.published` | COMPAT.ROW_WITHOUT_RESULT, COMPAT.DEPRECATION_TOO_SHORT, COMPAT.UNKNOWN_PROTOCOL, SYS.CONFLICT, SYS.FORBIDDEN |
| RecordCompatResult | `(matrix_version, row_key, commit_sha, outcome, suite_ref)` | `matrix_version` + `row_key` + `commit_sha` + `suite_ref` | `compat_result.recorded` | COMPAT.STALE_RESULT (flag only), SYS.NOT_FOUND |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| GetCompatMatrix | `matrix_key`, optional `version` | published rows | SYS.NOT_FOUND |
| ListCompatResults | `matrix_version`, `commit_sha?`, cursor | result summaries | SYS.REQUEST_MALFORMED |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| compat_matrix.published | compat_matrix | PUBLIC | matrix_key, version |
| compat_result.recorded | compat_result | PUBLIC | result_id, row_key, outcome, stale flag |

Envelope per CTR-EVT-001. Federation export of these events is not planned (ASSUMPTION).

## Assumptions & open decisions
- ASSUMPTION: release gates are the only subscriber.
- D01 applies only if peer-protocol rows are exchanged with peers: PROVISIONAL (D01 default, unapproved).
