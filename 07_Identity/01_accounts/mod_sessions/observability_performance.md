# PS-054-08 — Observability and performance: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-08.R01** Relays export session metrics per CTR-OBS-001 without DIDs or tokens as labels; the vault keeps only local counters.
- **PS-054-08.R02** Challenge issue and start meet the write budget of p95 at most 300 ms at 50 req/s; vault unlock completes within 1.5 seconds on a Moto G-class device.
- **PS-054-08.R03** Per-request token verification adds at most 2 ms p95.

## Specification

**Metrics**
- classrup_identity_session_starts_total{outcome=ok|bad_signature|expired_challenge|key_inactive|rate_limited|doc_unavailable}
- classrup_identity_sessions_active (gauge, relay)
- classrup_identity_challenges_evicted_total (relay)
- local counter vault_unlock_total{outcome=ok|wrong_passphrase|backoff}

**Logs**
- info session.started {kind, correlationId} - no DID, token, nonce or key.
- warn session.start_failed {reasonClass, correlationId} - relay diagnostics only, no inputs.

**Budgets**
- challenge and start p95 <= 300 ms at 50 req/s; token verification <= 2 ms p95; vault unlock <= 1.5 s and passphrase change <= 3 s on a Moto G-class device (scrypt N=2^17).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T12 | load | PS-054-08.R01, PS-054-08.R02, PS-054-08.R03 | 50 starts per second for 5 minutes; unlock on emulated Moto G | p95 <= 300 ms, verification <= 2 ms, unlock <= 1.5 s; metrics carry no DID labels |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
