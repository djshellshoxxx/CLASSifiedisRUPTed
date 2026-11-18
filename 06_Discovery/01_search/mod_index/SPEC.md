# F06.S01.M01 — index

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead. **Parent:** F06.S01.

## Purpose and business behavior
Maintain the local search index: a derived, rebuildable projection of published listing events (`lst_`, owned by F01) into one query-ready document per listing. Buyers find listings by title, category, price and coarse region cell. The index never becomes a source of truth: listing state always comes from the event log (CTR-EVT-001), and any withdrawal, deletion or moderation suppression removes a listing from query results without waiting for a rebuild.

## User stories
- As a buyer, I search local listings and see only listings that are still active, not withdrawn or suppressed.
- As a seller, I can withdraw or edit a listing and expect it to leave or update in search within 60 s.
- As an operator, I can rebuild the index for one region cell without taking search offline.
- As a moderator, I can suppress a listing from search pending a case without deleting the listing.

## Scope
Index projection, allowlisted fields, revision ordering, suppression, purge and rebuild. Not in scope: query parsing (F06.S01.M02 query), filters (M03 filter), ranking (F06.S03), listing authoring (F01).

- [domain_schema.md](domain_schema.md) — PS-045-01
- [validation_rules.md](validation_rules.md) — PS-045-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-045-03
- [commands_queries_events.md](commands_queries_events.md) — PS-045-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-045-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-045-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-045-07
- [observability_performance.md](observability_performance.md) — PS-045-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-045-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-045-10

## Public interfaces
Commands `index.apply_event`, `index.suppress`, `index.lift_suppression`, `index.rebuild`; event `index.doc.changed`; query contract consumed by mod_query. Signatures, idempotency keys and error codes in [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F01 listing events (`listing.*`); F12 moderation suppression (`case:<cas_>`); F10 field allowlist review; F16 capability grants; F15 event log and alias infrastructure. Downstream: mod_query (reads index), F06.S03 ranking (reads `index` fields), F13 notifications are not triggered by index changes. Federated listings (CTR-FED-001) enter only after PUBLIC and `federate` checks; PENDING CTR-DSC-001 for the discovery index contract.

## Data ownership
Owns: `index_doc` and `index_pending` buffer, shadow-index metadata. Does not own listing content, seller identity, moderation cases or location precision (LOCATION_PRECISE stays with F06.S02 location). Export excludes index docs.

## Risk considerations
Stale results after withdrawal or deletion (privacy and trust harm); index exposing seller or home-location data through tokens or titles; spam and token stuffing that degrades search; revision gaps and replay causing wrong final state; rebuild that swaps in an incomplete index. No platform custody of money involved. Pseudonyms do not guarantee anonymity in listing titles written by sellers.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; PENDING items (CTR-DSC-001, `idx_` prefix) resolved; F10 privacy review of allowlist; F12 review of suppression reasons; test IDs mapped; implementation deferred to a later prompt.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-045-01, SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-045-02, SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-045-03, SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-045-04, SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-045-05, SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-045-06, SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-045-07, SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-045-08, SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-045-09, SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-045-10, SPEC-DRAFT-COMPLETE
