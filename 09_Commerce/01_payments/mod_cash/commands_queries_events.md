# PS-067-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (commands and events table), CTR-EVT-001 (R02, R03), CTR-SCH-001, CTR-ERR-001. **Decisions:** D06, D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-04.R01 | Claim commands are exactly those in CTR-COM-001; this module adds no claim command. | MVP |
| PS-067-04.R02 | Configuration command `cash_method.configure` carries `expected_revision` and `idempotency_key`. | MVP |
| PS-067-04.R03 | Configuration events: `cash_method.enabled`, `cash_method.disabled`, `cash_method.ceiling_changed`. | MVP |
| PS-067-04.R04 | Events carry `max_data_class` PUBLIC (configuration) or FINANCIAL_EVIDENCE (claims). | MVP |

## Data / schema
`cash_method` event payload: `cashcfg_id`, `currency_code`, `region_class`, `ceiling_minor` (changed events only), `config_revision`. Schema `cash_method` 1.0.0.

## Commands / queries / events
| Command | Event | Expected revision | Idempotency |
|---|---|---|---|
| `cash_method.configure` (enable) | `cash_method.enabled` | required | actor + key |
| `cash_method.configure` (disable) | `cash_method.disabled` | required | actor + key |
| `cash_method.configure` (ceiling) | `cash_method.ceiling_changed` | required | actor + key |
| `cashcfg.list` (query) | none | n/a | n/a |
| `clm.submit` etc. | per CTR-COM-001 | per CTR-COM-001 | per CTR-COM-001 |

## States & transitions
Configuration events map to PS-067-03 configuration transitions.

## Validation & errors
`CASH.METHOD_DISABLED`, `CASH.CEILING_EXCEEDED`, `SYS.CONFLICT`, `SYS.FORBIDDEN`.

## Authorization
Configure requires `cash_method` `administer` (operator with dual control).

## Failure, idempotency, concurrency, offline
Configuration is online only; the client shows an error if offline. Claims may be queued offline (D08) and re-validated at commit.

## Privacy, retention, abuse
Configuration events are PUBLIC and may be shown to users so they know whether cash is offered.

## Observability & budgets
Counter per command result code. Latency p95 ≤ 300 ms for configuration commands (ASSUMPTION).

## Tests
- TEST-PS-067-04-01 (contract): configuration command and event schemas validate.
- TEST-PS-067-04-02 (contract): claim command surface equals CTR-COM-001 surface (diff test).
- TEST-PS-067-04-03 (unit): replay with same key returns original event.
- TEST-PS-067-04-04 (negative): configure without dual approval returns `SYS.FORBIDDEN`.

## Acceptance criteria
1. No command outside CTR-COM-001 and PS-067-04 exists in this module.
2. Configuration events validate against `cash_method` 1.0.0.
3. Idempotency tests pass.

## Assumptions & open decisions
- ASSUMPTION: `cash_method` schema starts at 1.0.0.
- D06, D08 (PROVISIONAL, unapproved).
