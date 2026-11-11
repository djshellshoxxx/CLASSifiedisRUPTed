# PS-067-09 — Contract and acceptance tests: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-09.R01** Every requirement is covered by at least one automated test.
- **PS-067-09.R02** Contract tests validate command outputs and statement envelopes against the schema registry.
- **PS-067-09.R03** Honest-label behavior is checked in UI tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults A (payer) and B (payee) with a Deal for EUR 45.00 allowing cash; a governance.jurisdiction_profile.resolve stub for the selected ProfileRef {publisherId P, code eu_de} version 3 returning effective.cashLimits [{amountMinor: 100000, currency: EUR}]; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T01 | unit | PS-067-01.R01, PS-067-01.R03, PS-067-02.R01 | propose valid terms | row stored with acknowledgementRequired true, status proposed, replacesTermsCid of the defaults, signed statement created |
| TEST-PS-067-09.T02 | unit | PS-067-02.R02 | each rule V01 to V10 violated in turn | documented error code and nothing stored |
| TEST-PS-067-09.T03 | property | PS-067-03.R01, PS-067-03.R02 | random sequences of set, accept, decline and expiry | only declared transitions succeed; at most one accepted terms per obligation at any time |
| TEST-PS-067-09.T04 | integration | PS-067-03.R02, PS-067-03.R03 | clock advanced 7 days on a proposal while the defaults are in force; claim made under accepted terms then a new proposal | proposal expires and the prior accepted terms stay in force; the existing claim keeps the termsCid it was signed with |
| TEST-PS-067-09.T05 | contract | PS-067-04.R01, PS-067-04.R02, PS-067-09.R02 | execute all three commands and ingest in vault B | outputs and envelopes validate; no events emitted |
| TEST-PS-067-09.T06 | integration | PS-067-04.R03, PS-067-01.R02 | commerce.deal.opened delivered twice | exactly one default terms row per cash obligation |
| TEST-PS-067-09.T07 | abuse | PS-067-05.R01, PS-067-05.R02, PS-067-05.R03 | payer proposes terms; third-party signer; relay inspects traffic | FORBIDDEN or quarantine; relay sees only ciphertext |
| TEST-PS-067-09.T08 | integration | PS-067-06.R01, PS-067-06.R02, PS-067-06.R03 | replay of a command ID and interrupted delivery | original result; UI shows prepared until peer_accepted |
| TEST-PS-067-09.T09 | abuse | PS-067-07.R01, PS-067-07.R02, PS-067-07.R03 | hint equal to stored private address; 2 proposals in an hour | hint rejected with COMMERCE_CASH_HINT_PRIVATE; second proposal RATE_LIMITED |
| TEST-PS-067-09.T10 | unit | PS-067-08.R01, PS-067-08.R02 | diagnostics and timing run | no network telemetry; budgets met |
| TEST-PS-067-09.T11 | e2e | PS-067-01.R03, PS-067-09.R03 | claim cash then acknowledge on second device | labels read claimed (unverified) then acknowledged by payee; never confirmed; axe zero serious issues |
| TEST-PS-067-09.T12 | unit | PS-067-09.R01 | traceability tool run | every PS-067 requirement maps to a passing test |
| TEST-PS-067-09.T13 | integration | PS-067-10.R01, PS-067-10.R02, PS-067-10.R03 | export, import to fresh vault, roll back one release | terms round-trip identical; expired proposals import as expired |
| TEST-PS-067-09.T14 | integration | PS-067-03.R01 | payer declines a proposal, then tries to accept it | proposed to declined with a signed decline statement and the prior accepted terms still in force; accept refused with CONFLICT_STATE |
| TEST-PS-067-09.T15 | integration | PS-067-03.R02, PS-067-01.R04, PS-067-04.R05 | defaults in force, payee proposes receiptRequired true, payer claims before accepting, then accepts and claims again | first claim signs the default termsCid; defaults superseded only in the acceptance transaction; second claim signs the new termsCid and triggers the receipt prompt after acknowledgement |
| TEST-PS-067-09.T16 | integration | PS-067-04.R04, PS-067-02.R04 | vault B ingests cash_terms signed by the payer, an accept signed by the payee, a duplicate and a valid terms statement | first two quarantined with signer_not_payee or signer_not_payer; duplicate is a no-op; the valid one applied once |
| TEST-PS-067-09.T17 | unit | PS-067-02.R03 | cash claim above the elevated guidance threshold with the guidance dismissed unread | claim allowed; guidance shown but never blocks; only V01, V04 and V05 can refuse a claim |
| TEST-PS-067-09.T18 | unit | PS-067-08.R03 | show standard and elevated guidance and trigger a cash limit rejection | classrup_commerce_cash_guidance_shown_total{level} and classrup_commerce_cash_limit_rejections_total increase in local diagnostics |
| TEST-PS-067-09.T19 | integration | PS-067-07.R04 | export, deletion and retention purge driven by F10 | section commerce.cash_terms exported; privacy.deletion.completed pseudonymizes the principal; RetentionPurgePort purges after RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-067-09.T20 | abuse | PS-067-07.R05 | blocked payee sends a terms statement; 10 000 fresh dids send terms statements | blocked statement dropped silently; quarantine stays within 500 entries or 5 MiB and non-party statements are dropped once it is full |
| TEST-PS-067-09.T21 | contract | PS-067-02.R05, PS-067-02.R02 | resolve stub returns cashLimits [EUR 1 000.00, USD 500.00] with sources naming {P, eu_de} version 3; cash obligations of EUR 2 500.00, EUR 1 000.00 and GBP 5 000.00; then a fallback resolve with empty cashLimits | resolve called with the vault's selected ProfileRefs and no profile id; EUR 2 500.00 refused with COMMERCE_CASH_LIMIT_EXCEEDED and details {limit EUR 1 000.00, profileRef {P, eu_de}, profileVersion 3}; EUR 1 000.00 and GBP 5 000.00 allowed with no FX conversion; fallback allows every amount |

## Acceptance criteria

- All tests T01 to T21 pass in CI.
- A cash claim can reach acknowledged but never confirmed or final, and no UI text implies verification.
- Safety guidance is displayed for every cash claim and never blocks on its own.
- Accepted cash terms are never replaced without the payer's signed acceptance of newer terms.

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F18.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
