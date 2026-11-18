# PS-015-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-05.R01 | Default deny. Declared capabilities: `cycle.propose`, `cycle.withdraw`, `cycle.read`, `cycle.lock`, `cycle.expire`, `cycle.close`. | MVP |
| PS-015-05.R02 | Only the proposer `acc_` (the owner of the first slot) may propose or withdraw before lock. | MVP |
| PS-015-05.R03 | `cycle.lock`, `cycle.expire`, `cycle.close` require `sys_` principal of this module. No human principal may call them. | MVP |
| PS-015-05.R04 | `cycle.read` requires `participant` scope on at least one slot. | MVP |

## Data / schema
Field visibility: `cyc_id`, `size`, `status`, `par_ids`, `expires_at`, `confirm_until` → participant. `feasibility_ref` → participant. `origin` and `candidate_ref` → participant. No public field.

## Commands / queries / events
| Action | Actor | Scope | Rule |
|---|---|---|---|
| cycle.propose | proposer `acc_` | self | slots distinct accounts |
| cycle.withdraw | proposer or slot `acc_` | participant | before lock |
| cycle.read | participant | participant | — |
| cycle.lock / expire / close | sys_ | global | system only |

## States & transitions
Authorization re-checked per transition (CTR-CAP-001 R05).

## Validation & errors
Non-participants receive `SYS.NOT_FOUND`.

## Authorization
Decision cache TTL 0 for writes (CTR-CAP-001 R09). System actions produce `aud_` records.

## Failure, idempotency, concurrency, offline
Revocation effective at next decision; system actions cannot be revoked by humans.

## Privacy, retention, abuse
Operator access to cycles needs case scope and dual control (CTR-CAP-001 R07).

## Observability & budgets
Denials per action; alert at 50 per `acc_` per hour.

## Tests
- TEST-PS-015-05-01 (unit): matrix actor × action × scope.
- TEST-PS-015-05-02 (security): human principal cannot call lock.
- TEST-PS-015-05-03 (security): non-participant sees `SYS.NOT_FOUND` for existing and nonexistent `cyc_`.

## Acceptance criteria
1. Matrix covers 100% of declared actions.
2. Zero human-callable system transitions.

## Assumptions & open decisions
- ASSUMPTION: "proposer" is the `acc_` of the first slot in `par_ids`.
- D10 PROVISIONAL (Dxx default, unapproved): key rotation does not alter cycle authorization.
