# PS-023-05 — Authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-05.R01 | Lock acquisition is performed only by the system principal `sys_` triggered by a `cycle.consented` event; no participant can request a lock directly. | MVP |
| PS-023-05.R02 | Participants read the lock state of their own cycle through `cyc.lock.get` (`participant` scope); `item_id` visible, `fence` visible, owner IDs of other parties hidden. | MVP |
| PS-023-05.R03 | Release, extend and consume require `sys_` with scope `cycle` and capability `cyc.execute`. | MVP |
| PS-023-05.R04 | Operators can force-release only via a `case:` privileged grant with purpose and `expires_at` ≤ 72 h, dual control (CTR-CAP-001 R06, R07). | MVP |
| PS-023-05.R05 | Lock operations on items from a suspended listing are denied with `SYS.FORBIDDEN` (listing state owned by F01). | MVP |

## Data / schema
Inputs: principal ID, cycle membership (derived), listing state from F01 by reference.

## Commands / queries / events
Authorization before idempotency lookup.

## States & transitions
Membership and listing-state changes are re-evaluated per decision (CTR-CAP-001 R05).

## Validation & errors
| Condition | Code | Class / HTTP |
|---|---|---|
| Participant tries acquire | SYS.FORBIDDEN | forbidden / 403 |
| Non-participant read | SYS.NOT_FOUND | not_found / 404 |
| Operator force-release without grant | SYS.FORBIDDEN | forbidden / 403 |
| Suspended listing item | SYS.FORBIDDEN | forbidden / 403 |

## Authorization
| Actor × action | Scope | Capability | Result |
|---|---|---|---|
| sys_ (consent handler) × acquire | cycle | cyc.execute | ALLOW |
| participant × acquire | cycle | cyc.execute | DENY SYS.FORBIDDEN |
| participant × read own cycle | cycle | cyc.read | ALLOW (fields limited) |
| non-participant × read | — | — | DENY SYS.NOT_FOUND |
| ope_ × force release | case | privileged | ALLOW only with dual-control grant |
| sys_ × acquire, listing suspended | item | cyc.execute | DENY SYS.FORBIDDEN |

## Failure, idempotency, concurrency, offline
Policy store down → fail closed (`SYS.UNAVAILABLE`). Offline clients never hold locks.

## Privacy, retention, abuse
No PRIVATE_PERSONAL or LOCATION data read. Force-release grants audited.

## Observability & budgets
Audit `aud_` for every privileged action and every denial.

## Tests
- TEST-PS-023-05-01 (matrix): each row above.
- TEST-PS-023-05-02 (negative): participant cannot call acquire by any API path (CTR-CAP-001 TEST-03).
- TEST-PS-023-05-03 (privileged): force release without dual approval → `CAP.DUAL_APPROVAL_REQUIRED`.

## Acceptance criteria
1. Matrix outcomes and codes match.
2. No user-facing route reaches acquire.
3. Privileged force-release leaves an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: listing suspension state is provided by F01 as a readable flag.
- [DECISIONS.md](../../../DECISIONS.md) D10 — PROVISIONAL (D10 default, unapproved): not applicable beyond identity; no key use here.
