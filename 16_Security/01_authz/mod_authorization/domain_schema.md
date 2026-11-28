# PS-126-01 — Domain schema: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-01.R01** A RoleAssignment stores relay, subject principal DID, role, scope (relay or tenant:<uuidv7>), status, grant path, grantor, optional approver with the cid of the approver's signed approval, grant time, expiry and revocation, with tenant and revision per CTR-ID-001.
- **PS-126-01.R02** An AuditEntry stores sequence, HMAC-pseudonymized actor, capability, resource ID, decision, deny code or reason, correlation ID, idempotency key hash, coalesced count and chain hashes, and never payload content, retained under RET-AUDIT.
- **PS-126-01.R03** Roles exist per relay only; assignments are published as relay-signed role statements (classrup.security.role_statement/v1) and are P1 within the relay's members.
- **PS-126-01.R04** Valid role and scope pairs are fixed - admin and relay_operator only at scope relay, operator only at scope tenant:<id> of a tenant on this relay, moderator at scope relay or tenant:<id> - and authorize matches a relay-scope role for every resource on that relay and a tenant-scope role only for resources whose tenantId equals the scope's id.
- **PS-126-01.R05** The subject of an assignment is a principal DID (the account root did:key), never a device key, and a request exercises the role only when signed by a device key that the principal's portable identity document lists as active at the relay's receipt time (F07.S02.M01 KeyStatusPort).

## Specification

### RoleAssignment

Schema `classrup.security.roleassignment/v1` · storage **relay** · privacy **P1** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope per CTR-ID-001 ID-6 (the relay's bootstrap tenant) |
| relayId | string — canonical relayId of this relay (F15.S02.M01) |
| subjectKey | did:key — principal DID holding the role; never a device key |
| role | enum — moderator \| operator \| relay_operator \| admin |
| scope | string — relay \| tenant:<uuidv7>; admin and relay_operator only relay, operator only tenant:<id>, moderator either |
| status | enum — pending_approval \| imported_inactive \| active \| revoked \| expired |
| via | enum — assign \| propose \| approve \| bootstrap \| break_glass \| import |
| grantedBy? | did:key — admin principal who assigned or proposed; absent for bootstrap |
| approvedBy? | did:key — second admin principal for admin grants approved through security.roleassignment.approve |
| approvalStatementCid? | string — cid of the approver's signed classrup.security.role_approval/v1 statement |
| proposedAt? | timestamp — RFC 3339 UTC, relay clock |
| approvalDeadline? | timestamp — proposedAt + 24 h |
| grantedAt? | timestamp — RFC 3339 UTC, relay clock, set on entering active |
| expiresAt? | timestamp — RFC 3339 UTC; required for moderator, operator and relay_operator, at most 365 days; never set for admin |
| revokedAt? | timestamp — RFC 3339 UTC |
| revokedBy? | did:key — admin principal, absent for automatic revocation |
| revokeReason? | enum — revoked \| expired \| subject_contested \| cancelled \| approval_expired \| tenant_archived (RoleBootstrapPort.archiveTenant only) |
| breakGlassReason? | string — 20..500 code points, required when via is break_glass |
| bootstrapOsUser? | string — OS user name that ran the local CLI for bootstrap or break-glass |
| importedFrom? | string — relayId of the exporting relay for imported records |
| statementCid? | string — content id of the latest relay-signed role statement |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- Once bootstrapped, at least one active admin assignment exists per relay, except after an automatic revocation with reason subject_contested of the last admin, which emits lastAdmin true, opens a SEV1 incident and leaves only security.roleassignment.bootstrap usable until an admin exists.
- subjectKey differs from grantedBy and from approvedBy, and approvedBy differs from grantedBy.
- An assignment grants its role only in status active with expiresAt absent or in the future; admin assignments never carry expiresAt.
- At most one assignment with status active, pending_approval or imported_inactive exists per (relayId, subjectKey, role, scope).
- The scope matches the role per the valid pairs, and a tenant scope names a tenant that exists on this relay.
- security.roleassignment.revoke never removes the last active operator assignment of a tenant scope; only expiry, a subject_contested revocation (both with lastOperator true) and RoleBootstrapPort.archiveTenant (reason tenant_archived) leave a tenant scope without an active operator.

### AuditEntry

Schema `classrup.security.auditentry/v1` · storage **relay+device** · privacy **P3** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope (vault or relay) |
| seq | int — gapless per store, starting at 1 |
| actorKeyHash | string — relay: hex HMAC-SHA256 of the actor principal DID with the relay audit pepper loaded through F16.S01.M02 (AUDIT_PEPPER); vault: the marker local |
| actorOsUser? | string — OS user for local CLI actions (bootstrap, break-glass, containment) |
| capability | string — capability ID |
| resourceId? | string — resource identifier, never content |
| decision | enum — allow \| deny \| quarantine |
| reason | string — stable reason code such as unknown_capability, not_owner, role_missing, scope_mismatch, signer_key_revoked, signer_role_invalid |
| denyCode? | string — error code returned |
| correlationId | uuidv7 — request correlation |
| idempotencyKeyHash? | string — hex SHA-256 of (actorKeyHash, command, Idempotency-Key); unique per store, so a replay never adds an entry |
| count | int — 1, or the number of identical read-only denials buffered in one 60 s window |
| windowStart? | timestamp — first denial of a coalesced window |
| occurredAt | timestamp — RFC 3339 UTC, store clock (window close for coalesced entries) |
| prevHash | string — hex SHA-256 of the previous entry hash, 64 chars |
| entryHash | string — hex SHA-256 over JCS bytes of the v1 field set of this entry without entryHash, computed when the entry is appended |

**Invariants**
- seq increases by exactly 1 and entryHash covers prevHash, so any removal or edit before the last externally published anchor is detectable.
- No payload field, token, key material or P2+ value is ever stored in an entry.
- Audit rows are append-only and are never updated or deleted before RET-AUDIT expiry.
- Entries for state-changing commands are appended in the command's own transaction and are never buffered or coalesced (CAP-7).

### Storage DDL

```sql
CREATE TABLE security_role_assignment (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, subject_key TEXT NOT NULL, role TEXT NOT NULL,
  scope TEXT NOT NULL, status TEXT NOT NULL, granted_by TEXT, expires_at TEXT, revoked_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX security_role_live ON security_role_assignment(tenant_id, subject_key, role, scope)
  WHERE status IN ('active', 'pending_approval', 'imported_inactive');
CREATE INDEX security_role_scope ON security_role_assignment(tenant_id, scope, role, status);
CREATE TABLE security_audit_entry (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, seq INTEGER NOT NULL, actor_key_hash TEXT NOT NULL, capability TEXT NOT NULL,
  decision TEXT NOT NULL, idempotency_key_hash TEXT, occurred_at TEXT NOT NULL, prev_hash TEXT NOT NULL, entry_hash TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX security_audit_seq ON security_audit_entry(tenant_id, seq);
CREATE UNIQUE INDEX security_audit_replay ON security_audit_entry(tenant_id, idempotency_key_hash) WHERE idempotency_key_hash IS NOT NULL;
CREATE TRIGGER security_audit_no_update BEFORE UPDATE ON security_audit_entry BEGIN SELECT RAISE(ABORT, 'append-only'); END;
CREATE TRIGGER security_audit_no_early_delete BEFORE DELETE ON security_audit_entry
  WHEN old.occurred_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-365 days') BEGIN SELECT RAISE(ABORT, 'append-only'); END;
CREATE TABLE security_audit_anchor (
  tenant_id TEXT NOT NULL, seq INTEGER NOT NULL, entry_hash TEXT NOT NULL, statement_cid TEXT NOT NULL, anchored_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, seq));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T01 | unit | PS-126-01.R01, PS-126-01.R03, PS-126-02.R01 | assign moderator at scope relay for 90 days and operator O3 at scope tenant:T1 | assignments stored active with scope, role statements signed by the relay key, expiry set |
| TEST-PS-126-09.T09 | abuse | PS-126-01.R02, PS-126-07.R04, PS-126-09.R03 | UPDATE and DELETE audit rows; remove a middle entry; truncate the tail before and after the last published anchor | triggers abort; verify_chain reports the first broken seq; truncation before the anchor detected; entries after it reported as the residual window |
| TEST-PS-126-09.T18 | unit | PS-126-01.R04, PS-126-01.R05 | M (scope relay) acts on T1 and T2; moderator at tenant:T1 acts on T2; request signed by an active device key of M; subjectKey given as a device key of another DID | allowed twice; FORBIDDEN scope_mismatch; device key resolved to the principal; VALIDATION_FAILED |

## Dependencies

Module depends on: F16.S01.M02, F10.S02.M02, CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
