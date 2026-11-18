# F09.S01.M03 — crypto

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F09). **Parent:** [F09.S01 payments](../SPEC.md). **Canonical contracts:** CTR-COM-001 (on-chain verification R09–R12, adapter registry R11), CTR-EVT-001, CTR-CAP-001, CTR-PRV-001, CTR-ID-001, CTR-SCH-001, CTR-ERR-001. **Decisions:** D03, D04, D06, D09 (PROVISIONAL defaults, unapproved).

## Purpose and business behavior
On-chain transfer evidence. Parties record a transfer they made from their own wallet as a `clm_` claim with `method = onchain_transfer`. Registered chain adapters then verify the transfer against public chain data (chain, asset, recipient, amount, confirmations) and move the claim to `EXTERNALLY_VERIFIED` and, after the finality threshold, to `FINAL`. The module is non-custodial: the platform holds no keys, wallets, balances or swap rights, and it never signs transactions.

## User stories
- As a participant, I record a transfer I sent from my own wallet so the counterparty can see its verification status.
- As a participant, I see which chain, asset and recipient the verification matched, and I see when a transfer is reorganized out.
- As an operator, I can add or disable a chain or asset in the registry without changing existing claims.

## Scope
- In scope: chain and asset registry entries, verifier adapter registration and signing, match rules, finality thresholds, reorg handling, adapter outage behavior.
- Out of scope: wallet creation or custody, transaction signing, token swaps, fiat on-ramps, fee-on-transfer or rebasing assets (excluded for MVP, OPEN), claim records (CTR-COM-001), settlement reconciliation (mod_reconciliation).

## Public interfaces
Adapter commands `adapter.verify`, `adapter.finality`, `adapter.reorg` (system; CTR-COM-001). Registry commands `chain_adapter.register`, `chain_adapter.disable`. Events `chain_adapter.registered`, `chain_adapter.disabled`, plus claim events `clm.verified`, `clm.finalized`, `clm.reorged`.

## Relationships, dependencies and integration
Upstream: `clm_` claims (CTR-COM-001), `cur_` asset registry (09 mod_currency, PENDING prefix), external chain RPC and indexer providers. Downstream: notifications (F13), reconciliation (mod_reconciliation), receipts (mod_receipts). Relation to mod_noncustodial (PS-069): wallet connection is owned there, not here.

## Data ownership
Owns chain adapter registration, verification records (raw response digest, adapter ID), and finality policy records. Claims belong to CTR-COM-001. Addresses are external references, not entity IDs (CTR-ID-001).

## Risk considerations
Spoofed or lying RPC/indexer responses; untrusted adapters; token impersonation through look-alike contracts; address poisoning and phishing; reorgs moving claims backward; public on-chain graph clustering that can link a pseudonym to other activity; chain outages. On-chain public data does not prove the handover of goods or services.

## Completion criteria
Adapter registry and finality values confirmed per chain (OPEN values); library selection recorded in an ADR with versions and licenses; threat model reviewed by F16 Security (not audited); reorg test vectors in CI.

## Required process specification inventory
- [x] `domain_schema.md` — PS-068-01
- [x] `validation_rules.md` — PS-068-02
- [x] `workflow_state_machine.md` — PS-068-03
- [x] `commands_queries_events.md` — PS-068-04
- [x] `authorization_capabilities.md` — PS-068-05
- [x] `failure_recovery_idempotency.md` — PS-068-06
- [x] `privacy_retention_abuse.md` — PS-068-07
- [x] `observability_performance.md` — PS-068-08
- [x] `contract_and_acceptance_tests.md` — PS-068-09
- [x] `import_export_backup_rollback.md` — PS-068-10
