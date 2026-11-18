# F07.S03.M02 — evidence

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Identity&Trust Lead (F07). **Parent:** F07.S03.

## Purpose and business behavior
Stores trust evidence about a pseudonym (`prf_`): signed statements from counterparties, self-attested notes, references to verifier results, and system observations. Each record is digest-based, append-only, and attributable to an issuer. Supports reputation scoring with records that can be withdrawn, superseded or quarantined. Does not store identity documents or payment data (F09 owns `evd_` payment evidence), does not score (mod_reputation), and does not hold moderation evidence (12_Moderation/mod_evidence).

## User stories
- As a counterparty, I sign a short statement about a completed exchange and the signature is stored with the other party's pseudonym.
- As a pseudonym holder, I see every trust record about my handle, marked self-attested or issuer-signed, and I can withdraw my own notes.
- As an issuer, I can supersede a statement I made in error without deleting the original digest.
- As Trust&Safety, I can review quarantined records when two signed statements contradict each other.

## Scope
- [domain_schema.md](domain_schema.md) — PS-057-01
- [validation_rules.md](validation_rules.md) — PS-057-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-057-03
- [commands_queries_events.md](commands_queries_events.md) — PS-057-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-057-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-057-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-057-07
- [observability_performance.md](observability_performance.md) — PS-057-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-057-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-057-10

## Public interfaces
Commands `RecordEvidence`, `SupersedeEvidence`, `WithdrawEvidence`; queries `GetEvidenceSummary`, `ListOwnEvidence`; events `evidence.recorded`, `evidence.superseded`, `evidence.withdrawn`, `evidence.quarantined` (CTR-EVT-001). Details in PS-057-04.

## Relationships, dependencies and integration
Upstream: mod_pseudonyms (`prf_`), mod_sessions, key registry (F16), exchange outcomes from F02–F05 and F08 handoff records (as references). Downstream: mod_reputation (summary counts and states; 60 s propagation), F12 quarantine review. Payment evidence stays with F09 (`evd_`, CTR-COM-001). Canonical owner ID for trust-evidence record class: PENDING CTR-ID-001 (candidate `tev`, owner F07). Moderation evidence (12_Moderation/mod_evidence) is a separate record class.

## Data ownership
Owns trust evidence records, supersession chains, withdrawal state and quarantine state. Does not own signing keys (F16), payment evidence (F09), reputation scores (mod_reputation) or moderation case evidence (F12). Retention per PS-057-07.

## Risk considerations
Specific to trust evidence: (1) fabricated or colluding statements used to inflate reputation; (2) equivocation, where one issuer signs contradictory statements; (3) signatures mistaken for proof of real-world events (CTR-COM-001 R14); (4) content fields becoming a channel for contact data or identity documents; (5) withdrawn evidence still influencing scores during propagation; (6) key compromise after signing. Signatures evidence an assertion only. Trust evidence does not guarantee identity or honesty.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; every `PS-057-*.Rnn` mapped to `TEST-PS-057-*`; canonical owner ID for trust evidence assigned in CTR-ID-001; D06 and D07 approved or kept PROVISIONAL with sign-off; signature library recorded from audited options; privacy and security review pass (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-057-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-057-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-057-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-057-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-057-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-057-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-057-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-057-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-057-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-057-10, SPEC-DRAFT-COMPLETE
