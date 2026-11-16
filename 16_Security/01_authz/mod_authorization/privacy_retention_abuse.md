# PS-126-07 — Privacy, retention and abuse: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-07.R01** Audit entries contain IDs, hashes and reason codes only and never payloads, tokens or P2+ values; actor keys are stored as hashes on relays.
- **PS-126-07.R02** Audit entries and role assignments are retained under RET-AUDIT (1 year), except entries under legal hold which are kept until release.
- **PS-126-07.R03** Privilege escalation and log tampering are limited by default deny, two-person admin grants, expiry on roles, hash chaining and signed daily anchors.

## Specification

**Data classification**
- RoleAssignment: P1 within the relay; published as signed statements.
- AuditEntry: P3 (relay operators and admins; vault owner for the local log).

**Retention**
- Audit entries: RET-AUDIT (1 year), then purged with their chain summarized in a signed digest.
- Role assignments: RET-AUDIT after revocation or expiry.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Privilege escalation by self-granting a role | grants require an active admin who is not the subject, two-person approval for admin, and every grant is audited and signed |
| T02 | Default-allow bug in a new capability | registry loader fails the build when a command lacks exactly one capability; unknown capabilities deny |
| T03 | Forged statement exercising another user's authority | authorizeStatement requires a signer key listed for the role in the author's signed chain, otherwise quarantine |
| T04 | Audit log tampering or truncation | per-entry hash chain, gapless sequence, daily signed anchors, append-only trigger |
| T05 | Audit log used to leak private data | entries carry only IDs, hashes and codes; operators cannot read payloads through the log |
| T06 | Stale grants after revocation | grants cached at most 60 seconds, handlers re-check inside the transaction, session revocation events flush caches |

**Abuse controls**
- Role commands limited to 20 per day per admin via F12.S03.M03.
- Denial coalescing: identical deny entries within 60 seconds fold into one with a count, bounding log growth to at most 1 440 entries per key per capability per day.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T07 | abuse | PS-126-05.R01, PS-126-05.R02, PS-126-05.R03, PS-126-07.R03 | member assigns role; moderator reads audit; self-grant; sole admin revokes self | FORBIDDEN, FORBIDDEN, FORBIDDEN, SECURITY_LAST_ADMIN |
| TEST-PS-126-09.T08 | abuse | PS-126-05.R01, PS-126-07.R03 | statement signed by non-author accepting an offer; revoked signer; unknown signer | quarantined with reasons unauthorized_role, signer_revoked, unknown_signer |
| TEST-PS-126-09.T09 | abuse | PS-126-07.R01, PS-126-07.R02, PS-126-07.R03 | UPDATE and DELETE audit rows; remove middle entry; truncate tail | trigger aborts; verify_chain reports first broken seq; anchor mismatch detected |
| TEST-PS-126-09.T12 | abuse | PS-126-07.R03 | 1 000 identical denials from one key in 60 seconds | one coalesced entry with count 1 000 |

## Dependencies

Module depends on: CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
