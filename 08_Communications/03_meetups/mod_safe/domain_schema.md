# PS-066-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`acc`, `thr`, `trx`), CTR-PRV-001 (classes, RET-PRIV), CTR-EVT-001, CTR-SCH-001. **Pending:** `mtp_` and `ven_` prefixes (CTR-ID-001); `ven_` entry (CTR-PRV-001). **Decisions:** D05, D07 (PROVISIONAL defaults, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-01.R01 | A plan `mtp_` binds exactly two distinct `acc_` parties and at most one `thr_`. No third party is a plan party. | MVP |
| PS-066-01.R02 | Window: `window_end - window_start` ≤ PT12H; `window_start` ≤ creation + P30D. Storage granularity 1 minute; shared views round to 5 minutes. | MVP |
| PS-066-01.R03 | Place is `venue_ref` = `ven_` from the curated public list, or the literal `custom_public` with `venue_warning = true`. No free-text address, landmark, coordinate or device-location field exists. | MVP |
| PS-066-01.R04 | Trusted contact: optional, max one per party. Stored only as salted SHA-256 of the normalized handle. | MVP |
| PS-066-01.R05 | Check-in code: 6 decimal digits from a CSPRNG, stored only as salted SHA-256, valid only within window ±30 min. | MVP |
| PS-066-01.R06 | Plan changes are CTR-EVT-001 events with `revision`; the record is rebuilt from events. | MVP |

## Data / schema
| Field | Type / constraint | Class |
|---|---|---|
| `meetup_plan_id` | `mtp_` + ULID body (class ulid, PENDING prefix) | PSEUDONYMOUS |
| `thread_id` | `thr_` or null | PSEUDONYMOUS |
| `trade_id` | `trx_` or null | PSEUDONYMOUS |
| `party_ids` | array, length 2, distinct `acc_` | PSEUDONYMOUS |
| `venue_ref` | `ven_` or `custom_public` | PRIVATE_PERSONAL |
| `venue_warning` | boolean, true iff `custom_public` | PUBLIC |
| `window_start`, `window_end` | RFC 3339 UTC, minute precision | PRIVATE_PERSONAL |
| `status` | enum per PS-066-03 | PRIVATE_PERSONAL |
| `checkin_code_hash[party]` | hex, 64 chars, salted | SECRET |
| `trusted_contact_hash[party]` | hex 64 chars or null | PRIVATE_PERSONAL |
| `revision` | integer ≥ 1 | — |

Each field has exactly one class (CTR-PRV-001 R01). `max_data_class` of any event carrying the plan is PRIVATE_PERSONAL.

## Commands / queries / events
Specified in PS-066-04. Status values are owned by PS-066-03.

## States & transitions
See PS-066-03.

## Validation & errors
See PS-066-02.

## Authorization
Field-level visibility is defined in PS-066-05.

## Failure, idempotency, concurrency, offline
Creation uses `expected_revision: null`. Duplicate creation with the same idempotency key returns the original plan (CTR-EVT-001 R03).

## Privacy, retention, abuse
Venue, window and status are PRIVATE_PERSONAL and never federated (CTR-FED-001 R03). Check-in and trusted-contact material is SECRET-derived hashes only.

## Observability & budgets
Logs carry `meetup_plan_id`, `revision` and codes only.

## Tests
- TEST-PS-066-01-01 (unit): window of PT12H accepted, PT12H1M rejected.
- TEST-PS-066-01-02 (property): no schema version contains a field named like address, lat, lon, coordinate, landmark or location.
- TEST-PS-066-01-03 (unit): stored check-in hash does not equal SHA-256 of the plaintext code without salt.

## Acceptance criteria
1. Every field in the table has one class and a registry entry (PRV.UNCLASSIFIED_FIELD absent).
2. A plan cannot be created with a third party or with coordinates.
3. Stored bytes contain no plaintext codes or contact handles.

## Assumptions & open decisions
- ASSUMPTION: 12-hour window cap and 30-day lead time.
- D05 (PROVISIONAL default, unapproved): coarse venue reference, no precise location.
- D07 (PROVISIONAL default, unapproved): retention per PS-066-07.
