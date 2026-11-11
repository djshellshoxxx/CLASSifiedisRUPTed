# PS-138-06 — Failure recovery and idempotency: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-06.R01** Idempotency is verified under each fault: replaying a command whose response was lost returns the stored result with no duplicate effect (CTR-IDM-001).
- **PS-138-06.R02** Consumers dedupe by event ID, so duplicate or reordered deliveries are safe (CTR-EVT-001).
- **PS-138-06.R03** After any single injected fault, a sweep with nothing else running covers every participant vault (reservation store: no classrup.bazaar.reservation/v1 hold past expiresAt; saga state: no saga stuck outside a documented state; sync outbox: every OutboxEntry in a documented F15.S01.M01 state) and, on the relay, only the relay-hosted leases (auction close) and the mailbox and federation queues.
- **PS-138-06.R04** Recovery bounds are per scenario and derived from the owner's schedule on the FakeClock: 60 s for local faults (db_busy, idb_abort, consumer_crash, duplicate_delivery, combined_busy_crash); for peer_outage the next scheduled F11.S02.M01 round (1 min, then 15 min after the previous round) plus one IDM-4 cycle, about 16 min of fake time, or 60 s after federation.peer.reinstated; for vault_outbox_outage the F15.S01.M01 behavior is asserted instead of auto-drain - after 6 IDM-4 attempts (each delay uniform in [0, min(30 s, 500 ms x 2^(n-1))], retryAfterMs honoured) the entry is failed with failureReason retry_exhausted, and after Retry now it reaches transport_acknowledged.
- **PS-138-06.R05** Clock skew invariants are checkable without trusted time (ADR-0016 section 5): (1) ordering by seq, revision and outbox order never depends on wall time; (2) an entity that has expired never comes back when the clock moves backwards and its expiry event fires exactly once; (3) a vault whose clock is +24 h expires its own reservations and cycles by its own clock and the other vaults see a signed withdrawal or expiry rather than silent divergence; (4) relay-hosted leases (IDM-3, auction close) use only the relay clock.

## Specification

- **idempotency:** Scenarios are re-runnable from the seed; the relay and the vaults under test are rebuilt per scenario so earlier faults leave no residue.
- **concurrency:** Scenarios run sequentially per relay but in parallel across workers; fault schedules use a seeded PRNG so concurrency interleavings are reproducible.
- **retries:** No retries of failed scenarios; the system's retry behavior is what is under test - busy timeout 5 000 ms, CTR-IDM-001 IDM-4 full-jitter backoff (base 500 ms, cap 30 s, 6 attempts, retryAfterMs honoured) and the F11.S02.M01 PeerOutbox rounds at 1 min, 15 min, 1 h, 6 h and 24 h after the previous round.
- **offline:** Peer outage and network faults are simulated by fake transports; no real network is used.
- **partial failure:** The runner continues remaining scenarios after one fails, writes all results, and exits with the worst code.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T03 | chaos | PS-138-02.R01, PS-138-06.R01 | db_busy: SQLITE_BUSY for 12 s during accept commands | commands retried or DEPENDENCY_UNAVAILABLE; no half-commit; exactly-once after replay |
| TEST-PS-138-09.T04 | chaos | PS-138-03.R01, PS-138-03.R02, PS-138-06.R03 | consumer_crash - crash before and after ack on a cycle execution | no duplicate effect; no hold past expiresAt in any participant vault reservation store; no stuck vault saga; recovery within 60 s |
| TEST-PS-138-09.T06 | chaos | PS-138-04.R01, PS-138-04.R03, PS-138-06.R02, PS-138-09.R02 | duplicate_delivery - events and statements delivered twice and reordered, correct code then a planted double-apply bug | correct code dedupes by event ID and cid with one effect; the planted bug violates the invariant and exits 1 |
| TEST-PS-138-09.T07 | chaos | PS-138-06.R05, PS-138-09.R03 | clock_skew - vault Bob -24 h after reservation r1 expired; vault Carol +24 h holding live reservation r2 in an open cycle; vault clock skewed during a relay-hosted auction close lease; planted bug resurrecting an expired reservation | the planted bug is detected; with correct code ordering by seq, revision and outbox order is unchanged, r1 stays expired with its expiry event fired once, Carol expires r2 and the cycle by her own clock and the other vaults receive her signed withdrawal, and the auction lease follows the relay clock only |
| TEST-PS-138-09.T08 | chaos | PS-138-06.R04 | peer_outage 10 min then recovery, once by schedule and once with federation.peer.reinstated | local commands keep succeeding; deliveries resume at the next scheduled round within about 16 min of fake time, or within 60 s of reinstatement, without duplicate import |
| TEST-PS-138-09.T15 | chaos | PS-138-06.R01 | combined_busy_crash: busy writes while consumer crashes | invariants hold and outbox drained |
| TEST-PS-138-09.T20 | chaos | PS-138-06.R04 | vault_outbox_outage - destination relay unreachable for 10 min, then Retry now after it returns | each of the 6 attempt delays lies in [0, min(30 s, 500 ms x 2^(n-1))], retryAfterMs honoured; entry failed with retry_exhausted after attempt 6 and no 7th attempt; after Retry now it reaches transport_acknowledged |
| TEST-PS-138-09.T22 | chaos | PS-138-01.R03, PS-138-06.R03 | idb_abort - the vault storage/indexeddb adapter aborts the 3rd write of an offer-accept transaction | the whole transaction rolls back (no hold without a Deal); the sweep of each vault reservation store, saga state and sync outbox and of the relay queues shows nothing stuck |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03, F15.S01.M01, F11.S02.M01, F11.S01.M02, F01.S03.M01, F16.S02.M02, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
