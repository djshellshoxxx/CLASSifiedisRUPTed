# PS-126-01 — Domain schema: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-01.R01** A RoleAssignment stores relay, subject key, role, grantor, optional second approver, grant time, expiry and revocation, with tenant and revision per CTR-ID-001.
- **PS-126-01.R02** An AuditEntry stores sequence, actor key hash, capability, resource ID, decision, deny code or reason, correlation ID, coalesced count and chain hashes, and never payload content, retained under RET-AUDIT.
- **PS-126-01.R03** Roles exist per relay only; assignments are published as relay-signed role statements and are P1 within the relay's members.

## Specification

### RoleAssignment

Schema `classrup.security.roleassignment/v1` · storage **relay** · privacy **P1** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| subjectKey | did:key — key holding the role |
| role | enum — moderator \| operator \| admin |
| grantedBy | did:key — admin who granted |
| approvedBy? | did:key — second admin, required to grant admin when two or more admins exist |
| grantedAt | timestamp — RFC 3339 UTC, relay clock |
| expiresAt? | timestamp — RFC 3339 UTC; required for moderator and operator, at most 365 days |
| revokedAt? | timestamp — RFC 3339 UTC |
| revokedBy? | did:key |
| statementCid | string — content id of the relay-signed role statement |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At least one active admin assignment exists per relay at all times.
- subjectKey differs from grantedBy and from approvedBy.
- An assignment is active when revokedAt is absent and expiresAt is absent or in the future.

### AuditEntry

Schema `classrup.security.auditentry/v1` · storage **relay+device** · privacy **P3** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope (vault or relay) |
| seq | int — gapless per store, starting at 1 |
| actorKeyHash | string — SHA-256 of the actor key (relay) or local-principal marker (vault) |
| capability | string — capability ID |
| resourceId? | string — resource identifier, never content |
| decision | enum — allow \| deny \| quarantine |
| reason | string — stable reason code such as unknown_capability, not_owner, role_missing, signer_revoked |
| denyCode? | string — error code returned |
| correlationId | uuidv7 — request correlation |
| count | int — 1, or the number of coalesced identical denials within 60 s |
| occurredAt | timestamp — RFC 3339 UTC, store clock |
| prevHash | string — hex SHA-256 of the previous entry hash, 64 chars |
| entryHash | string — hex SHA-256 over JCS bytes of this entry without entryHash |

**Invariants**
- seq increases by exactly 1 and entryHash covers prevHash, so any removal or edit is detectable.
- No payload field, token, key material or P2+ value is ever stored in an entry.
- Audit rows are append-only and are never updated or deleted before RET-AUDIT expiry.

### Storage DDL

```sql
CREATE TABLE security_role_assignment (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_key TEXT NOT NULL, role TEXT NOT NULL, granted_by TEXT NOT NULL,
  expires_at TEXT, revoked_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX security_role_subject ON security_role_assignment(tenant_id, subject_key, role);
CREATE TABLE security_audit_entry (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, seq INTEGER NOT NULL, actor_key_hash TEXT NOT NULL, capability TEXT NOT NULL,
  decision TEXT NOT NULL, occurred_at TEXT NOT NULL, prev_hash TEXT NOT NULL, entry_hash TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX security_audit_seq ON security_audit_entry(tenant_id, seq);
CREATE TRIGGER security_audit_no_update BEFORE UPDATE ON security_audit_entry BEGIN SELECT RAISE(ABORT, 'append-only'); END;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T01 | unit | PS-126-01.R01, PS-126-01.R02, PS-126-01.R03, PS-126-02.R01 | assign moderator for 90 days | assignment stored, statement signed, expiry set |

## Dependencies

Module depends on: CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
