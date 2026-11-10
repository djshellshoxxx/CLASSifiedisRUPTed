# PS-112-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-01. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); subject consumers are LocalBazaar listings and LocalMutiny proposals and cycles, referenced only by opaque `subject_ref`.

## Purpose and scope
Defines the five record types owned by currencies: `currency_definition`, `fx_quote`, `valuation_pin`, `conversion_record` and `display_preference`. Business outcome: every monetary value that crosses this module is an integer count of minor units with an explicit currency code, and every cross-currency comparison traces to one pinned, expiring, operator-published FX quote and to an append-only conversion record.

Exclusions: no payment execution, settlement, custody or exchange of funds; no valuation of crypto assets or tokens (A-currencies-02); no live third-party FX calls from clients or from this module (A-currencies-03); no translated currency names (A-currencies-09); no location data; no federated quote ingestion in MVP.

## Requirements
- PS-112-01.R01: The module is the single writer of the five record types below. Actors: operator (catalog, quotes), subject-owning service (pins, conversions), participant (own preference), scheduler (expiry). Other modules read through queries or consume events; they never write these rows.
- PS-112-01.R02: Edge cases are enumerated in the table "Edge cases" below (normal, invalid, expired, duplicate, concurrent, offline, adversarial). Each row maps to an error code in [validation_rules.md](validation_rules.md).
- PS-112-01.R03: Each serialized record is at most 2 KiB. The catalog holds at most 500 rows. Clients receive `name_key` and never receive a currency name without it, so screen readers announce the localized name rather than the three-letter code alone. Accessibility of rendering is verified by TEST-PS-112-01-T03.
- PS-112-01.R04: Field-level schemas are fixed as listed in "Field schemas". Unknown fields are rejected (CURRENCIES_INVALID_REQUEST).
- PS-112-01.R05: Amounts are signed decimal strings of integer minor units. Rates are decimal strings with at most 12 fractional digits. No binary floating point is permitted in storage, wire or computation.
- PS-112-01.R06: `fx_quote` and `valuation_pin` are immutable except for `status`, `status_reason_code` and `revision`. `conversion_record` is append-only. `currency_definition` is revisioned and never deleted. `display_preference` is updated in place and removed on account deletion.

## Field schemas

### currency_definition
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| code | string(3) | no | PK. `^[A-Z]{3}$` (FIAT) or `^LU[A-Z]$` (LOCAL_UNIT) | none | `EUR` |
| numeric_code | string(3) | yes | `^[0-9]{3}$`, unique when present; must be null for LOCAL_UNIT | null | `978` |
| name_key | string(40) | no | `^currency\.[A-Z]{2}[A-Z0-9]\.name$` | `currency.<code>.name` | `currency.EUR.name` |
| minor_unit_exponent | integer | no | 0..4 | 2 | `2` |
| kind | enum | no | `FIAT`, `LOCAL_UNIT` | none | `FIAT` |
| status | enum | no | `ACTIVE`, `DEPRECATED`, `DISABLED` | `ACTIVE` | `ACTIVE` |
| revision | integer | no | >= 1, +1 per change | 1 | `3` |
| changed_by_actor_ref | string(64) | no | pseudonymous operator ref from F07 | none | `act_01J9D1A3B5C7D9E1F3G5H7J9K1` |
| created_at / updated_at | timestamp | no | RFC 3339 UTC, second precision | now | `2026-11-01T09:00:00Z` |
| schema_version | integer | no | `= 1` | 1 | `1` |

### fx_quote
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| quote_id | string(30) | no | PK. `fxq_` + ULID (26 Crockford chars) | generated | `fxq_01J9C7K2M4N6P8Q0R2S4T6V8W0` |
| base_code | string(3) | no | catalog code, status ACTIVE at publish | none | `EUR` |
| quote_code | string(3) | no | catalog code, status ACTIVE, differs from base_code | none | `USD` |
| rate | decimal string | no | Units of quote_code per 1 unit of base_code. See R05 and V08 | none | `1.085` |
| source_id | string(32) | no | `^[a-z0-9_]{3,32}$`, must be in operator allowlist | none | `ops_daily_table` |
| as_of | timestamp | no | Source publication time; `as_of <= captured_at` | none | `2026-11-10T06:00:00Z` |
| captured_at | timestamp | no | Set by server at publish | now | `2026-11-10T07:02:14Z` |
| expires_at | timestamp | no | `captured_at + ttl`; ttl 5 min..24 h | `captured_at + 60 min` | `2026-11-10T08:02:14Z` |
| status | enum | no | `ACTIVE`, `EXPIRED`, `WITHDRAWN` | `ACTIVE` | `ACTIVE` |
| status_reason_code | enum | yes | Required when WITHDRAWN: `OPERATOR_ERROR`, `SOURCE_RETRACTED`, `SECURITY_HOLD` | null | null |
| published_by_actor_ref | string(64) | no | Operator or FX importer service principal ref | none | `svc_fx_01J9D1A3` |
| revision | integer | no | >= 1, +1 per status change | 1 | `1` |
| schema_version | integer | no | `= 1` | 1 | `1` |

Rates are directional. A reverse conversion requires its own published quote; the module never derives an inverse rate.

### valuation_pin
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| pin_id | string(30) | no | PK. `pin_` + ULID | generated | `pin_01J9D1A3B5C7D9E1F3G5H7J9K1` |
| quote_id | string(30) | no | FK fx_quote; quote ACTIVE and unexpired at pin time | none | `fxq_01J9C7K2M4N6P8Q0R2S4T6V8W0` |
| subject_type | enum | no | `LISTING`, `PROPOSAL`, `CYCLE` | none | `CYCLE` |
| subject_ref | string(64) | no | Opaque ID owned by subject module; `^[a-z]{3,8}_[0-9A-Za-z]{8,56}$` (A-currencies-12) | none | `cyc_7Q2XK9M4` |
| pinned_by_actor_ref | string(64) | no | Subject-owning service principal ref | none | `svc_mutiny_01J9` |
| pinned_at | timestamp | no | Server time | now | `2026-11-10T07:05:00Z` |
| valid_until | timestamp | no | Lifetime rule in workflow_state_machine.md (A-currencies-07) | see rule | `2026-11-10T08:02:14Z` |
| status | enum | no | `PINNED`, `RELEASED`, `INVALIDATED`, `EXPIRED` | `PINNED` | `PINNED` |
| status_reason_code | enum | yes | `SUBJECT_CLOSED`, `SUBJECT_CANCELLED`, `SUBJECT_DROPOUT`, `QUOTE_WITHDRAWN`, `TIMED_OUT` | null | null |
| revision | integer | no | >= 1, +1 per status change | 1 | `1` |
| schema_version | integer | no | `= 1` | 1 | `1` |

Uniqueness: at most one PINNED row per (`subject_ref`, `quote_id`). At most 16 PINNED rows per `subject_ref`.

### conversion_record
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| conversion_id | string(31) | no | PK. `cnv_` + ULID | generated | `cnv_01J9E4R7T1V3X5Z7B9D1F3H5J7` |
| pin_id | string(30) | no | FK valuation_pin; status PINNED at `computed_at` | none | `pin_01J9D1A3B5C7D9E1F3G5H7J9K1` |
| quote_id | string(30) | no | Copied from the pin | none | `fxq_01J9C7K2M4N6P8Q0R2S4T6V8W0` |
| from_code / to_code | string(3) | no | Equal to quote base_code / quote_code | none | `EUR` / `USD` |
| input_minor | decimal string | no | Signed integer, 1..18 digits (V14) | none | `"1250"` |
| output_minor | decimal string | no | Signed integer, rounded per policy; magnitude <= 999999999999999999 | none | `"1356"` |
| exact_output_decimal | decimal string | no | Unrounded product, at most 40 characters, for audit recomputation | none | `"1356.25"` |
| rounding_policy | enum | no | `HALF_EVEN`, `HALF_UP`, `FLOOR`, `CEILING` (A-currencies-05) | `HALF_EVEN` | `HALF_EVEN` |
| computed_at | timestamp | no | Server time | now | `2026-11-10T07:10:00Z` |
| computed_by_actor_ref | string(64) | no | Subject-owning service principal ref | none | `svc_mutiny_01J9` |
| supersedes_conversion_id | string(31) | yes | Earlier conversion this one corrects; never edits the earlier row | null | null |
| schema_version | integer | no | `= 1` | 1 | `1` |

Display-only conversions (for presentation, no evidence needed) are computed client-side from the public active quote and are not recorded (A-currencies-20).

### display_preference
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| user_ref | string(64) | no | PK. Pseudonymous participant ref from F07 | none | `usr_01J9F2` |
| display_code | string(3) | yes | Null, or catalog code with status ACTIVE | null | `JPY` |
| revision | integer | no | >= 1 | 1 | `2` |
| updated_at | timestamp | no | Server time | now | `2026-11-09T18:00:00Z` |
| schema_version | integer | no | `= 1` | 1 | `1` |

## Edge cases
| Case | Expected behavior | Error code |
|---|---|---|
| Duplicate catalog code registration | Rejected; no row change | CURRENCIES_DUPLICATE_CODE |
| Quote published for DISABLED code | Rejected | CURRENCIES_CODE_INACTIVE |
| Pin requested on expired quote | Rejected; no pin row | CURRENCIES_QUOTE_EXPIRED |
| Pin requested after quote withdrawn | Rejected | CURRENCIES_QUOTE_WITHDRAWN |
| Two operators change one definition concurrently | First commit wins; second gets revision conflict | CURRENCIES_REVISION_CONFLICT |
| Offline client holds old quote | Client shows `as_of` and grey-out after `expires_at`; server remains authoritative | none (client-side) |
| Forged quote from non-allowlisted source | Rejected before write | CURRENCIES_QUOTE_SOURCE_NOT_ALLOWED |
| Quote rate moves beyond outlier band | Rejected unless override with second approver | CURRENCIES_QUOTE_OUTLIER |
| Convert replayed with same Idempotency-Key | Stored response returned; no second row | none (replay) |
| Convert with pin released by subject | Rejected | CURRENCIES_PIN_INVALID |

## Persistence, provenance and ownership
- Each mutating command writes its row, a revision bump where applicable, and an outbox row in one transaction (see failure_recovery_idempotency.md).
- Provenance: every row carries an actor ref. Pins and conversions also carry the subject-owning service principal that acted for the subject.
- Subject ownership stays with the subject module. This module stores only `subject_ref` and never copies subject content.

## Open decisions
- A-currencies-01: The ISO 4217 catalog is loaded as an operator-managed snapshot with a recorded publication date. No runtime fetch from ISO sources.
- A-currencies-02: Crypto assets, tokens and non-ISO units other than LOCAL_UNIT are out of MVP scope. A future kind requires its own process spec.
- A-currencies-03: Quotes come only from operator-allowlisted sources (manual entry or scheduled import). Clients never call third-party FX APIs. Related decision: D03.
- A-currencies-09: Localized names are supplied by the mod_languages sibling through `name_key`. This module stores no translated text.
- A-currencies-12: `subject_ref` is an opaque string whose format is owned by the subject module; this module only checks the pattern above.
- A-currencies-20: Only valuation conversions are recorded. Display conversions are not stored.
