# PS-073-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R06, R07, R08), CTR-PRV-001 (R07). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-05.R01 | Registry reads are public. | MVP |
| PS-073-05.R02 | Registration and status change require `currency.administer` by `ope_` with dual control (two distinct approvers). | MVP |
| PS-073-05.R03 | Adapters (`sys_`) may propose asset entries but cannot enable them. | MVP |
| PS-073-05.R04 | Consumer modules read only; no write capability is granted to them. | MVP |

## Data / schema
Capabilities: `currency.read` (public), `currency.administer`.

## Commands / queries / events
| Command | Action | Actor |
|---|---|---|
| `currency.register` | `currency.administer` | `ope_` ×2 |
| `currency.set_status` | `currency.administer` | `ope_` ×2 |
| `currency.propose_asset` | `currency.create` | `sys_` (adapter) |
| queries | `currency.read` | any |

## States & transitions
Grants per CTR-CAP-001 lifecycle.

## Validation & errors
Unauthorized write: `SYS.FORBIDDEN`.

## Authorization
Default deny for all writes.

## Failure, idempotency, concurrency, offline
Grant checked per request.

## Privacy, retention, abuse
Operator actions emit `aud_`.

## Observability & budgets
Alert on any write without dual approval.

## Tests
- TEST-PS-073-05-01 (unit): matrix rows.
- TEST-PS-073-05-02 (negative): adapter cannot enable an asset.
- TEST-PS-073-05-03 (negative): self-approval refused (`CAP.SELF_APPROVAL_FORBIDDEN`).

## Acceptance criteria
1. Matrix implemented.
2. Dual control enforced.
3. Consumers have no write rights.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
