# PS-079-01 — Domain schema: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-01.R01** A RetentionPolicy stores scope (vault or relay), retention class, duration in days, source and bounds, and is unique per scope and class.
- **PS-079-01.R02** A LegalHold stores relay, subject, reason code, a non-personal reference, requester, approver, status and review dates, and exists only on the relay that placed it.
- **PS-079-01.R03** Vault-scope policy rows are P3 (owner only) and relay-scope policy rows are P0 (the relay's published policy); holds are P3 operator records retained as RET-AUDIT for 1 year after release.
- **PS-079-01.R04** Run records hold counts per kind and class plus startedAt; the latest startedAt of a committed vault run is the high-water clock, and the latest relay-signed receipt time the vault has seen is kept beside it for clock-jump detection.
- **PS-079-01.R05** RET-SIGNAL (CTR-PRV-001 PRV-8) is expiry-bounded - a signal record is kept until its own expiresAt and never longer than 365 days after its createdAt, is then folded into a counts-only rollup that holds no identifiers, and the rollup is kept 365 days; its policy row sets only the rollup duration, fixed at 365 days, and the defaults row exists in every vault and relay scope for F12.S03.M02 Signal records.
- **PS-079-01.R06** A jurisdiction-source row names its profile by the ProfileRef {publisherId, code} of F18.S01.M01 that supplied the class value, with the version resolved at the last refresh, never by a bare jurisdiction code; a missing or unknown ref resolves to the bundled generic profile, and a row whose value became Looser keeps priorDurationDays and looserFrom so that records created before looserFrom keep the stricter retention.

## Specification

### RetentionPolicy

Schema `classrup.privacy.retention_policy/v1` · storage **relay+device** · privacy **P3** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| scopeKind | enum — vault \| relay |
| scopeId | string — vault id or relay id |
| class | enum — RET-EPHEMERAL \| RET-SHORT \| RET-STANDARD \| RET-EVIDENCE \| RET-AUDIT \| RET-SIGNAL |
| durationDays | int — within bounds: EPHEMERAL 1 fixed, SHORT 7..90, STANDARD purge delay 7..90, EVIDENCE 365..3650, AUDIT 180..2555, SIGNAL 365 fixed (rollup retention; the signal record itself ends at its expiresAt, capped at createdAt + 365 days) |
| source | enum — default \| jurisdiction \| user \| relay_operator |
| profileRef? | object — ProfileRef {publisherId: did:key, code: ^[a-z0-9_-]{2,40}$} of F18.S01.M01 that supplied the value of a jurisdiction row (from the sources of governance.jurisdiction_profile.resolve); absent or unknown resolves to the bundled generic profile |
| profileVersion? | int — version of the supplying ProfileRef at the last refresh |
| fallback? | boolean — true when resolve used the bundled generic profile |
| priorDurationDays? | int — duration in force before the last Looser change; records created before looserFrom keep the stricter of priorDurationDays and durationDays |
| looserFrom? | timestamp — max(effectiveFrom claimed by the profile version, local time the version came into use in this scope); a Looser value applies only to records created at or after it |
| effectiveFrom | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- Unique per (scopeKind, scopeId, class).
- A Looser change by the F18.S01.M01 merge table (EVIDENCE or AUDIT shorter, STANDARD purge delay longer) sets looserFrom and sets priorDurationDays to the replaced durationDays, or to the stricter of it and an earlier priorDurationDays; a Stricter change updates durationDays for every record at once and keeps any earlier priorDurationDays and looserFrom.
- durationDays is inside the bounds of its class; RET-LEGAL-HOLD cannot be configured as a policy.
- Defaults are EPHEMERAL 1, SHORT 30, STANDARD 30, EVIDENCE 730, AUDIT 365, SIGNAL 365 (rollup).
- Neither a user, a relay operator nor a jurisdiction profile changes RET-SIGNAL; its record cap of 365 days after createdAt and its 365-day rollup are fixed by PRV-8.
- Vault-scope rows are P3 and never leave the vault except in the owner's export; relay-scope rows are served read-only as the relay's public P0 policy.

### LegalHold

Schema `classrup.privacy.legal_hold/v1` · storage **relay** · privacy **P3** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| relayId | string — canonical relayId (F15.S02.M01) of the relay that holds the data |
| subject | object — {kind: record\|author\|mailbox, ref: cid or did or mailbox id} |
| reasonCode | enum — court_order \| regulatory_request \| abuse_investigation \| safety_emergency |
| reference | string — ≤ 100 code points, case or ticket number, no personal data |
| requestedBy | did — relay operator or admin who requested |
| approvedBy? | did — second relay operator or admin; differs from and is not linked to requestedBy |
| releaseRequestedBy? | did — operator or admin who asked to release |
| releaseRequestedAt? | timestamp — relay clock |
| releaseDeadline? | timestamp — releaseRequestedAt + 72 h |
| releasedBy? | did — second operator or admin; differs from and is not linked to releaseRequestedBy |
| status | enum — requested \| active \| release_requested \| released \| rejected \| lapsed |
| requestedAt | timestamp — relay clock |
| approvalDeadline | timestamp — requestedAt + 72 h |
| activeSince? | timestamp — relay clock |
| reviewDueAt? | timestamp — activeSince + 180 days, then every 30 days until reviewed |
| releasedAt? | timestamp — relay clock; the record is purged 1 year later (RET-AUDIT) |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- approvedBy differs from requestedBy and releasedBy differs from releaseRequestedBy, and neither pair is linked by a same-owner attestation or rotation chain.
- Both members of each pair hold the operator or admin role on that relay at the time of approval, and at least one of them holds admin.
- A hold applies only to data stored on its own relay; it has no field referencing a vault.

### Storage DDL

```sql
CREATE TABLE privacy_retention_policy (
  id TEXT PRIMARY KEY, scope_kind TEXT NOT NULL, scope_id TEXT NOT NULL, class TEXT NOT NULL,
  duration_days INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX privacy_retention_scope_class ON privacy_retention_policy(scope_kind, scope_id, class);
CREATE TABLE privacy_legal_hold (
  id TEXT PRIMARY KEY, relay_id TEXT NOT NULL, subject_kind TEXT NOT NULL, subject_ref TEXT NOT NULL,
  status TEXT NOT NULL, approval_deadline TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX privacy_legal_hold_subject ON privacy_legal_hold(relay_id, subject_kind, subject_ref, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T01 | unit | PS-079-01.R01, PS-079-02.R01 | set durations at, below and above class bounds | in-bound accepted; out-of-bound VALIDATION_FAILED; defaults EPHEMERAL 1, SHORT 30, STANDARD 30, EVIDENCE 730, AUDIT 365, SIGNAL 365 |
| TEST-PS-079-09.T02 | unit | PS-079-01.R02, PS-079-02.R01 | hold requested with personal data in reference; user tries to change AUDIT | VALIDATION_FAILED and FORBIDDEN |
| TEST-PS-079-09.T17 | integration | PS-079-01.R03 | inspect classification and retention of vault policies, the relay policy endpoint and a hold released 366 days ago | vault rows annotated P3 and absent from relay traffic; relay rows served as public P0 policy; the released hold record is purged 1 year after release |
| TEST-PS-079-09.T19 | unit | PS-079-02.R04, PS-079-01.R04 | clock set 3 days forward since the last sweep; clock 2 days ahead of the latest relay-signed receipt; clock set 3 days back | both forward cases run as dry runs and return PRIVACY_RETENTION_CLOCK_JUMP until confirmClockJump; the backward case purges nothing with a future anchor and does not lower the high-water clock |
| TEST-PS-079-09.T23 | integration | PS-079-01.R05, PS-079-02.R05 | sweep over the signal fixtures in a vault and on a relay, one signal record under an active hold; rollup rows aged 364 and 366 days; set RET-SIGNAL to 180 days as user, operator and jurisdiction; register a signal kind without rollupKind and one whose rollup holds a did | the expired and the 400-day records are rolled up and purged (the latter at createdAt + 365 days), the 10-day record and the held record are kept; the 366-day rollup row is purged; every set returns FORBIDDEN; both registrations fail with VALIDATION_FAILED |
| TEST-PS-079-09.T26 | integration | PS-079-01.R06, PS-079-02.R06, PS-079-04.R08, PS-079-07.R04 | vault with (KP, eu_de) selected; activated selected, then upgrade_pending and upgraded to version 4 with the backdated effectiveFrom, then deselected; relay activated with scope relay for the hosting profile; resolve returning evidenceDays 180 and auditDays 90; a row naming an unknown ProfileRef and a set with code EU DE | selected writes EVIDENCE 1825 with source jurisdiction, ProfileRef and version 3; upgrade_pending changes no row; upgraded sets 730 with priorDurationDays 1825 and looserFrom at the confirmation time, so a record created before it is kept until 1825 days and one created after is purged after 730; deselected writes the generic defaults with fallback true; the relay STANDARD 60 applies only to records created after its looserFrom; 180 and 90 are clamped to 365 and 180; the unknown ref resolves to generic; EU DE returns VALIDATION_FAILED |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
