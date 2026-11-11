# F16.S01.M01 — Authorization policy

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S01](../SPEC.md). **Process IDs:** PS-126-01…PS-126-10. **Code:** `packages/security/src/authz/authorization`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The authorize() decision function of CTR-CAP-001 with its two layers. Vault policy runs in the user's browser: the unlocked local principal may change its own records, and authorizeStatement is the pure predicate that F11.S01.M02 calls before acting on an incoming signed statement; it takes the required signer role only from the F11.S01.M01 statement-type registry and key status only from F07.S02.M01, and returns Accept or Quarantine with an F11.S01.M02 reason code (F11.S01.M02 stores and shows quarantined statements). Relay policy runs on a relay and decides access to that relay's own resources using relay roles (moderator, operator, relay_operator, admin) that exist only on that relay, each scoped to the whole relay or to one tenant on it. A role is held by a principal DID and exercised only with a device key active in that principal's identity document. authorize() is pure, default-deny and side-effect free. This module also owns relay role assignments, including the command-line bootstrap and break-glass path that creates the first admin, and the append-only, hash-chained audit log whose anchors are published for others to keep. There are no global roles.

## Responsibilities

- Implement authorize(actor, capability, resource?, context) returning Allow or Deny(code) as a pure function with default deny for unknown capabilities, roles, scopes or predicates, resolving the actor principal's signing device key through the injected KeyStatusPort.
- Implement authorizeStatement(statement, context) returning Accept or Quarantine(statusReason) as a pure predicate for F11.S01.M02, with the required signer role taken only from RoleResolverPort.roleFor(type, context) (F11.S01.M01) and key status only from KeyStatusPort (F07.S02.M01); it has no expected-role parameter and stores nothing.
- Own relay RoleAssignment records (moderator, operator, relay_operator, admin with scope relay or tenant:<id>) with the propose and approve two-person path for admins, expiry for non-admin roles, revocation, last-admin protection, import activation, and the local-CLI bootstrap and break-glass path (also offered in process as RoleBootstrapPort), and publish relay-signed role statements.
- Own the AuditEntry log (relay and vault) with a per-store hash chain, HMAC-pseudonymized actors on relays, anchors published every 1 000 entries or 5 minutes, buffered coalescing of repeated read-only denials, and no payload content.
- Provide the capability registry loader that validates every command and query declares exactly one capability.

## Not responsible for

- Authenticating relay access tokens and challenge-response (F07.S01.M02 sessions) and the signature primitives and envelopes (F11.S01.M03, F16.S02.M03).
- Quarantine storage, the quarantine view and export of quarantined statements (F11.S01.M02), the statement-type registry and its signer roles (F11.S01.M01), and user key validity (F07.S02.M01).
- Reading user account state such as blocks or suspension; those facts are supplied in the context by the caller.
- Moderation decisions that create suspensions (F12.S02.M01) and limit values (F12.S03.M04).
- Legal-hold two-person approval workflow (F10.S01.M02).
- Tenant records and the derived operator list (F15.S04.M03), which creates the first tenant operator and admin through RoleBootstrapPort.
- Future: delegated capabilities with signed, expiring capability tokens; hardware-key bound roles.

## User stories

- As a user, I know that only my unlocked vault can change my records, and that a statement claiming to come from someone else is held back unless the key the registry requires for that role signed it.
- As a relay admin, I assign a moderator role to a member's identity for 90 days and can see in the audit log every decision made with that role.
- As an auditor of a relay, I can verify that the audit log has not been altered or truncated up to the last anchor that I or a peer fetched.
- As the person starting a relay, I create the first admin from the relay command line with access to the relay's data directory, and I can use the same command with a recorded reason if the only admin is compromised.

## Edge cases

- Capability is not in the registry; authorize returns Deny(FORBIDDEN) with reason unknown_capability and never falls through to allow.
- A statement is signed by a device key that F07.S02.M01 reports revoked with revokesEffectiveAt at or before this vault's first sight of the statement; authorizeStatement returns Quarantine(signer_key_revoked) and F11.S01.M02 stores and shows it.
- Two admins revoke each other simultaneously; the second revoke is refused with SECURITY_LAST_ADMIN because at least one admin must remain.
- Role expires between the HTTP request check and the handler's re-check inside the transaction; the re-check denies and the command returns FORBIDDEN.
- Audit denial flood from one key on a read-only capability; identical denials within 60 seconds are buffered in memory and appended once when the window closes, with a count; denials on state-changing commands are never buffered.
- Audit log truncated by an attacker with disk access; chain verification reports the first missing sequence and compares the head with the last externally published anchor; entries appended after that anchor are the stated residual window.
- A federated statement's signer does not hold the role the F11.S01.M01 registry requires for its type; authorizeStatement returns Quarantine(signer_role_invalid) whatever role the calling context suggests.
- A fresh relay has no admin; every role command is refused, and relay roles bootstrap --admin <did:key> run on the host with filesystem access to RELAY_DATA_DIR creates the first admin.
- The only admin's identity is compromised; relay roles bootstrap --admin <did:key> --break-glass --reason <text> grants a new admin although one exists, records the reason and OS user, and opens a SEV1 incident through security.role.assigned with breakGlass true.
- A moderator's device key is stolen and revoked in their identity document; once the relay stores that document, requests signed by the stolen key are denied with reason signer_key_revoked while the moderator's other device keys keep the role.
- The subject DID of the last admin becomes contested in F07.S02.M01; the assignment is revoked with reason subject_contested, security.role.revoked carries lastAdmin true, a SEV1 incident opens and only bootstrap is usable until a new admin exists.
- An assign request names an admin as approvedBy but that admin never signed an approval; it is refused with SECURITY_APPROVAL_REQUIRED.
- An admin proposal is not approved within 24 hours; it expires and grants nothing.
- Roles imported from another relay stay imported_inactive and grant nothing until an admin of this relay activates them.

## UX and accessibility

- Relay admin roles screen: list of role assignments (subject fingerprint from F07.S01.M01 fingerprintOf, role, scope relay or community name, granted by, approval, expiry, status), pending admin proposals with approve and cancel, assign and revoke forms with confirmation naming the subject fingerprint, and a bootstrap-required banner when no admin exists.
- Audit log viewer (relay_operator and admin): filter by capability, decision, time; entry details without payload; chain verification button with result, the last externally published anchor and the residual window since it.
- Relay CLI output of relay roles bootstrap: created assignment, role statement cid, OS user recorded, and for break-glass the reason and the note that a SEV1 incident was opened.

**States:** loading; empty; populated; pending-approval; bootstrap-required; verifying-chain; chain-ok; chain-broken

**Accessibility:** Role, scope and decision values are text labels, not color alone.; Tables have headers and are keyboard navigable; destructive revoke uses a confirmation dialog with focus trap.; Chain verification result is announced in an aria-live polite region.

## Owned data

- `RoleAssignment` (classrup.security.roleassignment/v1, P1, RET-AUDIT)
- `AuditEntry` (classrup.security.auditentry/v1, P3, RET-AUDIT)

## Interfaces

- Commands: `security.roleassignment.assign`, `security.roleassignment.propose`, `security.roleassignment.approve`, `security.roleassignment.activate_import`, `security.roleassignment.bootstrap`, `security.roleassignment.revoke`
- Queries: `security.roleassignment.list`, `security.auditentry.list`, `security.auditentry.verify_chain`, `security.auditentry.list_anchors`
- Emits: `security.role.assigned`, `security.role.revoked`
- Consumes: `identity.session.revoked`, `identity.portable_doc.published`, `moderation.action.applied`, `moderation.action.reverted`, `privacy.legal_hold.placed`, `privacy.legal_hold.released`

## Dependencies

F16.S01.M02, F10.S02.M02, CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-126-01 | [Domain schema](domain_schema.md) | 5 |
| PS-126-02 | [Validation rules](validation_rules.md) | 3 |
| PS-126-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-126-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-126-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-126-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-126-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-126-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-126-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-126-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/authz/authorization/index.ts`.

## Acceptance criteria

- All tests T01–T21 pass in CI.
- authorize is pure and every unlisted capability, role and scope combination denies (property tests).
- The audit chain detects any edit, deletion or truncation of entries covered by the last externally published anchor in tamper tests, and the residual window after it is reported.
