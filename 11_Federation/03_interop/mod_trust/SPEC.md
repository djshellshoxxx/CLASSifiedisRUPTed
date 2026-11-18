# F11.S03.M01 — trust

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (accountable role). **Parent:** F11.S03.

## Purpose and business behavior
Decide and record the trust state of federation peers (`pending`, `trusted`, `restricted`, `quarantined`, `revoked`). The state gates whether a peer's signed events are imported or exported (CTR-FED-001 R01). Trust is an operational control over a peer, not a judgement that its content is true; a `trusted` peer can still send invalid or disputed items, which are rejected or flagged per item.

## User stories
- As a node operator, I admit a federation peer only after confirming its key fingerprint, and each admission records a reason code.
- As a node operator, I see why a peer is restricted or quarantined and restore it after a recorded review.
- As a federated user, my local items are not changed when a peer is quarantined; only sync with that peer stops.

## Scope
- Peer trust state machine and its five commands (`peer.*`).
- Append-only trust assessment log (`trs_`).
- Automated restriction on signature-failure thresholds (ASSUMPTION thresholds).
- Out of scope: key generation and rotation (F16, D10), blocklist distribution (`mod_blocklists`), per-item verification order (CTR-FED-001), reputation scoring of people (F07.S03.M01).

## Public interfaces
Commands `peer.admit`, `peer.restrict`, `peer.quarantine`, `peer.restore`, `peer.revoke`; queries `peer.get_trust`, `peer.list_by_state`, `peer.get_assessments`; events `peer.admitted`, `peer.restricted`, `peer.quarantined`, `peer.restored`, `peer.revoked`. Details in PS-091-04.

## Relationships, dependencies and integration
Upstream (DEPENDENCY_MATRIX): F07.S03.M01 `mod_reputation` (signals only), F16.S02.M03 (key status). Downstream: F11.S03.M02 `mod_blocklists`, relay sync in F11.S02 (consumes trust state for sync gating). Contracts: CTR-FED-001, CTR-CAP-001, CTR-EVT-001, CTR-ERR-001. Integration uses a 2 s command timeout with idempotent retries.

## Data ownership
This module owns trust state and `trs_` assessments for each `fpr_` peer. The node record `nod_` and item payloads belong to F11 root and relay sync. Evidence items belong to F12 `mod_evidence`. Export and deletion follow CTR-PRV-001 R06–R07; equivocation evidence is retained longer (PS-091-07).

## Risk considerations
Sybil or malicious peers triggering automated restriction of a legitimate peer; a compromised signing key used to forge equivocation; stale trust after revocation reaching relays late; operator error admitting a hostile peer; a race between restore and quarantine; reason codes revealing which local users were affected. No platform custody of money. Trust state is not an identity guarantee and pseudonymous operators can still act maliciously.

## Completion criteria
Platform Lead approval of the state machine (not yet obtained); all ten process specs at SPEC-DRAFT-COMPLETE; contract tests for every transition; privacy and security review scheduled (not performed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-091-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-091-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-091-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-091-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-091-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-091-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-091-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-091-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-091-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-091-10, SPEC-DRAFT-COMPLETE (pending approval)
