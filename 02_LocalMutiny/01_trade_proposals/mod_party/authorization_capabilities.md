# PS-014-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-05.R01 | Default deny. Capabilities declared here: `party.invite`, `party.accept`, `party.decline`, `party.withdraw`, `party.read`, `party.remove`. | MVP |
| PS-014-05.R02 | Only the slot's `acc_` may accept, decline or withdraw. The cycle proposer may invite. | MVP |
| PS-014-05.R03 | `party.remove` requires `mod_` principal with `case:cas_` scope and an approved case. | MVP |
| PS-014-05.R04 | `acc_id` is never readable by any principal other than the system (CTR-CAP-001 R02). | MVP |

## Data / schema
Field visibility: `par_id`, `cyc_id`, `slot_index`, `status`, `prf_ref`, `region_cell_id` → `participant`. `acc_id` → `never` (system only). `resolved_at` → `participant`.

## Commands / queries / events
| Action | Actor | Scope | Rule |
|---|---|---|---|
| party.invite | proposer `acc_` | participant | cycle in draft |
| party.accept / decline / withdraw | slot `acc_` | self | per state table |
| party.read | cycle participant | participant | cycle not closed for removed parties |
| party.remove | mod_ | case | case open, dual control for suspension-linked removal |

## States & transitions
Authorization re-checked at each transition. A removed party loses `party.read` at next decision.

## Validation & errors
Unauthorized and nonexistent slots return `SYS.NOT_FOUND` (CTR-ERR-001 R08).

## Authorization
Decision cache TTL 0 for writes (CTR-CAP-001 R09). `party.remove` writes an `aud_` record with case ID.

## Failure, idempotency, concurrency, offline
Grants effective at next decision. Offline clients cannot accept without a fresh decision.

## Privacy, retention, abuse
Moderator access to `acc_id` requires case scope and dual control (CTR-CAP-001 R07); reads write `aud_` with purpose, no content.

## Observability & budgets
Denial counts per action; alert at 50 denials per `acc_` per hour (probing signal, ASSUMPTION).

## Tests
- TEST-PS-014-05-01 (unit): matrix actor × action × scope; default deny.
- TEST-PS-014-05-02 (security): `acc_id` absent for every non-system principal in fixtures.
- TEST-PS-014-05-03 (integration): removal takes effect at next read.

## Acceptance criteria
1. Matrix covers 100% of declared actions.
2. Zero `acc_id` leaks in response fixtures.

## Assumptions & open decisions
- ASSUMPTION: suspension-linked removal needs dual control (F12 to confirm).
- D10 PROVISIONAL (Dxx default, unapproved): key rotation keeps the slot bound to the same `acc_`.
