# PS-079-04 — Commands, queries and events: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-04.R01** Retention policy and sweep commands exist in two forms, vault commands for the user's vault and relay commands for operators, with identical rules and different authorization.
- **PS-079-04.R02** Hold commands are relay commands authorized by relay policy for operator and admin roles; they produce no statement to users and never touch vaults.
- **PS-079-04.R03** Sweeps emit privacy.retention.purged with counts only, and holds emit placed and released events on the relay.
- **PS-079-04.R04** RetentionPurgePort is defined in the note with typed methods, anchor semantics, error semantics and a CI conformance check.
- **PS-079-04.R05** On a relay, purges of an author's data start only from a verified deletion statement applied through privacy.deletion.relay_apply (F10.S01.M04), which calls privacy.legal_hold.check and purgeSubject, or from federation.tombstone.applied; vault-local events such as privacy.deletion.completed never reach a relay.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `privacy.retention_policy.set` | privacy.retention_policy.set | [vault command or relay command by scope] { scopeKind, scopeId, class, durationDays, source, jurisdictionCode?, expectedRevision? } | { policyId, revision, effectiveFrom } | VALIDATION_FAILED, FORBIDDEN, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `privacy.retention.run` | privacy.retention.run | [vault command or relay command by scope] { scopeKind, scopeId, dryRun?: boolean, kinds?: string[], confirmClockJump?: boolean } | { runId, dryRun, clockJump?: {sinceHighWaterMs, aheadOfRelayReceiptMs}, perKind: [{kind, class, eligible, purged, skipped, skippedFutureAnchor}], startedAt, completedAt } | VALIDATION_FAILED, FORBIDDEN, RATE_LIMITED, DEPENDENCY_UNAVAILABLE, PRIVACY_RETENTION_CLOCK_JUMP | privacy.retention.purged | yes (Idempotency-Key) |
| `privacy.legal_hold.request` | privacy.legal_hold.request | [relay command] { subject: {kind, ref}, reasonCode, reference } | { holdId, status: requested, approvalDeadline } | VALIDATION_FAILED, FORBIDDEN, PRIVACY_HOLD_EXISTS, RATE_LIMITED |  | yes (Idempotency-Key) |
| `privacy.legal_hold.approve` | privacy.legal_hold.approve | [relay command] { holdId, expectedRevision } | { holdId, revision, status: active, reviewDueAt } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, PRIVACY_HOLD_SELF_APPROVAL | privacy.legal_hold.placed | yes (Idempotency-Key) |
| `privacy.legal_hold.reject` | privacy.legal_hold.approve | [relay command] { holdId, expectedRevision, note? } | { holdId, revision, status: rejected } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `privacy.legal_hold.release_request` | privacy.legal_hold.release_request | [relay command] { holdId, expectedRevision } | { holdId, revision, status: release_requested, releaseDeadline } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
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
| `security.role.revoked` | requested holds lapse and release_requested holds return to active when the revoked assignment's subjectKey (a did:key) equals requestedBy or releaseRequestedBy or is a key of that did per KeyLinkagePort; approvals already given stay valid |
| `platform.tenant.configured` | apply the relay's configured jurisdiction profile as retention policy rows with source jurisdiction |
| `federation.tombstone.applied` | relay calls purgeSubject for the tombstoned content within 24 h unless privacy.legal_hold.check says held, in which case it is sealed and withdrawn from public serving |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_HOLD_SELF_APPROVAL | 403 | no | the approver must differ from the requester and must not be linked to the requester's DID |
| PRIVACY_HOLD_EXISTS | 409 | no | an active or requested hold already covers this subject |
| PRIVACY_RETENTION_CLOCK_JUMP | 409 | no | the device clock moved more than 24 h ahead of the last sweep or of relay receipts; confirm the dry-run preview before purging |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** RetentionPurgePort (N6; defined here, implemented by every module that owns user data and registered at vault or relay composition): kinds() -> [{kind (record kind, for example bazaar.listing), class: RET-EPHEMERAL | RET-SHORT | RET-STANDARD | RET-EVIDENCE | RET-AUDIT, anchorField (path of the RFC 3339 time the retention period starts from, for example deletedAt, withdrawnAt, closedAt or lastActivityAt)}]; purge(kind, olderThan, cursor?, limit ≤ 1000) -> {purged, skippedHeld, nextCursor?}, which deletes in one transaction only rows whose anchorField is at or before olderThan, where olderThan = sweep clock minus the effective durationDays of the class for the scope, and never rows whose anchor is later than the sweep clock; purgeSubject(subject{kind: author|record|mailbox, ref}, cursor?, limit ≤ 1000) -> {purged, sealed, nextCursor?}, the relay purge path used by tombstone handlers and privacy.deletion.relay_apply; isHeld?(ref) -> boolean on relays, delegating to privacy.legal_hold.check inside the deleting transaction. Calls are idempotent per (runId, kind, cursor). Errors - VALIDATION_FAILED for an unknown kind or a limit above 1000, DEPENDENCY_UNAVAILABLE when storage is busy (retried by the sweep). CI conformance check - every record kind with a retention annotation in the schema registry has a registered kind whose class matches the annotation, and a contract test runs purge and purgeSubject on the module's fixtures twice with identical results. This module's own ports - it registers ExportSectionPort section privacy.retention and DeletionPort (delete vault-scope policy rows and run records) through vault composition rather than depends_on, because F10.S01.M03 and F10.S01.M04 already depend on it; run records and released holds purge through its own kinds privacy.retention_run (RET-AUDIT, anchorField startedAt) and privacy.legal_hold (RET-AUDIT, anchorField releasedAt). KeyLinkagePort {linked(didA, didB) -> boolean} is supplied by the relay composition from the F07 key-linkage reads (N11).

### Example

```
relay command privacy.legal_hold.request (operator A)
{ "subject": { "kind": "record", "ref": "sha256-77de…" }, "reasonCode": "court_order", "reference": "CASE-2026-0417" }
=> { "holdId": "0192f3c1-…", "status": "requested", "approvalDeadline": "2026-11-07T10:00:00.000Z" }
relay command privacy.legal_hold.approve (admin B, not linked to A) { "holdId": "0192f3c1-…", "expectedRevision": 1 }
=> { "holdId": "0192f3c1-…", "revision": 2, "status": "active", "reviewDueAt": "2027-05-03T10:00:00.000Z" }
vault command privacy.retention.run { "scopeKind": "vault", "scopeId": "…" } after the clock jumped 3 days
=> PRIVACY_RETENTION_CLOCK_JUMP with the dry-run preview; repeated with "confirmClockJump": true after the user confirms
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T07 | contract | PS-079-04.R01, PS-079-04.R02, PS-079-04.R03, PS-079-09.R02 | execute each command and query in vault and relay forms | outputs and events validate against registry schemas; purged events contain counts only |
| TEST-PS-079-09.T08 | integration | PS-079-04.R03, PS-079-04.R05 | federation.tombstone.applied and privacy.deletion.relay_apply (F10.S01.M04 double) for a held and a non-held author; a vault-local privacy.deletion.completed injected on the relay bus | held sealed and not served; non-held purged within 24 h through purgeSubject; the vault-local event triggers nothing |
| TEST-PS-079-09.T22 | contract | PS-079-04.R04 | RetentionPurgePort conformance with stub modules: limit 1001, unknown kind, replay of (runId, kind, cursor), a kind whose class differs from its schema annotation, anchorField missing | VALIDATION_FAILED for the bad calls; the replay purges nothing twice; the CI check fails for the mismatched and missing cases |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
