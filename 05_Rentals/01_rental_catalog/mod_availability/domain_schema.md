# PS-039-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-01. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle (commit and release of claims), notifications (claim events), observability; shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-01.R01: Business outcome, actors and exclusions are defined below and are the scope of this schema.
- PS-039-01.R02: Every entity has field-level name, type, nullability, constraints, default and example. Cases covered: normal, invalid, expired hold, duplicate command, concurrent write, offline replay and adversarial input (see validation and failure files).
- PS-039-01.R03: Schema is accessible and localizable: dates are shown in the listing timezone and the viewer locale, and stored values are never shown as raw codes to users. Budgets are in observability_performance.md.

## Business outcome
A rental listing owner publishes the periods in which a rentable item can be requested, blocks periods it cannot be rented, and a renter can see whether a requested period is open. The module keeps the availability calendar consistent so that two requesters cannot both hold or commit the same period.

## Actors
- Listing owner (pseudonymous participant, F07).
- Requester (pseudonymous participant, F07).
- Rental lifecycle service (internal principal from 02_rental_lifecycle; the only writer of commitments).
- Operator (moderation suspension of a listing; read-only on claims).

## Exclusions
- No payment, deposit, price, fee or currency values (owned by mod_deposits and rental pricing).
- No rental agreement, handover, return or dispute state (owned by 02_rental_lifecycle).
- No platform custody of the item or money.
- No exact pickup address or geolocation precision (owned by F10 disclosure rules).
- No free-text notes; reasons are closed codes.
- No import of claims, and no federation of availability in this version.

## Entities
All timestamps are UTC instants, RFC 3339 with `Z`, second precision, minute-aligned. Intervals are half-open: `[starts_at_utc, ends_at_utc)`.

### availability_window
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| window_id | string (ULID, 26 chars) | no | PK, immutable, see A-AVAIL-01 | generated | `01J9Z8X3K4M5N6P7Q8R9S0T1VW` |
| listing_id | string | no | opaque ref to rental listing, see A-AVAIL-02 | none | `rl_example_0001` |
| owner_participant_id | string | no | F07 pseudonym; never a legal name | none | `participant_id_owner_01` |
| starts_at_utc | timestamp | no | minute-aligned; >= now at publish | none | `2026-12-01T09:00:00Z` |
| ends_at_utc | timestamp | no | > starts_at_utc; span <= 366 days | none | `2026-12-08T09:00:00Z` |
| timezone_id | string (IANA) | no | must exist in the IANA database; display and day-boundary use only | listing timezone | `Europe/Berlin` |
| status | enum | no | `active` or `withdrawn` (see workflow file) | `active` | `active` |
| revision | integer | no | >= 1; incremented on every write | 1 | `3` |
| schema_version | integer | no | equals 1 in this version | 1 | `1` |
| created_at_utc | timestamp | no | set once | now | `2026-11-10T08:00:00Z` |
| withdrawn_at_utc | timestamp | yes | set only when status = withdrawn | null | null |

### availability_block
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| block_id | string (ULID) | no | PK | generated | `01J9Z8X3K4M5N6P7Q8R9S0T1VX` |
| listing_id | string | no | same ref as window | none | `rl_example_0001` |
| owner_participant_id | string | no | must equal listing owner | none | `participant_id_owner_01` |
| starts_at_utc | timestamp | no | minute-aligned | none | `2026-12-24T00:00:00Z` |
| ends_at_utc | timestamp | no | > starts_at_utc; span <= 366 days | none | `2027-01-02T00:00:00Z` |
| reason_code | enum | no | `maintenance`, `owner_use`, `seasonal_closure`, `other` | `other` | `maintenance` |
| status | enum | no | `active` or `removed` | `active` | `active` |
| revision | integer | no | >= 1 | 1 | `1` |

### availability_claim
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| claim_id | string (ULID) | no | PK | generated | `01J9Z8X3K4M5N6P7Q8R9S0T1VY` |
| listing_id | string | no | same ref as window | none | `rl_example_0001` |
| window_id | string (ULID) | no | must reference an active window fully covering the claim at creation | none | `01J9Z8X3K4M5N6P7Q8R9S0T1VW` |
| requester_participant_id | string | no | F07 pseudonym; must differ from owner | none | `participant_id_requester_07` |
| starts_at_utc | timestamp | no | minute-aligned | none | `2026-12-03T09:00:00Z` |
| ends_at_utc | timestamp | no | > starts_at_utc | none | `2026-12-05T09:00:00Z` |
| state | enum | no | `held`, `committed`, `released`, `expired` | `held` | `held` |
| hold_expires_at_utc | timestamp | yes | required when state = held; null otherwise | created_at + hold TTL | `2026-11-13T09:00:00Z` |
| source_ref | string | no | opaque request or agreement ID from 02_rental_lifecycle; no personal data | none | `rq_example_0042` |
| release_reason | enum | yes | `requester_withdrew`, `owner_declined`, `rental_cancelled`, `rental_completed`, `hold_expired`; set when terminal | null | null |
| revision | integer | no | >= 1 | 1 | `2` |
| created_at_utc | timestamp | no | set once | now | `2026-11-10T08:05:00Z` |
| updated_at_utc | timestamp | no | updated on each revision | now | `2026-11-10T08:06:00Z` |

### command_idempotency_record
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| actor_key | string | no | hash of actor ID plus scope; see privacy file | none | `h_3f9a…` |
| command_name | string | no | e.g. `avail.claim.hold` | none | `avail.claim.hold` |
| idempotency_key | string (ULID) | no | client generated | none | `01J9Z8X3K4M5N6P7Q8R9S0T1VZ` |
| request_hash | string (SHA-256 hex) | no | over canonical request body | none | `9b1c…` |
| result_ref | string | no | ID of the created or changed record | none | `01J9Z8X3K4M5N6P7Q8R9S0T1VY` |
| expires_at_utc | timestamp | no | created_at + 7 days (A-AVAIL-13) | none | `2026-11-17T08:05:00Z` |

## Relationships and ownership
- Listing: owned by the rental catalog; referenced by `listing_id` only (A-AVAIL-02).
- Window, block and claim: owned by this module. Claims reference a window by ID; a window is never copied into a claim.
- Rental request or agreement: owned by 02_rental_lifecycle; referenced by `source_ref`.
- Participant: owned by F07; referenced by pseudonymous ID only.
- Effective availability is derived, never stored: active windows minus active blocks minus claims in `held` (unexpired) or `committed` state.

## Derived rules
- A period is requestable if it lies inside one active window, overlaps no active block, and overlaps no unexpired held or committed claim.
- Two claims conflict when their half-open intervals overlap and both are in `held` (unexpired) or `committed`.

## Open decisions
- A-AVAIL-01: ID format. ULID is assumed for sortable IDs; UUID is the alternative. CTR-ID-001 is OPEN, so this is provisional.
- A-AVAIL-02: Canonical owner of `listing_id` is assumed to be the rental catalog. Not stated in CONTRACTS.md; cross-module contract needed.
- A-AVAIL-03: Time model is UTC instants plus IANA display zone, minute granularity, half-open intervals. Whole-day rentals are represented as midnight-to-midnight in `timezone_id`.
- A-AVAIL-04: Hold TTL default 72 hours (range 1 hour to 7 days). Owner acceptance window for a held request.
- A-AVAIL-05: Maximum span of a single window, block or claim is 366 days.
