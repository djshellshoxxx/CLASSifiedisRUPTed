# PS-126-07 — Privacy, retention and abuse: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-07.R01** Audit entries contain IDs, hashes and reason codes only and never payloads, tokens or P2+ values; on relays actors are stored as HMAC-SHA256 with a relay pepper loaded through F16.S01.M02, so a copied audit table cannot be joined to public DIDs without the pepper.
- **PS-126-07.R02** Audit entries and role assignments are retained under RET-AUDIT (1 year), except entries under legal hold which are kept until release.
- **PS-126-07.R03** Privilege escalation and log tampering are limited by default deny, signed two-person admin approvals, expiry on non-admin roles, hash chaining and anchors published off-host every 1 000 entries or 5 minutes.
- **PS-126-07.R04** Tampering is detectable only for entries covered by the last externally published anchor; entries appended since then (at most 1 000 entries or 5 minutes plus the fetch interval of the vaults or peers holding anchors) are the stated residual window.

## Specification

**Data classification**
- RoleAssignment: P1 within the relay; published as signed role statements.
- AuditEntry: P3 (relay_operators and admins; vault owner for the local log).
- Audit pepper: P4 relay secret loaded through F16.S01.M02, never logged, exported or backed up with the database.

**Retention**
- Audit entries: RET-AUDIT (1 year), then purged; the purge boundary is recorded in the next anchor so verification starts from it.
- Role assignments: RET-AUDIT after revocation or expiry.
- Audit anchors: kept by the relay for 2 years and by fetching vaults and peers under their own retention.
- Vault audit log: deleted with the vault through the F10.S01.M04 DeletionPort registry injected by the vault composition root.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Privilege escalation by self-granting a role | grants require an active admin who is not the subject, admin grants need a second admin's signed approval statement, and every grant is audited and signed |
| T02 | Default-allow bug in a new capability | registry loader fails the build when a command lacks exactly one capability; unknown capabilities deny |
| T03 | Forged statement exercising another user's authority, or a caller passing a weaker role | authorizeStatement takes the role only from the F11.S01.M01 registry and key status only from F07.S02.M01, ignoring caller hints; otherwise quarantine |
| T04 | Audit log tampering or truncation | per-entry hash chain, gapless sequence, append-only triggers, anchors every 1 000 entries or 5 minutes fetched and kept by vaults and peers off-host; residual window stated |
| T05 | Audit log used to leak private data | entries carry only IDs, HMAC actor hashes and codes; operators cannot read payloads through the log |
| T06 | Stale grants after revocation or device-key theft | grants and key status cached at most 60 seconds, handlers re-check inside the transaction, session revocation and identity document events flush caches, roles bound to the principal and exercised only with active device keys |
| T07 | Bootstrap misuse by someone with host access | host access already controls the relay key file; bootstrap refuses while an admin exists unless a break-glass reason is recorded; break-glass opens a SEV1 incident and is shown on the roles screen |
| T08 | Joining a copied audit table with public DIDs | HMAC-SHA256 with a pepper held outside the database and backups |

**Abuse controls**
- Role commands limited to 20 per day per admin via the bus rate limit (F12.S03.M03).
- Denial coalescing for read-only capabilities: identical denials are buffered for 60 seconds and appended once with a count, bounding log growth to at most 1 440 entries per key per capability per day; decisions on state-changing commands are never buffered (CAP-7).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T07 | abuse | PS-126-05.R01, PS-126-05.R02, PS-126-05.R03, PS-126-07.R03 | member assigns a role; moderator reads audit; self-grant; sole admin revokes self; O1 configures T2 and assigns roles; R1 assigns roles | FORBIDDEN, FORBIDDEN, FORBIDDEN, SECURITY_LAST_ADMIN, FORBIDDEN, FORBIDDEN |
| TEST-PS-126-09.T09 | abuse | PS-126-01.R02, PS-126-07.R04, PS-126-09.R03 | UPDATE and DELETE audit rows; remove a middle entry; truncate the tail before and after the last published anchor | triggers abort; verify_chain reports the first broken seq; truncation before the anchor detected; entries after it reported as the residual window |
| TEST-PS-126-09.T12 | abuse | PS-126-03.R03, PS-126-07.R03 | 1 000 identical read-only denials in 60 seconds; 1 000 denials of a state-changing command; crash in the middle of a window | one entry with count 1 000 appended at window close with entryHash computed then; 1 000 separate entries; the crash loses at most the open window |
| TEST-PS-126-09.T20 | integration | PS-126-07.R01, PS-126-07.R02 | inspect relay audit rows; recompute actorKeyHash without and with the pepper; vault deletion through the DeletionPort stub; relay rows under legal hold at the 1-year sweep | no DID in any row; only the peppered HMAC matches; local audit log erased; held rows kept until release |

## Dependencies

Module depends on: F16.S01.M02, F10.S02.M02, CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
