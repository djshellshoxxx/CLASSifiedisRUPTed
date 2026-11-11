# PS-126-02 — Validation rules: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-02.R01** Role commands are validated strictly, including role and scope vocabulary, expiry bounds, the signed two-person rule for admin and the bootstrap preconditions.
- **PS-126-02.R02** authorize() inputs are validated structurally and any malformed input returns Deny without throwing.
- **PS-126-02.R03** Every violation maps to one stable error code.
- **PS-126-02.R04** Revocation keeps at least one active admin per relay and at least one active operator per tenant scope, counting only active operator assignments of that same tenant:<id> scope.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | role is moderator, operator, relay_operator or admin; scope is relay or tenant:<uuidv7> of a tenant on this relay and the pair is valid (admin and relay_operator at relay, operator at tenant, moderator at either); subjectKey is a well-formed Ed25519 did:key that KeyStatusPort does not report as a device key of another DID | VALIDATION_FAILED |
| V02 | moderator, operator and relay_operator assignments carry expiresAt within 365 days; admin assignments carry no expiresAt | VALIDATION_FAILED |
| V03 | an admin grant while two or more active admins exist goes through propose and approve, and approve carries a classrup.security.role_approval/v1 statement signed by a device key active for a different active admin principal (neither proposer nor subject) before approvalDeadline; assign with role admin, or any request naming approvedBy without that signed statement, is refused | SECURITY_APPROVAL_REQUIRED |
| V04 | grantor is an active relay-scope admin of this relay signing with a device key active in its portable identity document, and is not the subject | FORBIDDEN |
| V05 | revoking must leave at least one active admin | SECURITY_LAST_ADMIN |
| V06 | expectedRevision matches the assignment revision | CONFLICT_REVISION |
| V07 | audit query range spans at most 90 days per request | VALIDATION_FAILED |
| V08 | bootstrap runs only from the local relay CLI with filesystem access to RELAY_DATA_DIR, and only when no active admin exists or with a break-glass reason of 20..500 code points | SECURITY_BOOTSTRAP_REFUSED |
| V09 | activating an imported assignment is requested by an active relay-scope admin of this relay, and the imported subject, role, scope and expiry pass V01 and V02 | FORBIDDEN |
| V10 | a role is exercised only when the request's signing device key is active for the subject principal at the relay's receipt time per KeyStatusPort and the subject DID is not contested | FORBIDDEN |
| V11 | revoking an active operator assignment of scope tenant:<id> through security.roleassignment.revoke leaves at least one active operator assignment of that same scope; operators of other tenants and relay-scope roles do not count, and only RoleBootstrapPort.archiveTenant may remove the last one | SECURITY_LAST_OPERATOR |
| V12 | RoleBootstrapPort.bootstrapTenant runs inside the caller's open transaction tx, tenantId is a uuidv7 with no live assignment of scope tenant:<tenantId>, and operatorKeys holds 1..10 distinct principal did:keys that each pass V01 | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T01 | unit | PS-126-01.R01, PS-126-01.R03, PS-126-02.R01 | assign moderator at scope relay for 90 days and operator O3 at scope tenant:T1 | assignments stored active with scope, role statements signed by the relay key, expiry set |
| TEST-PS-126-09.T02 | unit | PS-126-02.R01, PS-126-02.R03 | each rule V01–V12 violated, including admin with expiresAt, operator at scope relay, relay_operator at tenant scope, unknown tenant and a malformed did:key | documented error code and nothing stored |
| TEST-PS-126-09.T03 | property | PS-126-02.R02, PS-126-06.R01, PS-126-09.R02 | generated actors, capabilities, resources, scopes and malformed inputs | authorize never throws, is deterministic, every unlisted combination denies, and a tenant-scope role never matches another tenant's resource |
| TEST-PS-126-09.T17 | integration | PS-126-02.R01, PS-126-03.R04 | A1 proposes admin S with A2 approving within 24 h; a proposal left 25 h; assign naming A2 as approvedBy without a signed approval; approval signed by the proposer | S active with approvalStatementCid; expired with approval_expired; SECURITY_APPROVAL_REQUIRED; SECURITY_APPROVAL_REQUIRED |
| TEST-PS-126-09.T22 | integration | PS-126-02.R04, PS-126-03.R06 | A1 revokes O1, the only operator of tenant:T1, while O2 operates tenant:T2 and R1 is relay_operator; a second operator O3 is added to T1 and O1 is revoked again; O2 reaches expiresAt as T2's only operator; O4, the only operator of tenant:T3, becomes contested; archiveTenant(tx, T1) with O3 and a moderator at tenant:T1 | SECURITY_LAST_OPERATOR and nothing changed; O1 revoked; O2 expired with lastOperator true; O4 revoked subject_contested with lastOperator true; both T1 assignments revoked with reason tenant_archived inside tx, one security.role.revoked each |

## Dependencies

Module depends on: F16.S01.M02, F10.S02.M02, CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
