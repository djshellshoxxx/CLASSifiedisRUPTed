# F09.S02.M01 — Receipts

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S02](../SPEC.md). **Process IDs:** PS-071-01…PS-071-10. **Code:** `packages/commerce/src/settlement/receipts`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A party signs a short statement about a payment claim with their device key: the payer says they paid, the payee says they received. The result is a Receipt {claimId, statement, signerId, signedAt, sig} that both vaults store, verify and can export as a portable file anyone can verify offline, because the signer's did:key embeds the public key. A receipt evidences what the signer asserted at the time they signed; it never proves that money moved or goods were delivered, and the UI says so.

## Responsibilities

- Create receipts by signing a canonical statement (JCS bytes, Ed25519, domain prefix classrup-receipt:v1) with the local principal's device key, only for claims the signer is a party to.
- Ingest, verify and store receipts signed by the counterparty, with provenance, and quarantine invalid ones.
- Verify any receipt offline from its content and signerId, reporting valid, invalid or key-revoked-after-signing.
- Export a receipt as a portable classrup-receipt/v1 file and embed it in the vault export.
- Track signer key revocation (as claimed by the signer's revocation statement) so verifiers see the key status.

## Not responsible for

- Payment claim state and acknowledgement (F09.S01.M01); a receipt does not change claim status.
- Dispute handling (F09.S02.M02) and reconciliation (F09.S02.M03).
- Tax invoices, VAT and legal receipts; the receipt here is an evidence statement only.
- Future: optional RFC 3161 timestamp tokens from a user-chosen timestamping authority, and PDF rendering for printing.

## User stories

- As a payer, I sign a receipt stating that I paid EUR 45.00 for the bike, and I keep a file I can show later.
- As a payee, I sign a receipt stating that I received the cash, and the buyer's vault stores it with my signature.
- As anyone holding a receipt file, I can verify the signature offline and see exactly what the signer asserted.

## Edge cases

- The signer's device key was revoked after signing; verification reports valid signature, key revoked at the signer's claimed time, and does not hide the receipt.
- A receipt arrives from someone who is not a party to the claim; it is quarantined with reason signer_not_party.
- The same party tries to issue two receipts of the same type for one claim; the second returns CONFLICT_STATE and the first stays.
- The claim is later disputed or expires; existing receipts stay valid evidence of what was asserted and are never deleted by status changes.
- The statement text is edited after signing in a transported file; verification fails with COMMERCE_RECEIPT_SIGNATURE_INVALID.
- After the signer's account deletion their did is replaced by a pseudonym in retained records; the signature is kept but marked unverifiable-after-pseudonymization while the original signing check result is retained.

## UX and accessibility

- Receipt sheet on a claim: shows the exact sentence that will be signed, amount, currency, claim reference and the line 'This records what you assert. It does not prove payment or delivery.'; button Sign with this device.
- Receipt view: signer pseudonym, role, signed time (as claimed by signer), signature status (Valid, Invalid, Key revoked later), Export file and Copy verification code.
- Verify screen: drop a receipt file or paste code; result with reasons.

**States:** loading; empty; ready-to-sign; signing; signed; peer-accepted; verified; invalid; quarantined

**Accessibility:** Signature status is text with an icon and an accessible description of what it means.; The sentence to be signed is readable text and read out before the Sign button is focused.; Sign and Export buttons are at least 44 by 44 px.

## Owned data

- `Receipt` (classrup.commerce.receipt/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.receipt.issue`, `commerce.receipt.ingest`
- Queries: `commerce.receipt.verify`, `commerce.receipt.export`, `commerce.receipt.list_for_claim`
- Emits: `commerce.receipt.issued`
- Consumes: `commerce.payment.acknowledged`, `commerce.payment.finalized`, `identity.device_key.revoked`, `privacy.deletion.completed`

## Dependencies

F09.S01.M01, F09.S03.M03, F07.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-071-01 | [Domain schema](domain_schema.md) | 3 |
| PS-071-02 | [Validation rules](validation_rules.md) | 3 |
| PS-071-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-071-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-071-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-071-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-071-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-071-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-071-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-071-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/settlement/receipts/index.ts`.

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- Every receipt view and export carries the statement that it evidences an assertion and not delivery.
- A receipt file verifies offline with no network and no vault.
