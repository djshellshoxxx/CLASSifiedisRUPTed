# PS-131-01 — Domain schema: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-01.R01** An Incident stores category, severity with its history, status, scope, key milestone times, notification decision, notice delivery counts, postmortem link and linked reference IDs, with tenant and revision per CTR-ID-001; its timeline lives in the security_incident_timeline table.
- **PS-131-01.R02** Incident records are P3 relay-operational data readable by relay_operators and admins of that relay, retained under RET-EVIDENCE (2 years), and contain no secrets, tokens, keys or user content.
- **PS-131-01.R03** Severity follows the matrix SEV1 critical, SEV2 high, SEV3 medium and SEV4 low, and changes are recorded with reason and actor.
- **PS-131-01.R04** The timeline is stored in its own append-only table keyed by (incident_id, seq) whose triggers refuse every update except one redaction per row (text set to NULL and redacted_hash set) and refuse deletion while the incident exists.

## Specification

### Incident

Schema `classrup.security.incident/v1` · storage **relay** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| title | string — 5..140 code points, no secrets |
| category | enum — key_compromise \| relay_breach \| data_leak \| auth_anomaly \| federation_abuse \| privilege_change \| availability \| supply_chain \| detection_overflow \| other |
| severity | enum — SEV1 \| SEV2 \| SEV3 \| SEV4 |
| severityHistory | object[] — { severity, reason, actorKeyHash, at }, max 20 |
| status | enum — detected \| triaged \| contained \| resolved \| closed |
| closeReason? | enum — resolved \| false_positive \| duplicate |
| closeOverrideReason? | string — 10..500 code points; required to close while noticePending > 0 |
| scope | string — affected component or peer ID (for example relay_identity, user_keys, peer:<id>), no user content |
| affectedDataClasses | string[] — subset of P0..P4 involved, empty when none |
| affectedUsersEstimate? | enum — none \| under_10 \| under_100 \| under_1000 \| over_1000 |
| commanderKeyHash? | string — relay_operator or admin in charge (HMAC actor hash of F16.S01.M01) |
| timeline | derived — rows of security_incident_timeline (incident_id, seq) ordered by seq, at most 500 |
| timelineLength | int — number of timeline rows |
| detectedAt | timestamp — RFC 3339 UTC, relay clock |
| triagedAt? | timestamp — RFC 3339 UTC |
| containedAt? | timestamp — RFC 3339 UTC |
| resolvedAt? | timestamp — RFC 3339 UTC |
| closedAt? | timestamp — RFC 3339 UTC |
| notificationDecision? | enum — notify_users \| not_required \| pending |
| notificationDueAt? | timestamp — detectedAt + the breach notice period of the active F18.S01.M01 jurisdiction profile, 72 h by default |
| noticeStatementCid? | string — content id of the signed incident notice |
| noticeDelivered | int — mailboxes whose delivery reached transport_acknowledged or better, 0 when no notice |
| noticePending | int — mailboxes still prepared or failed, 0 when no notice |
| postmortemRef? | string — link or document ID of the postmortem |
| relatedRefs | string[] — key record IDs, event IDs, case IDs, max 50 |
| source | enum — manual \| hook |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- closed incidents of severity SEV1 or SEV2 have a postmortemRef and a notificationDecision other than pending.
- timeline rows are never edited or removed; the only permitted change is one redaction per row that clears text and sets redacted_hash, and it is audit-logged.
- Only one non-closed incident exists per (tenantId, category, scope) for automatic triggers, and at most one open detection_overflow incident exists.
- A closed incident with noticePending above 0 has a closeOverrideReason.

### Storage DDL

```sql
CREATE TABLE security_incident (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, category TEXT NOT NULL, severity TEXT NOT NULL, status TEXT NOT NULL,
  scope TEXT NOT NULL, detected_at TEXT NOT NULL, notification_due_at TEXT, closed_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX security_incident_open ON security_incident(tenant_id, category, scope) WHERE status != 'closed';
CREATE INDEX security_incident_status ON security_incident(tenant_id, status, severity);
CREATE TABLE security_incident_timeline (
  incident_id TEXT NOT NULL, seq INTEGER NOT NULL, at TEXT NOT NULL, actor_key_hash TEXT NOT NULL, kind TEXT NOT NULL,
  text TEXT, redacted_hash TEXT, PRIMARY KEY (incident_id, seq));
CREATE TRIGGER security_incident_timeline_update BEFORE UPDATE ON security_incident_timeline
  WHEN NOT (old.redacted_hash IS NULL AND new.text IS NULL AND new.redacted_hash IS NOT NULL
    AND new.incident_id = old.incident_id AND new.seq = old.seq AND new.at = old.at
    AND new.actor_key_hash = old.actor_key_hash AND new.kind = old.kind)
  BEGIN SELECT RAISE(ABORT, 'append-only'); END;
CREATE TRIGGER security_incident_timeline_delete BEFORE DELETE ON security_incident_timeline
  WHEN EXISTS (SELECT 1 FROM security_incident WHERE id = old.incident_id)
  BEGIN SELECT RAISE(ABORT, 'append-only'); END;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T01 | unit | PS-131-01.R01, PS-131-01.R02, PS-131-01.R03, PS-131-02.R01 | open SEV2 key_compromise with valid input under the 48 h jurisdiction profile | Incident stored detected, severity history has one entry, notificationDueAt = detectedAt + 48 h when data classes are above P1 |
| TEST-PS-131-09.T10 | abuse | PS-131-07.R03, PS-131-01.R04 | 201 operator commands in an hour; UPDATE of a timeline row's text; second redaction of a redacted row; DELETE of a row while the incident exists | RATE_LIMITED; trigger aborts each change |

## Dependencies

Module depends on: F16.S01.M01, F16.S01.M02, F16.S02.M02, F16.S02.M03, F16.S03.M01, F18.S01.M01, F08.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
