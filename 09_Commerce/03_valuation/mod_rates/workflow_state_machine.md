# PS-075-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R04, R16 window interplay), CTR-EVT-001 (R02). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-03.R01 | Quote states: `issued`, `expired`. Expiry is time-based and irreversible. | MVP |
| PS-075-03.R02 | Source states: `active`, `stale`, `disabled`. `stale` is derived from observation age; `disabled` is operator action only. | MVP |
| PS-075-03.R03 | Expiry of a quote never alters a proposal or claim already pinned to it. | MVP |
| PS-075-03.R04 | Consent pins `quote_id` and `quote_hash` atomically with the consent event. | MVP |

## Data / schema
Transition row: `entity_id`, `from`, `to`, `at`, `revision`.

## Commands / queries / events
`quote.issued`, `quote.expired`, `rate_source.registered`, `rate_source.disabled`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `quote.issue` | PS-075-02 passes | `issued` | `quote.issued` |
| `issued` | timer `valid_until` | — | `expired` | `quote.expired` |
| source `active` | observation older than 5 min | — | `stale` | alert |
| source `stale` | fresh observation | — | `active` | — |
| source any | `rate_source.disable` | dual control | `disabled` | `rate_source.disabled` |

Other pairs return `SYS.CONFLICT` or `RATE.*` per PS-075-02.

## Validation & errors
Per PS-075-02.

## Authorization
Per PS-075-05.

## Failure, idempotency, concurrency, offline
Expiry timer is idempotent; expired quote refuses new use.

## Privacy, retention, abuse
Public events.

## Observability & budgets
Histogram: quote age at consent (aggregate).

## Tests
- TEST-PS-075-03-01 (unit): table rows; expired → issued refused.
- TEST-PS-075-03-02 (integration): consent at valid time pins quote; expiry afterward does not affect proposal.
- TEST-PS-075-03-03 (integration): source stale after 5 min excluded from next quote.

## Acceptance criteria
1. Pinned proposals unaffected by expiry (CTR-COM test 09).
2. Source staleness handled.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
