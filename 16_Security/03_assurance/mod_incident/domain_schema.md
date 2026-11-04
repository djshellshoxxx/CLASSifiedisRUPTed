# PS-131-01 — Domain schema: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-01.R01** An Incident stores category, severity with its history, status, scope, timeline, key milestone times, notification decision, postmortem link and linked reference IDs, with tenant and revision per CTR-ID-001.
- **PS-131-01.R02** Incident records are P3 relay-operational data readable by operators and admins of that relay, retained under RET-EVIDENCE (2 years), and contain no secrets, tokens, keys or user content.
- **PS-131-01.R03** Severity follows the matrix SEV1 critical, SEV2 high, SEV3 medium and SEV4 low, and changes are recorded with reason and actor.

## Specification

### Incident

Schema `classrup.security.incident/v1` · storage **relay** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| title | string — 5..140 code points, no secrets |
| category | enum — key_compromise \| relay_breach \| data_leak \| auth_anomaly \| federation_abuse \| availability \| supply_chain \| other |
| severity | enum — SEV1 \| SEV2 \| SEV3 \| SEV4 |
| severityHistory | object[] — { severity, reason, actorKeyHash, at }, max 20 |
| status | enum — detected \| triaged \| contained \| resolved \| closed |
| closeReason? | enum — resolved \| false_positive \| duplicate |
| scope | string — affected component or peer ID, no user content |
| affectedDataClasses | string[] — subset of P0..P4 involved, empty when none |
| affectedUsersEstimate? | enum — none \| under_10 \| under_100 \| under_1000 \| over_1000 |
| commanderKeyHash? | string — operator in charge |
| timeline | object[] — append-only { at, actorKeyHash, kind, text ≤ 1000 code points }, max 500 entries |
| detectedAt | timestamp — RFC 3339 UTC, relay clock |
| triagedAt? | timestamp — RFC 3339 UTC |
| containedAt? | timestamp — RFC 3339 UTC |
| resolvedAt? | timestamp — RFC 3339 UTC |
| closedAt? | timestamp — RFC 3339 UTC |
| notificationDecision? | enum — notify_users \| not_required \| pending |
| notificationDueAt? | timestamp — detectedAt + 72 h by default or per jurisdiction profile |
| noticeStatementCid? | string — content id of the signed incident notice |
| postmortemRef? | string — link or document ID of the postmortem |
| relatedRefs | string[] — key record IDs, event IDs, case IDs, max 50 |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- closed incidents of severity SEV1 or SEV2 have a postmortemRef and a notificationDecision other than pending.
- timeline entries are never edited or removed; redaction replaces text with a hash and appends an audit note.
- Only one non-closed incident exists per (tenantId, category, scope) for automatic triggers.

### Storage DDL

```sql
CREATE TABLE security_incident (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, category TEXT NOT NULL, severity TEXT NOT NULL, status TEXT NOT NULL,
  scope TEXT NOT NULL, detected_at TEXT NOT NULL, notification_due_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX security_incident_open ON security_incident(tenant_id, category, scope) WHERE status != 'closed';
CREATE INDEX security_incident_status ON security_incident(tenant_id, status, severity);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T01 | unit | PS-131-01.R01, PS-131-01.R02, PS-131-01.R03, PS-131-02.R01 | open SEV2 key_compromise with valid input | Incident stored detected, severity history has one entry, notificationDueAt = detectedAt + 72 h when data classes above P1 |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
