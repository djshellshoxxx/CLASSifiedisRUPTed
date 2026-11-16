# PS-094-04 — Commands, queries and events: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-04.R01** Every command declares whether it is vault-local, produces a signed statement, or is a relay command, and the signatures below do so.
- **PS-094-04.R02** File emits moderation.report.filed as a local event in the same IndexedDB transaction as the Report; the statement leaves the device only through the sync outbox.
- **PS-094-04.R03** The module consumes case events locally (derived from verified relay statements) to link and resolve reports.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.report.file` | moderation.report.file | { targetType, targetId, relayId, reasonCode, details?, hideLocally?: boolean, blockAuthor?: boolean } | { reportId, referenceCode, revision: 1, syncState: local_committed, evidenceSnapshotId } | VALIDATION_FAILED, MODERATION_TARGET_UNAVAILABLE, MODERATION_REPORT_SELF, MODERATION_REPORT_DUPLICATE, MODERATION_EVIDENCE_FAILED, PAYLOAD_TOO_LARGE | moderation.report.filed | yes (Idempotency-Key) |
| `moderation.report.withdraw` | moderation.report.withdraw | { reportId, expectedRevision } | { reportId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `moderation.report.receive` | moderation.report.receive | { sealedReport, signature } | { receipt: statement classrup.moderation.reportreceipt/v1 signed by relay, caseRef? } | VALIDATION_FAILED, MODERATION_REPORT_DUPLICATE, PAYLOAD_TOO_LARGE, RATE_LIMITED, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.advisorysubscription.set` | moderation.advisorysubscription.set | { publisherKey, mode: label\|hide\|ignore } | { subscriptionId, revision } | VALIDATION_FAILED, NOT_FOUND |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.report.list_mine` | moderation.report.read_own | { status?, cursor?, limit ≤ 50 } | { items: { reportId, referenceCode, reasonCode, status, syncState, outcome?, createdAt }[], nextCursor? } |  |
| `moderation.report.list_for_target` | moderation.report.read_as_relay_moderator | { targetType, targetId, status?, cursor?, limit ≤ 50 } | { items: Report[] (opened from sealed envelopes), nextCursor? } | NOT_FOUND |
| `moderation.advisorysubscription.list` | moderation.advisorysubscription.read_own | { includeRevoked?: boolean } | { items: AdvisorySubscription[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.report.filed` | P3 | { reportId, targetType, targetId, targetCid, reasonCode, relayId, evidenceSnapshotId } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.case.opened` | relay side: link received reports to the case; vault side: derived from the verified relay receipt to set caseRef and status linked |
| `moderation.case.closed` | move linked reports to resolved with the case outcome (relay side) or from the verified outcome statement (vault side) |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_TARGET_UNAVAILABLE | 409 | no | the vault does not hold the target with a verifiable author signature |
| MODERATION_REPORT_SELF | 422 | no | authors cannot report their own content |
| MODERATION_REPORT_DUPLICATE | 409 | no | an open report for this key, relay, target and reason exists; params.reportId |
| MODERATION_EVIDENCE_FAILED | 500 | no | the evidence snapshot could not be created locally so no report was filed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command moderation.report.file (local, Idempotency-Key 0192f3a4-0000-7000-8000-000000000a01)
{ "targetType": "listing", "targetId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "relayId": "did:key:z6MkRelayExample", "reasonCode": "scam_fraud", "hideLocally": true }
-> { "reportId": "0192f3b0-1111-7000-8000-000000000001", "referenceCode": "0192f3b0", "revision": 1, "syncState": "local_committed" }
sync outbox POST https://relay.example/api/v1/cmd/moderation.report.receive
-> 201 { "receipt": { "type": "classrup.moderation.reportreceipt/v1", "relayReceivedAt": "2026-11-04T10:00:02Z", "sig": "…" } }  (syncState transport_acknowledged)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T05 | contract | PS-094-04.R01, PS-094-04.R02, PS-094-09.R02 | each command, statement and query executes | outputs, signed statements and filed event validate against registry schemas |
| TEST-PS-094-09.T06 | integration | PS-094-04.R03 | case.opened then case.closed receipts delivered twice each | report linked then resolved once |
| TEST-PS-094-09.T12 | unit | PS-094-01.R04, PS-094-04.R01 | subscribe to advisory feed then revoke publisher key | labels applied, then dropped after verified revocation; no local record deleted |
| TEST-PS-094-09.T16 | e2e | PS-094-01.R02, PS-094-04.R01 | mobile reporter files a report offline then reconnects | single report, delivery status progresses honestly, axe zero serious issues |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
