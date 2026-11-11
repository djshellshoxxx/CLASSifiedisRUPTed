# PS-126-09 — Contract and acceptance tests: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-126-09.R02** Default deny and purity are covered by property tests over generated capability, role and scope matrices.
- **PS-126-09.R03** Audit integrity is covered by tamper tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X with admins A1 and A2, relay_operator R1, tenant operators O1 (tenant:T1) and O2 (tenant:T2), moderator M (scope relay) with device keys Md1 and Md2, member U; KeyStatusPort and RoleResolverPort stubs; registry of 60 capabilities from fixture modules; audit pepper fixture; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T01 | unit | PS-126-01.R01, PS-126-01.R03, PS-126-02.R01 | assign moderator at scope relay for 90 days and operator O3 at scope tenant:T1 | assignments stored active with scope, role statements signed by the relay key, expiry set |
| TEST-PS-126-09.T02 | unit | PS-126-02.R01, PS-126-02.R03 | each rule V01–V10 violated, including admin with expiresAt, operator at scope relay, relay_operator at tenant scope, unknown tenant and a malformed did:key | documented error code and nothing stored |
| TEST-PS-126-09.T03 | property | PS-126-02.R02, PS-126-06.R01, PS-126-09.R02 | generated actors, capabilities, resources, scopes and malformed inputs | authorize never throws, is deterministic, every unlisted combination denies, and a tenant-scope role never matches another tenant's resource |
| TEST-PS-126-09.T04 | integration | PS-126-03.R02 | expiry sweep missed; role revoked mid-request; Md1 revoked in M's stored portable document | request-time check denies; handler re-check denies; Md1 denied with signer_key_revoked within 60 s while Md2 keeps the role |
| TEST-PS-126-09.T05 | contract | PS-126-04.R02, PS-126-04.R05 | commands, queries, events and statements | validate against registry schemas; role_statement and audit_anchor verify as CTR-FED-001 envelopes by the relay key; role_approval verifies with the approver's device key; all three are registered in F11.S01.M01 |
| TEST-PS-126-09.T06 | integration | PS-126-04.R03 | identity.session.revoked, moderation.action.applied, identity.portable_doc.published with status contested for A2, privacy.legal_hold.placed then released | caches flushed; A2's admin revoked with subject_contested and lastAdmin false; held rows exempted then returned to the sweep |
| TEST-PS-126-09.T07 | abuse | PS-126-05.R01, PS-126-05.R02, PS-126-05.R03, PS-126-07.R03 | member assigns a role; moderator reads audit; self-grant; sole admin revokes self; O1 configures T2 and assigns roles; R1 assigns roles | FORBIDDEN, FORBIDDEN, FORBIDDEN, SECURITY_LAST_ADMIN, FORBIDDEN, FORBIDDEN |
| TEST-PS-126-09.T08 | abuse | PS-126-04.R01, PS-126-05.R01 | statement accepting an offer signed by a non-author; signer device key revoked before first sight; caller context claims a weaker role than the registry requires | Quarantine(signer_role_invalid), Quarantine(signer_key_revoked), Quarantine(signer_role_invalid) with the hint ignored; nothing stored by this module |
| TEST-PS-126-09.T09 | abuse | PS-126-01.R02, PS-126-07.R04, PS-126-09.R03 | UPDATE and DELETE audit rows; remove a middle entry; truncate the tail before and after the last published anchor | triggers abort; verify_chain reports the first broken seq; truncation before the anchor detected; entries after it reported as the residual window |
| TEST-PS-126-09.T10 | integration | PS-126-06.R03 | audit store failure during a state-changing command | command fails closed with DEPENDENCY_UNAVAILABLE and no state change |
| TEST-PS-126-09.T11 | integration | PS-126-06.R02 | same Idempotency-Key replayed on assign by the same admin | original response; one audit entry de-duplicated by (actor, command, Idempotency-Key) |
| TEST-PS-126-09.T12 | abuse | PS-126-03.R03, PS-126-07.R03 | 1 000 identical read-only denials in 60 seconds; 1 000 denials of a state-changing command; crash in the middle of a window | one entry with count 1 000 appended at window close with entryHash computed then; 1 000 separate entries; the crash loses at most the open window |
| TEST-PS-126-09.T13 | load | PS-126-08.R01, PS-126-08.R02, PS-126-08.R03 | 5 000 authorize calls per second for 5 minutes; verify 100 000 entries; 1 000 entries to trigger an anchor | p95 targets met; verification ≤ 10 s; anchor published and the entries-since-anchor gauge resets |
| TEST-PS-126-09.T14 | unit | PS-126-09.R01 | traceability tool run | every PS-126 requirement maps to a passing test |
| TEST-PS-126-09.T15 | integration | PS-126-10.R01, PS-126-10.R02, PS-126-10.R03 | export audit and roles, import into a fresh relay, restore backup | chain verifies after round trip; imported roles stay imported_inactive until activate_import by an admin of the new relay |
| TEST-PS-126-09.T16 | integration | PS-126-03.R05, PS-126-04.R04, PS-126-05.R04 | fresh relay rejects assign; CLI bootstrap creates A1; second bootstrap without break-glass; break-glass with a 30-character reason; bootstrap attempted over HTTP; RoleBootstrapPort from a tenant bootstrap stub | A1 active via bootstrap with OS user audited; SECURITY_BOOTSTRAP_REFUSED; new admin via break_glass and security.role.assigned with breakGlass true; no HTTP route; operator and admin created in one transaction |
| TEST-PS-126-09.T17 | integration | PS-126-02.R01, PS-126-03.R04 | A1 proposes admin S with A2 approving within 24 h; a proposal left 25 h; assign naming A2 as approvedBy without a signed approval; approval signed by the proposer | S active with approvalStatementCid; expired with approval_expired; SECURITY_APPROVAL_REQUIRED; SECURITY_APPROVAL_REQUIRED |
| TEST-PS-126-09.T18 | unit | PS-126-01.R04, PS-126-01.R05 | M (scope relay) acts on T1 and T2; moderator at tenant:T1 acts on T2; request signed by an active device key of M; subjectKey given as a device key of another DID | allowed twice; FORBIDDEN scope_mismatch; device key resolved to the principal; VALIDATION_FAILED |
| TEST-PS-126-09.T19 | integration | PS-126-03.R04, PS-126-03.R01 | expiry sweep runs when A1 is the only admin; admin proposal carrying expiresInMs; revoke of an already expired assignment; approve of an active one | A1 never expires; VALIDATION_FAILED; CONFLICT_STATE; CONFLICT_STATE |
| TEST-PS-126-09.T20 | integration | PS-126-07.R01, PS-126-07.R02 | inspect relay audit rows; recompute actorKeyHash without and with the pepper; vault deletion through the DeletionPort stub; relay rows under legal hold at the 1-year sweep | no DID in any row; only the peppered HMAC matches; local audit log erased; held rows kept until release |
| TEST-PS-126-09.T21 | abuse | PS-126-05.R01 | vault locked; a command authored by a different principal in the same browser profile | FORBIDDEN with reasons vault_locked and not_owner; nothing written |

## Acceptance criteria

- All tests T01–T21 pass in CI.
- authorize is pure and every unlisted capability, role and scope combination denies (property tests).
- The audit chain detects any edit, deletion or truncation of entries covered by the last externally published anchor in tamper tests, and the residual window after it is reported.

## Dependencies

Module depends on: F16.S01.M02, F10.S02.M02, CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
