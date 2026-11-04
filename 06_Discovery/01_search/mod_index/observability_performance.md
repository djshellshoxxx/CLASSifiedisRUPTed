# PS-045-08 — Observability and performance: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-08.R01** Index freshness, backlog and rejection counts are measured; relays export them per CTR-OBS-001 and vaults keep them in the local diagnostics log only (OBS-7).
- **PS-045-08.R02** Indexing keeps up with 200 events per second on a relay and 50 events per second in a vault, and freshness stays within 5 seconds at p95.
- **PS-045-08.R03** A full rebuild of 100 000 documents on a relay completes within 10 minutes and of 5 000 documents in a vault within 30 seconds, without blocking reads.

## Specification

**Metrics**
- classrup_discovery_index_documents{status=active|removed} (relay export; vault local counter)
- classrup_discovery_index_apply_total{outcome=upserted|removed|ignored_stale|rejected}
- classrup_discovery_index_freshness_ms (histogram: now - event occurredAt at commit)
- classrup_discovery_index_rebuild_duration_ms

**Logs**
- info index.applied {sourceKind, op, correlationId} - no titles, bodies or DIDs; relay logs follow OBS-1, vault logs stay on the device.
- warn index.rejected {code, sourceKind, correlationId}.

**Budgets**
- Single upsert p95 <= 50 ms on the relay, <= 80 ms in the vault on a Moto G-class device; freshness p95 <= 5 s.
- Relay rebuild of 100 000 documents <= 10 min while query p95 stays <= 200 ms; vault rebuild of 5 000 documents <= 30 s.
- Index size <= 1.5 KiB per document average including FTS tokens (vault cap about 8 MiB).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T14 | load | PS-045-08.R01, PS-045-08.R02, PS-045-08.R03 | 200 events/s on relay for 5 minutes and 5 000 documents rebuild in a vault emulation | freshness p95 <= 5 s; relay 100 000 rebuild <= 10 min; vault rebuild <= 30 s |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
