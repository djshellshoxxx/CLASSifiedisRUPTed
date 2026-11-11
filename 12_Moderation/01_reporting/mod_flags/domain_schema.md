# PS-094-01 — Domain schema: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-01.R01** A Report stores reporter key, relay target, content target (id, content id and revision seen), reason code, optional details, evidence snapshot reference, sync state and status, with tenant and revision per CTR-ID-001.
- **PS-094-01.R02** Reports are P3 in the reporter's vault and are sent only as an envelope sealed to the relay's moderation key, so the relay stores ciphertext until a moderator opens it; the relay copy is retained under RET-EVIDENCE per relay policy.
- **PS-094-01.R03** A report is immutable after filing except for sync state, status, case reference and outcome; details cannot be edited, only withdrawn and refiled.
- **PS-094-01.R04** An AdvisorySubscription stores a publisher key, mode and last verified sequence, is P3 and local to the vault, and changes only through the subscription command.

## Specification

### Report

Schema `classrup.moderation.report/v1` · storage **relay+device** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, generated in the vault |
| tenantId | uuidv7 — relay hosting scope the report is addressed to (the vault's own scope locally) |
| reporterKey | did:key — pseudonymous principal that signs the statement; P3 |
| relayId | string — user-selected destination relay, did:key of the relay |
| targetType | enum — listing \| message \| profile \| review \| bid \| offer \| attachment \| cycle_proposal |
| targetId | uuidv7 — id of the reported content |
| targetCid | string — content id (sha256-…) of the signed author envelope held by the reporter |
| targetRevision | int — revision of the target at report time |
| reasonCode | enum — spam \| scam_fraud \| prohibited_item \| harassment \| hate \| sexual_content \| violence \| counterfeit \| privacy_leak \| impersonation \| minor_safety \| other |
| details? | string — plain text, 0..1000 code points, sealed to the relay |
| evidenceSnapshotId | uuidv7 — ref F12.S01.M02 EvidenceSnapshot in the vault |
| syncState | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| caseRef? | string — relay case reference from the signed report receipt |
| status | enum — filed \| linked \| resolved \| withdrawn |
| outcome? | enum — actioned \| no_action \| duplicate \| content_removed_by_owner |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local device clock (a claim, not evidence) |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one report with status filed or linked per (reporterKey, relayId, targetType, targetId, reasonCode).
- syncState peer_accepted implies a verified relay-signed receipt is stored; transport_acknowledged implies a relay receipt time recorded as relay-clock evidence only.
- status linked or resolved implies caseRef is set; a report always has an evidenceSnapshotId.

### AdvisorySubscription

Schema `classrup.moderation.advisorysubscription/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| publisherKey | did:key — signer of advisory statements |
| mode | enum — label \| hide \| ignore |
| lastSeq | int — highest verified advisory sequence number (CTR-FED-001 FED-3) |
| publisherStatus | enum — active \| revoked \| unreachable |
| createdAt | timestamp — RFC 3339 UTC |

**Invariants**
- Advisory items are applied only if their signature verifies against publisherKey and the key is not revoked in the vault's key registry.
- An advisory never deletes local records; mode hide only filters views and can be undone.

### Storage DDL

```sql
CREATE TABLE moderation_report (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, reporter_key TEXT NOT NULL, relay_id TEXT NOT NULL,
  target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason_code TEXT NOT NULL, sync_state TEXT NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_report_open ON moderation_report(reporter_key, relay_id, target_type, target_id, reason_code)
  WHERE status IN ('filed','linked');
CREATE INDEX moderation_report_target ON moderation_report(tenant_id, target_type, target_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T01 | unit | PS-094-01.R01, PS-094-01.R03, PS-094-02.R01 | file a valid scam report in the vault | Report stored with syncState local_committed, snapshot reference set, details unchanged |
| TEST-PS-094-09.T12 | unit | PS-094-01.R04, PS-094-04.R01 | subscribe to advisory feed then revoke publisher key | labels applied, then dropped after verified revocation; no local record deleted |
| TEST-PS-094-09.T16 | e2e | PS-094-01.R02, PS-094-04.R01 | mobile reporter files a report offline then reconnects | single report, delivery status progresses honestly, axe zero serious issues |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
