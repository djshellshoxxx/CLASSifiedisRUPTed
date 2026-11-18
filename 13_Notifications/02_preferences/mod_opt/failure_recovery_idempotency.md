# PS-107-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-06.R01 | Cell writes are atomic per cell and per matrix revision. | MVP |
| PS-107-06.R02 | Confirmation emails are sent at most 3 times per cell per 72 h (ASSUMPTION). | MVP |
| PS-107-06.R03 | Email send failure during confirmation leaves cell `pending_confirm` with retry; no cell is set `on` without confirmation. | MVP |
| PS-107-06.R04 | Withdrawal is never rolled back by a later stale write (revision check). | MVP |

## Data / schema
Idempotency key for cell writes = client key; for unsubscribe = token hash.

## Commands / queries / events
- `opt.set_cell` replay returns original revision.
- Withdrawal events emitted after commit.

## States & transitions
See workflow_state_machine.

## Validation & errors
`SYS.CONFLICT` on stale revision: client re-reads and re-applies explicit user choice.

## Authorization
Token use checked at each call.

## Failure, idempotency, concurrency, offline
- Concurrency: stale enable cannot override a newer withdrawal (R04).
- Offline: a user's enable or withdraw is queued per D08 PROVISIONAL pending queue; withdraw queued offline is sent first on reconnect.
- Email provider outage: confirmation notice retried; if all retries fail, cell stays `pending_confirm` until expiry.

## Privacy, retention, abuse
Pending queue on device is cleared after acknowledgement.

## Observability & budgets
Counter `opt_confirmation_send_failures_total`.

## Tests
- TEST-PS-107-06-01 (integration): stale enable after withdrawal leaves cell off.
- TEST-PS-107-06-02 (offline): withdraw offline, reconnect, withdraw applied and event emitted once.
- TEST-PS-107-06-03 (integration): email outage yields retry and no `on` state.
- TEST-PS-107-06-04 (property): cell never `on` without a matching granted event.

## Acceptance criteria
1. Stale-write rule verified.
2. No `on` without confirmation in fault injection.
3. Offline withdrawal sent first.

## Assumptions & open decisions
- ASSUMPTION: 3 sends per 72 h.
- D08 PROVISIONAL (D08 default, unapproved).
