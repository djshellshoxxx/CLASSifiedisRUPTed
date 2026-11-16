# PS-003-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (`EDIT.*` registry, `SYS.*`), CTR-EVT-001 (`EVT.*`), CTR-PRV-001 R01 (field classification).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-02.R01 | `changes` is a closed object. Any key outside the six editable fields → `EDIT.FIELD_NOT_EDITABLE`. Response names keys only, never values. | MVP |
| PS-003-02.R02 | `changes` with zero keys → `EDIT.VALIDATION_FAILED`. A change equal to the stored value for every key is a no-op: no revision bump, no event. | MVP |
| PS-003-02.R03 | Text fields reject bidi controls (U+202A–U+202E, U+2066–U+2069) and control characters except LF in `description`. | MVP |
| PS-003-02.R04 | `price` matches the pattern in [domain_schema.md](domain_schema.md), is ≤ 999999999999999 minor units, and is `null` or `"0"` for giveaway listings (ASSUMPTION; cross-check with 02_LocalBazaar 02_listing_types/mod_giveaway). | MVP |
| PS-003-02.R05 | `currency` must be in the registry. `price` without `currency`, or the reverse, → `EDIT.VALIDATION_FAILED`. | MVP |
| PS-003-02.R06 | Material fields: `price`, `currency`, `region_cell`, `category_id`. Title and description are non-material. | MVP |
| PS-003-02.R07 | Server-side validation runs on every request. Client validation is advisory. | MVP |
| PS-003-02.R08 | One response reports up to 16 field errors. Each entry: `field`, `code`, `message_key`. No submitted values. | MVP |

## Data / schema
Field rules are the constraints in [domain_schema.md](domain_schema.md). This file adds validation order and error mapping only.

## Commands / queries / events
Validation runs inside `listing.edit` before the transaction opens. See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Not applicable. Material-change blocking is a state rule in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Field | Rule | Code | Category / HTTP | Retryable |
|---|---|---|---|---|
| any key | in editable set | `EDIT.FIELD_NOT_EDITABLE` | validation / 400 | false |
| `title` | 1–120 cp, NFC, no bidi | `EDIT.VALIDATION_FAILED` | validation / 400 | false |
| `description` | 0–4000 cp, plain text | `EDIT.VALIDATION_FAILED` | validation / 400 | false |
| `category_id` | active registry entry | `EDIT.VALIDATION_FAILED` | validation / 400 | false |
| `region_cell` | registry, coarse; precision supplied → FIELD_NOT_EDITABLE | `EDIT.VALIDATION_FAILED` | validation / 400 | false |
| `price`, `currency` | R04, R05 | `EDIT.VALIDATION_FAILED` | validation / 400 | false |
| body | JSON ≤ 8 KiB | `SYS.PAYLOAD_TOO_LARGE` | 413 | false |

## Authorization
Validation does not grant access. Field-level denial returns `SYS.NOT_FOUND` before validation runs (CTR-CAP-001 R10).

## Failure, idempotency, concurrency, offline
Validation failures are not stored in the idempotency record as successes. They are re-evaluated on retry. See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Error responses contain field names and codes only (CTR-PRV-001 R09). See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Count of `EDIT.VALIDATION_FAILED` by field name only. See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-003-02-01 (unit): each row of the error table produces its code.
- TEST-PS-003-02-02 (property): any string containing a bidi control is rejected.
- TEST-PS-003-02-03 (unit): no-op change → no revision bump, no event.
- TEST-PS-003-02-04 (negative): key `region_precise` → `EDIT.FIELD_NOT_EDITABLE`, no value echoed.

## Acceptance criteria
1. Every rule in R01–R08 has at least one passing unit test.
2. No error response contains a submitted value.
3. Giveaway price rule matches mod_giveaway's rule (ASSUMPTION confirmed by owner).

## Assumptions & open decisions
- ASSUMPTION: 8 KiB request cap.
- D03 (PROVISIONAL, Dxx default, unapproved): price as minor units; upper bound ASSUMPTION.
- D05 (PROVISIONAL, Dxx default, unapproved): region checks against coarse registry only.
