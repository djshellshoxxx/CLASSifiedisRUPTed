# PS-087-06 — Failure recovery and idempotency: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-06.R01** Calling decide() repeatedly with the same inputs returns the same decision, so retries are safe.
- **PS-087-06.R02** Draining is idempotent since releasing an envelope already accepted yields duplicate.
- **PS-087-06.R03** Failures leave no partial state because the library writes nothing.

## Specification

- **idempotency:** Pure and deterministic; the same envelope delivered N times yields one next/buffer decision followed by N-1 duplicate decisions.
- **concurrency:** No shared state; the caller serializes decisions per author inside one storage transaction, and this module's unit tests assert order independence of drain().
- **retries:** Not applicable; callers retry delivery, not decisions.
- **offline:** Runs offline in the vault and in workers; the 24 h window is measured with the device clock plus a monotonic check, and a backwards clock jump never extends the window.
- **partial failure:** A decision either returns a full Decision or an error; there is no partial result.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T07 | unit | PS-087-03.R01, PS-087-06.R01, PS-087-06.R02 | expired() with buffer rows at 23 h 59 min and 24 h 00 min; backwards clock jump | only the 24 h row expires; jump does not extend the window |
| TEST-PS-087-09.T08 | unit | PS-087-06.R03, PS-087-05.R02 | repeat decide 1000 times and drain twice | identical results; second drain returns duplicates; no state written |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
