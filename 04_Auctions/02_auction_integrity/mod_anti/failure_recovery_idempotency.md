# PS-036-06 — Failure recovery and idempotency: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-06.R01** Check and score are idempotent per (auction, subject, trigger sequence); repeated calls return the stored verdict.
- **PS-036-06.R02** The synchronous check never writes an allow record, so a crash cannot leave partial state; deny and flag writes are single transactions.
- **PS-036-06.R03** Linkage data unavailability degrades by one rule - the seller-key equality and revoked-key checks always run on host-local data, other linkage uses cached F07 data while it is at most 24 h old, beyond that linkage reasons fail open with a linkage_stale flag for review, a counter and an operator alert, and the check returns DEPENDENCY_UNAVAILABLE only when the equality check itself cannot run.

## Specification

- **idempotency:** Unique open check per (auction, subject); score keyed by (auction, subject, triggerBidSeq); consumed events deduplicated by (consumer, eventId).
- **concurrency:** The check runs inside the bid transaction under the auction lease; scoring runs outside the lease on a snapshot of the scoring projection at triggerBidSeq, so a delayed score never blocks bids.
- **retries:** Scoring retried 5 s, 15 s, 45 s then dead-letter per EVT-6 with an operator alert; the synchronous check is never retried inside the bid path.
- **offline:** Not applicable in vaults; on the host the check depends only on local SQLite data and the cached F07 projections.
- **partial failure:** Cache at most 24 h old - used for every linkage reason. No cache, or a cache older than 24 h - V01 and V07 still run on host-local data; V02 to V04 fail open, the check returns allow with flags [linkage_stale], a linkage_stale ShillCheck enters the moderator queue, classrup_auctions_shill_linkage_stale_total is counted and the operator is alerted. Host database or auction record unreadable, so V01 cannot run - the check returns DEPENDENCY_UNAVAILABLE and F04.S01.M02 rejects the bid. Bids are never blocked by scoring failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T08 | chaos | PS-036-06.R01, PS-036-06.R02, PS-036-06.R03 | F07 cache 23 h old, 25 h old and missing; host database unreadable; scoring job crashes; duplicate events | 23 h - linkage denies; 25 h and missing - the seller key and a revoked key are still denied, other linkage allows with a linkage_stale flag, counter and alert; unreadable - DEPENDENCY_UNAVAILABLE; scoring retried; duplicates skipped |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
