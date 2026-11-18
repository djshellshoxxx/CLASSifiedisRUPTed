# PS-065-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03, offline), CTR-PRV-001 (RET-EVD), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-06.R01 | Attestation commit and event are atomic (transaction or outbox). | MVP |
| PS-065-06.R02 | Duplicate attestations (same key or same signed payload digest) return the original line. | MVP |
| PS-065-06.R03 | Two-party race: both attestations commit; state transitions are recomputed from lines (not from event order). | MVP |
| PS-065-06.R04 | Dispute referral to F09 is at-least-once; referral is idempotent by `handoff_id` and reason. | MVP |
| PS-065-06.R05 | Offline attestations: signed on device, queued until relay ack; if the window closed → `not_applied`. | MVP |
| PS-065-06.R06 | Client retries only retryable codes, max 5 attempts, backoff with jitter. | MVP |

## Data / schema
Lines are append-only. Idempotency record 7 days. Dispute referral outbox: `handoff_id`, `reason`, `sent_at`.

## Commands / queries / events
Retry rules apply to all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Device queue: `queued` → `acknowledged` | `not_applied`. Not-applied items shown to the attesting party.

## Validation & errors
Non-retryable codes not auto-retried. Window-closed attestation submitted offline is shown as not applied; the party is told the handoff window closed, not who is at fault.

## Authorization
Server re-authorizes each attempt.

## Failure, idempotency, concurrency, offline
- Crash between commit and dispute referral: outbox resends; F09 de-duplicates.
- Key registry outage: `KEY_UNKNOWN` retryable; attestation not accepted unsigned.
- Clock skew: server time decides window (PS-065-02 R04).

## Privacy, retention, abuse
Device queue holds signed payloads only for pending items; purged on ack or logout. Rate limit 20 attestations per account per day (ASSUMPTION).

## Observability & budgets
`handoff_outbox_lag_seconds` p95 ≤ 5 s; `handoff_referral_retry_total`.

## Tests
- TEST-PS-065-06-01 (integration): crash after attestation commit before referral; referral sent once.
- TEST-PS-065-06-02 (concurrency): simultaneous attestations from both parties; both commit; state `confirmed_mutual` or `disputed` per content.
- TEST-PS-065-06-03 (offline): attestation queued past window → `not_applied` with user message.
- TEST-PS-065-06-04 (fault): key registry down → retryable; no unsigned line accepted.

## Acceptance criteria
1. No duplicate lines under replay.
2. State derived deterministically from lines.
3. Offline attestations never silently dropped.
4. Dispute referral delivered exactly once in effect.

## Assumptions & open decisions
- ASSUMPTION: 20 attestations per account per day.
- PROVISIONAL (D08 default, unapproved): local pending queue until acknowledgment.
- PROVISIONAL (D04 default, unapproved): compensating recovery via dispute flow.
