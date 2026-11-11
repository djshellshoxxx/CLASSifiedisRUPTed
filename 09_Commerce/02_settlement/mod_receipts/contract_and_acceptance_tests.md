# PS-071-09 — Contract and acceptance tests: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-09.R01** Every requirement is covered by at least one automated test.
- **PS-071-09.R02** Signatures are tested with RFC 8032 vectors and JCS vectors from RFC 8785.
- **PS-071-09.R03** Verification is tested against tampered, replayed and revoked-key receipts.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults A (payer) and B (payee) with an acknowledged EUR 45.00 cash claim; RFC 8032 test keys; principal root keys with device-link chains; a revoked device key with effective-from 2026-11-04T09:00:00Z; a self-generated unlinked key; a relay double that signs receipt times; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T01 | unit | PS-071-01.R01, PS-071-01.R03, PS-071-02.R03, PS-071-09.R03 | sign a payee receipt, then flip one byte of statement text | original verifies valid; edited copy fails with COMMERCE_RECEIPT_SIGNATURE_INVALID |
| TEST-PS-071-09.T02 | unit | PS-071-02.R01, PS-071-02.R02 | rules V01 to V10 violated in turn | documented error code returned and nothing stored |
| TEST-PS-071-09.T03 | unit | PS-071-01.R02, PS-071-03.R01, PS-071-03.R03 | attempt edit or delete via API and re-run verify after claim expiry | no edit path exists; verification result recomputed and receipt retained |
| TEST-PS-071-09.T04 | unit | PS-071-01.R03, PS-071-02.R03, PS-071-09.R03 | receipt for claim X replayed against claim Y | COMMERCE_RECEIPT_MISMATCH |
| TEST-PS-071-09.T05 | contract | PS-071-04.R01, PS-071-04.R02, PS-071-09.R02 | execute issue, ingest, verify and export | outputs and events validate against registry schemas; commerce.receipt.issued carries parties with roles |
| TEST-PS-071-09.T06 | integration | PS-071-04.R03, PS-071-09.R03 | identity.device_key.revoked with effective-from after the stored receipt's receivedAt, delivered twice | keyStatus revoked_after_receipt set once from receivedAt and the effective-from time, not from signedAt; receipt still listed |
| TEST-PS-071-09.T07 | abuse | PS-071-05.R01, PS-071-05.R02, PS-071-05.R03 | non-party signer; wrong-role statement; relay traffic inspection | quarantined with reason; relay sees only ciphertext |
| TEST-PS-071-09.T08 | integration | PS-071-06.R01, PS-071-06.R02, PS-071-06.R03 | two tabs sign simultaneously; delivery fails after signing | one receipt; export still possible; UI shows prepared |
| TEST-PS-071-09.T09 | integration | PS-071-03.R02, PS-071-07.R01 | offline signing then reconnect | receipt delivered, sync state advances to peer_accepted only on signed acknowledgement |
| TEST-PS-071-09.T10 | e2e | PS-071-07.R02 | both parties open receipts | disclaimer shown; labels say asserted by signer; axe zero serious issues |
| TEST-PS-071-09.T11 | integration | PS-071-07.R03 | account deletion completes | signerId pseudonymized, signature flagged unverifiable-after-pseudonymization, counterparty copy untouched |
| TEST-PS-071-09.T12 | abuse | PS-071-07.R03, PS-071-07.R01 | 21 incoming receipts in one hour from one known party | 21st quarantined |
| TEST-PS-071-09.T13 | load | PS-071-08.R01, PS-071-08.R02, PS-071-08.R03 | 1 000 signs and 1 000 verifies | p95 sign ≤ 80 ms, verify ≤ 25 ms, no telemetry sent, quarantine counts by reason visible in local diagnostics |
| TEST-PS-071-09.T14 | unit | PS-071-09.R01 | traceability tool run | every PS-071 requirement maps to a passing test |
| TEST-PS-071-09.T15 | integration | PS-071-10.R01, PS-071-10.R02, PS-071-10.R03 | export vault, import to fresh vault with one tampered receipt, roll back one release | valid receipts round-trip; tampered one quarantined; v1 readable |
| TEST-PS-071-09.T16 | abuse | PS-071-01.R05, PS-071-02.R04, PS-071-04.R05 | a receipt signed with a key revoked at 09:00 and signedAt backdated to 08:00 arrives at 10:00; the same file verified offline with no trusted receipt time; a receipt with a relay-signed receipt time of 08:30 | first reads revoked_before_receipt and is quarantined with COMMERCE_RECEIPT_KEY_REVOKED, never Valid; second reads 'key revoked; signing time unverifiable'; third reads revoked_after_receipt labelled 'according to relay <name>' |
| TEST-PS-071-09.T17 | abuse | PS-071-01.R04, PS-071-02.R04 | file signed by a self-generated key with no device-link chain to the payee, and one whose chain links to a different principal | signature valid but partyBinding unverified, label 'Signature valid - party not proven'; ingest quarantines with party_unbound (COMMERCE_RECEIPT_PARTY_UNBOUND) |
| TEST-PS-071-09.T18 | integration | PS-071-01.R04, PS-071-04.R05 | export a receipt and verify the file on a device with no network and no vault | result names the signing device key and the principal it is linked to, partyBinding verified, file ≤ 8 KiB |
| TEST-PS-071-09.T19 | integration | PS-071-04.R04 | receipt delivered through F09.S01.M01 commerce.statement.ingest, then the same envelope again | dispatched once to commerce.receipt.ingest and stored; duplicate is a no-op |
| TEST-PS-071-09.T20 | integration | PS-071-07.R04 | export, deletion and retention purge driven by F10 | section commerce.receipts exported; DeletionPort pseudonymizes signerId; RetentionPurgePort purges after RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-071-09.T21 | abuse | PS-071-07.R05 | blocked payee sends a receipt, then one on a Deal with an open dispute case; 10 000 fresh dids each send one receipt | first dropped silently; second stored as evidence with notification suppressed; quarantine stays within 500 entries or 5 MiB and non-party receipts are dropped once full |
| TEST-PS-071-09.T22 | contract | PS-071-04.R06, PS-071-02.R04, PS-071-01.R03 | sign a receipt and check the envelope bytes; ingest a hash-only envelope with its statement supplied, with a different statement, and with none; change kid or signedAt in the header; replay the statement under another dealId | signature covers exactly JCS({v, ctx, kid, alg, signedAt, payloadHash}) with payloadHash over the JCS statement; the first is accepted and stored; the others return accepted false (SECURITY_PAYLOAD_HASH_MISMATCH or SECURITY_SIGNATURE_INVALID) and are quarantined with that reason as COMMERCE_RECEIPT_SIGNATURE_INVALID; the replay returns COMMERCE_RECEIPT_MISMATCH; nothing is stored or emitted unless accepted is true |

## Acceptance criteria

- All tests T01 to T22 pass in CI.
- Every receipt view and export carries the statement that it evidences an assertion and not delivery.
- A receipt file verifies offline with no network and no vault, naming both the signing device key and the principal it is linked to.
- No receipt reads valid for a party unless its device key is linked to that party and was not revoked before a trusted receipt time; signedAt never decides key status.

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
