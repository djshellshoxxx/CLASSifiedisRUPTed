# F16.S01.M01 — Authorization policy

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S01](../SPEC.md). **Process IDs:** PS-126-01…PS-126-10. **Code:** `packages/security/src/authz/authorization`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The authorize() decision function of CTR-CAP-001 with its two layers. Vault policy runs in the user's browser: the unlocked local principal may change its own records, and an incoming signed statement is accepted only if signed by a key authorized for that role in that statement (for example only the listing author accepts an offer on it), otherwise it is quarantined with a reason. Relay policy runs on a relay and decides access to that relay's own resources using relay roles (moderator, operator, admin) that exist only on that relay. authorize() is pure, default-deny and side-effect free; this module also owns relay role assignments and the append-only, hash-chained audit log of decisions. There are no global roles.

## Responsibilities

- Implement authorize(actor, capability, resource?, context) returning Allow or Deny(code) as a pure function with default deny for unknown capabilities, roles or predicates.
- Implement authorizeStatement(statement, expectedRole, context) returning Accept or Quarantine(reason) for incoming signed statements, using signer keys and role claims inside the statement chain.
- Own relay RoleAssignment records (moderator, operator, admin per relay) with expiry, revocation and last-admin protection, and publish signed role statements.
- Own the AuditEntry log (relay and vault) with a per-store hash chain, coalescing of repeated denials, and no payload content.
- Provide the capability registry loader that validates every command and query declares exactly one capability.

## Not responsible for

- Authenticating relay access tokens and challenge-response (F07.S01.M02 sessions) and verifying signatures (F16.S02.M03).
- Reading user account state such as blocks or suspension; those facts are supplied in the context by the caller.
- Moderation decisions that create suspensions (F12.S02.M01) and limit values (F12.S03.M04).
- Legal-hold two-person approval workflow (F10.S01.M02).
- Future: delegated capabilities with signed, expiring capability tokens; hardware-key bound roles.

## User stories

- As a user, I know that only my unlocked vault can change my records, and that a statement claiming to come from someone else is quarantined unless their authorized key signed it.
- As a relay admin, I assign a moderator role to a key for 90 days and can see in the audit log every decision made with that role.
- As an auditor of a relay, I can verify that the audit log has not been altered or truncated.

## Edge cases

- Capability is not in the registry; authorize returns Deny(FORBIDDEN) with reason unknown_capability and never falls through to allow.
- A statement is signed by a key that was a valid author key when signed but the vault now holds a revocation for it; the statement is quarantined with reason signer_revoked and the revocation freshness is shown.
- Two admins revoke each other simultaneously; the second revoke is refused with SECURITY_LAST_ADMIN because at least one admin must remain.
- Role expires between the HTTP request check and the handler's re-check inside the transaction; the re-check denies and the command returns FORBIDDEN.
- Audit denial flood from one key; repeated identical denials within 60 seconds are coalesced into one entry with a count to bound storage.
- Audit log truncated by an attacker with disk access; chain verification reports the first missing sequence and the head hash recorded in the last signed digest.
- A federated statement claims a role the sender cannot prove; it is quarantined as unauthorized_role and shown in the quarantine view with the failing check.

## UX and accessibility

- Relay admin roles screen: list of role assignments (key label, role, granted by, expiry), assign and revoke forms with confirmation naming the key fingerprint.
- Audit log viewer (operator and admin): filter by capability, decision, time; entry details without payload; chain verification button with result.
- Vault quarantine view: statements held back with reason (unauthorized_role, signer_revoked, signature_invalid, unknown_signer), signer fingerprint, and actions to inspect or discard.

**States:** loading; empty; populated; verifying-chain; chain-ok; chain-broken; quarantined-item

**Accessibility:** Role and decision values are text labels, not color alone.; Tables have headers and are keyboard navigable; destructive revoke uses a confirmation dialog with focus trap.; Chain verification result is announced in an aria-live polite region.

## Owned data

- `RoleAssignment` (classrup.security.roleassignment/v1, P1, RET-AUDIT)
- `AuditEntry` (classrup.security.auditentry/v1, P3, RET-AUDIT)

## Interfaces

- Commands: `security.roleassignment.assign`, `security.roleassignment.revoke`
- Queries: `security.roleassignment.list`, `security.auditentry.list`, `security.auditentry.verify_chain`
- Emits: `security.role.assigned`, `security.role.revoked`
- Consumes: `identity.session.revoked`, `moderation.action.applied`, `moderation.action.reverted`, `privacy.legal_hold.placed`

## Dependencies

CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-126-01 | [Domain schema](domain_schema.md) | 3 |
| PS-126-02 | [Validation rules](validation_rules.md) | 3 |
| PS-126-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-126-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-126-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-126-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-126-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-126-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-126-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-126-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/authz/authorization/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- authorize is pure and every unlisted capability and role combination denies (property tests).
- The audit chain detects any edit, deletion or truncation in tamper tests.
