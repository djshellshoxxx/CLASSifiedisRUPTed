# PS-041-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-COM-001 (claim commands), CTR-CAP-001.

**Decision labels:** D06 PROVISIONAL. D08 PROVISIONAL (offline queue).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-04.R01 | Every command requires `idempotency_key` and, when state-changing, `expected_revision`. | MVP |
| PS-041-04.R02 | Each command emits exactly one `damage.*` event (`aggregate_type = damage`). | MVP |
| PS-041-04.R03 | Excess claims call CTR-COM-001 `clm.submit`; this module does not write claim state. | MVP |
| PS-041-04.R04 | `damage.report` p95 ≤ 300 ms excluding photo upload (ASSUMPTION). | MVP |

## Data / schema
`damage.report` payload = `rental_id`, `against`, `baseline_handoff_id?`, `line_items[]`, `total_minor`, `currency`. Event payloads carry IDs, status, totals and state version. Descriptions are omitted from events.

## Commands / queries / events
| Command | Caller | Event | Error codes |
|---|---|---|---|
| `damage.report` | owner | damage.reported | WINDOW_CLOSED, LINE_LIMIT, EVIDENCE_REQUIRED, AMOUNT_OVER_CAP, TOTAL_MISMATCH |
| `damage.acknowledge` | renter | damage.acknowledged | INVALID_TRANSITION, SYS.CONFLICT |
| `damage.contest` | renter | damage.contested | INVALID_TRANSITION |
| `damage.withdraw` | owner | damage.withdrawn | INVALID_TRANSITION |
| `damage.resolve` | system or `mod` (case) | damage.resolved | ALREADY_RESOLVED |

Queries: `damage.get`, `damage.list_by_rental` (participant). Pagination 50 per page.

## States & transitions
Event-to-state mapping in PS-041-03.

## Validation & errors
PS-041-02 gates run first.

## Authorization
Caller column is the minimum; capabilities in PS-041-05.

## Failure, idempotency, concurrency, offline
Per-line decisions are one command carrying all lines (no partial acknowledgement across commands). Same key, different digest → `EVT.IDEMPOTENCY_KEY_REUSED`.

## Privacy, retention, abuse
Events never carry photo bytes or descriptions. `max_data_class = FINANCIAL_EVIDENCE`.

## Observability & budgets
`damage_command_latency_ms` per command.

## Tests
- TEST-PS-041-04-01 (contract): each command validates; each event carries envelope fields.
- TEST-PS-041-04-02 (idempotency): duplicate report → one damage record.
- TEST-PS-041-04-03 (per-line): acknowledge with one line rejected → whole command rejected, no partial state.
- TEST-PS-041-04-04 (integration): resolve with excess creates `clm.submit` and no direct claim write.

## Acceptance criteria
1. Each command maps to one event and one transition (PS-041-03).
2. No event payload contains a description or photo bytes.
3. Idempotency and revision rules hold in tests -02 and -03.

## Assumptions & open decisions
- ASSUMPTION: 300 ms p95 budget.
- PENDING CTR-ID-001 `dmg` prefix and CTR-SCH-001 registration.
