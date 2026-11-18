# PS-025-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R04, R05, R15), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-03.R01 | Binding states: unbound, bound, expired, refreshed. | MVP |
| PS-025-03.R02 | `bound` is set only at consent, with a valid quote; the binding is then fixed for that cycle version. | MVP |
| PS-025-03.R03 | Expiry before lock moves to `expired`; the cycle must refresh terms and re-consent. | MVP |
| PS-025-03.R04 | Settlement states are not modelled here; no state name in this module implies payment. | MVP |

## Data / schema
State in `status`.

## Commands / queries / events
PS-025-04.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| unbound | cycle.pin_quote_ref at consent | quote valid; hash matches | bound | emit cycle.value_terms_bound |
| bound | valid_until passes before lock | — | expired | cycle blocked from lock; emit state change |
| expired | cycle.pin_quote_ref (new quote) | new quote valid | refreshed | new cycle version; consents cleared |
| refreshed | consent to new version | version matches | bound | emit cycle.value_terms_bound |
| any | cycle lost or cancelled | — | unbound | binding retained as history |

## Validation & errors
PS-025-02.

## Authorization
PS-025-05.

## Failure, idempotency, concurrency, offline
Refresh is a new version (PS-025-06); no silent re-pin.

## Privacy, retention, abuse
Binding history follows PS-025-07.

## Observability & budgets
Count of expired-before-lock per day.

## Tests
- TEST-PS-025-03-01 (unit): every table row.
- TEST-PS-025-03-02 (integration): quote expiry before lock blocks lock.
- TEST-PS-025-03-03 (property): no path to bound without a valid quote.

## Acceptance criteria
1. Lock never proceeds on expired binding in 100% of runs.
2. Every refresh creates a new cycle version.
3. No state name contains "paid" or "settled".

## Assumptions & open decisions
- PROVISIONAL (D03 default, unapproved).
