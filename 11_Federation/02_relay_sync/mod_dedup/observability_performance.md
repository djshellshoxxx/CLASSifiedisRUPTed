# PS-087-08 — Observability and performance: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-08.R01** Decision counts are exposed per kind so operators can see duplicate ratios and buffer pressure.
- **PS-087-08.R02** decide() has a p95 budget of 0.2 ms excluding storage lookups.
- **PS-087-08.R03** Buffer occupancy is a gauge and alerts when above 80 percent of 5000.

## Specification

**Metrics**
- classrup_federation_dedup_decisions_total{outcome=duplicate|next|buffer|fork|reject}
- classrup_federation_gap_buffer_size (gauge)
- classrup_federation_gap_buffer_age_ms (gauge: age of oldest buffered envelope)

**Logs**
- debug federation.dedup.decision {kind, authorPrefix(16), seq, correlationId} — no payload; the PWA writes this only to local diagnostics.

**Budgets**
- decide() p95 ≤ 0.2 ms; drain() of 100 buffered envelopes ≤ 5 ms.
- expired() over 5000 buffered envelopes ≤ 10 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T10 | load | PS-087-08.R01, PS-087-08.R02, PS-087-08.R03 | 100 000 decisions and 5000-row expiry scan | decide p95 ≤ 0.2 ms, expired ≤ 10 ms, metrics exported |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
