# PS-014-06 — failure, recovery and idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-06.R01 | Cycle creation with N invitations is atomic: all slots or none. | MVP |
| PS-014-06.R02 | Replays of invite and accept return the original result for 7 days (CTR-EVT-001 R03). | MVP |
| PS-014-06.R03 | Retries only for retryable codes (PARTY.REGION_BELOW_THRESHOLD), max 3, backoff 1 s/2 s/4 s. | MVP |
| PS-014-06.R04 | Invitation delivery failure does not create a slot; the invite command fails and is retryable by key. | MVP |

## Data / schema
Uses `par_id`, `cyc_id`, `idempotency_key`, `expected_revision`. No extra tables.

## Commands / queries / events
Server timeout 2 s per command; client 5 s. Timeout after commit: replay the key.

## States & transitions
Crash before commit: no slot. Crash after commit: replay returns the slot.

## Validation & errors
Retryable only: `PARTY.REGION_BELOW_THRESHOLD`. All others need client change or are terminal.

## Authorization
Replay re-authorizes; a removed slot cannot accept on replay.

## Failure, idempotency, concurrency, offline
Accept vs decline vs expiry on one slot: slot row lock; loser gets `PARTY.ALREADY_RESOLVED`. Accept while cycle is being locked: lock order is cycle then slots; deadlock avoided by fixed order.
Offline: accept is never queued as an offline draft (it needs a fresh decision); decline and withdraw may queue (D08 PROVISIONAL) with the same key.

## Privacy, retention, abuse
Queued declines store `par_id` and key only.

## Observability & budgets
Metrics: replay count, conflicts per code. Alert on conflict rate above 2% for 15 minutes.

## Tests
- TEST-PS-014-06-01 (integration): fault after second of three invites → zero slots visible.
- TEST-PS-014-06-02 (concurrency): accept vs expiry race, 100 iterations, one outcome each.
- TEST-PS-014-06-03 (offline): queued decline replays once after reconnect.

## Acceptance criteria
1. No partial cycle is visible in 10,000 injected failures.
2. Zero duplicate `party.accepted` events.

## Assumptions & open decisions
- ASSUMPTION: accept is online-only for MVP.
- D08 PROVISIONAL (Dxx default, unapproved): local queue until acknowledgment, decline and withdraw only.
