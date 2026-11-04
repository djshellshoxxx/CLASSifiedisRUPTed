# PS-128-08 — Observability and performance: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-08.R01** The PWA sends no telemetry; the library records local diagnostics (unlock duration, failures count, lock reason) in the vault, exportable by the user per OBS-7.
- **PS-128-08.R02** Unlock completes within 3 s p95 on a desktop-class device and within 8 s p95 on a Moto G-class device, running in a worker so the main thread stays responsive (INP ≤ 200 ms).
- **PS-128-08.R03** Sign and agree complete within 5 ms p95 desktop and 25 ms p95 Moto G.

## Specification

**Metrics**
- Local diagnostic counters: unlock_ms, unlock_failures, auto_locks, rotations (vault-local, exportable).

**Logs**
- local vault log key.unlocked {durationMs} and key.locked {reason}; never passphrases, keys or blobs.

**Budgets**
- unlock p95 ≤ 3 s (desktop) and ≤ 8 s (Moto G profile); sign p95 ≤ 5 ms and ≤ 25 ms; library bundle ≤ 40 KiB gzip.
- Main-thread blocking during unlock ≤ 50 ms per task.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T13 | load | PS-128-08.R02, PS-128-08.R03 | unlock under Moto G throttling; 1 000 signs | unlock p95 ≤ 8 s with main-thread tasks ≤ 50 ms; sign p95 ≤ 25 ms |
| TEST-PS-128-09.T14 | unit | PS-128-08.R01, PS-128-09.R01, PS-128-09.R03 | traceability tool run; telemetry scan of network calls | every PS-128 requirement maps to a passing test; zero network calls from the library |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
