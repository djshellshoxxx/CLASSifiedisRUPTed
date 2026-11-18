# PS-028-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-04.R01 | Every state-changing command carries `idempotency_key` and `expected_revision` (CTR-EVT-001 R02, R03). | MVP |
| PS-028-04.R02 | Slot search returns ≤ 200 slots per request; range ≤ 31 days. | MVP |
| PS-028-04.R03 | Events use CTR-EVT-001 envelope with `aggregate_type` = `service_availability`, `max_data_class` = PRIVATE_PERSONAL. | MVP |
| PS-028-04.R04 | Every payload is registered in CTR-SCH-001. | MVP |

## Data / schema
| Command | Signature | Idempotency key |
|---|---|---|
| `svcavail.create_window` | (`srv_id`, window fields) → `avw_` | (actor, command, key) |
| `svcavail.update_window` | (`avw_`, expected_revision, changed fields) | (actor, command, key) |
| `svcavail.hold` | (`avw_`, `svq_` holder, expected_revision) | (`svq_`, `avw_`) |
| `svcavail.block` / `unblock` / `retire` | (`avw_`, expected_revision) | (actor, command, key) |
| `svcavail.import_ics` | (`srv_id`, file digest, bytes ≤ 256 KB) | (actor, file digest) |
| `svcavail.search_slots` | (`srv_id`, range ≤ 31 days, granularity) → slots (query) | n/a |

## Commands / queries / events
| Event (`schema_id`) | Emitted by |
|---|---|
| `svcavail.window.created` | create_window, import_ics |
| `svcavail.window.updated` | update_window |
| `svcavail.window.held` | hold |
| `svcavail.hold.expired` | timer |
| `svcavail.window.blocked` / `unblocked` / `retired` | provider commands |
| `svcavail.booking.linked` / `booking.released` | quote events |

Errors: PS-028-02 codes, plus `SYS.CONFLICT` for revision mismatch and `SYS.NOT_FOUND` for hidden windows.

## States & transitions
Command outcomes map to PS-028-03.

## Validation & errors
Schema validation (JSON Schema 2020-12) before PS-028-02 rules; unknown fields rejected (`SYS.REQUEST_MALFORMED`).

## Authorization
Provider-only writes (PS-028-05). Search: authenticated users see slot start times at 1-hour granularity; anonymous users see a count of open slots per day only.

## Failure, idempotency, concurrency, offline
Duplicate command with same key and digest returns original result; same key different digest → `SYS.CONFLICT`. Hold command keyed by (`svq_`, `avw_`) so retries cannot create two holds. Events at-least-once; consumers dedupe on `event_id`.

## Privacy, retention, abuse
`svcavail.window.created` payload omits `timezone` and `service_region` for non-provider subscribers. Search responses omit provider `acc_` IDs.

## Observability & budgets
Search p95 ≤ 150 ms for 31-day range (ASSUMPTION). Command p95 ≤ 200 ms.

## Tests
- TEST-PS-028-04-01 (contract): all commands and events validate against CTR-SCH-001.
- TEST-PS-028-04-02 (integration): duplicate hold command returns one HELD window.
- TEST-PS-028-04-03 (contract): search response contains no provider `acc_`.
- TEST-PS-028-04-04 (integration): search range of 32 days rejected with `SYS.REQUEST_MALFORMED`.

## Acceptance criteria
1. All commands and events registered in CTR-SCH-001.
2. Search responses pass a scan for `acc_` and coordinate patterns.
3. Idempotency replay test passes.

## Assumptions & open decisions
- ASSUMPTION: 1-hour public granularity; 24-hour idempotency retention.
- Related: F03.S02.M01 `mod_quotes` consumes `svcavail.hold` (full ID references only). See [DECISIONS.md](../../../DECISIONS.md) D08.
