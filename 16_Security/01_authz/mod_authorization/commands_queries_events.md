# PS-126-04 — Commands, queries and events: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-04.R01** authorize and authorizeStatement are in-process pure functions, evaluated by the command bus before every handler (authorize) and by F11.S01.M02 intake before a statement is acted on (authorizeStatement), with the required signer role resolved only through RoleResolverPort and key status only through KeyStatusPort.
- **PS-126-04.R02** Role assign, propose, approve, activate_import, bootstrap and revoke are relay commands that produce relay-signed role statements and emit security.role.assigned and security.role.revoked.
- **PS-126-04.R03** The module consumes session, identity document, suspension and legal-hold events only to invalidate caches, revoke the roles of contested identities or protect audit rows.
- **PS-126-04.R04** RoleBootstrapPort.bootstrap({ adminKey?, operatorKeys?, tenantId?, breakGlassReason?, osUser }) is the in-process form of security.roleassignment.bootstrap used by F15.S04.M03 tenant bootstrap in the same transaction, so a tenant's first operator and the relay's first admin are created together.
- **PS-126-04.R05** Statements and signer roles (N2) are registered with F11.S01.M01 - classrup.security.role_statement/v1 and classrup.security.audit_anchor/v1 are CTR-FED-001 envelopes with author = relay did:key signed by the relay key, and classrup.security.role_approval/v1 is a CTR-FED-001 envelope with author = the approving admin principal and ext.signerKey = one of its active device keys.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `security.roleassignment.assign` | security.roleassignment.assign | { subjectKey, role: moderator\|operator\|relay_operator, scope, expiresInMs } | { roleAssignmentId, status: active, statementCid, revision: 1 } | VALIDATION_FAILED, SECURITY_APPROVAL_REQUIRED, FORBIDDEN, CONFLICT_STATE | security.role.assigned | yes (Idempotency-Key) |
| `security.roleassignment.propose` | security.roleassignment.propose | { subjectKey, role: admin, scope: relay } | { roleAssignmentId, status: pending_approval\|active, approvalDeadline?, statementCid?, revision: 1 } | VALIDATION_FAILED, FORBIDDEN, CONFLICT_STATE | security.role.assigned | yes (Idempotency-Key) |
| `security.roleassignment.approve` | security.roleassignment.approve | { roleAssignmentId, expectedRevision, approval: classrup.security.role_approval/v1 envelope } | { roleAssignmentId, status: active, approvalStatementCid, statementCid, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SECURITY_APPROVAL_REQUIRED, FORBIDDEN, EXPIRED | security.role.assigned | yes (Idempotency-Key) |
| `security.roleassignment.activate_import` | security.roleassignment.activate_import | { roleAssignmentId, expectedRevision } | { roleAssignmentId, status: active, statementCid, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, FORBIDDEN | security.role.assigned | yes (Idempotency-Key) |
| `security.roleassignment.bootstrap` | security.roleassignment.bootstrap | { adminKey: did:key, breakGlassReason? (20..500 code points), osUser } | { roleAssignmentId, status: active, via: bootstrap\|break_glass, statementCid, auditSeq } | VALIDATION_FAILED, SECURITY_BOOTSTRAP_REFUSED | security.role.assigned | yes (Idempotency-Key) |
| `security.roleassignment.revoke` | security.roleassignment.revoke | { roleAssignmentId, expectedRevision, reason } | { roleAssignmentId, status: revoked, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SECURITY_LAST_ADMIN, FORBIDDEN | security.role.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `security.roleassignment.list` | security.roleassignment.read | { role?, scope?, status?, cursor?, limit ≤ 100 } | { items: RoleAssignment[], nextCursor? } |  |
| `security.auditentry.list` | security.auditentry.read | { capability?, decision?, from, to, cursor?, limit ≤ 200 } | { items: AuditEntry[], nextCursor? } | VALIDATION_FAILED |
| `security.auditentry.verify_chain` | security.auditentry.verify | { fromSeq?, toSeq? } | { ok, checked, firstBrokenSeq?, headHash, lastPublishedAnchor: { seq, entryHash, statementCid }, entriesAfterAnchor } |  |
| `security.auditentry.list_anchors` | security.auditentry.read_public | { sinceSeq?, limit ≤ 100 } | { items: classrup.security.audit_anchor/v1 statements } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `security.role.assigned` | P1 | { roleAssignmentId, relayId, subjectKey, role, scope, via, breakGlass: boolean, grantedBy?, approvedBy?, expiresAt?, statementCid } |
| `security.role.revoked` | P1 | { roleAssignmentId, relayId, subjectKey, role, scope, revokedBy?, reason: revoked\|expired\|subject_contested, lastAdmin: boolean, statementCid } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.session.revoked` | drop cached grants for the revoked session before the 60 second bound |
| `identity.portable_doc.published` | drop cached key status for the document's DID; when its status is contested, revoke that DID's active assignments on this relay with reason subject_contested, setting lastAdmin when it held the last admin |
| `moderation.action.applied` | invalidate cached suspension and restriction facts for the subject on this relay |
| `moderation.action.reverted` | invalidate cached suspension and restriction facts for the subject on this relay |
| `privacy.legal_hold.placed` | exempt audit rows referencing the held subject from the retention sweep |
| `privacy.legal_hold.released` | return the released audit rows to the RET-AUDIT retention sweep |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_APPROVAL_REQUIRED | 422 | no | an admin grant needs a signed approval by a second active admin |
| SECURITY_LAST_ADMIN | 409 | no | at least one active admin must remain on the relay |
| SECURITY_BOOTSTRAP_REFUSED | 409 | no | bootstrap needs the local CLI and either no active admin or a recorded break-glass reason |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements (N2, registered in F11.S01.M01): classrup.security.role_statement/v1 { relayId, roleAssignmentId, subjectKey, role, scope, status: active|revoked|expired, via, grantedBy?, approvalStatementCid?, grantedAt?, expiresAt?, revokedAt?, revokeReason? } audience public, signer role relay (the relay's current key); classrup.security.role_approval/v1 { relayId, roleAssignmentId, subjectKey, role: admin, proposedBy, approvalDeadline } audience relay-local, signer role principal holding an active relay-scope admin RoleAssignment on relayId (checked here); classrup.security.audit_anchor/v1 { relayId, seq, entryHash, prevAnchorCid?, anchoredAt, entriesSinceLast } audience public, signer role relay. Injected ports (dependency inversion, wired by the vault and relay composition roots because the implementers depend on this module): RoleResolverPort.roleFor(type, context) implemented by F11.S01.M01; KeyStatusPort.keyStatus(did, publicKey, at) implemented by F07.S02.M01. authorizeStatement(statement, context) -> Accept | Quarantine(statusReason) uses the F11.S01.M02 statusReason vocabulary (signer_role_invalid, signer_key_revoked), has no expected-role parameter and ignores any role hint in the context. Provided port: RoleBootstrapPort.bootstrap for F15.S04.M03. Privacy duties (N6, N6a): fields carry F10.S02.M02 classification annotations; the vault audit log registers ExportSectionPort (security.audit), DeletionPort (removed with the vault erase step) and RetentionPurgePort (RET-AUDIT, legal hold respected) with the F10.S01.M03, F10.S01.M04 and F10.S01.M02 registries injected by the composition root, because those modules depend on this one.

### Example

```
authorize({ kind: "relay_key", principal: "did:key:z6MkMod", signerKey: "did:key:z6MkModDev1", roles: [{ role: "moderator", scope: "tenant:0192f3a4-…" }] }, "moderation.action.apply", { tenantId: "0192f3a4-…", caseAssignee: "did:key:z6MkMod" }, { now, keyStatus })
-> Allow
authorize({ kind: "relay_key", principal: "did:key:z6MkMod", signerKey: "did:key:z6MkModDev1", roles: [{ role: "moderator", scope: "tenant:0192f3a4-…" }] }, "moderation.action.apply", { tenantId: "0192f3b9-…" }, { now, keyStatus })
-> Deny(FORBIDDEN, reason: "scope_mismatch")  (audit entry seq 4812 written)
authorizeStatement({ type: "classrup.bazaar.offer_decision/v1", payload: { decision: "accepted" }, author: "did:key:z6MkBuyer", ext: { signerKey: "did:key:z6MkBuyerDev" } }, { listingAuthor: "did:key:z6MkSeller", roleHint: "anyone" })
-> Quarantine("signer_role_invalid")   // role from RoleResolverPort.roleFor; the hint is ignored
$ relay roles bootstrap --admin did:key:z6MkAdmin
-> admin assignment 0192f3c0-… active (via bootstrap), role statement sha256-Rk…, audit seq 1 (os user classrup)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T05 | contract | PS-126-04.R02, PS-126-04.R05 | commands, queries, events and statements | validate against registry schemas; role_statement and audit_anchor verify as CTR-FED-001 envelopes by the relay key; role_approval verifies with the approver's device key; all three are registered in F11.S01.M01 |
| TEST-PS-126-09.T06 | integration | PS-126-04.R03 | identity.session.revoked, moderation.action.applied, identity.portable_doc.published with status contested for A2, privacy.legal_hold.placed then released | caches flushed; A2's admin revoked with subject_contested and lastAdmin false; held rows exempted then returned to the sweep |
| TEST-PS-126-09.T08 | abuse | PS-126-04.R01, PS-126-05.R01 | statement accepting an offer signed by a non-author; signer device key revoked before first sight; caller context claims a weaker role than the registry requires | Quarantine(signer_role_invalid), Quarantine(signer_key_revoked), Quarantine(signer_role_invalid) with the hint ignored; nothing stored by this module |
| TEST-PS-126-09.T16 | integration | PS-126-03.R05, PS-126-04.R04, PS-126-05.R04 | fresh relay rejects assign; CLI bootstrap creates A1; second bootstrap without break-glass; break-glass with a 30-character reason; bootstrap attempted over HTTP; RoleBootstrapPort from a tenant bootstrap stub | A1 active via bootstrap with OS user audited; SECURITY_BOOTSTRAP_REFUSED; new admin via break_glass and security.role.assigned with breakGlass true; no HTTP route; operator and admin created in one transaction |

## Dependencies

Module depends on: F16.S01.M02, F10.S02.M02, CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
