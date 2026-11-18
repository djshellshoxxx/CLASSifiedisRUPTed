# PS-036-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-05.R01 | Only `sys` may evaluate bids and change `effective_end`. No user, seller or operator can set an extension directly. | MVP |
| PS-036-05.R02 | Policy publication requires `ope` with dual control (CTR-CAP-001 R07) and purpose `auction_integrity`. A principal cannot approve its own policy (`CAP.SELF_APPROVAL_FORBIDDEN`). | MVP |
| PS-036-05.R03 | Schedule is readable by all users (public). | MVP |
| PS-036-05.R04 | Advisory signals (reputation F07.S03.M01, signals F12.S03.M02) are readable by `sys` only and cannot alter the extension rule. | MVP |

## Data / schema
Action matrix:

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| sys | `auc.execute` | evaluate bid | ALLOW |
| user, any | `auc.execute` | evaluate bid | DENY → `SYS.FORBIDDEN` |
| user, seller | `auc.update` | schedule | DENY → `SYS.FORBIDDEN` |
| user, anyone | `auc.read` | schedule | ALLOW (public) |
| ope, one approval | `anti.publish_policy` | policy | DENY (dual control) |
| ope, two approvals (not self) | `anti.publish_policy` | policy | ALLOW |
| sys | `anti.publish_policy` | policy | DENY |

## Commands / queries / events
Each command maps to a row. Decision records hold outcome and reason only.

## States & transitions
Authorization re-checked per command; policy approvals are per publication.

## Validation & errors
`SYS.FORBIDDEN` for non-sys attempts on extension; `CAP.SELF_APPROVAL_FORBIDDEN` for self-approval.

## Authorization
Capability IDs: `auc.execute`, `auc.read`, `anti.publish_policy`.

## Failure, idempotency, concurrency, offline
Decision TTL zero for evaluation. Revocation of an operator takes effect at next decision.

## Privacy, retention, abuse
Advisory signal reads by `sys` create `dec_` records with reason code only.

## Observability & budgets
Metric `antisnip_authz_denials_total{action,code}`. Alert on any `auc.execute` denial from non-sys principal.

## Tests
- TEST-PS-036-05-01 (negative): each matrix row returns stated outcome.
- TEST-PS-036-05-02 (negative): seller attempt to extend returns `SYS.FORBIDDEN`.
- TEST-PS-036-05-03 (integration): self-approved policy rejected.
- TEST-PS-036-05-04 (integration): advisory signal cannot change extension outcome (fixture with high-risk signal).

## Acceptance criteria
1. Matrix tests pass with zero unlisted outcomes.
2. Signal-independence test passes on all fixtures.
3. No code path allows user-driven schedule writes.

## Assumptions & open decisions
- ASSUMPTION: policy approvals within 72 h of publication request.
- OPEN: whether a policy change can be scheduled for future auctions only. See [DECISIONS.md](../../../DECISIONS.md) D10.
