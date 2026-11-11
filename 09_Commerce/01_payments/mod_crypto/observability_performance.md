# PS-068-08 — Observability and performance: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-08.R01** The PWA sends no telemetry (OBS-7); endpoint latency, errors and reorg counts are kept in local diagnostics.
- **PS-068-08.R02** Status updates are applied within one poll interval of the verifier reporting them.
- **PS-068-08.R03** Verifier disagreement and reorg counts are visible to the user.
- **PS-068-08.R04** Polling stays within the per-vault budget - one tip request per endpoint per interval, per-observation calls only when the tip moved - and when the budget runs out observations closest to finality go first, intervals widen and the rest show 'verification paused'; manual refresh is limited to 3 per minute per observation.

## Specification

**Metrics**
- Local diagnostics: classrup_commerce_chain_polls_total{chain,kind=tip|tx,outcome=ok|error|disagreement}
- Local diagnostics: classrup_commerce_chain_reorgs_total{chain,depth=pre_final|deep}
- Local diagnostics: classrup_commerce_chain_mismatches_total{reason}
- Local diagnostics: classrup_commerce_chain_budget_used (gauge per hour) and classrup_commerce_chain_budget_paused (gauge)
- Local diagnostics: classrup_commerce_chain_final_latency_s{chain} (histogram)

**Logs**
- info observation.status {claimId, from, to, chain, correlationId} — txid hash prefix only (first 8 chars), no addresses, no amounts.
- warn observation.deep_reorg {claimId, chain, correlationId} — no addresses.

**Budgets**
- Observation update commit p95 ≤ 100 ms local; a poll cycle for 20 active observations ≤ 3 s excluding network.
- Verifier timeout 8 s per call; 3 attempts; at most 900 endpoint calls per hour per vault.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T13 | abuse | PS-068-08.R04 | 4 refreshes in one minute | 4th returns RATE_LIMITED |
| TEST-PS-068-09.T14 | integration | PS-068-08.R02 | app closed for 3 days with the transaction finalized meanwhile | on open the observation catches up within one poll interval and reaches final with checkedAt updated |
| TEST-PS-068-09.T15 | load | PS-068-08.R01, PS-068-08.R02 | 20 active observations polled for 10 minutes | commit p95 ≤ 100 ms, poll cycle ≤ 3 s, no telemetry sent |
| TEST-PS-068-09.T26 | load | PS-068-08.R04 | 60 active observations with two endpoints per chain for one hour | at most 900 endpoint calls; observations closest to finality checked first; deferred ones show 'verification paused - check budget reached'; tip polls continue |
| TEST-PS-068-09.T31 | unit | PS-068-08.R03 | two endpoints disagree twice and one reorg and one deep reorg occur; diagnostics opened | commerce.crypto_observation.diagnostics and the verification panel show 2 disagreements, 1 reorg and 1 deep-reorg alert |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
