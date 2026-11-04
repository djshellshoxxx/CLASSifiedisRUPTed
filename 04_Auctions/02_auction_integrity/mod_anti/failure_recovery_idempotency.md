# PS-036-06 — Failure recovery and idempotency: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-06.R01** Check and score are idempotent per (auction, subject, trigger sequence); repeated calls return the stored verdict.
- **PS-036-06.R02** The synchronous check never writes an allow record, so a crash cannot leave partial state; deny and flag writes are single transactions.
- **PS-036-06.R03** Linkage cache failure degrades predictably - equality check stays hard, other linkage uses cache up to 24 h and then fails open with a counter and an operator alert.

## Specification

- **idempotency:** Unique open check per (auction, subject); score keyed by (auction, subject, triggerBidSeq); consumed events deduplicated by (consumer, eventId).
- **concurrency:** The check runs inside the bid transaction under the auction lease; scoring runs outside the lease on a snapshot of the ledger at triggerBidSeq, so a delayed score never blocks bids.
- **retries:** Scoring retried 5 s, 15 s, 45 s then dead-letter per EVT-6 with an operator alert; the synchronous check is never retried inside the bid path.
- **offline:** Not applicable in vaults; on the host the check depends only on local SQLite data and the cached F07 projections.
- **partial failure:** If F07 data cannot be read at all, the key equality check still runs, other linkage fails open for at most 24 h with host_linkage_stale counted, and the operator is alerted; bids are never blocked by scoring failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T08 | chaos | PS-036-06.R01, PS-036-06.R02, PS-036-06.R03 | F07 cache unavailable; scoring job crashes; duplicate events | equality check still denies; linkage fails open with counter and alert; scoring retried; duplicates skipped |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S02.M01, F07.S03.M02, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
