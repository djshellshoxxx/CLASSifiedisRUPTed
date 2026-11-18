# F02.S03.M04 — mod_recovery (cycle compensation)

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** Marketplace Lead (accountable role). **Parent:** F02.S03 (cycle_execution). **Canonical record owner:** this module, for cycle-compensation records. Platform restore records belong to F15.S03.M03 `15_Platform/03_operations/mod_recovery` (same slug, different record class; cross-link by full ID only).

## Purpose and business behavior
Handles a locked barter cycle that did not complete cleanly: a party drops out, an attestation is missing past its window, or parties disagree about what was handed over. It collects one signed attestation per party, computes a compensation plan (release locks, re-open listings, mark slots compensated), and escalates unresolved disagreement to moderation or dispute. The platform never claims that a physical handover happened; attestations are self-statements, and no money is held.

## User stories
- As a participant whose counterparty did not show up, I can record my own signed statement and see which listings were released.
- As a participant, I can see which step is open and by when I must respond.
- As a moderator, I receive a case with pseudonymous references and the attestations, and nothing else.

## Scope
Ten process specifications (inventory below). Monetary compensation is out of scope; in-kind terms are referenced only.

## Public interfaces
Commands: `cycle.open_recovery`, `cycle.attest`, `cycle.compensate`, `cycle.escalate`. Queries: `cycle.recovery_get`. Events: `cycle.recovery_opened`, `cycle.attested`, `cycle.compensated`, `cycle.recovery_closed`, `cycle.escalated`. Error module code `CYCRECOV`.

## Relationships, dependencies and integration
Upstream: F02.S03.M03 (mod_dropouts, triggers), F02.S03.M02 (mod_lock, lock records), F02.S02.M04 (mod_party, slot status), F15.S03.M03 (platform recovery, for infrastructure faults only). Downstream: F12 moderation case (`cas_`), F09.S02.M01 (mod_disputes, for evidence-backed disputes), F02.S03.M03 (dropout counts). Shared contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-COM-001 (R14 attestation signatures), CTR-PRV-001.

## Data ownership
Owns recovery records, attestations (as signed statements) and compensation plans for cycles. Does not own locks, slots, listings, disputes or moderation cases.

## Risk considerations
Parties relying on unverifiable attestations, one party blocking release by refusing to attest, false attestations used against a counterparty, retention of evidence that exposes personal data, and recovery used to bypass proof requirements (CTR-CAP-001 R12). Pseudonyms do not guarantee anonymity.

## Completion criteria
Ten process specs at SPEC-DRAFT-COMPLETE; attestation format agreed with F09 (CTR-COM-001 R14); escalation path agreed with F12.

## Required process specification inventory
- [x] `domain_schema.md` — PS-024-01
- [x] `validation_rules.md` — PS-024-02
- [x] `workflow_state_machine.md` — PS-024-03
- [x] `commands_queries_events.md` — PS-024-04
- [x] `authorization_capabilities.md` — PS-024-05
- [x] `failure_recovery_idempotency.md` — PS-024-06
- [x] `privacy_retention_abuse.md` — PS-024-07
- [x] `observability_performance.md` — PS-024-08
- [x] `contract_and_acceptance_tests.md` — PS-024-09
- [x] `import_export_backup_rollback.md` — PS-024-10
