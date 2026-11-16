# PS-101-06 — Failure recovery and idempotency: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-06.R01** Ingestion is idempotent through the unique source index and the inbox table of CTR-EVT-001 EVT-3.
- **PS-101-06.R02** A row and its event commit in one transaction.
- **PS-101-06.R03** Consumer failures retry with CTR-IDM-001 backoff and dead-letter after 8 attempts.

## Specification

- **idempotency:** Unique (tenantId, kind, sourceEventId); manual command uses a local Idempotency-Key replayed for 24 h.
- **concurrency:** Append-only inserts need no locking; summarize reads a consistent snapshot; the manual cap is enforced inside the insert transaction.
- **retries:** Event retries per EVT-6; callers of the manual command retry DEPENDENCY_UNAVAILABLE only.
- **offline:** The vault records signals from local events while offline; relay signals require the relay.
- **partial failure:** If the event insert succeeds but outbox dispatch fails, the dispatcher retries; summarize never reads partial transactions.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T04 | integration | PS-101-04.R03, PS-101-06.R01 | each consumed event delivered twice | exactly one signal per source event with documented weight |
| TEST-PS-101-09.T09 | integration | PS-101-06.R02, PS-101-06.R03 | transaction aborted mid-ingest; outbox dispatcher down | no partial row; event delivered after recovery |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
