# PS-065-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001 (R05), CTR-ERR-001, CTR-COM-001 (dispute and claim boundary).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-03.R01 | States: `open`, `single_attested`, `confirmed_mutual`, `disputed`, `closed`. | MVP |
| PS-065-03.R02 | `confirmed_mutual` requires both parties' attestations in the same direction-pair for every item and quantity (gave by A = received by B, and vice versa). | MVP |
| PS-065-03.R03 | Partial handoff is allowed: confirmation is per item; the record may be `single_attested` for some items and `confirmed_mutual` for others. | MVP |
| PS-065-03.R04 | Conflicting attestations (A says gave 2, B says received 1) move the handoff to `disputed` and stop auto-confirmation. | MVP |
| PS-065-03.R05 | At window close, incomplete handoffs move to `closed` with per-item status `unconfirmed` (no automatic fault assignment). | MVP |
| PS-065-03.R06 | A `disputed` handoff is referred to F09 dispute flow (`dsp_`) by reference; this module does not decide fault. | MVP |

## Data / schema
`handoff_state` enum closed: `open`, `single_attested`, `confirmed_mutual`, `disputed`, `closed`. Item-level status: `pending`, `confirmed`, `conflicting`, `unconfirmed`.

## Commands / queries / events
`OpenHandoff`, `AttestHandoff`, `WithdrawAttestation`, `RaiseHandoffDispute`, `CloseHandoff` (timeout); events `handoff.opened`, `handoff.attested`, `handoff.confirmed`, `handoff.disputed`, `handoff.closed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `OpenHandoff` | exchange in a handoff-eligible state | `open` | event `handoff.opened` |
| `open` | `AttestHandoff` (first party) | PS-065-02 passes | `single_attested` | event `handoff.attested` |
| `single_attested` | `AttestHandoff` (other) | matches | `confirmed_mutual` (for matching items) | event `handoff.confirmed` |
| `single_attested` / `open` | `AttestHandoff` (other) | conflicts | `disputed` | event `handoff.disputed`; F09 referral |
| `single_attested` | `WithdrawAttestation` | before counter-attestation | `open` | event `handoff.attested` (withdrawn) |
| any non-terminal | `RaiseHandoffDispute` | participant | `disputed` | F09 referral |
| `open` / `single_attested` | window close | PS-065-02 R05 | `closed` | unconfirmed items marked |

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `HANDOFF.CLOSED` | false | `err.handoff.closed` |
| `HANDOFF.NOT_WITHDRAWABLE` | false | `err.handoff.not_withdrawable` |

## Authorization
Attestations by parties (`attest`); disputes by parties; closure by `sys_`.

## Failure, idempotency, concurrency, offline
- Concurrent attestations on the same item: compare-and-set on revision; second receives state-specific error or matches.
- Withdrawal after counter-attestation is refused; the record keeps both lines.
- Closure job idempotent.

## Privacy, retention, abuse
Withdrawn attestations remain as signed lines with `withdrawn_at` (evidence integrity). No fault or reputation output here.

## Observability & budgets
`handoff_transition_total{from,to}`; disputes per 1,000 handoffs as aggregate.

## Tests
- TEST-PS-065-03-01 (unit): transition table complete.
- TEST-PS-065-03-02 (integration): partial handoff with mixed item statuses.
- TEST-PS-065-03-03 (integration): conflicting quantities move to `disputed` and create F09 referral.
- TEST-PS-065-03-04 (integration): window close marks unconfirmed items without fault.

## Acceptance criteria
1. Only listed transitions occur.
2. Partial handoffs supported per item.
3. Conflicts never auto-confirm.
4. No fault assignment in this module.

## Assumptions & open decisions
- ASSUMPTION: withdrawal allowed only before counter-attestation.
- PROVISIONAL (D04 default, unapproved): compensating recovery through dispute flow; no atomic guarantee.
