# PS-079-01 — Domain schema: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-01.R01** A RetentionPolicy stores scope (vault or relay), retention class, duration in days, source and bounds, and is unique per scope and class.
- **PS-079-01.R02** A LegalHold stores relay, subject, reason code, a non-personal reference, requester, approver, status and review dates, and exists only on the relay that placed it.
- **PS-079-01.R03** Policies are P1 configuration and holds are P3 operator records retained as RET-AUDIT for 1 year after release.

## Specification

### RetentionPolicy

Schema `classrup.privacy.retention_policy/v1` · storage **relay+device** · privacy **P1** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| scopeKind | enum — vault \| relay |
| scopeId | string — vault id or relay id |
| class | enum — RET-EPHEMERAL \| RET-SHORT \| RET-STANDARD \| RET-EVIDENCE \| RET-AUDIT |
| durationDays | int — within bounds: EPHEMERAL 1 fixed, SHORT 7..90, STANDARD purge delay 7..90, EVIDENCE 365..3650, AUDIT 180..2555 |
| source | enum — default \| jurisdiction \| user \| relay_operator |
| jurisdictionCode? | string — profile code from F18.S01.M01, e.g. DE or US-CA |
| effectiveFrom | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- Unique per (scopeKind, scopeId, class).
- durationDays is inside the bounds of its class; RET-LEGAL-HOLD cannot be configured as a policy.
- Defaults are EPHEMERAL 1, SHORT 30, STANDARD 30, EVIDENCE 730, AUDIT 365.

### LegalHold

Schema `classrup.privacy.legal_hold/v1` · storage **relay** · privacy **P3** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| relayId | string — relay that holds the data |
| subject | object — {kind: record\|author\|mailbox, ref: cid or did or mailbox id} |
| reasonCode | enum — court_order \| regulatory_request \| abuse_investigation \| safety_emergency |
| reference | string — ≤ 100 code points, case or ticket number, no personal data |
| requestedBy | did — relay operator who requested |
| approvedBy? | did — second relay operator; differs from requestedBy |
| releaseRequestedBy? | did — operator who asked to release |
| releasedBy? | did — second operator; differs from releaseRequestedBy |
| status | enum — requested \| active \| release_requested \| released \| rejected \| lapsed |
| requestedAt | timestamp — relay clock |
| approvalDeadline | timestamp — requestedAt + 72 h |
| activeSince? | timestamp — relay clock |
| reviewDueAt? | timestamp — activeSince + 180 days |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- approvedBy differs from requestedBy and releasedBy differs from releaseRequestedBy.
- Both approvers hold the operator or admin role on that relay at the time of approval.
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
| TEST-PS-079-09.T01 | unit | PS-079-01.R01, PS-079-02.R01, PS-079-01.R03 | set durations at, below and above class bounds | in-bound accepted; out-of-bound VALIDATION_FAILED; defaults EPHEMERAL 1, SHORT 30, STANDARD 30, EVIDENCE 730, AUDIT 365 |
| TEST-PS-079-09.T02 | unit | PS-079-01.R02, PS-079-02.R02 | hold requested with personal data in reference; user tries to change AUDIT | VALIDATION_FAILED and FORBIDDEN |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
