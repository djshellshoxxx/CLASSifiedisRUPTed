# PS-091-08 — Observability and performance: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-08.R01** Peer status counts, health scores and quota use are exported on relays; the PWA keeps the same information in local diagnostics only.
- **PS-091-08.R02** resolve_key and quota check add at most 2 ms p95 to inbox handling.
- **PS-091-08.R03** Alerts fire on any automatic suspension and on health below 60 for an active peer.

## Specification

**Metrics**
- classrup_federation_peers{status}
- classrup_federation_peer_health_score{peer} (gauge, cardinality ≤ 200)
- classrup_federation_peer_quota_rejections_total
- classrup_federation_peer_suspensions_total{reason}
- classrup_federation_peer_offers_total{outcome=stored|merged|rate_limited|invalid}

**Logs**
- warn federation.peer.suspended {peerId, relayId, reason, correlationId} — no keys beyond did prefix (16 chars).

**Budgets**
- resolve_key p95 ≤ 2 ms with an in-memory cache refreshed on change; writes p95 ≤ 300 ms.
- Health event processing keeps up with 500 events/s; receive_offer p95 ≤ 50 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T14 | load | PS-091-08.R01, PS-091-08.R02, PS-091-08.R03 | 500 health events per second and 10 000 resolve_key calls | resolve_key p95 ≤ 2 ms, gauges exported, alert on automatic suspension |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F15.S04.M02, F07.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
