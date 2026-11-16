# PS-131-04 — Commands, queries and events: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-04.R01** Commands are relay commands; detection hooks call open internally as actor kind system.
- **PS-131-04.R02** Open and close emit security.incident.opened and security.incident.closed in the same transaction as the record.
- **PS-131-04.R03** The module consumes security, moderation, identity and federation events as detection hooks with fixed thresholds.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `security.incident.open` | security.incident.open | { title, category, severity, scope, affectedDataClasses?, source: manual\|hook, relatedRefs? } | { incidentId, severity, status: detected, notificationDueAt, revision: 1 } | VALIDATION_FAILED, SECURITY_INCIDENT_SECRET_IN_TEXT, PAYLOAD_TOO_LARGE | security.incident.opened | yes (Idempotency-Key) |
| `security.incident.triage` | security.incident.triage | { incidentId, expectedRevision, severity, commanderKeyHash?, reason } | { incidentId, revision, severity, status } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `security.incident.annotate` | security.incident.annotate | { incidentId, expectedRevision, kind: note\|containment\|evidence\|decision, text } | { incidentId, revision, timelineLength } | NOT_FOUND, CONFLICT_REVISION, SECURITY_INCIDENT_SECRET_IN_TEXT, PAYLOAD_TOO_LARGE |  | yes (Idempotency-Key) |
| `security.incident.contain` | security.incident.contain | { incidentId, expectedRevision, steps } | { incidentId, revision, containedAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `security.incident.resolve` | security.incident.resolve | { incidentId, expectedRevision, summary } | { incidentId, revision, resolvedAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `security.incident.notify` | security.incident.notify | { incidentId, expectedRevision, decision: notify_users\|not_required, reason, noticeText?, audience? } | { incidentId, revision, noticeStatementCid? } | NOT_FOUND, CONFLICT_REVISION, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `security.incident.close` | security.incident.close | { incidentId, expectedRevision, closeReason, postmortemRef? } | { incidentId, revision, closedAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SECURITY_INCIDENT_CLOSE_BLOCKED | security.incident.closed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `security.incident.list` | security.incident.read | { status?, severity?, category?, cursor?, limit ≤ 50 } | { items: Incident (without timeline), nextCursor? } |  |
| `security.incident.get` | security.incident.read | { incidentId } | { incident: Incident with timeline } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `security.incident.opened` | P2 | { incidentId, category, severity, scope, source, notificationDueAt } |
| `security.incident.closed` | P2 | { incidentId, category, severity, closeReason, durations: { acknowledgeMs, containMs, resolveMs } } |

### Events consumed

| Type | Effect |
|---|---|
| `security.key.revoked` | reason compromised for a relay-registered or peer relay key opens SEV2 key_compromise; user device key compromise opens SEV3 only if five or more occur within 1 hour |
| `moderation.rate.exceeded` | 50 or more events for class relay.access from 20 or more distinct prefix hashes within 10 minutes opens SEV3 auth_anomaly |
| `federation.record.rejected` | 100 or more signature rejections from one peer within 10 minutes opens SEV3 federation_abuse for that peer scope |
| `federation.peer.suspended` | append a timeline entry to the matching federation_abuse incident or open SEV4 if none exists |
| `identity.session.revoked` | 100 or more revocations within 10 minutes opens SEV3 auth_anomaly |
| `security.role.assigned` | an admin assignment outside business-hours policy, or three admin changes within 24 hours, opens SEV3 other with reason privilege_change |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_INCIDENT_SECRET_IN_TEXT | 422 | no | text contains a secret-like pattern and was not stored |
| SECURITY_INCIDENT_CLOSE_BLOCKED | 409 | no | SEV1 and SEV2 need a postmortem reference and a notification decision before closing |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
detection hook (system): federation.record.rejected x100 from peer did:key:z6MkPeer… within 10 minutes
-> security.incident.open { "title": "Signature rejection spike from peer", "category": "federation_abuse", "severity": "SEV3", "scope": "peer:z6MkPeer", "source": "hook" }
-> { "incidentId": "0192f440-cccc-7000-8000-00000000000c", "severity": "SEV3", "status": "detected", "notificationDueAt": null, "revision": 1 }
operator: security.incident.triage { "severity": "SEV3", "commanderKeyHash": "k_3d1…", "reason": "spike persists" } -> { "status": "triaged", "revision": 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T05 | contract | PS-131-04.R01, PS-131-04.R02, PS-131-09.R02 | each command, query and event | validate against registry schemas; notice statement verifies with relay key |
| TEST-PS-131-09.T06 | integration | PS-131-04.R03, PS-131-06.R02 | event streams: 99 vs 100 rejections in 10 minutes; 49 vs 50 rate.exceeded from 19 vs 20 prefixes; duplicates | no incident below thresholds; one incident at thresholds; duplicates dedupe |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
