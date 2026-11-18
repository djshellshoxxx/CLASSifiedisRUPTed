# PS-075-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (quote), CTR-EVT-001 (R02, R03), CTR-SCH-001, CTR-ERR-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-04.R01 | `quote.issue` is sys-only and carries `idempotency_key` and the source observation digests. | MVP |
| PS-075-04.R02 | `quote.get` returns the full quote object and `quote_hash`. | MVP |
| PS-075-04.R03 | `rate_source.register` and `rate_source.disable` require `expected_revision` and dual control. | MVP |
| PS-075-04.R04 | Events are PUBLIC; `quote.refused` is internal audit only. | MVP |

## Data / schema
Schemas `quote` 1.0.0 (CTR-COM-001 object) and `rate_source` 1.0.0.

## Commands / queries / events
| Command | Event | Expected revision | Actor |
|---|---|---|---|
| `quote.issue` | `quote.issued` | null | sys_ |
| `quote.issue` (refused) | `quote.refused` (internal) | null | sys_ |
| timer | `quote.expired` | n/a | sys_ |
| `rate_source.register` | `rate_source.registered` | null | ope_ ×2 |
| `rate_source.disable` | `rate_source.disabled` | required | ope_ ×2 |
| `quote.get` (query) | none | n/a | public |

## States & transitions
Per PS-075-03.

## Validation & errors
Per PS-075-02; `SYS.CONFLICT`, `SYS.FORBIDDEN`.

## Authorization
Per PS-075-05.

## Failure, idempotency, concurrency, offline
Quotes are never queued offline; clients show "no quote available" when offline.

## Privacy, retention, abuse
Events carry quote IDs and pairs only.

## Observability & budgets
`quote.issue` p95 ≤ 500 ms including source fetch (ASSUMPTION).

## Tests
- TEST-PS-075-04-01 (contract): quote and event schemas validate.
- TEST-PS-075-04-02 (negative): non-sys actor calling `quote.issue` gets `SYS.FORBIDDEN`.
- TEST-PS-075-04-03 (unit): replay of issue with same key returns original quote.
- TEST-PS-075-04-04 (contract): `quote.get` output equals CTR-COM-001 object.

## Acceptance criteria
1. Command surface matches table.
2. Schemas validate.
3. Idempotency tests pass.

## Assumptions & open decisions
- D03 (PROVISIONAL, unapproved).
