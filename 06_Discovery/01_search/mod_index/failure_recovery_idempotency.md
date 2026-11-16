# PS-045-06 — Failure recovery and idempotency: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-06.R01** Event handling is idempotent through the inbox and the sourceRevision guard; replays never duplicate or resurrect documents.
- **PS-045-06.R02** A failed handler retries with backoff and moves to dead letter after 8 attempts, leaving the previous document in place.
- **PS-045-06.R03** A crash during rebuild leaves the live index untouched because the swap is one transaction.

## Specification

- **idempotency:** Consumers record (consumer, eventId) in the local inbox before side effects; rebuild requires an Idempotency-Key and replays the stored response for 24 h; upsert is keyed by (tenantId, sourceKind, sourceId, authorDid).
- **concurrency:** Single writer per vault (one IndexedDB or SQLite transaction per event); on a relay one writer per aggregate by (aggregate.id, revision) order; rebuild builds shadow tables and swaps in one transaction.
- **retries:** Handler retries use base 500 ms, cap 30 s, full jitter, max 8 attempts, then dead_letter; the vault shows 'search data needs repair' with a Rebuild button.
- **offline:** The local index is fully functional offline; the relay index is simply not queried. Statements fetched later are indexed on arrival in creation order.
- **partial failure:** If a projection cannot be verified because the author's identity document is unavailable, the event is retried for 24 h then quarantined; removals never depend on verification, only on the tombstone or unpublish event.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T06 | integration | PS-045-04.R02, PS-045-06.R01 | deliver the same event twice and an older edit afterwards | one document, stale edit ignored |
| TEST-PS-045-09.T11 | integration | PS-045-06.R02, PS-045-06.R03 | handler fails 8 times; crash during rebuild; verification key unavailable | dead_letter after 8 attempts; live index unchanged; event quarantined after 24 h |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
