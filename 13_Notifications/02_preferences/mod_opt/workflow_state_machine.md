# PS-107-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-03.R01 | Each push or email cell is `off`, `pending_confirm` or `on`. Inapp/security is always `on`. | MVP |
| PS-107-03.R02 | Email enabling enters `pending_confirm` for 72 h; confirmation moves it to `on`; expiry moves it to `off`. | MVP |
| PS-107-03.R03 | Withdrawal takes effect at the next dispatch decision (zero cache). | MVP |
| PS-107-03.R04 | Confirmation is a POST from a page; a GET never confirms (protects against link scanners). | MVP |

## Data / schema
Confirmation record: token hash, `npf_id`, cell key, `expires_at`, `used_at`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| off | settings: enable push | explicit action | on | emit `notification_preference.granted` (source settings) |
| off | settings: enable email | explicit action | pending_confirm | send confirmation notice to address on file; token created |
| pending_confirm | POST confirm with valid token | token unused and ≤ 72 h | on | `used_at` set; emit `notification_preference.granted` (source email_confirmation) |
| pending_confirm | 72 h elapsed | none | off | emit `notification_preference.confirmation_expired` |
| pending_confirm | settings: cancel | owner | off | token invalidated |
| on | settings or unsubscribe token: withdraw | owner or valid token for this cell | off | emit `notification_preference.withdrawn` |
| on | `opt.withdraw_all` | owner | off for push and email | emit one withdrawn event per cell |
| inapp/security | any | any | on | rejected (PS-107-02.R03) |

## Validation & errors
`OPT.CONFIRMATION_EXPIRED` for expired token; `OPT.CONFIRMATION_INVALID` for reuse or unknown token. Both non-retryable.

## Authorization
Owner, or a scoped unsubscribe token for a single cell (see authorization_capabilities).

## Failure, idempotency, concurrency, offline
Withdrawal is idempotent; repeated withdrawal returns off without new event. Confirmation replay returns `CONFIRMATION_INVALID` after first use.

## Privacy, retention, abuse
Expired tokens are purged 30 days later (RET-SEC).

## Observability & budgets
Counters for grants, withdrawals, confirmation expiries by channel. Transition p95 ≤ 100 ms.

## Tests
- TEST-PS-107-03-01 (unit): each transition row covered.
- TEST-PS-107-03-02 (integration): GET to confirm URL does not change state.
- TEST-PS-107-03-03 (integration): confirmation after 72 h yields expired and cell off.
- TEST-PS-107-03-04 (integration): withdrawal effective on next dispatch decision.

## Acceptance criteria
1. Email cannot be `on` without confirmation.
2. Security inapp cannot leave `on` in any fixture.
3. All transitions emit events.

## Assumptions & open decisions
- ASSUMPTION: 72 h confirmation window.
- No D-ID blocks state logic.
