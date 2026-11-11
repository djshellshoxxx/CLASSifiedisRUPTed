# PS-067-09 — Contract and acceptance tests: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-09.R01** Every requirement is covered by at least one automated test.
- **PS-067-09.R02** Contract tests validate command outputs and statement envelopes against the schema registry.
- **PS-067-09.R03** Honest-label behavior is checked in UI tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults A (payer) and B (payee) with a Deal for EUR 45.00 allowing cash; jurisdiction profile with cash limit EUR 1 000.00; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T01 | unit | PS-067-01.R01, PS-067-01.R03, PS-067-02.R01 | propose valid terms | row stored with acknowledgementRequired true, status proposed, signed statement created |
| TEST-PS-067-09.T02 | unit | PS-067-02.R02, PS-067-02.R03 | each rule V01 to V07 violated in turn | documented error code and nothing stored |
| TEST-PS-067-09.T03 | property | PS-067-03.R01, PS-067-03.R02 | random sequences of set, accept and expiry | only declared transitions succeed; at most one accepted terms per obligation |
| TEST-PS-067-09.T04 | integration | PS-067-03.R02, PS-067-03.R03 | clock advanced 7 days on a proposal; claim made under old terms then new proposal | proposal expires to defaults; existing claim keeps old terms |
| TEST-PS-067-09.T05 | contract | PS-067-04.R01, PS-067-04.R02, PS-067-09.R02 | execute both commands and ingest in vault B | outputs and envelopes validate; no events emitted |
| TEST-PS-067-09.T06 | integration | PS-067-04.R03, PS-067-01.R02 | commerce.deal.opened delivered twice | exactly one default terms row per cash obligation |
| TEST-PS-067-09.T07 | abuse | PS-067-05.R01, PS-067-05.R02, PS-067-05.R03 | payer proposes terms; third-party signer; relay inspects traffic | FORBIDDEN or quarantine; relay sees only ciphertext |
| TEST-PS-067-09.T08 | integration | PS-067-06.R01, PS-067-06.R02, PS-067-06.R03 | replay of a command ID and interrupted delivery | original result; UI shows prepared until peer_accepted |
| TEST-PS-067-09.T09 | abuse | PS-067-07.R01, PS-067-07.R02, PS-067-07.R03 | hint equal to stored private address; 2 proposals in an hour | hint rejected with COMMERCE_CASH_HINT_PRIVATE; second proposal RATE_LIMITED |
| TEST-PS-067-09.T10 | unit | PS-067-08.R01, PS-067-08.R02, PS-067-08.R03 | diagnostics and timing run | no network telemetry; budgets met |
| TEST-PS-067-09.T11 | e2e | PS-067-01.R03, PS-067-09.R03 | claim cash then acknowledge on second device | labels read claimed (unverified) then acknowledged by payee; never confirmed; axe zero serious issues |
| TEST-PS-067-09.T12 | unit | PS-067-09.R01 | traceability tool run | every PS-067 requirement maps to a passing test |
| TEST-PS-067-09.T13 | integration | PS-067-10.R01, PS-067-10.R02, PS-067-10.R03 | export, import to fresh vault, roll back one release | terms round-trip identical; expired proposals import as expired |

## Acceptance criteria

- All tests T01 to T13 pass in CI.
- A cash claim can reach acknowledged but never confirmed or final, and no UI text implies verification.
- Safety guidance is displayed for every cash claim and never blocks on its own.

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F18.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
