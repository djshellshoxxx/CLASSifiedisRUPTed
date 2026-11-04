# PS-068-09 — Contract and acceptance tests: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-09.R01** Every requirement is covered by at least one automated test.
- **PS-068-09.R02** Adapter behavior is tested against recorded Esplora and EVM JSON-RPC fixtures with no network access in CI.
- **PS-068-09.R03** Reorg, underpayment, wrong asset and no-verifier scenarios are covered deterministically.

## Specification

See the module test table below (all processes).

**Fixtures:** Recorded fixtures: Bitcoin tx with 0, 1, 5, 6 confirmations and an orphaned block; EVM tx pre-finalized and finalized, reverted tx, USDC transfer from correct and wrong contract; two-vault setup; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T01 | unit | PS-068-01.R01, PS-068-01.R02, PS-068-02.R01 | create a request with valid and invalid addresses for each chain | valid request stored and signed; invalid returns COMMERCE_CRYPTO_ADDRESS_INVALID |
| TEST-PS-068-09.T02 | unit | PS-068-01.R03, PS-068-02.R02 | inputs with a WIF key, an xprv string, and a 12-word phrase in note and txRef | COMMERCE_CRYPTO_SECRET_REJECTED, nothing stored or logged |
| TEST-PS-068-09.T03 | unit | PS-068-02.R03, PS-068-03.R02 | no verifier configured and a crypto claim made | claim stays claimed, verification.source self, no observation, COMMERCE_CRYPTO_NO_VERIFIER on refresh |
| TEST-PS-068-09.T04 | integration | PS-068-02.R03 | underpaid, wrong address, wrong token contract and reverted transactions | matchResult recorded; claim never confirmed |
| TEST-PS-068-09.T05 | property | PS-068-03.R01 | random verifier answer sequences | only declared transitions occur; final is never followed by another state |
| TEST-PS-068-09.T06 | integration | PS-068-03.R03 | Bitcoin block orphaned at 2 confirmations then transaction re-included; and absent for 24 h | reorged then pending then confirmed; second case ends failed |
| TEST-PS-068-09.T07 | integration | PS-068-03.R02, PS-068-03.R04 | Bitcoin at 5 then 6 confirmations; EVM below then at finalized tag; claim expiry at 14 days | finalized only at 6 and finalized tag; observation stopped at expiry |
| TEST-PS-068-09.T08 | contract | PS-068-04.R01, PS-068-04.R02, PS-068-09.R02 | execute each command and run an observation to final | outputs, envelopes and events validate against registry schemas |
| TEST-PS-068-09.T09 | integration | PS-068-04.R03, PS-068-06.R01 | consumed events delivered twice; same command ID replayed | one request and one observation; original result returned |
| TEST-PS-068-09.T10 | abuse | PS-068-05.R01, PS-068-05.R02, PS-068-05.R03 | request signed by the payer; third-party statement; relay inspects traffic | quarantined or FORBIDDEN; relay sees only ciphertext |
| TEST-PS-068-09.T11 | chaos | PS-068-06.R02, PS-068-06.R03 | endpoint timeouts, two endpoints disagreeing, endpoint returning lower height | claim status unchanged, disagreement flagged, no progress applied |
| TEST-PS-068-09.T12 | integration | PS-068-07.R01, PS-068-07.R03 | inspect outbound endpoint requests and local logs | only txid or address lookups to the configured endpoint; no addresses or amounts in logs |
| TEST-PS-068-09.T13 | abuse | PS-068-07.R02 | 4 refreshes in one minute | 4th returns RATE_LIMITED |
| TEST-PS-068-09.T14 | integration | PS-068-06.R03 | app closed for 3 days with the transaction finalized meanwhile | on open the observation catches up and reaches final with checkedAt updated |
| TEST-PS-068-09.T15 | load | PS-068-08.R01, PS-068-08.R02, PS-068-08.R03 | 20 active observations polled for 10 minutes | commit p95 ≤ 100 ms, poll cycle ≤ 3 s, no telemetry sent |
| TEST-PS-068-09.T16 | unit | PS-068-09.R01, PS-068-09.R03 | traceability tool run and fixture coverage check | every PS-068 requirement maps to a passing test |
| TEST-PS-068-09.T17 | integration | PS-068-10.R01, PS-068-10.R02, PS-068-10.R03 | export, import to fresh vault, roll back one release | requests and observations round-trip; imported open observations restart as watching |

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- With no verifier configured, no crypto claim ever leaves claimed.
- No code path reads, requests, stores or logs a private key or seed phrase, verified by input rejection tests and static analysis.
- A reorg is always visible to the user and never leaves a stale final state.

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
