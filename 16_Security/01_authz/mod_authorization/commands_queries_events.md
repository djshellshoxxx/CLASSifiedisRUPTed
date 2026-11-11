# PS-126-04 — Commands, queries and events: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-04.R01** authorize and authorizeStatement are in-process pure functions evaluated by the command bus before every handler in both vault and relay.
- **PS-126-04.R02** Role assign and revoke are relay commands that produce signed role statements and emit security.role.assigned and security.role.revoked.
- **PS-126-04.R03** The module consumes session, suspension and legal-hold events only to invalidate caches or protect audit rows.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `security.roleassignment.assign` | security.roleassignment.assign | { subjectKey, role, expiresInMs?, approvedBy? } | { roleAssignmentId, statementCid, revision: 1 } | VALIDATION_FAILED, SECURITY_APPROVAL_REQUIRED, FORBIDDEN | security.role.assigned | yes (Idempotency-Key) |
| `security.roleassignment.revoke` | security.roleassignment.revoke | { roleAssignmentId, expectedRevision, reason } | { roleAssignmentId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SECURITY_LAST_ADMIN, FORBIDDEN | security.role.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `security.roleassignment.list` | security.roleassignment.read | { role?, activeOnly?: boolean, cursor?, limit ≤ 100 } | { items: RoleAssignment[], nextCursor? } |  |
| `security.auditentry.list` | security.auditentry.read | { capability?, decision?, from, to, cursor?, limit ≤ 200 } | { items: AuditEntry[], nextCursor? } | VALIDATION_FAILED |
| `security.auditentry.verify_chain` | security.auditentry.verify | { fromSeq?, toSeq? } | { ok, checked, firstBrokenSeq?, headHash, lastAnchor } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `security.role.assigned` | P1 | { roleAssignmentId, subjectKey, role, grantedBy, expiresAt, statementCid } |
| `security.role.revoked` | P1 | { roleAssignmentId, subjectKey, role, revokedBy, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.session.revoked` | drop cached grants for the revoked session before the 60 second bound |
| `moderation.action.applied` | invalidate cached suspension and restriction facts for the subject key on this relay |
| `moderation.action.reverted` | invalidate cached suspension and restriction facts for the subject key on this relay |
| `privacy.legal_hold.placed` | exempt audit rows referencing the held subject from the retention sweep |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_APPROVAL_REQUIRED | 422 | no | granting admin needs a second active admin as approver |
| SECURITY_LAST_ADMIN | 409 | no | at least one active admin must remain on the relay |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
authorize({ kind: "relay_key", key: "did:key:z6MkMod", roles: ["moderator"] }, "moderation.action.apply", { caseAssignee: "did:key:z6MkMod" }, { now })
-> Allow
authorize({ kind: "relay_key", key: "did:key:z6MkMember", roles: [] }, "moderation.action.apply", {}, { now })
-> Deny(FORBIDDEN, reason: "role_missing")  (audit entry seq 4812 written)
authorizeStatement({ schema: "classrup.bazaar.offeracceptance/v1", signerKey: "did:key:z6MkBuyer", offerAuthor: "did:key:z6MkSeller" }, "listing_author", ctx)
-> Quarantine("unauthorized_role")
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T05 | contract | PS-126-04.R01, PS-126-04.R02, PS-126-09.R02 | commands, queries and events | validate against registry schemas; role statements verify with the relay key |
| TEST-PS-126-09.T06 | integration | PS-126-04.R03 | session.revoked and action.applied events | caches flushed; next request uses fresh facts |

## Dependencies

Module depends on: CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
