# PS-148-04 — Commands, queries and events: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-04.R01** import_snapshot, compute, request_review and discard are vault commands in the compiler's vault and publish runs in the reviewer's vault; request_review sends a compiler-signed classrup.governance.transparency_draft/v1 sealed to the reviewer, and publish signs classrup.governance.transparency_report/v1 embedding that draft and queues it to the relay.
- **PS-148-04.R02** Counters accumulate on the relay in a relay-side consumer of relay-local moderation events and relay-scope policy decisions, idempotent by event id and by proposalId and statementCid; legal request tallies are operator-signed relay commands; relay_counter_snapshot returns a relay-signed snapshot sealed to the requesting operator key.
- **PS-148-04.R03** receive is a vault command in any vault that verifies and stores reports from publishers trusted for scope transparency and drafts addressed to the local operator key; get_published and list_published are public reads on the relay and local reads in vaults; relay_upload accepts only two-key reports from the relay's operators.
- **PS-148-04.R04** Every statement type of this module is registered in the F11.S01.M01 registry with audience, signer role, role resolution and maxAge (N2).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.transparency.record_legal_request` | governance.transparency.record | [relay command, request signed by an operator device key] { periodKey, type, outcome, count? (default 1) } | { periodKey, metric: legal_requests, dimension, count } | VALIDATION_FAILED, CONFLICT_STATE, FORBIDDEN, GOVERNANCE_TRANSPARENCY_PERIOD_INVALID, RATE_LIMITED |  | yes (Idempotency-Key) |
| `governance.transparency.import_snapshot` | governance.transparency.compile | [vault-local, operator] { sealedSnapshot (from relay_counter_snapshot) } | { snapshotCid, relayId, periodKey, coveragePercent, frozen: boolean } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, PAYLOAD_TOO_LARGE, FORBIDDEN |  | yes (Idempotency-Key) |
| `governance.transparency.compute` | governance.transparency.compile | [vault-local, operator] { periodKey, snapshotCid, correctionOf?: reportId, correctionNote? } | { reportId, version, contentCid, suppressedCellCount, totalsVisible, coveragePercent } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_STATE, GOVERNANCE_TRANSPARENCY_PERIOD_INVALID, GOVERNANCE_TRANSPARENCY_SUPPRESSION |  | yes (Idempotency-Key) |
| `governance.transparency.request_review` | governance.transparency.compile | [vault-local, compiler + statement classrup.governance.transparency_draft/v1 { relayId, periodKey, version, reportBody, contentCid, snapshotCid } sealed to the reviewer] { reportId, expectedRevision, reviewerId } | { reportId, draftCid, status: awaiting_review, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_TRANSPARENCY_SELF_REVIEW |  | yes (Idempotency-Key) |
| `governance.transparency.publish` | governance.transparency.review | [vault-local, reviewer + statement classrup.governance.transparency_report/v1 { draft envelope (compiler signature), contentCid, reviewerId, publishedAt }] { reportId, draftCid, contentCid, recomputed: boolean, relayIds[] } | { reportId, version, statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_STATE, GOVERNANCE_TRANSPARENCY_SELF_REVIEW, GOVERNANCE_TRANSPARENCY_SUPPRESSION, GOVERNANCE_TRANSPARENCY_PERIOD_INVALID | governance.transparency.published | yes (Idempotency-Key) |
| `governance.transparency.discard` | governance.transparency.compile | [vault-local, operator] { reportId, expectedRevision } | { reportId, status: discarded } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `governance.transparency.receive` | governance.transparency.apply | [vault-local, inbound statement or PendingApplyPort] { envelope (transparency_report, or transparency_draft addressed to a local operator key), receipt?, provenance } | { reportId?, stored: boolean, status?, quarantineReason?, pendingId?, conflicted?: boolean } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, PAYLOAD_TOO_LARGE, GOVERNANCE_TRANSPARENCY_SUPPRESSION, GOVERNANCE_TRANSPARENCY_SELF_REVIEW | governance.transparency.published | yes (Idempotency-Key) |
| `governance.transparency.relay_upload` | governance.transparency.relay_publish | [relay command] { envelope } | { statementCid, relayReceipt: classrup.platform.relay_receipt/v1 } | VALIDATION_FAILED, FORBIDDEN, PAYLOAD_TOO_LARGE, RATE_LIMITED, GOVERNANCE_TRANSPARENCY_SELF_REVIEW, GOVERNANCE_TRANSPARENCY_SUPPRESSION, GOVERNANCE_TRANSPARENCY_PERIOD_INVALID |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.transparency.get_published` | governance.transparency.read_public | { relayId, periodKey, version? } | { report: TransparencyReport, compilerSignatureValid: boolean, reviewerSignatureValid: boolean, operatorListVerified: boolean, conflicted: boolean } | NOT_FOUND |
| `governance.transparency.list_published` | governance.transparency.read_public | { relayId?, cursor?, limit <= 50 } | { items: TransparencyReport[], nextCursor? } | VALIDATION_FAILED |
| `governance.transparency.preview` | governance.transparency.compile | { periodKey, snapshotCid? } | { counters (operator view from the latest imported snapshot), suppressionPreview, coveragePercent, daysSincePeriodEnd } | GOVERNANCE_TRANSPARENCY_PERIOD_INVALID, NOT_FOUND |
| `governance.transparency.relay_counter_snapshot` | governance.transparency.relay_snapshot | [relay query, request signed by an operator device key] { periodKey } | { sealedSnapshot: classrup.governance.transparency_counts/v1 signed by the relay key and sealed to the requesting operator key, snapshotCid, frozen: boolean } | FORBIDDEN, NOT_FOUND, RATE_LIMITED, GOVERNANCE_TRANSPARENCY_PERIOD_INVALID |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.transparency.published` | P0 | { reportId, relayId, periodKey, version, contentCid, statementCid, compilerId, reviewerId, supersedes? } — vault-local in the reviewer vault on publish and in receiving vaults on receive |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.report.received` | relay only: increment reports_received for payload.reasonCode (12-code F12.S01.M01 taxonomy) in the period of relayReceivedAt; dedupe by eventId; the vault-local moderation.report.filed is not consumed |
| `moderation.action.applied` | relay only, origin relay only (vault-derived copies ignored): increment actions_applied for payload.kind (warn, remove_from_index, restrict_feature, suspend_relay_access); dedupe by eventId |
| `moderation.appeal.filed` | relay only (relay-local event): increment appeals_filed with dimension filed; dedupe by eventId |
| `moderation.appeal.decided` | relay only, origin relay only: increment appeals_decided for payload.outcome upheld, overturned or reduced; dedupe by eventId; moot closures emit no decided event and are never counted as decided |
| `moderation.spam.detected` | relay only, mode relay_intake only (vault_filter ignored): increment spam_detected with dimension throttled when a throttle is present, else flagged; dedupe by eventId |
| `governance.policy_proposal.decided` | relay only, scope relay and payload.publisherId an operator key of this relay: increment policy_decisions for the outcome once per (proposalId, statementCid); vault-scope copies ignored |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_TRANSPARENCY_PERIOD_INVALID | 422 | no | period key is malformed, not ended, of another granularity, overlapping a published period, or already published and frozen |
| GOVERNANCE_TRANSPARENCY_SUPPRESSION | 422 | no | a table cell between 1 and 9 would be disclosed directly, through totals or by differencing against the superseded version |
| GOVERNANCE_TRANSPARENCY_SELF_REVIEW | 403 | no | reviewer key equals the compiler key or either key is not an operator key of the relay |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2, registered in F11.S01.M01):
| Type | Audience | Signer role (resolution) | maxAge |
|---|---|---|---|
| classrup.governance.transparency_counts/v1 | participants (sealed to the requesting operator key) | relay (author is the relay key pinned through F15.S02.M01, current key or previous key inside the 7-day rotation overlap) | 30 d |
| classrup.governance.transparency_draft/v1 | participants (sealed to the reviewer) | compiler: principal listed in operatorKeys of the relay's latest verified classrup.platform.tenant_config/v1 (F15.S04.M03), ext.signerKey active per F07.S02.M01 key status | 30 d |
| classrup.governance.transparency_report/v1 | public | reviewer: principal in the same operatorKeys, different from the compiler of the embedded draft; both signatures over the same contentCid | none (public record) |
Receivers act only on reports their receiving path accepted; a report failing V13 is quarantined with GOVERNANCE_TRANSPARENCY_SELF_REVIEW. This module registers apply for classrup.governance.transparency_report/v1 in the F18.S02.M01 PendingApplyPort and registers a relay-scope RetentionPurgePort kind for TransparencyCounter (class RET-AUDIT, anchor publishedAt + 90 d) with F10.S01.M02. Reports and counters hold no user data, so no export or deletion port applies beyond the operator's own export section.


### Example

```
operator O1 vault: query relay governance.transparency.relay_counter_snapshot { "periodKey": "2026-Q3" } (signed request) => { "sealedSnapshot": "...", "snapshotCid": "sha256-U25h...", "frozen": true }
dispatch("governance.transparency.import_snapshot", { "sealedSnapshot": "..." }) => { "snapshotCid": "sha256-U25h...", "relayId": "relay:berlin.example", "periodKey": "2026-Q3", "coveragePercent": 99, "frozen": true }
dispatch("governance.transparency.compute", { "periodKey": "2026-Q3", "snapshotCid": "sha256-U25h..." })
=> { "reportId": "0192f3b5-...", "version": 1, "contentCid": "sha256-Zm9v...", "suppressedCellCount": 6, "totalsVisible": true, "coveragePercent": 99 }
dispatch("governance.transparency.request_review", { "reportId": "0192f3b5-...", "expectedRevision": 1, "reviewerId": "did:key:z6MkO2..." }) => { "draftCid": "sha256-RHJm...", "status": "awaiting_review", "syncState": "prepared" }
reviewer O2 vault: dispatch("governance.transparency.publish", { "reportId": "0192f3b5-...", "draftCid": "sha256-RHJm...", "contentCid": "sha256-Zm9v...", "recomputed": true, "relayIds": ["relay:berlin.example"] })
=> { "reportId": "0192f3b5-...", "version": 1, "statementCid": "sha256-Yg1b...", "syncState": "prepared" }
published table excerpt: { "actions_applied": { "warn": 41, "remove_from_index": "under_10", "restrict_feature": "suppressed", "suspend_relay_access": 12 } } (no total for actions_applied)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T06 | contract | PS-148-04.R01, PS-148-04.R04, PS-148-09.R02 | import_snapshot, compute, request_review, publish, receive | statements validate against classrup.governance.transparency_counts/v1, transparency_draft/v1 and transparency_report/v1 and their F11.S01.M01 registry rows; signatures verify; published event valid |
| TEST-PS-148-09.T07 | integration | PS-148-04.R02, PS-148-06.R01 | deliver the same relay events twice and out of order, plus vault-origin copies, vault_filter spam events and decided events from another publisher | counts equal unique relay events; ignored events not counted; each operator decision counted once |
| TEST-PS-148-09.T18 | integration | PS-148-05.R02, PS-148-04.R03 | anonymous get_published on the relay; relay_upload by O2 with a two-key report, with a single-signature report and by X | anonymous read served; two-key upload stored with receipt; single-signature and X uploads refused |
| TEST-PS-148-09.T19 | integration | PS-148-04.R02, PS-148-01.R04, PS-148-03.R04 | F12 fixtures emit relay-local events through the quarter; relay freezes at periodEnd + 24 h; O1 and O2 each fetch the snapshot; O1 computes and requests review; O2 recomputes and publishes | both snapshots have the same snapshotCid; O2's recomputed contentCid equals O1's; the published report matches the event fixture after suppression |
| TEST-PS-148-09.T21 | integration | PS-148-03.R02, PS-148-04.R03 | two different verified version-1 reports for 2026-Q3 reach V in either order | both marked conflicted; get_published returns conflicted true and neither is current |
| TEST-PS-148-09.T22 | contract | PS-148-01.R04, PS-148-04.R02 | compare the dimension vocabularies with the F12.S01.M01 moderation.report.received, F12.S02.M01, F12.S01.M03 and F12.S02.M02 event schemas; a moderation.report.filed fixture; an appeal closed as moot | every enum value maps to one dimension and no dimension lacks a producer value; report.filed and the moot closure change no counter and appeals_decided has exactly upheld, overturned and reduced |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
