# PS-002-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, R02; idempotency, R03), CTR-ERR-001 (retry semantics), CTR-SCH-001 (R06 pending offline entries).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-03.R01 | `listing.create` is the only path from no listing to `draft`. Its from-state is `none`. | MVP |
| PS-002-03.R02 | A listing enters `draft` only on a successful commit. A rejected or failed create leaves no listing row. | MVP |
| PS-002-03.R03 | This module defines no transition out of `draft`. Edit, publish and discard belong to mod_edit, mod_publish and mod_archive. | MVP |
| PS-002-03.R04 | Revision of a new listing is 1. The first `listing.created` event has revision 1. | MVP |
| PS-002-03.R05 | Server commit deadline is 5 s (ASSUMPTION). Past the deadline nothing is committed, and the client gets `SYS.UNAVAILABLE` (retryable). | MVP |
| PS-002-03.R06 | `pending_local` and `not_applied` are client-side offline states only. They never appear in server records. | MVP |
| PS-002-03.R07 | No terminal state exists in this module. | MVP |

## Data / schema
State set owned here: `draft` (server). Client-only: `pending_local`, `not_applied`. Field values per PS-002-01.

## Commands / queries / events
Transitions are triggered by `listing.create` (PS-002-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| none | listing.create (client_direct) | Authorized; valid; quota OK; key new | draft (rev 1) | Commit record, event, idempotency row; return result |
| none | listing.create (client_offline_replay) | As above; `occurred_at` within 7 days; client `lst_` ID unused | draft (rev 1) | As above; `created_source` = offline replay |
| none | listing.create, same key and digest | Idempotency row exists | none (unchanged) | Return original result; no event |
| none | listing.create, same key, other digest | Idempotency row exists | none (unchanged) | `EVT.IDEMPOTENCY_KEY_REUSED` |
| none | listing.create, same key | Previous attempt still in flight | none (unchanged) | `SYS.PRECONDITION_FAILED` (retryable) |
| none | listing.create | Auth, validation or quota fails | none (unchanged) | Error; no write |
| none | listing.create | Commit fails mid-transaction | none (unchanged) | Rollback; `SYS.UNAVAILABLE` (retryable) |
| draft | (any) | Owned by mod_edit, mod_publish, mod_archive | — | Out of scope here |

## Validation & errors
Guard failures reuse codes from PS-002-02, PS-002-05 and PS-002-06. No new state-related error codes.

## Authorization
Guards for the first row (authorized owner, eligible account) are defined in PS-002-05.

## Failure, idempotency, concurrency, offline
- Two creates with different keys produce two independent drafts. No uniqueness is enforced across listings (ASSUMPTION).
- Offline replays enter the same transition as online creates, with the original `occurred_at` (CTR-EVT-001 R04).
- Replays of an acknowledged create are no-ops.

## Privacy, retention, abuse
Draft state is visible only to the owner (PS-002-05). State values carry no personal data.

## Observability & budgets
Counter `lst_state_transitions_total{from,to,event}`. Only `none → draft` may appear; any other pair is an alert (see PS-002-08).

## Tests
- TEST-PS-002-03-01 (unit): table-driven test; each row yields the stated state, error and side effect.
- TEST-PS-002-03-02 (integration): after 500 random mixed requests, every stored record has `state = draft` and `revision = 1`.
- TEST-PS-002-03-03 (offline): `pending_local` and `not_applied` never appear in any server response or record.

## Acceptance criteria
1. Transition table has exactly the rows above; no other transitions exist.
2. A failed create leaves zero rows and zero events in 100% of fault-injection runs.
3. TEST-PS-002-03-01 to -03 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved): local pending queue until relay ack.
- ASSUMPTION: no per-owner uniqueness of titles or drafts.
