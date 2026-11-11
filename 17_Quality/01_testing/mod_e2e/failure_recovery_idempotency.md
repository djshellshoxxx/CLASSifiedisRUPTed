# PS-134-06 — Failure recovery and idempotency: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-06.R01** Offline replay is verified: an offer created offline keeps exactly one OutboxEntry with its original cid across a page reload during the outage, and after reconnect the seller vault applies it exactly once (statements dedupe by cid; relay commands keep their Idempotency-Key).
- **PS-134-06.R02** Parallel workers are fully isolated by browser context, vault and relay tenant; no shared state exists between tests.
- **PS-134-06.R03** A failed test is retried at most once in CI; the report marks flaky tests, appends each run to the stored history artifact reports/e2e-history.json, and the job fails if any single test needed a retry in more than 3 of the last 20 CI runs read from that history.

## Specification

- **idempotency:** E2E runs are repeatable: each worker starts a fresh relay, database and browser context, so a re-run never depends on earlier state.
- **concurrency:** Workers run in parallel with unique tenants and ports; tests in one file are serial when they share a context.
- **retries:** One retry in CI for browser-level flakiness, none locally; a retried pass is reported as flaky and recorded per test in reports/e2e-history.json, and more than 3 retried runs of one test in the last 20 fail the job (V09). The system's own retry behavior is tested by explicit offline and reconnect steps.
- **offline:** Offline is simulated with context.setOffline(true) and with route abort for flaky network profiles; the suite proves the app shell works offline after first visit.
- **partial failure:** If the relay or browser crashes, the worker fails its current test with a trace, restarts, and the remaining tests continue; the final exit code reflects any failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T01 | e2e | PS-134-01.R01, PS-134-01.R02, PS-134-06.R02 | two workers run journeys in parallel | separate tenants and databases; no cross-test interference |
| TEST-PS-134-09.T06 | e2e | PS-134-03.R03, PS-134-06.R01 | go offline, create offer, reload page, go online, seller acknowledges | one OutboxEntry with the original cid survives the reload; the seller vault applies the offer once (dedupe by cid); labels move Saved on this device, then Delivered to relay, peer has not confirmed, then Confirmed by peer and never ahead of the reached state |
| TEST-PS-134-09.T10 | e2e | PS-134-06.R03 | history artifact reports/e2e-history.json where test A needed a retry in 4 of the last 20 runs and test B in 3, plus a new run where A fails on its first attempt | the run marks A flaky; the job fails with QUALITY_E2E_FLAKY naming test A only; test B passes the rule |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01. Predecessor: [domain_schema.md](domain_schema.md).
