# F09.S02.M01 — receipts

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F09). **Parent:** [F09.S02 settlement](../SPEC.md). **Canonical contracts:** CTR-COM-001 (evidence, claim_hash, attestation), CTR-ID-001 (`clm`, `evd`, `trx`, `qte`), CTR-PRV-001 (R03, R06, RET-EVD), CTR-SCH-001, CTR-EVT-001. **Decisions:** D06, D07 (PROVISIONAL defaults, unapproved).

## Purpose and business behavior
Signed statements about payment and settlement claims. A receipt is the claim body, its evidence digests and the signatures of the claimant and, after attestation, the counterparty. Encrypted evidence items hold screenshots, documents or text notes; their metadata is stripped before hashing. A receipt records what each party asserted. It does not prove that a payment or handover happened.

## User stories
- As a claimant, I attach evidence to a claim and the counterparty sees a digest and an encrypted copy they can open.
- As a counterparty, I attest a claim only after checking the amount and method it states.
- As a participant, I export my receipts with their signatures so I can check them later.

## Scope
- In scope: receipt assembly, signatures over `claim_hash`, evidence items (`evd_`), metadata stripping, receipt export.
- Out of scope: claim state machine (CTR-COM-001), external verification (mod_crypto), reconciliation (mod_reconciliation), dispute resolution (mod_disputes), messaging attachments (F08 mod_attachments).

## Public interfaces
Commands `evd.upload`, `evd.redact`, `receipt.export`; query `receipt.get`. Events `evd.uploaded`, `evd.redacted`, `receipt.exported`. Claim events from CTR-COM-001.

## Relationships, dependencies and integration
Upstream: `clm_` claims and states (CTR-COM-001), `trx_` (F09), `cur_` currency registry (09 mod_currency, PENDING prefix), account keys (F07). Downstream: disputes (mod_disputes), moderation cases (F12), owner export.

## Data ownership
Owns receipt assembly rules and `evd_` evidence items. Canonical owner of the evidence record class is `evd_` (F09, CTR-ID-001). Claim records belong to CTR-COM-001.

## Risk considerations
Forged or edited evidence; EXIF and GPS leakage in photos; personal data placed in free text; digest mismatch between implementations; evidence retained beyond RET-EVD; receipts mistaken for proof of payment.

## Completion criteria
Golden vectors for JCS and hashing pass in two implementations; EXIF stripping tested on the reference image set; F10 approval of evidence retention; F16 review of signing (not audited).

## Required process specification inventory
- [x] `domain_schema.md` — PS-071-01
- [x] `validation_rules.md` — PS-071-02
- [x] `workflow_state_machine.md` — PS-071-03
- [x] `commands_queries_events.md` — PS-071-04
- [x] `authorization_capabilities.md` — PS-071-05
- [x] `failure_recovery_idempotency.md` — PS-071-06
- [x] `privacy_retention_abuse.md` — PS-071-07
- [x] `observability_performance.md` — PS-071-08
- [x] `contract_and_acceptance_tests.md` — PS-071-09
- [x] `import_export_backup_rollback.md` — PS-071-10
