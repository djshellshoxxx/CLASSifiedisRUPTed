# PS-034-08 — Observability and performance: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-08.R01** The PWA sends no telemetry (OBS-7); the host exports metrics and logs per OBS-1 to OBS-6.
- **PS-034-08.R02** Close lag p95 ≤ 2 s and p99 ≤ 5 s after currentEndsAt on the host with 1 000 auctions ending in the same minute.
- **PS-034-08.R03** Result verification in the vault completes in ≤ 300 ms with 5 000 ledger entries.

## Specification

**Metrics**
- classrup_auctions_results_total{outcome=won|unsold|voided,state} (host)
- classrup_auctions_close_lag_ms (host histogram: close commit minus currentEndsAt)
- classrup_auctions_close_lease_conflicts_total (host)
- classrup_auctions_nonpayment_total and classrup_auctions_void_after_payment_total (vault local counters)

**Logs**
- info auction.closed {auctionId, resultId, outcome, correlationId} on the host - no bidder keys or prices.

**Budgets**
- close lag p95 ≤ 2 s and p99 ≤ 5 s with 1 000 simultaneous closes; determine transaction p95 ≤ 100 ms.
- Result receive plus Deal open p95 ≤ 250 ms in the vault.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T13 | load | PS-034-08.R02, PS-034-08.R03 | 1 000 auctions end in the same minute; 5 000 entry ledger verify | close lag p95 ≤ 2 s, p99 ≤ 5 s; verify ≤ 300 ms |
| TEST-PS-034-09.T18 | e2e | PS-034-08.R01 | network capture of the PWA through result, settlement, void notice and second-chance screens | zero telemetry or analytics requests |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
