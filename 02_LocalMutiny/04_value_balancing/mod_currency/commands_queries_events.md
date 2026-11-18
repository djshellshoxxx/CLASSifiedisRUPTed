# PS-025-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-COM-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-04.R01 | `cycle.pin_quote_ref` takes `{cycle_id, cycle_version, quote_ref, quote_hash, idempotency_key}`. | MVP |
| PS-025-04.R02 | `cycle.value_terms_get` returns the bound terms to slot participants only. | MVP |
| PS-025-04.R03 | Event `cycle.value_terms_bound` payload is the binding record; `max_data_class` FINANCIAL_EVIDENCE. | MVP |
| PS-025-04.R04 | Pin is idempotent by (cycle_id, cycle_version, quote_ref). | MVP |

## Data / schema
Amounts as decimal strings; schema 1.0.0.

## Commands / queries / events
| Operation | Caller | Idempotency | Expected version | Errors |
|---|---|---|---|---|
| cycle.pin_quote_ref | sys_ cycle module | cycle + version + quote | cycle version | CYCCURR.QUOTE_STALE, HASH_MISMATCH, EXPONENT_MISMATCH, CURRENCY_UNSUPPORTED, COM.QUOTE_MISSING |
| cycle.value_terms_get | slot participant | n/a | n/a | SYS.NOT_FOUND |

## States & transitions
PS-025-03.

## Validation & errors
PS-025-02.

## Authorization
PS-025-05.

## Failure, idempotency, concurrency, offline
PS-025-06.

## Privacy, retention, abuse
Events carry no location and no personal data.

## Observability & budgets
Pin p95 ≤ 200 ms (ASSUMPTION).

## Tests
- TEST-PS-025-04-01 (contract): event validates against CTR-COM-001 field shapes.
- TEST-PS-025-04-02 (unit): repeated pin returns same binding.
- TEST-PS-025-04-03 (negative): non-participant read denied.

## Acceptance criteria
1. Each command has schema, idempotency and version rule.
2. Event amounts are strings and minor units only.
3. Read responses omit values for other slots that the caller may not see.

## Assumptions & open decisions
- ASSUMPTION: 200 ms p95 pin budget.
