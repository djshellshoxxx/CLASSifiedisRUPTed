# PS-075-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R08), CTR-PRV-001 (R07). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-05.R01 | `quote.issue` requires a `sys_` principal scoped to `quote.create` for registered sources. | MVP |
| PS-075-05.R02 | Source operators (external) have no access to proposals, claims or party data. | MVP |
| PS-075-05.R03 | Source registration and disabling require two distinct `ope_` approvers. | MVP |
| PS-075-05.R04 | Parties may pin only quotes issued for their proposal's pair (`participant` scope). | MVP |

## Data / schema
Capabilities: `quote.create`, `quote.read` (public), `rate_source.administer`, `quote.pin` (participant).

## Commands / queries / events
| Command | Action | Actor |
|---|---|---|
| `quote.issue` | `quote.create` | sys_ |
| `quote.get` | `quote.read` | any |
| `rate_source.register` / `disable` | `rate_source.administer` | ope_ ×2 |
| consent hook | `quote.pin` | participant |

## States & transitions
Grant lifecycle per CTR-CAP-001.

## Validation & errors
Non-sys issuance: `SYS.FORBIDDEN`.

## Authorization
Default deny for writes.

## Failure, idempotency, concurrency, offline
Grant check per request.

## Privacy, retention, abuse
Source operator actions emit `aud_`.

## Observability & budgets
Alert on any issuance by non-sys principal attempt.

## Tests
- TEST-PS-075-05-01 (unit): matrix rows.
- TEST-PS-075-05-02 (negative): party attempts `quote.create` gets `SYS.FORBIDDEN`.
- TEST-PS-075-05-03 (negative): self-approval of source refused.
- TEST-PS-075-05-04 (negative): party pins quote for a different pair refused.

## Acceptance criteria
1. Matrix implemented.
2. Dual control enforced.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
