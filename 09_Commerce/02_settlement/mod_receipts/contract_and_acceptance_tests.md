# PS-071-09 — Contract and acceptance tests: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-09.R01** Every requirement is covered by at least one automated test.
- **PS-071-09.R02** Signatures are tested with RFC 8032 vectors and JCS vectors from RFC 8785.
- **PS-071-09.R03** Verification is tested against tampered, replayed and revoked-key receipts.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults A (payer) and B (payee) with an acknowledged EUR 45.00 cash claim; RFC 8032 test keys; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T01 | unit | PS-071-01.R01, PS-071-01.R03, PS-071-02.R03 | sign a payee receipt, then flip one byte of statement text | original verifies valid; edited copy fails with COMMERCE_RECEIPT_SIGNATURE_INVALID |
| TEST-PS-071-09.T02 | unit | PS-071-02.R01, PS-071-02.R02 | rules V01 to V07 violated in turn | documented error code returned and nothing stored |
| TEST-PS-071-09.T03 | unit | PS-071-01.R02, PS-071-03.R01, PS-071-03.R03 | attempt edit or delete via API and re-run verify after claim expiry | no edit path exists; verification result recomputed and receipt retained |
| TEST-PS-071-09.T04 | unit | PS-071-01.R03, PS-071-02.R03 | receipt for claim X replayed against claim Y | COMMERCE_RECEIPT_MISMATCH |
| TEST-PS-071-09.T05 | contract | PS-071-04.R01, PS-071-04.R02, PS-071-09.R02 | execute issue, ingest, verify and export | outputs and events validate against registry schemas |
| TEST-PS-071-09.T06 | integration | PS-071-04.R03 | identity.device_key.revoked delivered twice | keyStatus revoked_later set once and receipt still listed |
| TEST-PS-071-09.T07 | abuse | PS-071-05.R01, PS-071-05.R02, PS-071-05.R03 | non-party signer; wrong-role statement; relay traffic inspection | quarantined with reason; relay sees only ciphertext |
| TEST-PS-071-09.T08 | integration | PS-071-06.R01, PS-071-06.R02, PS-071-06.R03 | two tabs sign simultaneously; delivery fails after signing | one receipt; export still possible; UI shows prepared |
| TEST-PS-071-09.T09 | integration | PS-071-03.R02, PS-071-07.R01 | offline signing then reconnect | receipt delivered, sync state advances to peer_accepted only on signed acknowledgement |
| TEST-PS-071-09.T10 | e2e | PS-071-07.R02, PS-071-09.R03 | both parties open receipts | disclaimer shown; labels say asserted by signer; axe zero serious issues |
| TEST-PS-071-09.T11 | integration | PS-071-07.R03 | account deletion completes | signerId pseudonymized, signature flagged unverifiable-after-pseudonymization, counterparty copy unchanged |
| TEST-PS-071-09.T12 | abuse | PS-071-07.R03, PS-071-07.R01 | 21 incoming receipts in one hour from one sender | 21st quarantined |
| TEST-PS-071-09.T13 | load | PS-071-08.R01, PS-071-08.R02, PS-071-08.R03 | 1 000 signs and 1 000 verifies | p95 sign ≤ 80 ms, verify ≤ 20 ms, no telemetry sent |
| TEST-PS-071-09.T14 | unit | PS-071-09.R01 | traceability tool run | every PS-071 requirement maps to a passing test |
| TEST-PS-071-09.T15 | integration | PS-071-10.R01, PS-071-10.R02, PS-071-10.R03 | export vault, import to fresh vault with one tampered receipt, roll back one release | valid receipts round-trip; tampered one quarantined; v1 readable |

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- Every receipt view and export carries the statement that it evidences an assertion and not delivery.
- A receipt file verifies offline with no network and no vault.

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
