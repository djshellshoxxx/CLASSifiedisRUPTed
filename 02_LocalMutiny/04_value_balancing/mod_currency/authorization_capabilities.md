# PS-025-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R10, R11), CTR-COM-001 (R11), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-05.R01 | Pin requires a `sys_` principal of the cycle module with grant `cyc.propose`; users cannot pin. | MVP |
| PS-025-05.R02 | Terms read requires `cyc.read` with participant scope. | MVP |
| PS-025-05.R03 | Quote reads by this module use the valuation owner's `sys_` read grant only (CTR-COM-001 R11 adapter rule does not apply here). | MVP |
| PS-025-05.R04 | Field visibility: other slots' amounts are shown only where the cycle's terms are shared by design (CTR-CAP-001 R10). | MVP |

## Data / schema
Grants for the cycle module; decisions store reason codes only.

## Commands / queries / events
Pin: sys_ cycle module. Read: participant.

## States & transitions
Not applicable.

## Validation & errors
Unauthorised reads return SYS.NOT_FOUND; unauthorised pins return SYS.FORBIDDEN.

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| sys_ cycle module (grant) | cyc.propose (pin) | cyc_ version | ALLOW |
| user | pin | cyc_ | DENY SYS.FORBIDDEN |
| slot participant | cyc.read | terms | ALLOW |
| non-participant | cyc.read | terms | DENY SYS.NOT_FOUND |
| ope_ | read amounts | any | DENY (privileged access needs case, dual control) |

## Failure, idempotency, concurrency, offline
Grant revocation takes effect at next decision.

## Privacy, retention, abuse
Amounts are FINANCIAL_EVIDENCE; access by privileged roles audited (CTR-CAP-001 R08).

## Observability & budgets
Denials counted without amounts.

## Tests
- TEST-PS-025-05-01 (unit): each row.
- TEST-PS-025-05-02 (negative): user cannot pin.
- TEST-PS-025-05-03 (integration): operator cannot read amounts without case grant.

## Acceptance criteria
1. Every row covered.
2. Zero amount values in operator views without case grant.
3. Pins by non-system principals refused in 100% of runs.

## Assumptions & open decisions
- ASSUMPTION: cycle module holds a purpose-bound sys_ grant (CTR-CAP-001 R06).
