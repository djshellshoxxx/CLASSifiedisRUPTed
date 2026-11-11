# PS-049-08 — Observability and performance: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-08.R01** Relays export proximity query metrics per CTR-OBS-001; the PWA keeps only local diagnostics.
- **PS-049-08.R02** Proximity queries meet the search budget - relay p95 at most 200 ms over 100 000 documents and local p95 at most 120 ms over 5 000 documents.
- **PS-049-08.R03** Limit triggers are observable by reason.

## Specification

**Metrics**
- classrup_discovery_proximity_queries_total{outcome=ok|rate_limited|invalid}
- classrup_discovery_proximity_rate_limited_total{reason=center_changes|per_minute|per_hour|pattern}
- classrup_discovery_proximity_duration_ms (histogram)

**Logs**
- info proximity.served {radiusKm, resultCount, durationMs, correlationId} - no center cell, no caller id.
- warn proximity.limited {reason, correlationId}.

**Budgets**
- Relay p95 <= 200 ms at 100 000 documents and 50 req/s; local p95 <= 120 ms at 5 000 documents; cellsForRadius(100 km) <= 2 ms.
- Counter checks add <= 3 ms p95.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T11 | load | PS-049-08.R01, PS-049-08.R02, PS-049-08.R03 | 50 req/s for 5 minutes on a relay and 120 ms local budget run | relay p95 <= 200 ms, counters add <= 3 ms, metrics exported by reason |
| TEST-PS-049-09.T12 | abuse | PS-049-07.R03, PS-049-08.R03 | pattern of 9 queries over 4 centers within 25 km in an hour | local signal raised and quota halved for 24 h |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
