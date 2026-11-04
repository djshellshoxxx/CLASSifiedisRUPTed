# PS-050-06 — Failure recovery and idempotency: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-06.R01** rerank is deterministic and side-effect free, so retries are safe.
- **PS-050-06.R02** Windowed paging is stable for the lifetime of a query snapshot (15 minutes).
- **PS-050-06.R03** A failure returns an error and never a partially re-ranked page.

## Specification

- **idempotency:** Pure function; identical input yields identical output.
- **concurrency:** No shared state; safe for concurrent calls.
- **retries:** Not applicable; there is no I/O.
- **offline:** Works offline in the vault with the same code as on a relay.
- **partial failure:** A call returns a complete page or an error; there is no partial output.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T10 | unit | PS-050-06.R01, PS-050-06.R02, PS-050-06.R03 | repeat call after thrown error and during concurrent calls | no shared state; same result |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
