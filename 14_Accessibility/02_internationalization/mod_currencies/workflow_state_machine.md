# PS-112-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-03. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); subject consumers are LocalBazaar listings and LocalMutiny proposals and cycles.

## Purpose and scope
Defines the lifecycle of the three stateful record types (`currency_definition`, `fx_quote`, `valuation_pin`) and the append-only `conversion_record`. The business outcome is that a value is valued against one pinned quote for one bounded time window, and that every transition is explicit, attributable and reversible only where stated. This process does not model any real-world exchange of goods, money or assets; a conversion is a calculation, not a transfer.

## Requirements
- PS-112-03.R01: Each stateful entity has exactly the states, entry events, transitions, guards and terminal flags in the tables below. Actors: operator, FX importer, subject-owning service, scheduler.
- PS-112-03.R02: Invalid, expired, duplicate, concurrent, offline and adversarial transition attempts are rejected or made idempotent as listed under "Transition edge cases". Offline clients cannot transition any record; they show last known state with `as_of`.
- PS-112-03.R03: Transitions are recorded in the revision counter and emit exactly one domain event each (event names in commands_queries_events.md). Timing budgets: a transition completes within the command budget; quote-expiry and pin-expiry sweeps complete within 60 s of the due time (observability_performance.md).
- PS-112-03.R04: Pin lifetime is `valid_until = min(quote.expires_at, subject_deadline, pinned_at + 7 days)`, where `subject_deadline` is optional and supplied by the subject service (A-currencies-07).
- PS-112-03.R05: Withdrawing a quote invalidates every PINNED pin on it. Convert is also guarded by quote status, so correctness does not wait for the invalidation job.
- PS-112-03.R06: Expiry sweeps are scheduler-driven, idempotent and batched at 500 rows per transaction.

## currency_definition
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| ACTIVE | `currencies.catalog.registered.v1` | DEPRECATED, DISABLED | Operator capability `currencies.catalog.admin`; `If-Match` revision | No |
| DEPRECATED | `currencies.catalog.status_changed.v1` (to DEPRECATED) | ACTIVE, DISABLED | Operator; reason code `REGULATORY_CHANGE` or `OPERATOR_DECISION` | No |
| DISABLED | `currencies.catalog.status_changed.v1` (to DISABLED) | ACTIVE | Operator; second approver on re-enable | No (reversible under dual control) |

DISABLED blocks new quotes, pins, conversions and preferences for the code. Existing PINNED pins on a disabled code continue to convert until their quote expires, because quote and pin states are authoritative for evidence. Codes are never deleted.

## fx_quote
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| ACTIVE | `currencies.fx.published.v1` | EXPIRED, WITHDRAWN | Publish validation V01..V13 passed; both codes ACTIVE | No |
| EXPIRED | `currencies.fx.expired.v1` | none | Scheduler: `now >= expires_at` | Yes |
| WITHDRAWN | `currencies.fx.withdrawn.v1` | none | Operator; `status_reason_code` required; `If-Match` revision | Yes |

Quote payload fields (rate, pair, source, as_of, expires_at) never change after publication. A correction is a new quote; the old one is withdrawn with `OPERATOR_ERROR` if it was wrong.

## valuation_pin
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| PINNED | `currencies.valuation.pinned.v1` | RELEASED, INVALIDATED, EXPIRED | V15 passed; quote ACTIVE; subject open | No |
| RELEASED | `currencies.valuation.released.v1` | none | Caller is subject service; reason `SUBJECT_CLOSED` | Yes |
| INVALIDATED | `currencies.valuation.invalidated.v1` | none | Reason `SUBJECT_CANCELLED`, `SUBJECT_DROPOUT` (service) or `QUOTE_WITHDRAWN` (system) | Yes |
| EXPIRED | `currencies.valuation.expired.v1` | none | Scheduler: `now >= valid_until` | Yes |

Pins are never re-opened. Re-pinning after a release or invalidation creates a new pin row. Re-quoting a subject means the subject service releases the old pin and pins a newer quote.

## conversion_record
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| COMPUTED | `currencies.conversion.recorded.v1` | none (append-only) | Pin PINNED at `computed_at`; quote ACTIVE; V14, V17, V18 passed | Yes |

A correction is a new COMPUTED row with `supersedes_conversion_id` set. The earlier row is never edited.

## Side effects and ordering
1. Quote withdrawn: in the same transaction, set quote WITHDRAWN and emit `currencies.fx.withdrawn.v1`. Then a chunked job moves PINNED pins on that quote to INVALIDATED (`QUOTE_WITHDRAWN`) at 200 rows per transaction, emitting one event per pin.
2. Pin pinned: insert row and outbox event in one transaction. The subject service's acknowledgment is not required for pin validity.
3. Conversion computed: insert row and outbox event in one transaction; no state change on the pin.
4. Scheduler sweep (every 30 s): ACTIVE quotes with `expires_at <= now` become EXPIRED; PINNED pins with `valid_until <= now` become EXPIRED. Each batch is idempotent because the WHERE clause tests the source state.

## Transition edge cases
| Case | Outcome |
|---|---|
| Pin requested twice with same (subject, quote) while PINNED | Second call returns the first pin (V16); no transition |
| Release called on RELEASED pin | HTTP 200 with current state; no event |
| Withdraw called on WITHDRAWN quote | HTTP 200 with current state; no event |
| Convert races with release | Conditional update on pin status; loser receives CURRENCIES_PIN_INVALID |
| Quote withdrawn during pin request | Pin insert checks quote status inside the transaction; receives CURRENCIES_QUOTE_WITHDRAWN |
| Scheduler runs twice | Second run finds no rows in source state; no duplicate events |
| Pin valid_until passes during conversion | V17 fails with CURRENCIES_PIN_EXPIRED |

## Open decisions
- A-currencies-07: Pin lifetime is the minimum of quote expiry, optional subject deadline and 7 days. Related: D04 (partial execution), D08 (offline).
- Open for review: whether DISABLED codes should block conversions of already-PINNED pins immediately rather than at quote expiry. Current default is expiry. Related: D03.
