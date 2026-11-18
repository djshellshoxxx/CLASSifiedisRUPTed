# PS-064-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`thr`, `prf`; meetup record prefix PENDING), CTR-PRV-001 (LOCATION_PRECISE, LOCATION_COARSE; RET-LOC), CTR-SCH-001, CTR-CAP-001 (R04, R06, R07).

**Canonical owner ID for the meetup record class.** No CTR-ID-001 prefix exists. PENDING CTR-ID-001 entry (candidate `mtg`, owner F08). Meetup handoff records (mod_handoff) reference the meetup by full ID.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-01.R01 | One meetup record per proposal, linked to exactly one `thread_id` (mod_private) and to one exchange reference (`trx_`, `par_` or `rnt_`) by full ID. | MVP |
| PS-064-01.R02 | Time window: `window_start`, `window_end`, duration ≤ 6 h, start in the future, ≤ 30 days ahead. | MVP |
| PS-064-01.R03 | Place is either a `venue_ref` from the public venue registry (LOCATION_COARSE public, precise point LOCATION_PRECISE) or free text ≤ 80 code points without contact or address patterns. | MVP |
| PS-064-01.R04 | Precise coordinates are never stored on the meetup record; they live in a per-meetup disclosure (R05). | MVP |
| PS-064-01.R05 | Per-meetup disclosure row: `meetup_id`, `grantee_prf_id`, `point` (LOCATION_PRECISE, encrypted), `expires_at`. | MVP |
| PS-064-01.R06 | Schema `meetup.record` 1.0.0 registered in CTR-SCH-001. | MVP |
| PS-064-01.R07 | Meetup at home addresses, or any private residence flag. | Future (not supported; venue registry only in MVP) |

## Data / schema
| Field | Type | Constraint | Class |
|---|---|---|---|
| `meetup_id` | string(30) | PENDING prefix (`mtg`), opaque | PRIVATE_PERSONAL |
| `thread_id` | string(30) | prefix `thr` | PRIVATE_PERSONAL |
| `exchange_ref` | string(30) | prefix `trx`, `par` or `rnt` | PSEUDONYMOUS |
| `proposer_prf_id`, `counterparty_prf_id` | string(30) | prefix `prf` | PSEUDONYMOUS |
| `window_start`, `window_end` | timestamp | RFC 3339 UTC, minute precision | PRIVATE_PERSONAL |
| `venue_ref` | string or null | registry ID | PSEUDONYMOUS |
| `place_text` | string(0–80) or null | NFC; rules in PS-064-02 | PRIVATE_PERSONAL |
| `state` | enum closed | see PS-064-03 | internal |
| `reschedule_count` | int 0–3 | | internal |
| `revision` | int | ≥ 1 | internal |

Per-meetup disclosure table: `meetup_id`, `grantee_prf_id`, `point_ciphertext`, `expires_at`, `revoked_at` — LOCATION_PRECISE.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See PS-064-05 for participants and case access.

## Failure, idempotency, concurrency, offline
See PS-064-06.

## Privacy, retention, abuse
LOCATION_PRECISE and derived data purged at RET-LOC (PS-064-07).

## Observability & budgets
Aggregate counts by state only (PS-064-08).

## Tests
- TEST-PS-064-01-01 (unit): window rules (future, ≤ 30 days, ≤ 6 h).
- TEST-PS-064-01-02 (contract): no precise coordinate field on meetup record (lint).
- TEST-PS-064-01-03 (privacy): disclosure row ciphertext only; plaintext never in logs.
- TEST-PS-064-01-04 (contract): schema digest registered.

## Acceptance criteria
1. No coordinates in meetup table (schema lint).
2. Disclosure rows encrypted and expiring.
3. Window invariants enforced in database.
4. Prefix assigned or decision recorded as PENDING.

## Assumptions & open decisions
- PENDING CTR-ID-001: `mtg` prefix, owner F08.
- PROVISIONAL (D05 default, unapproved): coarse public venue regions; precision only by user-initiated per-meetup disclosure.
- PROVISIONAL (D07 default, unapproved): RET-LOC.
