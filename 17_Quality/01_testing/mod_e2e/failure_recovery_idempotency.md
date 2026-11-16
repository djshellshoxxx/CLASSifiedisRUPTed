# PS-134-06 — Failure recovery and idempotency: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-06.R01** Offline replay is verified: a command created offline is delivered once with the original Idempotency-Key after reconnect, even when the page is reloaded during the outage.
- **PS-134-06.R02** Parallel workers are fully isolated by tenant; no shared state exists between tests.
- **PS-134-06.R03** A failed test is retried at most once in CI; the report marks flaky tests and the job fails if any test needed a retry more than 3 times in 20 runs.

## Specification

- **idempotency:** E2E runs are repeatable: each worker starts a fresh relay, database and browser context, so a re-run never depends on earlier state.
- **concurrency:** Workers run in parallel with unique tenants and ports; tests in one file are serial when they share a context.
- **retries:** One retry in CI for browser-level flakiness, none locally; a retried pass is reported as flaky and tracked. The system's own retry behavior is tested by explicit offline and reconnect steps.
- **offline:** Offline is simulated with context.setOffline(true) and with route abort for flaky network profiles; the suite proves the app shell works offline after first visit.
- **partial failure:** If the relay or browser crashes, the worker fails its current test with a trace, restarts, and the remaining tests continue; the final exit code reflects any failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T01 | e2e | PS-134-01.R01, PS-134-01.R02, PS-134-06.R02 | two workers run journeys in parallel | separate tenants and databases; no cross-test interference |
| TEST-PS-134-09.T06 | e2e | PS-134-03.R03, PS-134-06.R01 | go offline, create offer, reload page, go online | pending shown, then replayed once with the same Idempotency-Key; no duplicate |
| TEST-PS-134-09.T10 | e2e | PS-134-06.R03 | run the same flaky test repeatedly with an injected failure on first attempt | reported as flaky; job fails after 3 retried tests in 20 runs |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
