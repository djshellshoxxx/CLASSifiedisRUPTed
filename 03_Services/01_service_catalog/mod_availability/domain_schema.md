# PS-028-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-028-01. **Owner:** [03_Services/01_service_catalog/mod_availability](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_availability. **Consumers:** 03_Services/02_service_booking (claim caller, see A-availability-05); notifications and observability per [03_Services SPEC](../../SPEC.md); identity F07, privacy F10, platform F15, security F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Business outcome: a provider publishes bounded time windows with a fixed capacity against one service offering in one coarse region. A booking caller can hold, confirm or release capacity so that a window is never oversold. Records describe supply and capacity only. They never prove payment, delivery or completion.

Exclusions:
- Service offering definitions (owned by sibling `mod_skills`, PS-029).
- Booking records, customer obligations and cancellation terms (02_service_booking).
- Payments, deposits and fees. No platform custody (PROJECT_SPEC, D09).
- Precise location and home address. Never stored in this module.
- External calendar synchronization and named-resource or per-seat assignment.

## Entities and ownership
| Entity | Owner of record | Purpose | Primary key |
|---|---|---|---|
| AvailabilitySchedule | this module | Weekly recurrence rule that materializes windows | schedule_id |
| AvailabilityWindow | this module | One concrete time range with capacity | window_id |
| AvailabilityClaim | this module (capacity ledger) | Hold, confirmation or release of capacity by a booking caller | claim_id |
| AvailabilityAudit | this module | Append-only record of each accepted command | audit_id |
| provider_ref | identity F07 | Pseudonymous provider account reference | external |
| claimant_ref | 02_service_booking | Pseudonymous claimant reference | external |
| service_offering_id | mod_skills (PS-029) | Offering the window is for | external |
| booking_ref | 02_service_booking | Booking that confirmed a claim | external |

## Field-level schema

### AvailabilitySchedule
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| schedule_id | char(26) ULID | no | PK, immutable | generated | 01J9Z3K8QF7W2M4X6R0T5V8B1C |
| schema_version | smallint | no | equals 1 for this spec | 1 | 1 |
| provider_ref | varchar(40) | no | pseudonymous ref, immutable | none | prov_01J9Z3K8QF7W2M4X6R0T5V8B2D |
| service_offering_id | char(26) ULID | no | reference only, immutable (A-availability-03) | none | 01J9Z3KA0Z5N8R2P4T6V8W0X1Y |
| region_code | varchar(10) | no | pattern `^[A-Z]{2}-[A-Z0-9]{1,3}$`, ISO 3166-2 subdivision (A-availability-06) | none | DE-BE |
| timezone | varchar(64) | no | IANA tz database name, validated | none | Europe/Berlin |
| weekday_mask | smallint | no | 1..127; bit0 Mon, bit1 Tue, ..., bit6 Sun | none | 31 (Mon to Fri) |
| blocks | jsonb | no | 1..14 items; each `{"local_start":"HH:MM","local_end":"HH:MM"}`; local_end after local_start; no overlap | none | `[{"local_start":"09:00","local_end":"12:00"}]` |
| capacity_per_window | smallint | no | 1..100 | 1 | 2 |
| status | varchar(12) | no | ACTIVE, PAUSED, ARCHIVED | ACTIVE | ACTIVE |
| revision | bigint | no | >= 1; incremented on every accepted write | 1 | 3 |
| created_at | timestamptz | no | UTC | now() | 2026-11-02T08:15:00Z |
| updated_at | timestamptz | no | UTC | now() | 2026-11-09T17:02:11Z |

### AvailabilityWindow
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| window_id | char(26) ULID | no | PK, immutable | generated | 01J9Z4Q1M7X3B5N8C0D2E4F6G8 |
| schema_version | smallint | no | equals 1 | 1 | 1 |
| schedule_id | char(26) ULID | yes | NULL for manual windows; FK to AvailabilitySchedule | NULL | 01J9Z3K8QF7W2M4X6R0T5V8B1C |
| generation_id | char(26) ULID | yes | set when materialized from a schedule (see failure spec) | NULL | 01J9Z5A0P1Q2R3S4T5U6V7W8X9 |
| provider_ref | varchar(40) | no | copied from schedule or request; immutable | none | prov_01J9Z3K8QF7W2M4X6R0T5V8B2D |
| service_offering_id | char(26) ULID | no | immutable | none | 01J9Z3KA0Z5N8R2P4T6V8W0X1Y |
| region_code | varchar(10) | no | as AvailabilitySchedule; immutable | none | DE-BE |
| timezone | varchar(64) | no | IANA name; immutable | none | Europe/Berlin |
| start_at | timestamptz | no | UTC; minute is 0, 15, 30 or 45 (A-availability-02) | none | 2026-11-20T09:00:00Z |
| end_at | timestamptz | no | UTC; end_at > start_at; duration 15 min to 24 h; minute on 15-minute grid | none | 2026-11-20T12:00:00Z |
| local_date | date | no | derived from start_at in timezone; used for search | derived | 2026-11-20 |
| capacity_total | smallint | no | 1..100 | capacity_per_window | 2 |
| capacity_held | smallint | no | >= 0 | 0 | 1 |
| capacity_confirmed | smallint | no | >= 0 | 0 | 0 |
| status | varchar(12) | no | UNPUBLISHED, PUBLISHED, SOLD_OUT, SUSPENDED, WITHDRAWN, EXPIRED, DISCARDED | UNPUBLISHED | PUBLISHED |
| suspension_code | varchar(20) | yes | MODERATION_HOLD or OPERATOR_HOLD; set only while SUSPENDED | NULL | NULL |
| note | varchar(280) | yes | UTF-8 text; rules in validation_rules.md | NULL | Bring own tools |
| revision | bigint | no | >= 1; optimistic concurrency token | 1 | 4 |
| published_at | timestamptz | yes | set on first publish | NULL | 2026-11-10T08:00:00Z |
| terminal_at | timestamptz | yes | set on WITHDRAWN, EXPIRED or DISCARDED | NULL | NULL |
| created_at | timestamptz | no | UTC | now() | 2026-11-09T17:00:00Z |
| updated_at | timestamptz | no | UTC | now() | 2026-11-10T08:00:00Z |

Derived value: `remaining = capacity_total - capacity_held - capacity_confirmed`. Never stored separately.

### AvailabilityClaim
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| claim_id | char(26) ULID | no | PK | generated | 01J9Z6B2C3D4E5F6G7H8J9K0M1 |
| schema_version | smallint | no | equals 1 | 1 | 1 |
| window_id | char(26) ULID | no | FK to AvailabilityWindow | none | 01J9Z4Q1M7X3B5N8C0D2E4F6G8 |
| claimant_ref | varchar(40) | no | pseudonymous ref from booking | none | clm_01J9Z6B2C3D4E5F6G7H8J9K0N2 |
| idempotency_key | varchar(64) | no | UNIQUE with claimant_ref; see commands spec | none | bkg-hold-7d2f0c91-a |
| quantity | smallint | no | 1..10; <= capacity_total | 1 | 1 |
| status | varchar(10) | no | HELD, CONFIRMED, RELEASED, EXPIRED | HELD | HELD |
| release_reason | varchar(20) | yes | CONFIRM_FAILED, BOOKING_CANCELLED, CLAIMANT_RELEASED, TTL_EXPIRED, WINDOW_WITHDRAWN, WINDOW_EXPIRED | NULL | NULL |
| booking_ref | char(26) ULID | yes | set on confirm; reference only | NULL | 01J9Z7D5E6F7G8H9J0K1M2N3P4 |
| hold_expires_at | timestamptz | yes | required while HELD; created_at + 15 min (A-availability-04) | created_at + 15 min | 2026-11-10T08:15:00Z |
| revision | bigint | no | >= 1 | 1 | 2 |
| created_at | timestamptz | no | UTC | now() | 2026-11-10T08:00:00Z |
| updated_at | timestamptz | no | UTC | now() | 2026-11-10T08:01:00Z |
| terminal_at | timestamptz | yes | set on RELEASED or EXPIRED | NULL | NULL |

### AvailabilityAudit
| Field | Type | Null | Constraints | Example |
|---|---|---|---|---|
| audit_id | char(26) ULID | no | PK; append-only | 01J9Z8E0F1G2H3J4K5M6N7P8Q9 |
| aggregate_type | varchar(12) | no | SCHEDULE, WINDOW or CLAIM | WINDOW |
| aggregate_id | char(26) ULID | no | | 01J9Z4Q1M7X3B5N8C0D2E4F6G8 |
| revision_after | bigint | no | | 4 |
| command | varchar(48) | no | command name | availability.window.publish |
| actor_ref | varchar(40) | no | pseudonymous ref or service principal id | prov_01J9Z3K8QF7W2M4X6R0T5V8B2D |
| correlation_id | varchar(64) | no | from command envelope | corr_01J9Z8F0 |
| occurred_at | timestamptz | no | UTC | 2026-11-10T08:00:00Z |

## Constraints (normative)
- `CHECK (capacity_held >= 0 AND capacity_confirmed >= 0 AND capacity_held + capacity_confirmed <= capacity_total)` on AvailabilityWindow.
- `CHECK (end_at > start_at)` on AvailabilityWindow.
- Partial unique index on AvailabilityWindow `(provider_ref, service_offering_id, start_at, end_at)` where status is not WITHDRAWN, EXPIRED or DISCARDED. Duplicate active windows are rejected (AVAILABILITY_WINDOW_DUPLICATE).
- Unique `(claimant_ref, idempotency_key)` on AvailabilityClaim.
- Index `(region_code, service_offering_id, start_at)` where status = PUBLISHED, for search.
- Index `(hold_expires_at)` where status = HELD, for the expiry sweeper.
- AvailabilityAudit rows are never updated or deleted by application code.

## Serialization
Timestamps: RFC 3339 UTC with `Z`. IDs: ULID, uppercase Crockford base32 (A-availability-01). Strings: UTF-8 NFC. Integers: JSON numbers without fractions. No floating-point money or quantities.

## Example window record (API view for provider)
```json
{"window_id":"01J9Z4Q1M7X3B5N8C0D2E4F6G8","service_offering_id":"01J9Z3KA0Z5N8R2P4T6V8W0X1Y","region_code":"DE-BE","timezone":"Europe/Berlin","start_at":"2026-11-20T09:00:00Z","end_at":"2026-11-20T12:00:00Z","capacity_total":2,"capacity_held":1,"capacity_confirmed":0,"status":"PUBLISHED","revision":4}
```

## Requirements
- [ ] PS-028-01.R01: Business outcome, actors and exclusions are stated in Purpose and scope. Actors: provider, booking_service, moderator, operator, viewer, system scheduler.
- [ ] PS-028-01.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial cases are covered in validation_rules.md, workflow_state_machine.md and failure_recovery_idempotency.md.
- [ ] PS-028-01.R03: Accessibility, localization, performance and operational budgets are in observability_performance.md. Times shown to users are localized using the stored timezone.
- [ ] PS-028-01.R04: Every field in this file has a type, nullability, constraint and default. Each constraint is enforced at the database layer and at the command layer.
- [ ] PS-028-01.R05: Each record carries `schema_version`. Schema changes follow CTR-SCH-001 (owner F15).

## Dependencies and predecessor specifications
Parent [module SPEC](SPEC.md), [project trust model](../../../PROJECT_SPEC.md), [registry](../../../planning/SPEC_REGISTRY.csv). This is the first spec in the chain for this module. Canonical contracts used by reference: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Open decisions
- A-availability-01: IDs are ULID until CTR-ID-001 (F15, OPEN) selects a format. Changing the format requires a migration of the ID column type only.
- A-availability-02: 15-minute granularity and UTC storage. Local display uses `timezone`.
- A-availability-03: `service_offering_id` is owned by mod_skills (PS-029). This module stores the reference and never duplicates offering fields.
- A-availability-06: `region_code` is limited to ISO 3166-2 subdivisions. Precise location is never stored (D05, OPEN).
- Test IDs: TEST-PS-028-01-T01 to T04 (see contract_and_acceptance_tests.md for the family rules).
