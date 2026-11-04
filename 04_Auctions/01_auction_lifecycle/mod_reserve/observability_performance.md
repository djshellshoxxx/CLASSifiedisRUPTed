# PS-035-08 — Observability and performance: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-08.R01** The PWA sends no telemetry (OBS-7); the host relay exports metrics and logs per OBS-1 to OBS-6.
- **PS-035-08.R02** Open runs within 5 s of startsAt at the 95th percentile on the host.
- **PS-035-08.R03** Vault commands meet p95 ≤ 150 ms; host accept_hosting meets p95 ≤ 300 ms at 20 req/s.

## Specification

**Metrics**
- classrup_auctions_auctions_total{outcome=scheduled|opened|closed|cancelled} (host)
- classrup_auctions_open_lag_ms (host histogram: open time minus startsAt)
- classrup_auctions_host_required_refusals_total (vault local counter)

**Logs**
- info auction.opened {auctionId, correlationId} on the host - no reserve and no bidder data.

**Budgets**
- vault create/schedule p95 ≤ 150 ms; host accept_hosting p95 ≤ 300 ms at 20 req/s; get_public p95 ≤ 100 ms.
- Host opens 1 000 due auctions within 10 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T12 | load | PS-035-08.R01, PS-035-08.R02, PS-035-08.R03 | 1 000 due auctions and 20 accept_hosting req/s for 5 minutes | opens within 10 s, p95 ≤ 300 ms, metrics exported |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
