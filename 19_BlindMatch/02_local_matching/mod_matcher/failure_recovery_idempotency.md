# PS-150-06 — Failure recovery and idempotency: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-06.R01** Keep jobs and results ephemeral; late completion cannot revive cancelled or superseded operations.
- **PS-150-06.R02** Read durable intent revision after loading to detect changes by another owner-bound controller.
- **PS-150-06.R03** Handle loader errors without network fallback or automatic retry; reopening resumes no job.

## Specification

- **idempotency:** No persistent request hash or replay response; current revisions control mutation and erase leaves no history.
- **concurrency:** Current revision and ephemeral epoch checks reject stale results; session rereads revision after loading.
- **retries:** No automatic retry or recovered job; owner chooses a fresh action after state inspection.
- **offline:** Local functions require no remote account, wallet, payment or network provider.
- **partial failure:** The matcher performs no writes. Loader and policy errors return fixed failures; cancellation and final admission suppress stale results.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T06 | integration | PS-150-06.R01, PS-150-06.R02, PS-150-06.R03 | Change an intent through another store and reject or stall the loader | Final durable revision and ephemeral epoch prevent stale results; no automatic retries or jobs |

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
