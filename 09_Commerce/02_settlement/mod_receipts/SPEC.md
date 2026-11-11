# F09.S02.M01 — Receipts

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S02](../SPEC.md). **Process IDs:** PS-071-01…PS-071-10. **Code:** `packages/commerce/src/settlement/receipts`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A party signs a short statement about a payment claim with a device key linked to their principal DID: the payer says they paid, the payee says they received. The result is a Receipt {claimId, statement, signerId (the party's principal DID), signingKeyId, signedAt, sig} that both vaults store, verify and can export as a portable file. The file embeds the device-link statement chain from the principal's root key (or an identity-document snapshot), so anyone can verify offline both the signature and that the signing device key belonged to the Deal party. Signing and verification use the F16.S02.M03 context classrup/receipt/v1. Key revocation status is derived from a trusted receipt time - this vault's receivedAt, or a relay-signed receipt time labelled as that relay's evidence - compared with the revocation's effective-from time, never from the signer's own signedAt. A receipt evidences what the signer asserted; it never proves that money moved or goods were delivered, and the UI says so.

## Responsibilities

- Create receipts by signing a canonical statement with the local principal's device key under the F16.S02.M03 context classrup/receipt/v1 (signature over the JCS header {v, ctx, kid, alg, signedAt, payloadHash}, Ed25519), only for claims the signer is a party to, embedding the device-link chain that links the key to the principal.
- Ingest, verify and store receipts signed by the counterparty, with provenance, and quarantine invalid ones.
- Verify any receipt offline from its content, the embedded key-link chain and signerId through F16.S02.M03 and the F07 identity checks, reporting the signature result, partyBinding verified or unverified, and key status.
- Export a receipt as a portable classrup-receipt/v1 file and embed it in the vault export.
- Track signer key revocation from verified revocation statements with their effective-from time, and derive key status from a trusted receipt time (revoked_before_receipt, revoked_after_receipt or revoked_receipt_time_unknown), never from signedAt.
- Register the receipt type with the F09.S01.M01 ingest dispatcher (StatementHandlerPort), drop receipts from blocked dids, and bound the quarantine against Sybil floods.
- Register the F10 export, deletion and retention ports for receipts (N6).

## Not responsible for

- Payment claim state and acknowledgement (F09.S01.M01); a receipt does not change claim status.
- The cash receipt prompt after acknowledgement (F09.S01.M02), which calls commerce.receipt.issue when the in-force cash terms require receipts.
- Signature primitives, the context registry and key registry snapshots (F16.S02.M03), and device links and identity documents (F07.S01.M01, F07.S02.M01).
- Dispute handling (F09.S02.M02) and reconciliation (F09.S02.M03).
- Tax invoices, VAT and legal receipts; the receipt here is an evidence statement only.
- Future: optional RFC 3161 timestamp tokens from a user-chosen timestamping authority, and PDF rendering for printing.

## User stories

- As a payer, I sign a receipt stating that I paid EUR 45.00 for the bike, and I keep a file I can show later.
- As a payee, I sign a receipt stating that I received the cash, and the buyer's vault stores it with my signature.
- As anyone holding a receipt file, I can verify the signature offline and see exactly what the signer asserted, which device key signed it and which principal that key belongs to.
- As a payee whose phone was stolen, I revoke its key and know that receipts the thief signs afterwards, even with a backdated signing time, never read as valid.

## Edge cases

- The signer's device key was revoked after this vault received the receipt; verification reports keyStatus revoked_after_receipt, derived from receivedAt and the revocation's effective-from time, and does not hide the receipt.
- A receipt arrives from someone who is not a party to the claim; it is quarantined with reason signer_not_party.
- The same party tries to issue two receipts of the same type for one claim; the second returns CONFLICT_STATE and the first stays.
- The claim is later disputed or expires; existing receipts stay valid evidence of what was asserted and are never deleted by status changes.
- The statement text is edited after signing in a transported file; verification fails with COMMERCE_RECEIPT_SIGNATURE_INVALID.
- After the signer's account deletion their did is replaced by a pseudonym in retained records; the signature is kept but marked unverifiable-after-pseudonymization while the original signing check result is retained.
- A thief signs a receipt with a stolen, already revoked key and backdates signedAt to before the revocation; this vault receives it after the revocation took effect, so it reads revoked_before_receipt and is quarantined with COMMERCE_RECEIPT_KEY_REVOKED, never Valid.
- An offline receipt file is verified with no trusted receipt time and its key has a revocation; it reads 'key revoked; signing time unverifiable' (revoked_receipt_time_unknown), never 'revoked later'.
- A file signed by a freshly generated key with no device-link chain to the claim's party verifies cryptographically but reads partyBinding unverified and 'Signature valid - party not proven'.
- A receipt arrives from a did the receiver has blocked; it is dropped silently unless the claim's Deal has an open dispute case, in which case it is stored as evidence with notifications suppressed.
- 10 000 fresh dids each send one receipt; the shared bounded quarantine evicts oldest entries and then drops receipts from dids that are party to no known Deal.

## UX and accessibility

- Receipt sheet on a claim: shows the exact sentence that will be signed, amount, currency, claim reference and the line 'This records what you assert. It does not prove payment or delivery.'; button Sign with this device.
- Receipt view: signer pseudonym and principal, signing device key, role, signed time (as claimed by signer), received time (this device, or 'according to relay <name>'), signature status (Valid for <party>, Signature valid - party not proven, Invalid, Key revoked before receipt, Key revoked after receipt, Key revoked; signing time unverifiable), Export file and Copy verification code.
- Verify screen: drop a receipt file or paste code; result with reasons, the device key and the principal it is linked to.

**States:** loading; empty; ready-to-sign; signing; signed; peer-accepted; verified; party-not-proven; key-revoked; invalid; quarantined

**Accessibility:** Signature status is text with an icon and an accessible description of what it means.; The sentence to be signed is readable text and read out before the Sign button is focused.; Sign and Export buttons are at least 44 by 44 px.

## Owned data

- `Receipt` (classrup.commerce.receipt/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.receipt.issue`, `commerce.receipt.ingest`
- Queries: `commerce.receipt.verify`, `commerce.receipt.export`, `commerce.receipt.list_for_claim`
- Emits: `commerce.receipt.issued`
- Consumes: `commerce.payment.acknowledged`, `commerce.payment.finalized`, `identity.device_key.revoked`, `privacy.deletion.completed`

## Dependencies

F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-071-01 | [Domain schema](domain_schema.md) | 5 |
| PS-071-02 | [Validation rules](validation_rules.md) | 4 |
| PS-071-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-071-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-071-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-071-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-071-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-071-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-071-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-071-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/settlement/receipts/index.ts`.

## Acceptance criteria

- All tests T01 to T22 pass in CI.
- Every receipt view and export carries the statement that it evidences an assertion and not delivery.
- A receipt file verifies offline with no network and no vault, naming both the signing device key and the principal it is linked to.
- No receipt reads valid for a party unless its device key is linked to that party and was not revoked before a trusted receipt time; signedAt never decides key status.
