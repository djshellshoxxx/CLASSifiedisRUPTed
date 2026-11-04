# PS-011-08 — Observability and performance: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-08.R01** Command latency and outcomes are measured per CTR-OBS-001.
- **PS-011-08.R02** Make and accept meet the write budget (p95 ≤ 300 ms) at 50 req/s.
- **PS-011-08.R03** Expiry sweep lag is observable and alerting.

## Specification

**Metrics**
- classrup_bazaar_offers_total{outcome=made|accepted|rejected|withdrawn|expired}
- classrup_bazaar_offer_accept_conflicts_total
- classrup_bazaar_offer_expiry_lag_ms (gauge: now - oldest overdue made offer)

**Logs**
- info offer.accepted {offerId, listingId, correlationId} — no amounts or notes.

**Budgets**
- make/accept p95 ≤ 300 ms; list queries p95 ≤ 150 ms for ≤ 50 items.
- Expiry sweep processes 10 000 overdue offers in ≤ 5 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T13 | load | PS-011-08.R01, PS-011-08.R02 | 50 req/s mixed make/accept for 5 minutes | p95 ≤ 300 ms, metrics exported |
| TEST-PS-011-09.T14 | integration | PS-011-08.R03 | 10 000 overdue offers | sweep completes ≤ 5 s and lag gauge returns to 0 |

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
