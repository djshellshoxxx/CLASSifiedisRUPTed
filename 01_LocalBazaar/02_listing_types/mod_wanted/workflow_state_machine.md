# PS-007-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, event envelope), CTR-CAP-001 (guards), CTR-ERR-001, CTR-ID-001 (`lst_`), PENDING CTR-LST-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-03.R01 | Eight states: `draft`, `published`, `paused`, `suspended`, `fulfilled`, `closed`, `expired`, `tombstoned`. `tombstoned` is terminal. | MVP |
| PS-007-03.R02 | Only transitions in the table occur. Any other (state, command) pair returns `WANTED.INVALID_TRANSITION` with no side effect. | MVP |
| PS-007-03.R03 | Each committed transition appends exactly one `listing.*` event and increments `revision` by 1, in the same transaction. | MVP |
| PS-007-03.R04 | Expiry is enforced at read time (`expires_at ≤ now` hides the post) and by the sweeper (p95 ≤ 120 s after `expires_at`). | MVP |
| PS-007-03.R05 | Suspension stores `prior_state`. Reinstatement restores it, unless `expires_at` has passed, in which case the post becomes `expired`. | MVP |
| PS-007-03.R06 | `fulfilled` is an owner statement. It creates no settlement, claim, `trx_` or payment record (no CTR-COM-001 call). | MVP |

## Data / schema
`status` enum as in PS-007-01. `prior_state` non-null only in `suspended`. No other stored state.

## Commands / queries / events
Commands in PS-007-04. Each transition emits one event (`listing.created`, `published`, `updated`, `paused`, `resumed`, `fulfilled`, `closed`, `expired`, `renewed`, `suspended`, `reinstated`, `tombstoned`).

## States & transitions
| From | Event (command) | Guard | To | Side effect |
|---|---|---|---|---|
| — | `wanted.create` | `cap.wanted.create`; validation pass | draft | `listing.created`; rev 1 |
| draft | `wanted.publish` | validation pass; active < 5; no duplicate; abuse decision `allow` | published | `listing.published`; `expires_at` = now + 30 d; index projection |
| draft | `wanted.publish` | abuse decision `review` | suspended (`prior_state` draft) | `listing.suspended`; F12 case opened |
| draft, published, paused | `wanted.update` | owner; validation pass | same | `listing.updated`; rev +1 |
| published | `wanted.pause` | owner | paused | `listing.paused`; de-index |
| paused | `wanted.resume` | owner; `expires_at` > now | published | `listing.resumed`; re-index |
| published, paused | `wanted.fulfill` | owner | fulfilled | `listing.fulfilled`; de-index; no settlement |
| published, paused | `wanted.close` | owner | closed | `listing.closed`; de-index |
| published, paused | `sys.expire` | `expires_at` ≤ now; `revision` = observed | expired | `listing.expired`; de-index |
| expired | `wanted.renew` | owner; active < 5; new `expires_at` ≤ now + 90 d | published | `listing.renewed`; re-index |
| draft, published, paused | `wanted.suspend` | `cap.wanted.moderate`; `cas_` ref | suspended (`prior_state` = previous) | `listing.suspended`; hidden from public read |
| suspended | `wanted.reinstate` | moderator; case closed as reinstate; `expires_at` > now | `prior_state` | `listing.reinstated`; index if published |
| suspended | `wanted.reinstate` | as above; `expires_at` ≤ now | expired | `listing.reinstated`, `listing.expired` |
| suspended | `wanted.remove` | moderator; `cas_` ref | tombstoned | `listing.tombstoned` (reason `moderation`) |
| draft, published, paused, fulfilled, closed, expired | `wanted.delete` | owner | tombstoned | `listing.tombstoned` (reason `owner`) |

Owner commands on `suspended` return `WANTED.SUSPENDED_READ_ONLY`. Owner delete on `suspended` is refused for the same reason, so moderation evidence cannot be removed by the owner.

## Validation & errors
`WANTED.INVALID_TRANSITION` (conflict, retryable false). `WANTED.SUSPENDED_READ_ONLY` (conflict, retryable false). Stale `expected_revision` returns `SYS.CONFLICT`.

## Authorization
Guards reference capabilities in PS-007-05. Moderation transitions need a grant scoped to a `cas_` ID.

## Failure, idempotency, concurrency, offline
Every transition is a compare-and-set on `revision`. The sweeper and owner commands race safely: the loser gets `SYS.CONFLICT` or a no-op. Recovery in PS-007-06.

## Privacy, retention, abuse
Events carry state and reason codes only. Draft purge (30 days) and retention in PS-007-07.

## Observability & budgets
Counter `wanted_transition_total{from,to,event}`. Alert when `INVALID_TRANSITION` exceeds 0.5% of commands over 15 min (ASSUMPTION).

## Tests
- TEST-PS-007-03-01 (unit): matrix test; every (state, command) pair yields the table result.
- TEST-PS-007-03-02 (property): random command sequences keep `tombstoned` terminal and `revision` strictly +1 per event.
- TEST-PS-007-03-03 (integration): read at `expires_at` hides post; sweeper within 120 s; renew vs sweep race yields one winner.
- TEST-PS-007-03-04 (integration): suspend while paused, reinstate restores `paused`.
- TEST-PS-007-03-05 (e2e): publish → pause → resume → fulfill creates no `trx_`/`clm_` records.

## Acceptance criteria
1. Matrix test passes for all 8 × 14 pairs.
2. No state change occurs without exactly one event.
3. Zero listings readable past `expires_at` in the load test.
4. `fulfilled` creates zero settlement records.

## Assumptions & open decisions
- D04 PROVISIONAL (Dxx default, unapproved): `fulfilled` is a one-sided statement; no atomic real-world handover is assumed.
- D06 PROVISIONAL (Dxx default, unapproved): no receipt is produced by this module.
- ASSUMPTION: default expiry 30 d; renewal ceiling 90 d.
