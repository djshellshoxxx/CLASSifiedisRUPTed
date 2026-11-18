# F09.S01.M01 — noncustodial

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead. **Parent:** F09.S01.

## Purpose and business behavior
Declare and display the direct, party-to-party payment routes a counterparty must use to settle an agreed exchange: on-chain address and asset, cash, in-kind compensation, or other external arrangement. ClassRup stores instructions, never funds. This module has no balance, wallet, payout or custodial key field. It also owns the rail and verifier adapter registry that PS-072 reconciliation consumes.

## User stories
- As a payer, I see the recipient route, its chain and asset, and the text "You pay the counterparty directly. ClassRup does not hold funds."
- As a payee, I declare the routes I accept, replace them before they are used, and withdraw unused routes.
- As an operator, I suspend one rail adapter without changing claims, disputes or unrelated routes.

## Scope
- Process specifications PS-069-01 to PS-069-10 (inventory below).
- In scope: route records, route lifecycle, rail/verifier adapter registry, contact-hint handling.
- Out of scope: claim states (PS-071), external verification and reorg handling (PS-072), disputes (PS-070), quotes and currency registry (PS-073), rate sources (PS-075), consent records (PS-076).

## Public interfaces
Commands `route.declare`, `route.replace`, `route.withdraw`, `adapter.register`, `adapter.suspend`, `adapter.restore`; queries `route.list`, `adapter.list`. Signatures in PS-069-04.

## Relationships, dependencies and integration
- Upstream: identity and participant rule (CTR-CAP-001, F07/F16); consent for `contact_hint` disclosure (PS-076); asset and fiat validity (PS-073).
- Downstream: receipts bind claims to `route_id` (PS-071); reconciliation consumes adapter registry (PS-072); notifications receive `route.declared` (generic text only).
- Reference other records by full ID only.

## Data ownership
Owns `route` records, `route` transition log and `adapter` registry rows. Does not own claims, quotes, disputes, consent or evidence.

## Risk considerations
- Custody creep through schema extension (blocked by COM.CUSTODY_FORBIDDEN).
- Wrong on-chain destination: funds sent to an address the counterparty does not control cannot be recovered by the platform.
- Off-platform contact hints leak personal data if logged or federated.
- Address reuse links activity across trx (graph deanonymization).
- Labels implying payment before FINAL.
- Unregistered rail adapters spoofing verification.
No platform custody of money. Pseudonyms do not guarantee anonymity.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; implementation and tests in later phases; privacy and security review pending.

## Pending canonical contract items
- PENDING CTR-ID-001: prefix `rte` for `route_id`.
- PENDING CTR-ID-001: adapter ID format (`adp_` proposed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-069-01
- [x] [validation_rules.md](validation_rules.md) — PS-069-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-069-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-069-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-069-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-069-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-069-07
- [x] [observability_performance.md](observability_performance.md) — PS-069-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-069-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-069-10
