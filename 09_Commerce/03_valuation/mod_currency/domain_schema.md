# PS-073-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (currency object: `kind`, `code`, `exponent`), CTR-ID-001, CTR-SCH-001, CTR-PRV-001 (PUBLIC). **Pending:** `cur_` prefix (CTR-ID-001). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-01.R01 | Each entry has `kind` = `fiat` or `asset` and a `code` matching the CTR-COM-001 currency pattern. | MVP |
| PS-073-01.R02 | `exponent` is an integer 0–18 and is the single source of minor-unit scale for that currency. | MVP |
| PS-073-01.R03 | Fiat `code` is ISO 4217 alpha-3 and exponent equals the ISO minor-unit value. | MVP |
| PS-073-01.R04 | Asset `code` is a CAIP-19 identifier; exponent is declared by the asset registration and cross-checked against the adapter record. | MVP |
| PS-073-01.R05 | Each entry carries `status` (`enabled`, `disabled`, `deprecated`) and `schema_version`. | MVP |
| PS-073-01.R06 | Published entry versions are immutable; changes create a new version (CTR-SCH-001 R02). | MVP |

## Data / schema
| Field | Type / constraint | Class |
|---|---|---|
| `currency_id` | `cur_` ULID (PENDING) | PUBLIC |
| `kind` | enum `fiat` \| `asset` | PUBLIC |
| `code` | string per CTR-COM-001 pattern | PUBLIC |
| `exponent` | integer 0–18 | PUBLIC |
| `display` | `{name_key, symbol, decimals_hint}` localization keys, no free text | PUBLIC |
| `status` | enum | PUBLIC |
| `version` | integer ≥ 1 | PUBLIC |
| `adapter_id` | `chn_` or null (assets only) | PUBLIC |
| `schema_version` | SemVer | PUBLIC |

## Commands / queries / events
Specified in PS-073-04.

## States & transitions
Entry status per PS-073-03.

## Validation & errors
See PS-073-02.

## Authorization
Reads public; writes restricted (PS-073-05).

## Failure, idempotency, concurrency, offline
Versions are appended; no in-place edit.

## Privacy, retention, abuse
No user data; registry is public.

## Observability & budgets
Gauge: enabled entries by kind.

## Tests
- TEST-PS-073-01-01 (unit): exponent 19 rejected; exponent 0 accepted.
- TEST-PS-073-01-02 (golden): ISO 4217 exponents match reference list for enabled codes.
- TEST-PS-073-01-03 (unit): in-place update rejected; new version accepted.

## Acceptance criteria
1. One entry per (kind, code) per version.
2. Exponent source is unique.
3. No user field in schema.

## Assumptions & open decisions
- ASSUMPTION: display uses localization keys only.
- D03 (PROVISIONAL default, unapproved): integer minor units keyed by this exponent.
