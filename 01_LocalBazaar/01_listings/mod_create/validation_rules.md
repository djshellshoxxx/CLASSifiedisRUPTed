# PS-002-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (codes, envelope), CTR-EVT-001 (size and depth, R12), CTR-COM-001 (amount encoding), CTR-PRV-001 (location), CTR-SCH-001 (closed enums).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-02.R01 | Order of checks: body size and depth, then unknown or forbidden keys, then per-field rules, then type rules, then taxonomy and region lookup. First failure returns; nothing is written. | MVP |
| PS-002-02.R02 | Body ≤ 16 KiB serialized and nesting depth ≤ 8, checked before schema parsing (ASSUMPTION). | MVP |
| PS-002-02.R03 | Keys `listing_id`, `owner_ref`, `state`, `revision`, `published_at` are server-set and rejected as unknown. Any other unknown key is rejected. | MVP |
| PS-002-02.R04 | Keys named `lat`, `lng`, `latitude`, `longitude`, `address`, `street`, `coordinates`, or prefixed `home_`, return `PRV.PRECISE_LOCATION_FORBIDDEN`. This check runs before R03. | MVP |
| PS-002-02.R05 | `title`: NFC-normalized, trimmed, 3–120 code points, no Cc or Cf characters. | MVP |
| PS-002-02.R06 | `description`: optional, 0–4000 code points, NFC; tab and LF allowed; other Cc or Cf rejected. | MVP |
| PS-002-02.R07 | `listing_type` must be `sell`, `giveaway` or `wanted`. Other values return `not_in_enum`. | MVP |
| PS-002-02.R08 | A listing type disabled by operator configuration returns `LST.TYPE_DISABLED`. Other types are unaffected. | MVP |
| PS-002-02.R09 | `category_code` matches `^[a-z][a-z0-9_]{1,31}$` and exists in the active taxonomy version. | MVP |
| PS-002-02.R10 | Type rules: `sell` requires `asking_price` with amount > 0. `giveaway` forbids `asking_price`. `wanted` allows an optional `asking_price` as a budget ceiling. | MVP |
| PS-002-02.R11 | `asking_price.amount_minor` matches `^(0\|[1-9][0-9]{0,38})$` (CTR-COM-001 R02) and is ≤ 10^12 (ASSUMPTION). `currency.kind` must be `fiat`. `code` is ISO 4217 alpha-3 from the supported list. `exponent` equals the registry value. JSON numbers for amounts are rejected (`wrong_type`). | MVP |
| PS-002-02.R12 | `region_cell` must exist in the registered cell set (CTR-PRV-001 R04). The module never derives a cell from coordinates. | MVP |
| PS-002-02.R13 | `expected_revision` must be absent or null. Any other value returns `SYS.REQUEST_MALFORMED`. | MVP |

## Data / schema
Validation uses the request schema in PS-002-04 and the `listing.draft` field rules in PS-002-01. No other schema is introduced.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| SYS.REQUEST_MALFORMED | false | validation / 400 | Unknown key, wrong JSON type, `expected_revision` not null |
| SYS.PAYLOAD_TOO_LARGE | false | payload_too_large / 413 | R02 limit exceeded |
| LST.FIELD_INVALID | false | validation / 400 | Any R05–R12 rule failure; `details[].rule` set from the enum below |
| PRV.PRECISE_LOCATION_FORBIDDEN | false | unprocessable_state / 422 | R04 key present |
| LST.TYPE_DISABLED | false | unprocessable_state / 422 | R08 |

`details[].field` is a JSON pointer (for example `/asking_price/amount_minor`). Input values are never echoed (CTR-ERR-001 R07). Rule enum: `required`, `length`, `charset`, `wrong_type`, `not_in_enum`, `not_in_taxonomy`, `region_not_registered`, `required_for_type`, `forbidden_for_type`, `currency_unsupported`, `exponent_mismatch`, `amount_out_of_range`.

## Authorization
Not applicable. Authorization runs before validation (PS-002-05), so unauthorized callers learn nothing about the schema.

## Failure, idempotency, concurrency, offline
Validation is deterministic for a given body and registry version. Validation failures are never stored or retried by the server. Offline entries that fail validation are shown as `not_applied` (PS-002-06).

## Privacy, retention, abuse
R04 blocks location fields at the API boundary. Free text is not scanned here (see PS-002-07). Error bodies carry field pointers only, never values.

## Observability & budgets
Metric `lst_create_rejections_total{rule}`. Validation p95 ≤ 5 ms (ASSUMPTION). See PS-002-08.

## Tests
- TEST-PS-002-02-01 (unit): each rule R05–R13 has an accept and a reject fixture; `details[].rule` matches the enum.
- TEST-PS-002-02-02 (negative): body with `lat` returns `PRV.PRECISE_LOCATION_FORBIDDEN`; body with `owner_ref` returns `SYS.REQUEST_MALFORMED`.
- TEST-PS-002-02-03 (property): fuzzed floats, 39+ digit amounts, wrong exponents and control characters are rejected, never coerced.
- TEST-PS-002-02-04 (e2e): each `details[].field` maps to one labelled form control.

## Acceptance criteria
1. Each rule in R01–R13 has at least one passing and one failing fixture.
2. No error body contains an input value (fuzz scan).
3. `sell`, `giveaway` and `wanted` pass their type rules in all fixtures.
4. TEST-PS-002-02-01 to -04 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D03 default, unapproved): asking prices use integer minor units, a pinned exponent and fiat only in MVP.
- ASSUMPTION: title 3–120, description 0–4000, body 16 KiB, amount ≤ 10^12 minor units.
- ASSUMPTION: per-type enable flags are operator configuration owned by F15.
- OPEN: taxonomy owner (see PS-002-01).
- PENDING F10 confirmation: reuse of `PRV.PRECISE_LOCATION_FORBIDDEN` on the create input path. CTR-PRV-001 scopes that code to public, federated and log paths.
