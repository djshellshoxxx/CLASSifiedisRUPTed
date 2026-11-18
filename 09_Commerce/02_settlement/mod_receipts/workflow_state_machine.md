# PS-071-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05 state set, R06, R07, R13, R16), CTR-EVT-001 (R02, R13). **Decisions:** D06 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-03.R01 | This module writes only `CLAIMED` and `COUNTERPARTY_ATTESTED`. All other states are written by PS-072 or PS-070 (CTR-COM-001 R05). | MVP |
| PS-071-03.R02 | A self-submitted claim creates `CLAIMED`; no claimant action can move it past `CLAIMED` (R06). | MVP |
| PS-071-03.R03 | Counterparty attestation not received within 7 d leaves the claim `CLAIMED` with label "Awaiting counterparty"; it never auto-attests (ASSUMPTION window). | MVP |
| PS-071-03.R04 | Attestation moves `CLAIMED` → `COUNTERPARTY_ATTESTED` only for methods that allow it; for cash or in-kind, this is the ceiling (R07). | MVP |
| PS-071-03.R05 | Each transition appends `clm.state_changed` with `state_version` (CTR-COM-001 R13). | MVP |

## Data / schema
Transition row: `claim_id`, `from_state`, `event`, `to_state`, `state_version`, `actor_ref`, `claim_hash`, `recorded_at`.

## Commands / queries / events
`clm.submitted` (→ `CLAIMED`), `clm.attested` (→ `COUNTERPARTY_ATTESTED`), `clm.state_changed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `clm.submit` | PS-071-02 pass | `CLAIMED` | `clm.submitted`; counterparty notified (generic text) |
| `CLAIMED` | `clm.attest` | counterparty signature valid; method permits attest | `COUNTERPARTY_ATTESTED` | `clm.attested` |
| `CLAIMED` | timer 7 d, no attest | — | `CLAIMED` (label change only) | `clm.attest_pending_expired` (informational) |
| `CLAIMED` or `COUNTERPARTY_ATTESTED` | `clm.dispute` (PS-070) | window open | `DISPUTED` | owned by PS-070 |
| `CLAIMED` | `clm.submit` again for same trx and party | prior claim exists | refused | `RECEIPT.DUPLICATE_CLAIM` |

Claims in `EXTERNALLY_VERIFIED`, `FINAL`, `DISPUTED`, `REVERSED` are out of this module's transitions.

## Validation & errors
`COM.INVALID_TRANSITION` for any attest on a non-`CLAIMED` claim; `COM.ATTESTATION_INVALID` for bad signature.

## Authorization
Submit by claimant (participant); attest by counterparty only; the timer is `sys_`.

## Failure, idempotency, concurrency, offline
Concurrent attest and dispute: first committed wins; the other receives `SYS.CONFLICT`. Attestation replay with same key returns same result.

## Privacy, retention, abuse
Transition log holds hashes and enums only.

## Observability & budgets
Histogram: submit → attest latency (p50 ≤ 24 h, p95 ≤ 7 d; ASSUMPTION targets). Gauge: claims by state.

## Tests
- TEST-PS-071-03-01 (unit): table exhaustive; undefined pairs refused.
- TEST-PS-071-03-02 (property): cash and in-kind claims never reach a state beyond `COUNTERPARTY_ATTESTED` in 10,000 random sequences.
- TEST-PS-071-03-03 (integration): 7-day timer changes label only; state stays `CLAIMED`.
- TEST-PS-071-03-04 (integration): attest vs dispute race yields exactly one winner.

## Acceptance criteria
1. Only the two states written here appear in this module's transition log (verified by test).
2. No "paid" or "settled" label below `FINAL` (CTR-COM-001 R15).
3. Timer never auto-attests (test).

## Assumptions & open decisions
- ASSUMPTION: 7-day attestation wait; no implicit attestation.
- D06 (PROVISIONAL default, unapproved).
