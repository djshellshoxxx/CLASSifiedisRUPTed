# PS-035-06 — Failure recovery and idempotency: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-06.R01** Vault commands are idempotent through local command ids; host commands are idempotent by terms cid and auction id.
- **PS-035-06.R02** Host open, adjust_end and mark_closed run inside the per-auction lease (IDM-8) and are safe to repeat; a stale lease token is refused.
- **PS-035-06.R03** A seller vault crash after signing terms but before recording them is repaired by re-sending the same terms cid, which the host deduplicates.

## Specification

- **idempotency:** Local command id stored 24 h; host accept_hosting dedupes on termsCid and returns the same host_acceptance; open, adjust_end and mark_closed ignore repeats once their effect is stored.
- **concurrency:** Per-auction lease row on the host with a fencing token, TTL 5 s for bid-path commands and 30 s for the close path, always taken with BEGIN IMMEDIATE so adjust_end and mark_closed cannot interleave with bids; the seller vault uses a Web Locks lock auctions-auction-<id>.
- **retries:** Terms upload retries 1 s, 2 s, 4 s, 8 s up to 8 attempts, then shows needs attention; the host timer retries open every 5 s until success or cancellation.
- **offline:** Create and cancel (of a draft) work offline; schedule needs the host and shows prepared until the host acknowledges; the UI never says scheduled until the host countersignature is verified.
- **partial failure:** If the host acknowledges transport but the acceptance is lost, the seller sees proposed and can fetch the acceptance by termsCid; if the host is down at start time the auction opens late by the host clock and the delay is recorded, never backdated.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T05 | integration | PS-035-03.R03, PS-035-06.R02 | advance host clock past startsAt; run open twice and adjust_end with stale lease token | opened once; stale token refused |
| TEST-PS-035-09.T09 | integration | PS-035-06.R01, PS-035-06.R03 | replay schedule; crash after signing terms before recording | same termsCid and acceptance; host dedupes |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
