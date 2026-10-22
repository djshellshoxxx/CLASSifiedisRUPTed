# F01.S01.M01 — Create listing module
**Status:** SPECIFIED — REVIEW PENDING. **Feature:** F01 LocalBazaar. **Subfeature:** F01.S01 listings. **Owner:** F01.S01.M01. **No application implementation.**
## Purpose / assembly
The creation command validates one member's proposed draft, authorizes it, persists it atomically with idempotency receipt and outbox, then returns a private draft. This module does not publish, index, reserve, finalize payment or federate listings. Depend on F07 identity, F10 retention, F12 moderation, F15 persistence and F16 ABAC; inherit coarse area from F06 and forbidden category rules from F18. Other listing lifecycle steps belong to sibling modules; API/outbox are canonical F15 contracts.
## Process contracts (registry PS-002-01..10)
1. [domain_schema.md](domain_schema.md) — typed fields, authoritative ownership and constraints (PS-002-01)
2. [validation_rules.md](validation_rules.md) — exact parsing, errors, category and geo validations (PS-002-02)
3. [workflow_state_machine.md](workflow_state_machine.md) — absent->draft and atomic event (PS-002-03)
4. [commands_queries_events.md](commands_queries_events.md) — POST and listing.created event (PS-002-04)
5. [authorization_capabilities.md](authorization_capabilities.md) — tenant/owner/role checks (PS-002-05)
6. [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — receipts, CAS, rollback/retry (PS-002-06)
7. [privacy_retention_abuse.md](privacy_retention_abuse.md) — exact-location restriction, deletion, rate abuse (PS-002-07)
8. [observability_performance.md](observability_performance.md) — telemetry and latency targets (PS-002-08)
9. [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — unit/integration/e2e/property mapping (PS-002-09)
10. [import_export_backup_rollback.md](import_export_backup_rollback.md) — data-rights and disaster recovery (PS-002-10)
## Module composition
Client pending-draft form -> F16+F07 auth -> PS-002-02+05 validate/authorize -> PS-002-06 transactional idempotency guard -> PS-002-01 authoritative listings row -> PS-002-03+04 listing.created outbox -> PS-002-08 monitoring -> F15 response ack; PS-002-07,09,10 constrain the entire flow. Downstream F01 mod_edit and mod_publish may act only on the returned stable ID and current revision. F06/F11 must ignore private draft.
## Acceptance
All ten process contracts have specification text; their status is review-pending, NOT implementation or verification. Before acceptance: resolve F07 identity FK, canonical schema/OpenAPI generation, test and reviewer links, privacy/abuse test evidence and F17 gate. A sibling or feature cannot inherit a passing status from this document until its own contracts are complete.
