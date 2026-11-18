# PS-056-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`prf`), CTR-PRV-001 (PSEUDONYMOUS, PRIVATE_PERSONAL, LOCATION_COARSE; RET-PRIV), CTR-SCH-001, CTR-CAP-001 (R10 field visibility).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-01.R01 | One `profile` row per `prf_` (1:1), keyed by `prf_id`; created with the pseudonym (mod_pseudonyms event). | MVP |
| PS-056-01.R02 | Public block: `bio` ≤ 500 code points, `languages` ≤ 5 BCP 47 tags, `region_cell` optional. No legal name field in MVP. | MVP |
| PS-056-01.R03 | Private block: `contact_methods` ≤ 3 entries, PRIVATE_PERSONAL, never in the public block. | MVP |
| PS-056-01.R04 | `region_cell` accepted only from the registered coarse grid with K_MIN = 5 (CTR-PRV-001). Precise coordinates or addresses are rejected. | MVP |
| PS-056-01.R05 | Each field has a `visibility` value in {`public`, `participant`, `owner`, `never`}; default `owner` for private block and `public` for bio, languages, region_cell. | MVP |
| PS-056-01.R06 | Profile photos and attachments. | Future (depends on mod_attachments and EXIF stripping decision) |

## Data / schema
| Field | Type | Constraint | Class |
|---|---|---|---|
| `prf_id` | string(30) | prefix `prf`, PK, FK to mod_pseudonyms | PSEUDONYMOUS |
| `bio` | string(0–500) | NFC; rules in PS-056-02 | PSEUDONYMOUS, default public |
| `languages` | array(0–5) of string | BCP 47 tag, lowercase canonical | PSEUDONYMOUS, default public |
| `region_cell` | string | registry code of coarse grid cell; K_MIN = 5 | LOCATION_COARSE, default public |
| `contact_methods` | array(0–3) of object `{type, value}` | `type` enum closed: `email`, `phone`, `messenger`; value ≤ 128 chars | PRIVATE_PERSONAL, default owner |
| `visibility` | object | key = field name; value enum closed | internal |
| `revision` | int | ≥ 1 (CTR-EVT-001 R02) | internal |
| `updated_at` | timestamp | RFC 3339 UTC, ms | PSEUDONYMOUS |
| `schema_version` | semver | `1.0.0` | — |

Provenance: each field records `source` enum (`user_input`, `imported`); no device or IP metadata.

## Commands / queries / events
Schema reference; see [commands_queries_events.md](commands_queries_events.md) (PS-056-04).

## States & transitions
No lifecycle states of its own. Profile follows `prf_` state: on `pseudonym.retired` the profile becomes read-only and private block is purged per PS-056-07.

## Validation & errors
See [validation_rules.md](validation_rules.md) (PS-056-02).

## Authorization
Field visibility enforced per PS-056-05.

## Failure, idempotency, concurrency, offline
Profile update is a single-row compare-and-set on `revision`. See PS-056-06.

## Privacy, retention, abuse
Public block is PSEUDONYMOUS (RET-ACC). Private block is PRIVATE_PERSONAL (RET-PRIV). See PS-056-07.

## Observability & budgets
Count of rows by visibility setting (aggregate only). See PS-056-08.

## Tests
- TEST-PS-056-01-01 (unit): one profile per `prf_`; second insert rejected.
- TEST-PS-056-01-02 (unit): `contact_methods` absent from public projection.
- TEST-PS-056-01-03 (property): `region_cell` outside grid or cell with fewer than K_MIN active profiles is rejected.
- TEST-PS-056-01-04 (contract): schema digest registered.

## Acceptance criteria
1. Every profile row maps to exactly one active or retired `prf_`.
2. No precise coordinate or address field exists in the schema (lint).
3. Private block never serialized in public projection (fixture).
4. Visibility defaults match R05.

## Assumptions & open decisions
- ASSUMPTION: K_MIN = 5 for region cells (CTR-PRV-001 assumption).
- ASSUMPTION: contact method types limited to three in MVP.
- PROVISIONAL (D05 default, unapproved): coarse public regions; precision only by user-initiated disclosure (owned by 06_Discovery geoprivacy).
- PROVISIONAL (D07 default, unapproved): retention classes as in PS-056-07.
