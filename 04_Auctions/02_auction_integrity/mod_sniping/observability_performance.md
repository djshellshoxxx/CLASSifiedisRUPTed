# PS-038-08 — Observability and performance: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-08.R01** The host exports metrics and logs per OBS-1 to OBS-6; the PWA sends no telemetry (OBS-7).
- **PS-038-08.R02** Apply adds at most 5 ms to the p95 of the bid transaction.
- **PS-038-08.R03** The extension history is cacheable and meets p95 ≤ 50 ms.

## Specification

**Metrics**
- classrup_auctions_extensions_total
- classrup_auctions_extensions_per_auction (histogram at close)
- classrup_auctions_extension_cap_reached_total
- classrup_auctions_extension_quarantined_total (vault local counter)

**Logs**
- info auction.extended {auctionId, seq, correlationId} on the host - no bidder data.

**Budgets**
- apply p95 ≤ 5 ms inside the bid transaction; extension list p95 ≤ 50 ms for 30 rows.
- Property test of 100 000 bid sequences completes in ≤ 60 s in CI.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T12 | load | PS-038-08.R02, PS-038-08.R03 | 20 bids per second on one hot auction for 5 minutes | apply adds ≤ 5 ms p95; list p95 ≤ 50 ms |
| TEST-PS-038-09.T18 | e2e | PS-038-08.R01 | network capture of the PWA watching the countdown through extensions | zero telemetry or analytics requests |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
