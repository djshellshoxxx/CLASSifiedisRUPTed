# PS-022-05 — Authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-05.R01 | Own withdrawal: `cyc.withdraw` on the actor's own `acc_` in `participant` scope. | MVP |
| PS-022-05.R02 | Reporting another party's dropout: `cyc.dropout.report`, `participant` scope, requires an observed `reason_code` only; report counts are capped at 1 per reporter per case. | MVP |
| PS-022-05.R03 | Resolution (`cyc.dropout.resolve`) by any participant of the cycle with a majority of the remaining parties, or by `sys_` timer. Operators cannot resolve without a `case:` scope grant with `expires_at` (CTR-CAP-001 R06). | MVP |
| PS-022-05.R04 | Operators cannot read party-level reasons unless a privileged grant with purpose exists (CTR-CAP-001 R07 dual control). | MVP |
| PS-022-05.R05 | Participation removed on resolution is effective for new commands within 60 s (CTR-CAP-001 R09). | MVP |

## Data / schema
Inputs: `acc_` of actor, cycle membership derived from proposal version and case state.

## Commands / queries / events
Authorization evaluated before idempotency lookup; non-participants receive `SYS.NOT_FOUND`.

## States & transitions
Membership changes re-evaluated on each decision (CTR-CAP-001 R05).

## Validation & errors
| Condition | Code | Class / HTTP |
|---|---|---|
| Non-participant | SYS.NOT_FOUND | not_found / 404 |
| Removed participant | SYS.FORBIDDEN | forbidden / 403 |
| Operator without grant | SYS.FORBIDDEN | forbidden / 403 |
| Second report by same reporter | (idempotent replay) | 200 |

## Authorization
| Actor × action | Scope | Capability | Result |
|---|---|---|---|
| participant × withdraw (own) | cycle | cyc.withdraw | ALLOW before CONSENTED and after, with routing |
| participant × report another | cycle | cyc.dropout.report | ALLOW, max 1 per reporter |
| participant × resolve | cycle | cyc.dropout.resolve | ALLOW if majority rule (R03) |
| sys_ timer × escalate | system | cyc.dropout.resolve | ALLOW |
| ope_ × read reasons | case | privileged | DENY unless dual-control grant |
| non-participant × any | — | — | DENY SYS.NOT_FOUND |

## Failure, idempotency, concurrency, offline
Policy store down → `SYS.UNAVAILABLE`, fail closed. Offline clients never decide membership.

## Privacy, retention, abuse
Grants for reason access carry `purpose` and `expires_at ≤ 72 h`. Abuse: serial false reports are counted and surfaced to F12 Trust&Safety as signals, never auto-penalized.

## Observability & budgets
Audit record `aud_` for every allow/deny and every privileged read (CTR-CAP-001 R08).

## Tests
- TEST-PS-022-05-01 (matrix): each row above.
- TEST-PS-022-05-02 (negative): operator reads reason without grant → denied and audited.
- TEST-PS-022-05-03 (abuse): second report from same reporter → single report counted.

## Acceptance criteria
1. Matrix outcomes match codes.
2. Majority rule enforced in 3- and 4-party cases.
3. Every privileged read produces an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: majority rule uses remaining parties excluding the dropout.
- [DECISIONS.md](../../../DECISIONS.md) D10 — PROVISIONAL (D10 default, unapproved): user-controlled keys sign withdrawals where available.
