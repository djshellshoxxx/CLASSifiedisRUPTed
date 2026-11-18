# PS-067-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05–R07, R13, R15, R16; state table), CTR-EVT-001 (R02). **Decisions:** D04, D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-03.R01 | Cash claims use only the CTR-COM-001 states; the reachable subset is `CLAIMED`, `COUNTERPARTY_ATTESTED`, `DISPUTED`, and `REVERSED` only via case resolution. | MVP |
| PS-067-03.R02 | `EXTERNALLY_VERIFIED` and `FINAL` are unreachable for cash (R07). | MVP |
| PS-067-03.R03 | Method configuration: `enabled` ↔ `disabled`. Disabling blocks new cash claims only. | MVP |
| PS-067-03.R04 | Labels below `FINAL` never contain "paid", "payment received" or "settled" (CTR-COM-001 R15). | MVP |

## Data / schema
Transition row per CTR-COM-001 (`clm.state_changed`). Configuration transition: `cashcfg_id`, `from`, `to`, `config_revision`, `changed_by`.

## Commands / queries / events
`clm.submitted`, `clm.attested`, `clm.disputed`, `clm.dispute_resolved` (CTR-COM-001); `cash_method.enabled`, `cash_method.disabled`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `clm.submit` (cash) | PS-067-02 passes | `CLAIMED` | Counterparty notified |
| `CLAIMED` | `clm.attest` | counterparty signature valid | `COUNTERPARTY_ATTESTED` | Claimant notified |
| `CLAIMED`, `COUNTERPARTY_ATTESTED` | `clm.dispute` | within 14-day window | `DISPUTED` | Transitions frozen |
| `DISPUTED` | `clm.dispute_resolved` | case decision | prior state or `REVERSED` | Decision record |
| `enabled` | `cash_method.disable` | operator approval | `disabled` | Existing claims unchanged |
| `disabled` | `cash_method.enable` | operator approval | `enabled` | Notice to operators |

Any other pair returns `COM.INVALID_TRANSITION`.

## Validation & errors
`COM.INVALID_TRANSITION` (409); `COM.CASH_NOT_VERIFIABLE` (422) on verify attempts.

## Authorization
Claim transitions by parties and case moderators per CTR-COM-001. Configuration by operators under dual control.

## Failure, idempotency, concurrency, offline
Attest versus dispute race: exactly one wins, the other gets `SYS.CONFLICT` (CTR-COM-001 test 13).

## Privacy, retention, abuse
Transition log holds hashes and enums only.

## Observability & budgets
Histogram: submit to attest latency (aggregate). Counter: cash claims disputed per party (collusion signal).

## Tests
- TEST-PS-067-03-01 (unit): table rows pass; undefined pairs refused.
- TEST-PS-067-03-02 (property): 10,000 random sequences never reach `EXTERNALLY_VERIFIED` or `FINAL`.
- TEST-PS-067-03-03 (integration): disable does not change existing claim states.
- TEST-PS-067-03-04 (wording): UI copy scan for banned words below `FINAL`.

## Acceptance criteria
1. Cash claims never reach `EXTERNALLY_VERIFIED` or `FINAL` (verified by test).
2. Disabling the method leaves all claim states unchanged.
3. Wording scan passes.

## Assumptions & open decisions
- ASSUMPTION: 14-day dispute window (CTR-COM-001 R16).
- D06 (PROVISIONAL default, unapproved): signed statements only; no verification step for cash.
