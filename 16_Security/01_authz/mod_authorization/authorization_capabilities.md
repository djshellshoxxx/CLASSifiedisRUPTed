# PS-126-05 — Authorization and capabilities: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-05.R01** Vault policy: the vault accepts local commands only from the unlocked local principal, and authorizeStatement accepts an incoming statement only when its signer holds the role the F11.S01.M01 registry requires and its key is active per F07.S02.M01; F11.S01.M02 stores and shows the quarantined ones.
- **PS-126-05.R02** Relay policy: relay roles apply only to the relay that assigned them and only within their scope; admins assign roles, relay_operators run relay-wide operations, tenant operators configure their tenant, moderators act on moderation capabilities, and members use own-resource capabilities.
- **PS-126-05.R03** Reading the audit log requires relay_operator or admin on that relay, and the vault owner may read the local audit log.
- **PS-126-05.R04** Bootstrap and break-glass are authorized only by filesystem access to the relay data directory through the local CLI, never over HTTP, and the OS user and reason are recorded in the audit entry.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| security.roleassignment.assign | admin | relay-scope admin signing with an active device key; subject is not actor; role is not admin; scope valid for the role |
| security.roleassignment.propose | admin | relay-scope admin signing with an active device key; role admin at scope relay; subject is not actor |
| security.roleassignment.approve | admin | a different active relay-scope admin, neither proposer nor subject, whose signed role_approval statement arrives before approvalDeadline |
| security.roleassignment.activate_import | admin | relay-scope admin of this relay; imported record passes V01 and V02 |
| security.roleassignment.bootstrap | local relay CLI | filesystem access to RELAY_DATA_DIR; no active admin, or a break-glass reason; never over HTTP; OS user recorded |
| security.roleassignment.revoke | admin | relay-scope admin; at least one active admin remains |
| security.roleassignment.read | relay_operator, admin | relay-scope role |
| security.auditentry.read | relay_operator, admin, local principal | relay-scope role, or vault unlocked for the local audit log |
| security.auditentry.verify | relay_operator, admin, local principal | relay-scope role, or vault unlocked |
| security.auditentry.read_public | anonymous | published audit anchors only, never entries |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T07 | abuse | PS-126-05.R01, PS-126-05.R02, PS-126-05.R03, PS-126-07.R03 | member assigns a role; moderator reads audit; self-grant; sole admin revokes self; O1 configures T2 and assigns roles; R1 assigns roles | FORBIDDEN, FORBIDDEN, FORBIDDEN, SECURITY_LAST_ADMIN, FORBIDDEN, FORBIDDEN |
| TEST-PS-126-09.T08 | abuse | PS-126-04.R01, PS-126-05.R01 | statement accepting an offer signed by a non-author; signer device key revoked before first sight; caller context claims a weaker role than the registry requires | Quarantine(signer_role_invalid), Quarantine(signer_key_revoked), Quarantine(signer_role_invalid) with the hint ignored; nothing stored by this module |
| TEST-PS-126-09.T16 | integration | PS-126-03.R05, PS-126-04.R04, PS-126-05.R04 | fresh relay rejects assign; CLI bootstrap creates A1; second bootstrap without break-glass; break-glass with a 30-character reason; bootstrap attempted over HTTP; RoleBootstrapPort from a tenant bootstrap stub | A1 active via bootstrap with OS user audited; SECURITY_BOOTSTRAP_REFUSED; new admin via break_glass and security.role.assigned with breakGlass true; no HTTP route; operator and admin created in one transaction |
| TEST-PS-126-09.T21 | abuse | PS-126-05.R01 | vault locked; a command authored by a different principal in the same browser profile | FORBIDDEN with reasons vault_locked and not_owner; nothing written |

## Dependencies

Module depends on: F16.S01.M02, F10.S02.M02, CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
