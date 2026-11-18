# PS-073-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R10), CTR-SCH-001, CTR-ERR-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-04.R01 | `currency.register` carries `idempotency_key` and returns `currency_id` and `version`. | MVP |
| PS-073-04.R02 | `currency.set_status` carries `expected_revision`. | MVP |
| PS-073-04.R03 | Events: `currency.registered`, `currency.status_changed`; `max_data_class` PUBLIC. | MVP |
| PS-073-04.R04 | Queries are cache-safe with `version` in responses. | MVP |

## Data / schema
Schema `currency` 1.0.0 (fields per PS-073-01).

## Commands / queries / events
| Command | Event | Expected revision |
|---|---|---|
| `currency.register` | `currency.registered` | null |
| `currency.set_status` | `currency.status_changed` | required |
| `currency.get` (query) | none | n/a |
| `currency.list` (query) | none | n/a |

## States & transitions
Per PS-073-03.

## Validation & errors
Per PS-073-02.

## Authorization
Per PS-073-05.

## Failure, idempotency, concurrency, offline
Clients cache entries by `(currency_id, version)`; registry reads are safe offline with cached entries.

## Privacy, retention, abuse
Public events.

## Observability & budgets
`currency.get` p95 ≤ 50 ms (ASSUMPTION; cached).

## Tests
- TEST-PS-073-04-01 (contract): command and event schemas validate.
- TEST-PS-073-04-02 (unit): replay of register with same key returns original.
- TEST-PS-073-04-03 (contract): cached entry with old version still valid for old claims.

## Acceptance criteria
1. Command table implemented.
2. Event schemas validate.
3. Idempotency tests pass.

## Assumptions & open decisions
- ASSUMPTION: 1.0.0 schema.
- D03 (PROVISIONAL, unapproved).
