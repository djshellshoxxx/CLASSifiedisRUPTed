# PS-041-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-03. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Defines the states of a damage claim, the transitions between them, their guards and deadlines. The claim reaches an agreement, a withdrawal, an expiry, a moderated outcome or an external arrangement. No state in this module moves money or implies physical handover.

Exclusions: payment and refund flows (F09), deposit custody (D09), moderation case handling (F12), and the rental and return states themselves.

## Requirements
- **PS-041-03.R01** Outcome and actors. The state machine governs one claim. Lender, renter, moderator and system scheduler are the only actors. Terminal states are final.
- **PS-041-03.R02** Case coverage. Normal paths: accept, counter-accept, moderated outcome, external arrangement. Invalid: transitions not in the table are rejected with DAMAGE_INVALID_TRANSITION. Expired: each non-terminal state has a deadline that moves the claim to EXPIRED or leaves it waiting for moderation. Duplicate: a repeated command with the same key is a replay, not a second transition. Concurrent: transitions require `expected_revision`. Offline: a stale command is rejected, not merged. Adversarial: holds and role guards stop unauthorized transitions.
- **PS-041-03.R03** Accessibility and operations. Each state has a plain-language label key for the client and a deadline shown as an absolute date and time. Timer expiry is processed within the budget in observability_performance.md.

## States
| State | Entry event | Allowed outgoing transitions | Guard | Terminal |
|---|---|---|---|---|
| OPEN | DamageClaimOpened | AGREED (renter accept); COUNTER_PROPOSED (renter counter); ESCALATED (renter dispute); WITHDRAWN (lender withdraw); EXPIRED (deadline); CLOSED_EXTERNAL (matching attestations) | Role and revision guards per transition; no hold | false |
| COUNTER_PROPOSED | DamageCounterProposed | AGREED (lender accepts counter); WITHDRAWN (lender withdraws); ESCALATED (either party escalates); EXPIRED (deadline); CLOSED_EXTERNAL (matching attestations) | Role and revision guards; no hold | false |
| ESCALATED | DamageClaimEscalated | AGREED (moderator, agreed amount); CLOSED_NO_CHARGE (moderator, no charge); CLOSED_EXTERNAL (matching attestations); EXPIRED (deadline) | Moderator for resolution; attestation rules apply | false |
| AGREED | DamageClaimResolved (agreed_amount or moderated_agreed) | none | none | true |
| WITHDRAWN | DamageClaimWithdrawn | none | none | true |
| EXPIRED | DamageClaimExpired | none | none | true |
| CLOSED_NO_CHARGE | DamageClaimResolved (agreed_no_charge or moderated_no_charge) | none | none | true |
| CLOSED_EXTERNAL | DamageClaimResolved (external_arrangement) | none | none | true |

## Transitions and guards
| Command | From | To | Guard |
|---|---|---|---|
| damage.respond.v1 (accept) | OPEN | AGREED | Actor is renter; `expected_revision` current; no hold; before state_due_at; `agreed_amount_minor` = claimed amount |
| damage.respond.v1 (counter) | OPEN | COUNTER_PROPOSED | As above; counter amount per V12; sets `counter_amount_minor` and deadline |
| damage.respond.v1 (dispute) | OPEN | ESCALATED | As above; sets escalation deadline |
| damage.counter.accept.v1 | COUNTER_PROPOSED | AGREED | Actor is lender; `agreed_amount_minor` = counter amount |
| damage.claim.withdraw.v1 | OPEN, COUNTER_PROPOSED | WITHDRAWN | Actor is lender; no hold |
| damage.claim.escalate.v1 | COUNTER_PROPOSED | ESCALATED | Actor is either party; no hold |
| damage.external.attest.v1 | OPEN, COUNTER_PROPOSED, ESCALATED | CLOSED_EXTERNAL | Both role attestations exist, amounts equal, currency equal (V20) |
| damage.moderation.resolve.v1 | ESCALATED | AGREED or CLOSED_NO_CHARGE | Actor is moderator; `agreed_amount_minor` required only for agreed outcome; clears hold |
| system timer | OPEN, COUNTER_PROPOSED, ESCALATED | EXPIRED | `now` at or past `state_due_at`; no hold |

Other commands (revise, attach evidence, hold, read) do not change `state`. The table in PS-041-04 lists them.

## Deadlines and timers
- OPEN: `state_due_at` = opened_at + 14 days. Silence expires the claim. It never implies acceptance (A-damage-08).
- COUNTER_PROPOSED: `state_due_at` = counter time + 7 days (A-damage-09).
- ESCALATED: `state_due_at` = escalation time + 30 days (A-damage-09). Expiry here means no moderated outcome was recorded.
- `response_due_at` is a reminder only and does not block commands.
- A deadline check uses server time. A command arriving after the deadline but before the timer runs is rejected with DAMAGE_RESPONSE_WINDOW_CLOSED.
- The expiry job is idempotent. It re-reads state and deadline inside the claim row lock before writing.

## Moderation holds
- A moderator may set `hold_active` on any non-terminal claim. While a hold is active, only moderation commands and reads run (DAMAGE_CLAIM_LOCKED for others).
- While a hold is active, timers do not fire. On release, the remaining time is restored to `state_due_at` (A-damage-11).
- A hold does not change `state`. It cannot be used to extend a claim beyond its lifetime.

## Consent and revocation
- A counter is a proposal. Acceptance by the lender is the consent. AGREED requires explicit consent by the party who would pay.
- A party may withdraw consent only before a terminal state. Once AGREED, CLOSED_NO_CHARGE or CLOSED_EXTERNAL, consent cannot be revoked in this module.
- Attestations may be replaced by the same role until the pair matches. A matched pair closes the claim.

## Compensation and terminal finality
- Terminal states are final. This module has no reverse transition.
- A wrong terminal outcome is handled outside this state machine (moderation process, external dispute). The event log preserves the original history.

## Dual attestation rules (D04)
- Attestations are recorded as they arrive. The claim closes only when both roles have attested to equal amounts.
- If the second attestation differs, both are kept, the claim stays in its current state, and the command returns DAMAGE_EXTERNAL_ATTESTATION_MISMATCH.
- No atomic real-world guarantee is implied. This is explicit per-party attestation with compensating recovery (D04 OPEN).

## Open decisions
- **Assumption A-damage-08:** OPEN deadline is 14 days. Silence expires, never accepts.
- **Assumption A-damage-09:** Counter deadline is 7 days; escalation deadline is 30 days.
- **Assumption A-damage-10:** Lender revision limit is 2. Revision does not extend `state_due_at`.
- **Assumption A-damage-11:** Holds pause timers. Remaining time is restored on release.
- D04 (partial barter execution) is OPEN. Dual attestation here is a placeholder pattern.
- D09 (rentals and deposits) is OPEN. No state represents custody.
