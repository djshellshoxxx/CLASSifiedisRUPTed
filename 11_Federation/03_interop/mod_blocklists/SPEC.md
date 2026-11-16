# F11.S03.M02 — blocklists

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F11.S03 interop](../SPEC.md).

**Canonical contracts:** CTR-FED-001, CTR-EVT-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001, CTR-ID-001, CTR-ERR-001. Error slug: `BLOCKLISTS`. Entity prefix: `blk_` (PENDING CTR-ID-001). Aggregate: `blocklist`.

## Purpose and business behavior
Hold the node's blocklist of federation targets: peer nodes (`nod_`), peers (`fpr_`) and content digests. The module enforces local deny rules on inbound and outbound federation traffic, queues peer-imported entries for local acceptance, and distributes accepted entries as signed events to trusted peers when the entry is opted in to federation. It does not decide what is abusive. F12 owns moderation decisions, reason codes and case links. Entries never target end-user accounts or personal data.

## User stories
- As a moderator, I can propose a blocklist entry from an open case without seeing data outside that case.
- As an operator, I can accept, reject, withdraw or roll back entries, and a second operator must confirm any entry shared with peers.
- As a node operator, I can see which peer or content digest is blocked on my node, why (reason code), when it expires, and request review through F12 appeals.

## Scope
- [PS-089-01 domain schema](domain_schema.md)
- [PS-089-02 validation rules](validation_rules.md)
- [PS-089-03 workflow state machine](workflow_state_machine.md)
- [PS-089-04 commands, queries and events](commands_queries_events.md)
- [PS-089-05 authorization and capabilities](authorization_capabilities.md)
- [PS-089-06 failure, recovery and idempotency](failure_recovery_idempotency.md)
- [PS-089-07 privacy, retention and abuse](privacy_retention_abuse.md)
- [PS-089-08 observability and performance](observability_performance.md)
- [PS-089-09 contract and acceptance tests](contract_and_acceptance_tests.md)
- [PS-089-10 import, export, backup and rollback](import_export_backup_rollback.md)

## Public interfaces
Commands `blocklist.propose|activate|reject|withdraw|import_batch|rollback_batch`; queries `blocklist.list|get`; internal check `blocklist.check`; events `blocklist.proposed|activated|rejected|withdrawn|expired`. Full contracts in PS-089-04. Every state-changing command carries an idempotency key and expected revision.

## Relationships, dependencies and integration
- Upstream: CTR-FED-001 (peer trust states, batch ingress and egress), CTR-CAP-001 (grants, dual control), F12 (case IDs, reason codes, appeals), F16 (grants, node signing keys).
- Downstream: federation ingress and egress (enforcement), F12 appeals, F15 observability.
- Reference IDs only. No copies of foreign schemas (PS-089-09 R05).

## Data ownership
This module owns blocklist entries and peer import batch records. F12 owns cases and reason-code values. F10 owns data-class rules. F16 owns grants and node keys. Export and deletion follow PS-089-07 and CTR-PRV-001.

## Risk considerations
Main risks: over-blocking through malicious or mistaken peer lists; fail-open enforcement during store outage; stale enforcement after expiry, rollback or restore; personal data leaking through target or reason fields; replay of old signed activations; a single operator activating federated blocks alone. Mitigations: PS-089-02 (closed enums), PS-089-03 (no auto-activation, dual control), PS-089-06 (fail closed), PS-089-07 (no personal data). No platform custody of money. Pseudonyms do not guarantee anonymity.

## Completion criteria
All ten process specs exist and are reviewed by F10, F12 and F16; TODO.md items closed; PENDING contract registrations resolved; contract tests in PS-089-09 pass in CI.

## Open decisions
- PROVISIONAL (D01 default, unapproved): signed envelopes; federation opt-in per entry.
- PROVISIONAL (D07 default, unapproved): retention classes.
- D08 not applicable (online-only writes).
- OPEN (CTR-FED-001): distribution format; default signed events.
- OPEN: whether node-level blocks need per-audience pseudonym handling.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-089-01
- [x] [validation_rules.md](validation_rules.md) — PS-089-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-089-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-089-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-089-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-089-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-089-07
- [x] [observability_performance.md](observability_performance.md) — PS-089-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-089-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-089-10
