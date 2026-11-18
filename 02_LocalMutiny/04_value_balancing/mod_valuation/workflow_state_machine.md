# PS-027-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (quote expiry), CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-03.R01 | Snapshot states: `COMPUTED` → `CURRENT` (bound to latest revision and unexpired quotes) → `STALE` → `RECOMPUTED` (new snapshot for newer revision or quote set). | MVP |
| PS-027-03.R02 | A `CURRENT` snapshot becomes `STALE` within 5 s of a `cyc` revision change or a quote `valid_until` passing (event or timer). | MVP |
| PS-027-03.R03 | `STALE` snapshots are immutable. They remain readable as history. | MVP |
| PS-027-03.R04 | A `COMPUTED` snapshot that fails validation is never persisted. | MVP |

## Data / schema
`snapshot_state` stored on the snapshot row. Immutable fields: items, per_party, hash.

## Commands / queries / events
Transitions are triggered by `valuation.compute` (COMPUTED), `cyc.revision_changed` and `quote.expired` events from F09, and a timer for quote expiry.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | valuation.compute | Validation passes (PS-027-02) | COMPUTED | Persist snapshot |
| COMPUTED | (publish) | Revision matches current | CURRENT | Notify mod_mixed, mod_counteroffer |
| CURRENT | cyc.revision_changed | Revision > snapshot revision | STALE | Event `valuation.snapshot_stale` |
| CURRENT | quote.expired (timer) | `valid_until` ≤ now | STALE | Event; re-quote prompt |
| STALE | valuation.compute | New revision and fresh quotes | RECOMPUTED (new row) | Old row kept |
| COMPUTED | validation failure | Any PS-027-02 rule | (not persisted) | Error returned |

Forbidden transitions return `VALUE.SNAPSHOT_STALE` (409). No terminal state other than history.

## Validation & errors
`VALUE.SNAPSHOT_STALE` is returned when a consent or leg action references a stale snapshot hash.

## Authorization
Compute is `sys` (`cyc.execute`, scope `participant`). Read follows PS-027-05.

## Failure, idempotency, concurrency, offline
Compute is idempotent per (`cyc_`, revision, quote-set hash). Two concurrent computes for the same key → one row (unique constraint). Quote service outage: snapshot stays `CURRENT` until quote expiry; then `STALE`; no partial snapshot.

## Privacy, retention, abuse
STALE and RECOMPUTED rows are retained with the cycle (PS-027-07). Expiry timers emit no values in notifications.

## Observability & budgets
Metrics: `valuation_snapshots_total{state}`, `valuation_stale_lag_seconds` p95 ≤ 5 s.

## Tests
- TEST-PS-027-03-01 (unit): every row of the table; every other pair rejected.
- TEST-PS-027-03-02 (integration): quote expiry flips CURRENT to STALE within 5 s.
- TEST-PS-027-03-03 (concurrency): duplicate compute yields one persisted row.
- TEST-PS-027-03-04 (property): STALE rows are never modified after transition.

## Acceptance criteria
1. Snapshot state table complete; lint verifies all states are reachable.
2. Stale-lag budget measured in integration tests.
3. No state change occurs without an emitted event.

## Assumptions & open decisions
- ASSUMPTION: 5 s stale-propagation budget.
- PROVISIONAL: quote expiry per D03 default (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
