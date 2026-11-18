# PS-073-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R02, R06), CTR-EVT-001 (R02). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-03.R01 | States: `enabled`, `disabled`, `deprecated`. | MVP |
| PS-073-03.R02 | `enabled` → `disabled` allowed; `disabled` → `enabled` allowed; any → `deprecated` terminal (no new use). | MVP |
| PS-073-03.R03 | `deprecated` entries remain resolvable for existing claims forever. | MVP |
| PS-073-03.R04 | Status changes never alter claim states. | MVP |

## Data / schema
Transition row: `currency_id`, `version`, `from`, `to`, `actor_ref`, `revision`.

## Commands / queries / events
`currency.registered`, `currency.status_changed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `currency.register` | PS-073-02 passes | `enabled` | `currency.registered` |
| `enabled` | `currency.set_status` (disable) | dual control | `disabled` | warning if open claims |
| `disabled` | `currency.set_status` (enable) | dual control | `enabled` | event |
| `enabled`, `disabled` | `currency.set_status` (deprecate) | dual control; 30-day notice | `deprecated` | notice to consumers |

Any other pair returns `SYS.CONFLICT`.

## Validation & errors
`CURR.OPEN_CLAIMS_EXIST` warning (not an error) on disable.

## Authorization
Operator with dual control.

## Failure, idempotency, concurrency, offline
Concurrent status changes: revision check.

## Privacy, retention, abuse
Public log.

## Observability & budgets
Counter of status changes by target state.

## Tests
- TEST-PS-073-03-01 (unit): table rows pass; deprecated → enabled refused.
- TEST-PS-073-03-02 (integration): disabling leaves a claim in `CLAIMED` valid.
- TEST-PS-073-03-03 (integration): deprecated entry still resolves for an old claim.
- TEST-PS-073-03-04 (negative): status change without dual control refused.

## Acceptance criteria
1. Table implemented.
2. No claim state changes from registry changes.
3. Deprecated entries resolvable.

## Assumptions & open decisions
- ASSUMPTION: 30-day deprecation notice.
- D03 (PROVISIONAL default, unapproved).
