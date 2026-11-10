# PS-039-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-03. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle (commit and release), notifications, observability; shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-03.R01: Every state, transition, guard and terminal flag of windows, blocks and claims is listed in the tables below. No other transition exists.
- PS-039-03.R02: Each transition is written atomically with its domain event (outbox) and its revision increment. Duplicate and concurrent transitions are resolved by the guards, not by timing.
- PS-039-03.R03: Recovery after partial failure is defined per transition, including expiry of a hold while a commit request is in flight.

## Availability window
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| active | `avail.window.published` | withdrawn | owner; no committed claim inside window | no |
| withdrawn | `avail.window.withdrawn` | none | final; held claims inside window are released with reason `owner_declined` | yes |

A window is also time-expired when `ends_at_utc <= now`. Time expiry is a derived read state, not a stored transition; expired windows are kept for evidence and are never reactivated.

## Availability block
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| active | `avail.block.created` | removed | owner; no held or committed claim overlaps | no |
| removed | `avail.block.removed` | none | final | yes |

## Claim
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| held | `avail.claim.held` | committed; released; expired | committed: called by lifecycle service with valid claim; released: requester or owner, or lifecycle; expired: `hold_expires_at_utc <= now` | no |
| committed | `avail.claim.committed` | released | released only by lifecycle service with reason `rental_cancelled` or `rental_completed` | no |
| released | `avail.claim.released` | none | final | yes |
| expired | `avail.claim.expired` | none | final; set only from held | yes |

## Transition rules
- A hold is created with `hold_expires_at_utc = now + hold TTL` (default 72 hours, A-AVAIL-04).
- Expiry is enforced lazily: any read or write that encounters a held claim whose expiry has passed treats it as expired and attempts the `expired` transition in the same transaction. A sweep job runs every 60 seconds to transition the remaining ones.
- A commit against an expired hold is rejected with `AVAIL_CLAIM_STATE_INVALID`. The claim is never resurrected.
- Commitment has no expiry. It is released only by the lifecycle service (A-AVAIL-12).
- Withdrawing a window that contains a committed claim is rejected with `AVAIL_WINDOW_HAS_COMMITMENTS`; the owner must follow the lifecycle cancellation path (A-AVAIL-11).
- Every terminal state is absorbing. Re-sending a transition to a terminal state returns the stored result as an idempotent replay when the idempotency key matches, or `AVAIL_CLAIM_STATE_INVALID` otherwise.

## Preconditions and postconditions
- held: listing is not suspended; no overlapping unexpired held or committed claim; claim inside an active window; no overlapping active block.
- committed: prior state held and unexpired; lifecycle principal is the caller; `source_ref` is set.
- released and expired: `release_reason` is set; `hold_expires_at_utc` is null for committed-to-released.

## Timeouts
- Hold TTL: 72 hours default, range 1 hour to 7 days.
- Sweep interval: 60 seconds. Maximum lag before an expired hold is shown as expired to others: 60 seconds, and never shown as available to a new hold before the lazy check.
- Lifecycle commit deadline: the lifecycle service must commit within the remaining hold TTL; retries are bounded in failure_recovery_idempotency.md.

## Consent and revocation
- A requester may release their own held claim at any time before commitment. Consent to hold is implied by the request; consent to commit is given by the owner through the lifecycle module.
- An owner may withdraw a window only if no committed claim lies inside it. Owner consent is required for every block and window change.

## Open decisions
- A-AVAIL-10: Expiry is lazy plus a 60-second sweep, not a per-claim timer. Keeps the job count bounded.
- A-AVAIL-11: Window withdrawal with commitments is rejected, not automatically cancelling the rental. Cancellation stays in 02_rental_lifecycle.
- A-AVAIL-12: Commitments have no expiry and are released only by the lifecycle service, so a stalled rental cannot silently free a period.
