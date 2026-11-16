# PS-003-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (`EDIT.*` registry, `SYS.*`), CTR-EVT-001 (`EVT.*`), CTR-PRV-001 R01 (field classification).

**Decision labels:** Price bounds and giveaway rule PROVISIONAL (D03 default, unapproved). Region checks PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-02.R01 | `changes` is a closed object. Any key outside the six editable fields → `EDIT.FIELD_NOT_EDITABLE`; response lists key names only, never values. | MVP |
| PS-003-02.R02 | `changes` with zero keys → `EDIT.VALIDATION_FAILED`. A change that equals the stored value for every key is a no-op: no revision bump, no event. | MVP |
| PS-003-02.R03 | Text fields reject Unicode bidi controls (U+202A–U+202E, U+2066–U+2069) and control characters except LF in `description`. Violation → `EDIT.VALIDATION_FAILED` on that field. | MVP |
| PS-003-02.R04 | `price` must match the decimal-string pattern in [domain_schema.md](domain_schema.md), be ≤ 999999999999999 minor units, and be `null` or `"0"` when the listing kind is giveaway (ASSUMPTION, cross-check with 02_LocalBazaar 02_listing_types/mod_giveaway). | MVP |
| PS-003-02.R05 | `currency` must be in the registry. A `price` without `currency` (or the reverse) → `EDIT.VALIDATION_FAILED`. | MVP |
| PS-003-02.R06 | Material fields: `price`, `currency`, `region_cell`, `category_id`. A change to any of them is material. Title and description are non-material. | MVP |
| PS-003-02.R07 | Server-side validation runs on every request. Client-side validation is advisory only. | MVP |
| PS-003-02.R08 | Each response reports all field errors in one response, up to 16 entries. Each entry has `field`, `code`, `message_key`; no submitted values. | MVP |

## Validation table
| Field | Rule | Error code | Retryable |
|---|---|---|---|
| (any key) | in editable set | `EDIT.FIELD_NOT_EDITABLE` | false |
| `title` | 1–120 code points, NFC, no bidi controls | `EDIT.VALIDATION_FAILED` | false |
| `description` | 0–4000 code points, plain text | `EDIT.VALIDATION_FAILED` | false |
| `category_id` | active registry entry | `EDIT.VALIDATION_FAILED` | false |
| `region_cell` | registry cell, LOCATION_COARSE | `EDIT.FIELD_NOT_EDITABLE` if precision supplied; else `EDIT.VALIDATION_FAILED` | false |
| `price` | R04 | `EDIT.VALIDATION_FAILED` | false |
| `currency` | R05 | `EDIT.VALIDATION_FAILED` | false |
| request body | JSON ≤ 8 KiB | `SYS.PAYLOAD_TOO_LARGE` | false |

## Assumptions & open decisions
- ASSUMPTION: 8 KiB request cap for `listing.edit`.
- D03 (PROVISIONAL): price as minor units. Upper bound ASSUMPTION.
- D05 (PROVISIONAL): region checks against coarse registry only.
- Material-change blocking while offers are open is a state rule, not a validation rule: see [workflow_state_machine.md](workflow_state_machine.md).
