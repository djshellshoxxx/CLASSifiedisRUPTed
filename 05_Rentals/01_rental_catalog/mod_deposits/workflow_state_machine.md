# PS-040-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-03. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** notifications (subscribes to deposit.state_changed.v1), moderation (dispute entry and resolution), observability, rental lifecycle (reads state only).

## Purpose and scope
Define the deposit lifecycle: states, allowed transitions, guards, timers, and terminal states. The state machine records claims and consent. It never confirms that money moved. Every transition is explicit, authorized, revision-checked, and written as one deposit_event row. Exclusions: payment execution, escrow, refund processing, and dispute adjudication policy.

## Requirements
- PS-040-03.R01: Business outcome: from draft to a terminal state, every transition is attributable to one party or one timer, and every party consents to each terms revision. Terminal states are settled, expired and cancelled. Exclusions: any transition that implies platform-held funds or atomic real-world handover.
- PS-040-03.R02: Case coverage: normal path (draft to settled), counter-proposal loop, decline, expiry by timer at each window, unresolved withholding escalating to dispute, dispute resolution, duplicate command, command racing a timer, and command after terminal state.
- PS-040-03.R03: State labels are shown as text with a plain-language explanation for each state, localized by key. Accessibility: state change announced to assistive technology through the client status region.
- PS-040-03.R04: Consent: a terms revision becomes effective only when the non-proposing party accepts it with the current expected_revision. Silence is never consent.
- PS-040-03.R05: Revocation: when a participant's capability is revoked or blocked (CTR-CAP-001, F07), new commands from that participant are refused with DEPOSITS_FORBIDDEN_REVOKED. Timers continue, so the deposit still reaches a terminal state.
- PS-040-03.R06: Compensation: settled, expired and cancelled are final. Corrections happen through the dispute path before settlement. After settlement, corrections are recorded as support evidence and do not reopen the deposit (A-deposits-10 covers the cancel path).

## States
| State | Entry event | Allowed transitions (command or timer → target) | Guard | Terminal |
|---|---|---|---|---|
| draft | deposit.create | propose → proposed; cancel → cancelled; draft_expiry → expired | caller is receiver; rental eligible | no |
| proposed | deposit.propose or deposit.counter | accept → agreed; counter → proposed (revision + 1, proposer swaps); decline → cancelled; cancel (by proposer) → cancelled; proposal_expiry → expired | accept, decline, counter by non-proposer; expected_revision matches; terms not expired | no |
| agreed | deposit.accept | claim_paid → paid_claimed; cancel (either party) → cancelled; payment_window → expired | rental_status in {requested, confirmed, active} | no |
| paid_claimed | deposit.claim_paid | confirm_received → received_claimed; open_dispute → disputed; attach_evidence (no change) | confirm_received by receiver | no |
| received_claimed | deposit.confirm_received | claim_return → return_claimed; claim_withhold → withheld_claimed; open_dispute → disputed | claim_return requires rental_status = returned; withheld_minor <= amount_minor | no |
| return_claimed | deposit.claim_return | confirm_return → settled (returned_full or returned_partial); open_dispute → disputed; return_confirm → settled (returned_unconfirmed) | confirm_return by depositor; partial sums match | no |
| withheld_claimed | deposit.claim_withhold | acknowledge_withhold → settled (withheld_accepted); open_dispute → disputed; withhold_response → disputed (no_response) | acknowledge and dispute by depositor | no |
| disputed | deposit.open_dispute or escalation | resolve_dispute → settled (returned_full, returned_partial or withheld_upheld) | caller holds scoped dispute_moderator capability for this deposit; partial sums match | no |
| settled | entered from return_claimed, withheld_claimed or disputed | none | not applicable | yes |
| expired | timer | none | not applicable | yes |
| cancelled | cancel or decline | none | not applicable | yes |

## Timers
| Timer kind | Default window (A-deposits-08) | Scheduled in state | On fire |
|---|---|---|---|
| draft_expiry | 30 days | draft | draft → expired, closure_reason expired |
| proposal_expiry | 7 days | proposed | proposed → expired, closure_reason expired |
| payment_window | 7 days | agreed | agreed → expired, closure_reason expired |
| withhold_response | 14 days | withheld_claimed | withheld_claimed → disputed, dispute_reason_code no_response |
| return_confirm | 14 days | return_claimed | return_claimed → settled, returned_unconfirmed (A-deposits-12) |

Timers fire only if the stored scheduled_revision equals the current revision under row lock. Otherwise the timer is marked superseded.

## Rules
- Attach_evidence is allowed in paid_claimed, received_claimed, return_claimed, withheld_claimed and disputed. It never changes state.
- Cancel from agreed by either party is unilateral before any payment claim (A-deposits-10).
- A second open_dispute on the same deposit returns DEPOSITS_STATE_DISPUTE_ALREADY_OPEN.
- Terms and state are changed in the same transaction as the deposit_event row.

## Assumptions and open decisions
- A-deposits-08: Timer defaults as listed.
- A-deposits-09: Counter limit of 5 term revisions.
- A-deposits-10: Either party may cancel while agreed, before payment claim, without the other party's consent. Open: whether a mutual-consent cancel should be required once terms are accepted.
- A-deposits-11: withheld_claimed with no response escalates to disputed. It never auto-settles in the receiver's favor.
- A-deposits-12: return_claimed auto-settles as returned_unconfirmed after 14 days.
- A-deposits-30: rental_status names are provisional until 02_rental_lifecycle publishes its contract.
- Open: D09 (no platform custody) is the working default. D07 (retention) affects terminal record lifetime.

## Test cases
- TEST-PS-040-03-T01: Replay accept with an old expected_revision after counter. Pass: 409 DEPOSITS_CONFLICT_REVISION_MISMATCH, state unchanged. Fail: state changes.
- TEST-PS-040-03-T02: Fire return_confirm timer while confirm_return is committed. Pass: exactly one transition to settled; timer marked superseded. Fail: two transitions or a state outside the table.
- TEST-PS-040-03-T03: Send any command to a settled deposit. Pass: 409 DEPOSITS_STATE_TRANSITION_NOT_ALLOWED. Fail: any change.
