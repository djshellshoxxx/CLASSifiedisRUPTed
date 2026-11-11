# PS-079-04 — Commands, queries and events: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-04.R01** Retention policy and sweep commands exist in two forms, vault commands for the user's vault and relay commands for operators, with identical rules and different authorization.
- **PS-079-04.R02** Hold commands are relay commands authorized by relay policy for operator and admin roles; they produce no statement to users and never touch vaults.
- **PS-079-04.R03** Sweeps emit privacy.retention.purged with counts only, and holds emit placed and released events on the relay.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `privacy.retention_policy.set` | privacy.retention_policy.set | [vault command or relay command by scope] { scopeKind, scopeId, class, durationDays, source, jurisdictionCode?, expectedRevision? } | { policyId, revision, effectiveFrom } | VALIDATION_FAILED, FORBIDDEN, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `privacy.retention.run` | privacy.retention.run | [vault command or relay command by scope] { scopeKind, scopeId, dryRun?: boolean, kinds?: string[] } | { runId, dryRun, perKind: [{kind, class, eligible, purged, skipped}], startedAt, completedAt } | VALIDATION_FAILED, FORBIDDEN, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | privacy.retention.purged | yes (Idempotency-Key) |
| `privacy.legal_hold.request` | privacy.legal_hold.request | [relay command] { subject: {kind, ref}, reasonCode, reference } | { holdId, status: requested, approvalDeadline } | VALIDATION_FAILED, FORBIDDEN, PRIVACY_HOLD_EXISTS |  | yes (Idempotency-Key) |
| `privacy.legal_hold.approve` | privacy.legal_hold.approve | [relay command] { holdId, expectedRevision } | { holdId, revision, status: active, reviewDueAt } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, PRIVACY_HOLD_SELF_APPROVAL | privacy.legal_hold.placed | yes (Idempotency-Key) |
| `privacy.legal_hold.reject` | privacy.legal_hold.approve | [relay command] { holdId, expectedRevision, note? } | { holdId, revision, status: rejected } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `privacy.legal_hold.release_request` | privacy.legal_hold.release_request | [relay command] { holdId, expectedRevision } | { holdId, revision, status: release_requested } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `privacy.legal_hold.release_approve` | privacy.legal_hold.release_approve | [relay command] { holdId, expectedRevision, approve: boolean } | { holdId, revision, status } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, PRIVACY_HOLD_SELF_APPROVAL | privacy.legal_hold.released | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `privacy.retention_policy.list` | privacy.retention_policy.read | { scopeKind, scopeId } | { items: RetentionPolicy[], nextSweepAt } |  |
| `privacy.legal_hold.check` | privacy.legal_hold.check | { subject: {kind, ref} } | { held: boolean, holdId? } |  |
| `privacy.legal_hold.list` | privacy.legal_hold.read | { status?, cursor?, limit ≤ 50 } | { items: LegalHold[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `privacy.retention.purged` | P1 | { runId, scopeKind, recordKind, class, count } |
| `privacy.legal_hold.placed` | P3 | { holdId, relayId, subjectKind, reasonCode } |
| `privacy.legal_hold.released` | P3 | { holdId, relayId, subjectKind } |

### Events consumed

| Type | Effect |
|---|---|
| `security.role.revoked` | requested holds whose requester lost the operator role lapse; approvals already given stay valid |
| `platform.tenant.configured` | apply the relay's configured jurisdiction profile as retention policy rows with source jurisdiction |
| `federation.tombstone.applied` | relay purges the tombstoned content within 24 h unless privacy.legal_hold.check says held, in which case it is sealed and withdrawn from public serving |
| `privacy.deletion.completed` | relay purges data it holds for the deleted principal unless held; vault data is handled by the vault deletion flow |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_HOLD_SELF_APPROVAL | 403 | no | the approver must differ from the requester |
| PRIVACY_HOLD_EXISTS | 409 | no | an active or requested hold already covers this subject |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
relay command privacy.legal_hold.request (operator A)
{ "subject": { "kind": "record", "ref": "sha256-77de…" }, "reasonCode": "court_order", "reference": "CASE-2026-0417" }
=> { "holdId": "0192f3c1-…", "status": "requested", "approvalDeadline": "2026-11-07T10:00:00.000Z" }
relay command privacy.legal_hold.approve (operator B) { "holdId": "0192f3c1-…", "expectedRevision": 1 }
=> { "holdId": "0192f3c1-…", "revision": 2, "status": "active", "reviewDueAt": "2027-05-03T10:00:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T07 | contract | PS-079-04.R01, PS-079-04.R02, PS-079-04.R03, PS-079-09.R02 | execute each command and query in vault and relay forms | outputs and events validate against registry schemas; purged events contain counts only |
| TEST-PS-079-09.T08 | integration | PS-079-04.R03, PS-079-02.R03 | federation.tombstone.applied for a held and a non-held record | held sealed and not served; non-held purged within 24 h |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
