# PS-063-08 — Observability and performance: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-08.R01** The PWA keeps local diagnostics only (OBS-7) with counters for posted, verified and unverified cards.
- **PS-063-08.R02** Posting and state updates meet the vault budget of p95 ≤ 50 ms on a mid-range phone.
- **PS-063-08.R03** Rendering a thread with 50 cards meets p95 ≤ 100 ms.

## Specification

**Metrics**
- classrup_comms_cards_total{outcome=posted|verified|unverified|superseded|closed|frozen} (local diagnostics)
- classrup_comms_card_waiting_age_ms (gauge, local diagnostics)

**Logs**
- local info card.verified {cardId, kind} — no amounts.
- local warn card.unverified {cardId, reason}.

**Budgets**
- post and event update p95 ≤ 50 ms; list_thread 50 cards including owning-module rendering p95 ≤ 100 ms.
- Verification of one inbound card including hash and signature ≤ 20 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T10 | load | PS-063-08.R01, PS-063-08.R02, PS-063-08.R03 | thread with 50 cards and 500 events replayed | budgets met |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F01.S04.M02, F02.S01.M01, F02.S01.M04, F07.S02.M02, F16.S02.M02, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
