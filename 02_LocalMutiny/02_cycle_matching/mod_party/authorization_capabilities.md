# PS-019-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R05, R10), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-05.R01 | Withdrawal requires `cyc.withdraw` (verb `withdraw` is listed in CTR-CAP-001 R03) with scope `participant`. | MVP |
| PS-019-05.R02 | Binding requires `cyc.propose` by a sys_ cycle creator with grant. | MVP |
| PS-019-05.R03 | Slot view requires `cyc.read` with scope `participant`. | MVP |
| PS-019-05.R04 | Only the slot owner's account (`acc_`) may act on the slot; prf_ views do not authorise (CTR-CAP-001 R02). | MVP |

## Data / schema
Grants for cycle creators; bindings readable by participants of that cycle.

## Commands / queries / events
Bind: sys_. Withdraw: participant. Get: participant.

## States & transitions
Not applicable.

## Validation & errors
Non-participant withdrawal returns SYS.NOT_FOUND if the cycle is not visible.

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| slot participant | cyc.withdraw | own slot, pre-lock | ALLOW |
| slot participant | cyc.withdraw | locked slot | DENY CYCPARTY.LOCKED |
| non-participant | cyc.read | cyc_ | DENY SYS.NOT_FOUND |
| sys_ cycle creator (grant) | cyc.propose (bind) | cyc_ | ALLOW |
| user | cyc.propose (bind) | cyc_ | DENY SYS.FORBIDDEN |

## Failure, idempotency, concurrency, offline
Revocation at next decision; decisions not cached for writes.

## Privacy, retention, abuse
Decision records hold no slot pseudonyms.

## Observability & budgets
Denials counted by reason.

## Tests
- TEST-PS-019-05-01 (unit): each table row.
- TEST-PS-019-05-02 (negative): withdraw after lock denied.
- TEST-PS-019-05-03 (integration): prf_ view cannot authorise withdraw.

## Acceptance criteria
1. Every row covered.
2. Withdraw after lock denied in 100% of fixtures.
3. Pseudonym views never authorise writes.

## Assumptions & open decisions
- ASSUMPTION: `cyc.withdraw` is the withdrawal verb; no new verb needed.
