# PS-004-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, idempotency, commit atomicity), CTR-CAP-001 (actor and grant rules), CTR-ERR-001. **Pending:** PENDING CTR-MOD-001 (`cas.cleared`, `cas.rejected`, risk verdict; owner F12).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-03.R01 | Exactly three states in this module: `draft`, `published`, `held_review`. No other state is written here. | MVP |
| PS-004-03.R02 | Every transition commits with its revision increment and its event in one transaction (CTR-EVT-001 R02). | MVP |
| PS-004-03.R03 | Risk verdict is obtained before commit. Verdict timeout (300 ms, ASSUMPTION) → T2, never T1. | MVP |
| PS-004-03.R04 | Moderation release or rejection can only move `held_review` to `published` or `draft`. No transition moves `published` to `held_review`. | MVP |
| PS-004-03.R05 | The state label, reason and next step are text, not colour alone; state changes are announced once via a polite live region. | MVP |

## States & transitions
| ID | From | Event / command | Guard | To | Side effect |
|---|---|---|---|---|---|
| T1 | draft | `lst.publish` | V0–V10 pass; no PII match; verdict `allow`; media none or clean | published | set `published_at`, `expires_at`; emit `listing.published`; enqueue discovery index (outbox) |
| T2 | draft | `lst.publish` | V0–V10 pass; and (PII match or verdict `review` or risk timeout) | held_review | set `hold`; emit `listing.publish_held` (reason code only) |
| T3 | held_review | `cas.cleared` (actor `mod_`, `cas.moderate`, case grant) | media none or clean | published | clear `hold`; set `published_at`, `expires_at`; emit `listing.published` |
| T4 | held_review | `cas.rejected` (actor `mod_`) | none | draft | clear `hold`; emit `listing.publish_rejected` (reason code only) |
| T5 | held_review | `lst.publish` by owner | V0–V4, V6 | held_review | none; returns PUB.HOLD_ACTIVE |
| T6 | published | `lst.publish` | any | published | none; returns PUB.INVALID_STATE |
| T7 | draft | `lst.publish`, stale `expected_revision` | V0–V5 | draft | none; returns EVT.REVISION_CONFLICT |
| T8 | draft | `lst.publish`, store or outbox unavailable | — | draft | no write; returns SYS.UNAVAILABLE (retryable) |
| T9 | any | `lst.publish`, same key and digest | V0b hit | unchanged | returns original result; no event |

Diagram: `draft -T1-> published`; `draft -T2-> held_review`; `held_review -T3-> published`; `held_review -T4-> draft`. Terminal states in this module: none. Exits to `archived` and `expired` are owned by mod_archive.

## Concurrency and timeouts
- Two transitions on the same revision: exactly one commits; the other returns EVT.REVISION_CONFLICT.
- The risk call runs before commit and holds no row lock. Commit re-checks `expected_revision`.
- `held_review` has no automatic expiry here. Review SLA (alert at 72 h, ASSUMPTION) is owned by F12.
- `published` expiry (`expires_at`) is applied by mod_archive, not this module.

## Accessibility
- Each state has a text label ("Published", "Under review", "Draft") plus a reason line for `held_review`.
- After T1 or T2, focus moves to the status message. The message is read once via a polite live region.

## Assumptions & open decisions
- ASSUMPTION: risk verdict timeout 300 ms and fail-closed to T2.
- ASSUMPTION: moderation alert at 72 h (owned by F12).
- PROVISIONAL (D08 default, unapproved): offline publish is pending until server acknowledgment; state is re-checked at commit.
- Related: PS-004-06 (timeouts and retries), PS-004-05 (release grants).

## Tests
- TEST-PS-004-03-01 (unit): each row T1–T9 produces the stated `to` state, event set and code; no other transition is reachable.
- TEST-PS-004-03-02 (concurrency): 50 parallel publishes on revision N → one commit, 49 EVT.REVISION_CONFLICT.
- TEST-PS-004-03-03 (timeout): risk service delayed 500 ms → T2, never T1.
- TEST-PS-004-03-04 (a11y): status change announced once; each state visible with colour removed (text label present).

## Acceptance criteria
1. TEST-PS-004-03-01 passes for all nine rows; no transition writes `published` without `published_at` and `expires_at`.
2. TEST-PS-004-03-02 and -03 pass in CI.
3. No code path moves `published` to `held_review` (grep and model test).
