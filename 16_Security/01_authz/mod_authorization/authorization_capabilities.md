# PS-126-05 — Authorization and capabilities: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-05.R01** Vault policy: the vault accepts local commands only from the unlocked local principal, and records quarantined statements without applying them.
- **PS-126-05.R02** Relay policy: relay roles apply only to the relay that assigned them; admins assign roles, operators configure the relay, moderators act on moderation capabilities, and members use own-resource capabilities.
- **PS-126-05.R03** Reading the audit log requires operator or admin on that relay, and the vault owner may read the local audit log.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| security.roleassignment.assign | admin | relay role admin; subject is not actor; approver required for admin grants when two or more admins exist |
| security.roleassignment.revoke | admin | relay role admin; at least one active admin remains |
| security.roleassignment.read | operator, admin | relay role |
| security.auditentry.read | operator, admin, local principal | relay role, or vault unlocked for the local audit log |
| security.auditentry.verify | operator, admin, local principal | relay role, or vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T07 | abuse | PS-126-05.R01, PS-126-05.R02, PS-126-05.R03, PS-126-07.R03 | member assigns role; moderator reads audit; self-grant; sole admin revokes self | FORBIDDEN, FORBIDDEN, FORBIDDEN, SECURITY_LAST_ADMIN |
| TEST-PS-126-09.T08 | abuse | PS-126-05.R01, PS-126-07.R03 | statement signed by non-author accepting an offer; revoked signer; unknown signer | quarantined with reasons unauthorized_role, signer_revoked, unknown_signer |

## Dependencies

Module depends on: CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
