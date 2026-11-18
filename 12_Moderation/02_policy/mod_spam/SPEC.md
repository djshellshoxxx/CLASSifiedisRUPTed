# F12.S02.M02 — spam

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead (accountable role). **Parent:** F12.S02.

## Purpose and business behavior
Classify listings, service posts, private-message send patterns and verified inbound federated items as allowed, quarantined or rejected for spam and low-quality duplication. Listings and services are hidden from public discovery until they have a verdict. Private messages are never read by this module: only metadata (send rate, recipient novelty, link count, prior blocks) is scored, and a flagged sender is throttled rather than having delivered messages removed.

## User stories
- As a seller, my new listing is published quickly when it looks normal, and I see a generic "under review" state when it does not.
- As a buyer, I do not see duplicate or scam-pattern listings in discovery.
- As a messaging user, I am not read by the spam system; I may see my sending slowed if I send bursts to strangers.

## Scope
- Verdicts (`spm_`) for listings, services, message send patterns and verified federated items.
- Quarantine, release and reject flows with reviewer decisions.
- Out of scope: message content review (reported via `mod_flags`), rate limiting primitives (`mod_rate`), risk scoring of accounts (`mod_risk`), appeals (`mod_appeals`).

## Public interfaces
Internal command `spam.evaluate` (sys_ only); reviewer commands `spam.release`, `spam.reject`; queries `spam.get_status`, `spam.list_queue`; events `spam.evaluated`, `spam.quarantined`, `spam.released`, `spam.rejected`, `spam.expired`. Details in PS-097-04.

## Relationships, dependencies and integration
Upstream (DEPENDENCY_MATRIX): F12.S03.M02 `mod_signals`, F12.S03.M03 `mod_rate` (message throttling). Downstream: F01.S02.M03 (listing discovery filter), F12.S02.M03 `mod_abuse` (abuse pipeline consumes verdicts). Contracts: CTR-ERR-001, CTR-FED-001 (verification before scoring), CTR-EVT-001.

## Data ownership
This module owns `spm_` verdicts and feature-hash state. Listing and service content is owned by F01 and F03; message content by F08; federated items by F11. Verdicts are local and are not federated.

## Risk considerations
False positives hiding legitimate listings; discrimination through language or locale; evasion by adversarial text; classifier probing through message send behavior; surveillance through feature retention; listing fail-closed interacting with outage. No platform custody of money; no payment decisions are made here.

## Completion criteria
Trust&Safety Lead approval of thresholds and listing/message fail-mode split (not yet obtained); labeled evaluation set and regression gate defined; privacy review scheduled (not performed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-097-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-097-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-097-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-097-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-097-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-097-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-097-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-097-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-097-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-097-10, SPEC-DRAFT-COMPLETE (pending approval)
