# F16.S01.M01 — mod_authorization

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Security Lead. **Parent:** [F16.S01](../SPEC.md). **Registry:** PS-126-01 to PS-126-10 in [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md). **Canonical contract:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Purpose and business behavior
The policy decision point for ClassRup. Every read, write, export, subscription and attachment download is allowed or denied here, on the server, by default-deny rules. The module evaluates relation rules (owner, participant), explicit grants (including privileged grants that need two approvers and a purpose), field visibility and decision records. It does not define domain actions; each module declares its own action subset in its `authorization_capabilities.md`.

Object-level checks cover listings, messages, cycle proposals, reports and disputes. Bulk endpoints and alternate API paths are authorized per item.

## User stories
- As a participant, I can read and update only the listings, proposals and messages I own or take part in; other objects look as if they do not exist.
- As a moderator, I can read reports only inside an assigned case, for a stated purpose, until the grant expires.
- As an operator, I cannot act on private data alone; a second operator must approve.
- As a user, I see my access revoked on my devices within one minute of revocation.

## Scope
- Decision engine `authz.decide` and decision records (`dec_`).
- Grant store (`grt_`) for explicit, time-bounded grants and approvals.
- Policy versions (`pol_`) that bind rule sets to decisions.
- Decision cache with TTL rules from CTR-CAP-001 R09.
- Out of scope: authentication and sessions (F07), domain action vocabulary (each module), moderation case workflow (F12).

## Public interfaces
Internal decision call `authz.decide`; grant commands `grant.create`, `grant.approve`, `grant.revoke`; policy commands `policy.draft`, `policy.publish`, `policy.rollback`; events on CTR-EVT-001; errors on CTR-ERR-001 (`CAP.*`, `SYS.FORBIDDEN`, `SYS.NOT_FOUND`, `AUTHZ.*`).

## Relationships, dependencies and integration
- Upstream: F07 identity (principal and session validity), CTR-ID-001 (`acc_`, `grt_`, `dec_`), CTR-PRV-001 (data classes for field visibility).
- Downstream: every module that enforces authorization; CTR-FED-001 peer scopes; F12 moderation cases (case scope); F10 purpose registry.
- CTR-CAP-001 is owned by F16 with F07 (named owners UNASSIGNED, S3-11). Reference by ID only.

## Data ownership
Owns: grant records, approval records, decision records, policy versions, decision cache. Does not own: accounts, sessions, object content, moderation cases.

## Risk considerations
- Object-level bypass through IDs, bulk endpoints and alternate routes (S3-02, Critical).
- Stale grants after revocation, including offline clients and federated peers.
- Fail-open behavior when the grant or policy store is down.
- Self-approval or collusion between two operators (CR-12 Sybil and collusion risk).
- Decision logs that leak object content or purposes.

## Completion criteria
All ten process specifications SPEC-DRAFT-COMPLETE; decision matrix from CTR-CAP-001 covered by tests; S3-02 negative suite defined; Security Lead review recorded (future gate).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-126-01 — SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-126-02 — SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-126-03 — SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-126-04 — SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-126-05 — SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-126-06 — SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-126-07 — SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-126-08 — SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-126-09 — SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-126-10 — SPEC-DRAFT-COMPLETE
