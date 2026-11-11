# PS-051-06 — Failure recovery and idempotency: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-06.R01** Publication is idempotent by Idempotency-Key and guarded by expectedActiveVersion so concurrent publishers cannot both win.
- **PS-051-06.R02** Activation is one SQLite transaction, so a crash leaves exactly one active version.
- **PS-051-06.R03** Scoring is pure, so re-ranking after any failure gives the same order.

## Specification

- **idempotency:** Idempotency-Key required on publish and rollback; replay returns the stored response for 24 h; scoring has no side effects.
- **concurrency:** expectedActiveVersion compare-and-set inside BEGIN IMMEDIATE; the partial unique index on status active prevents two active rows.
- **retries:** Operators retry on RATE_LIMITED or DEPENDENCY_UNAVAILABLE with base 500 ms, cap 30 s, full jitter, max 6 attempts.
- **offline:** The vault scores offline with the bundled default; relay configs fetched earlier are cached 24 h for display only.
- **partial failure:** If signing fails the transaction aborts and the previous version stays active; if the statement is not delivered to clients, clients still fetch it with get_active.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T05 | property | PS-051-01.R02, PS-051-06.R03 | 200 runs of the same ranking | identical order; ties resolved by firstSeenAt then documentId |
| TEST-PS-051-09.T08 | integration | PS-051-06.R01, PS-051-06.R02 | same Idempotency-Key replayed; crash between insert and retire | original response replayed; exactly one active version after restart |
| TEST-PS-051-09.T12 | integration | PS-051-02.R03, PS-051-06.R03 | vault without relay config | bundled default used and explanation says default ranking |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
