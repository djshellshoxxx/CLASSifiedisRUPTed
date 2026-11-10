# PS-029-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-01. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines the persisted record for a **skill offer**: a pseudonymous participant's published description of a skill they can offer to other participants through the local service catalog. This file is the canonical field contract for the module. Wire formats are in [commands_queries_events.md](commands_queries_events.md). Registry rules (CTR-SCH-001) are owned by F15 per [CONTRACTS](../../../planning/CONTRACTS.md).

Exclusions: a skill offer is an advertisement, not an agreement. It creates no booking, price commitment, payment, escrow, custody, endorsement or certification. Availability calendars belong to mod_availability (PS-028). Booking requests, quotes and disputes belong to 02_service_booking. Identity attributes (display pseudonym, account status) stay with F07. Precise locations stay with F10 and are never stored here.

## Requirements
- PS-029-01.R01: Business outcome: a participant publishes, updates, pauses, renews and withdraws skill offers so that other participants can discover them by category and approximate region. Actors: owner participant, public searcher, moderator, scheduler. Exclusions as stated above.
- PS-029-01.R02: Case coverage: normal create-update-publish; invalid fields (see [validation_rules.md](validation_rules.md)); expired offers (published past `expires_at`); duplicate offers (same owner, category and normalized title); concurrent edits (revision conflict); offline writes (one effective write per idempotency key); adversarial input (control characters, contact data, coordinates, oversized text, unknown fields).
- PS-029-01.R03: Accessibility, localization and budgets: every field has a `label_key` for localized labels; text fields accept right-to-left and multi-byte input; a serialized record is at most 8 KB (title 80 code points x 4 bytes, description 1000 x 4 bytes, tags 5 x 24, plus fixed fields). Read and write budgets are in [observability_performance.md](observability_performance.md).
- PS-029-01.R04: Single canonical owner: this module is the only writer of `skill_offer`, `skill_offer_transition` and `skill_offer_idempotency`. Participant identity is referenced by `owner_participant_id` only and no identity attribute is copied.
- PS-029-01.R05: Immutability: `skill_id`, `owner_participant_id`, `schema_version`, `created_at` and `published_at` (once set) never change.
- PS-029-01.R06: Append-only history: every state change writes exactly one `skill_offer_transition` row in the same transaction as the state change.
- PS-029-01.R07: Money is an integer in minor units. `rate_*` fields are informative only; this module performs no FX conversion and no price binding (D03 open).

## Entity: skill_offer
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| skill_id | string (ULID) | no | 26 chars, `^[0-9A-HJKMNP-TV-Z]{26}$`, server-generated, immutable | none | `01J9S0KA0000000000000000A1` |
| owner_participant_id | string (ULID) | no | Reference to F07 participant; immutable | none | `01J9P4RT7QK2MVX8Z3HD5WBN6E` |
| schema_version | integer | no | Equals 1 for this spec | 1 | `1` |
| state | enum | no | `draft`, `published`, `paused`, `expired`, `retired` (see [workflow](workflow_state_machine.md)) | `draft` | `published` |
| revision | integer | no | >= 1; +1 on each successful write; optimistic concurrency token | 1 | `4` |
| category_code | string | no | `^[a-z]{2,16}(\.[a-z][a-z0-9_]{1,31})?$`, max 64 chars, active in `taxonomy_version` | none | `repair.bicycle` |
| taxonomy_version | integer | no | >= 1, must exist in taxonomy table | active version at create | `3` |
| title | string | no | 3–80 code points after NFC and trim; no Cc, Cf or Co characters; internal whitespace collapsed to one space | none | `Bicycle tune-up and brake adjustment` |
| description | string | no | 0–1000 code points; at most 20 lines; no contact data (A-skills-06) | `""` | `Tune-up for road and hybrid bikes; parts extra.` |
| proficiency | enum | no | `beginner`, `intermediate`, `advanced`, `expert`; self-declared, not verified | `intermediate` | `advanced` |
| tags | array of string | no | 0–5 items, unique, each `^[a-z0-9-]{2,24}$` | `[]` | `["bike","brakes"]` |
| rate_amount_minor | integer | yes | 0 to 100000000 inclusive; present only with `rate_currency_code` and `rate_unit` | null | `4500` |
| rate_currency_code | string | yes | ISO 4217 alpha-3, uppercase, in enabled currency list; required iff amount set | null | `EUR` |
| rate_unit | enum | yes | `per_hour`, `per_session`, `per_item`, `fixed`; required iff amount set | null | `per_hour` |
| discovery_region_code | string | yes | `^[A-Z]{2}-R[0-9]{2}$`, in approved approximate-region catalog (CTR-PRV-001); required from first publish | null | `AA-R07` |
| published_at | timestamp | yes | RFC 3339 UTC, millisecond precision; set on first publish; immutable once set | null | `2026-11-10T08:15:00.000Z` |
| expires_at | timestamp | yes | `published_at` + 180 days, reset on renew; null while draft (A-skills-09) | null | `2027-05-09T08:15:00.000Z` |
| paused_at | timestamp | yes | Set on pause; cleared on resume | null | null |
| retired_at | timestamp | yes | Set on retire; once set the record is terminal | null | null |
| retire_reason_code | enum | yes | `owner_withdrew`, `draft_inactive`, `moderation_removed`, `participant_closed`; set iff state is `retired` | null | `owner_withdrew` |
| created_at | timestamp | no | Server time at create; immutable | server time | `2026-11-10T08:02:31.412Z` |
| updated_at | timestamp | no | Server time on each successful write | `created_at` | `2026-11-10T08:15:00.000Z` |

Tags are lowercase and matched by exact string only; they are not free-text searched.

## Entity: skill_offer_transition (append-only)
| Field | Type | Null | Constraints | Example |
|---|---|---|---|---|
| transition_id | string (ULID) | no | Unique | `01J9T3H0KQ5ZB8RX2MDW7VNP4C` |
| skill_id | string (ULID) | no | FK to skill_offer | `01J9S0KA0000000000000000A1` |
| revision | integer | no | Revision produced by the transition | `4` |
| from_state | enum or null | yes | Null only for the create transition | `published` |
| to_state | enum | no | One of the five states | `paused` |
| command_name | string | no | Name from [commands](commands_queries_events.md), e.g. `skills.offer.pause` | `skills.offer.pause` |
| actor_ref | string | no | `participant:<ULID>`, `moderator:<ULID>` or `system:<sweep_name>` | `participant:01J9P4RT7QK2MVX8Z3HD5WBN6E` |
| reason_code | enum or null | yes | Required when to_state is `retired` | `owner_withdrew` |
| occurred_at | timestamp | no | Server time | `2026-11-10T09:00:00.000Z` |
| correlation_id | string (ULID) | no | Per CTR-EVT-001 | `01J9T4AB1TK3W0ZX9Q6RNE8MHS` |
| idempotency_key_hash | string | no | Lowercase hex SHA-256 of the raw key, 64 chars; raw key never stored here | `9f2c...` (64 hex chars) |

## Entity: skill_offer_taxonomy (owned, versioned configuration)
| Field | Type | Null | Constraints | Example |
|---|---|---|---|---|
| taxonomy_version | integer | no | >= 1; rows are never deleted | `3` |
| category_code | string | no | Same pattern as skill_offer.category_code | `repair.bicycle` |
| label_key | string | no | Localization key, max 96 chars | `skills.category.repair.bicycle` |
| active | boolean | no | False blocks new use; existing offers stay readable | `true` |
| introduced_in | integer | no | taxonomy_version that first contained the code | `1` |

Taxonomy changes are additive. A category is deactivated, never removed (A-skills-03).

## Entity: skill_offer_idempotency (operational)
Stores `idempotency_key_hash` (64 hex chars), `owner_participant_id`, `command_name`, `request_hash` (SHA-256 of canonical JSON body), `skill_id`, `result_revision`, `created_at` and `expires_at` (= `created_at` + 24 h). Contains no title, description or rate. Details in [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Read projection: skill_offer_public (not stored)
Returned only for `state = published`. Fields: `skill_id`, `category_code`, `title`, `description`, `tags`, `proficiency`, `rate_*`, `discovery_region_code`, `published_at`, `expires_at`, `owner_display_pseudonym` (read from F07 at query time). Excluded: `owner_participant_id`, `revision`, `state` other than published, draft fields, `retire_reason_code`, `updated_at`, transition history, and any contact data.

## Relationships
- `owner_participant_id` references F07. Deleting or suspending a participant is an F07/F16 signal handled per [workflow](workflow_state_machine.md).
- `discovery_region_code` references the approximate-region catalog owned by F10 (A-skills-04).
- `category_code` references `skill_offer_taxonomy`, owned here.

## Assumptions
- A-skills-01: Identifiers are ULIDs (26-char Crockford base32) pending the CTR-ID-001 choice (UUID/ULID OPEN). If UUIDv7 is chosen, only the pattern changes.
- A-skills-02: Timestamps are RFC 3339 UTC with millisecond precision. Money uses minor units with the ISO 4217 exponent of the currency.
- A-skills-03: The category taxonomy is owned by this module as versioned configuration. Changes are additive.
- A-skills-04: Discovery regions are the coarse catalog of CTR-PRV-001 (F10). The `AA-R07` example is a placeholder; `AA` is an ISO 3166 user-assigned code.
- A-skills-05: Tags are exact-match only. No tag can carry personal data by pattern.

## Open decisions
- D05 (geoprivacy): granularity of `discovery_region_code` and whether users may request finer disclosure. This schema assumes region-only.
- D03 (mixed currency valuation): rate is informative. No quote pinning exists in this module.
- A-skills-01 is blocked on CTR-ID-001.

## Testing
Schema conformance tests are `TEST-PS-029-01-T01` to `TEST-PS-029-01-T06` (see [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md)).
- TEST-PS-029-01-T01: Each field in the table accepts its example and rejects a value one step outside its constraint. Pass when all checks match the table.
- TEST-PS-029-01-T02: A record with `rate_amount_minor` set and `rate_unit` null is rejected. Pass when rejection occurs.
- TEST-PS-029-01-T03: Serialized size of a maximum-length record is at most 8192 bytes. Pass when measured size is at most 8192.
- TEST-PS-029-01-T04: Updating `skill_id`, `owner_participant_id`, `created_at` or `published_at` (after set) is rejected. Pass when rejected with no row change.
- TEST-PS-029-01-T05: Every state change produces exactly one transition row in the same transaction. Pass when a fault injected after the state write leaves neither row.
- TEST-PS-029-01-T06: The public projection contains none of the excluded fields. Pass when a reflection check over the projection finds zero excluded keys.
