# PS-033-08 — Observability and performance: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-08.R01** The PWA sends no telemetry (OBS-7); the host relay exports metrics and logs per OBS-1 to OBS-6, without maxima or keys.
- **PS-033-08.R02** Bid placement meets p95 ≤ 150 ms on the host at 50 bids per second across 500 auctions, and p99 ≤ 400 ms for one hot auction at 20 bids per second.
- **PS-033-08.R03** Ledger verification of 5 000 entries in the vault completes in ≤ 500 ms.

## Specification

**Metrics**
- classrup_auctions_bids_total{outcome=placed|rejected|retracted|expired,code} (host)
- classrup_auctions_bid_lease_wait_ms (host histogram)
- classrup_auctions_bid_lease_expired_total (host)
- classrup_auctions_ledger_verify_failures_total and classrup_auctions_bids_not_placed_total (vault local counters)

**Logs**
- info bid.placed {auctionId, seq, correlationId} on the host - no bidder key, no amount, no maximum.

**Budgets**
- host bid placement p95 ≤ 150 ms at 50 req/s; hot auction p99 ≤ 400 ms at 20 req/s; lease wait p95 ≤ 50 ms.
- public ledger page of 100 entries p95 ≤ 100 ms; vault verification of 5 000 entries ≤ 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T13 | load | PS-033-08.R02, PS-033-08.R03 | 500 auctions at 50 bids per second and one hot auction at 20 per second for 5 minutes | p95 ≤ 150 ms, hot p99 ≤ 400 ms, ledger verify 5 000 entries ≤ 500 ms |
| TEST-PS-033-09.T20 | e2e | PS-033-08.R01 | network capture of the PWA while bidding, retracting and checking receipts | requests go only to the auction host; zero telemetry or analytics requests |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
