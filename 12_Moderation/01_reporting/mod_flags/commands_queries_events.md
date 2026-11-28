# PS-094-04 — Commands, queries and events: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-04.R01** Every command declares whether it is vault-local, produces a signed statement, or is a relay command, and the signatures below do so.
- **PS-094-04.R02** File emits moderation.report.filed as a local event in the same IndexedDB transaction as the Report; the statement leaves the device only through the sync outbox.
- **PS-094-04.R03** The module consumes case events on the relay to link and resolve received reports and to send the reportlinked and reportoutcome statements, and the reporter's vault applies only those verified statements.
- **PS-094-04.R04** moderation.report.receive verifies the statement, stores the relay copy and the signed receipt, and emits the relay-local moderation.report.received with receiptId, subjectKey and snapshotId in the same relay transaction; only this event opens or extends a case in F12.S02.M01, and moderation.report.filed never leaves the reporter's vault (EVT-8).
- **PS-094-04.R05** When a case closes with outcome no_action, the relay emits moderation.report.dismissed { reportId, reporterKey, relayId, reasonCode, caseId, exempt } for every received report linked to it, relay-local and P3, consumed in-process only by F12.S03.M02; minor_safety reports carry exempt true.
- **PS-094-04.R06** F12.S02.M01 calls the in-process moderation.report.link_case in its intake transaction whenever it opens a case for a received report or merges one into an open case, so every linked reporter receives exactly one reportlinked statement.
- **PS-094-04.R07** LocalHidePort is the in-process vault read port behind moderation.localhide.check (isHidden({ targetRef? | authorDid? }) → { hidden, by: local_hide|advisory, hideId? }) and moderation.localhide.filter (filterHidden(items[{ targetRef, authorDid }]) → { visible, hiddenCount, labels }); F06.S01.M02 and F06.S02.M03 call it at query time instead of removing index documents, and moderation.localhide.add and moderation.localhide.remove are the explicit hide and unhide vault commands.
- **PS-094-04.R08** A message report carries the F08.S01.M01 messageCid as targetCid and the sender-signed envelope (nonce, ciphertext, key commitment, signature, without wrapped keys) in its metadata, and the message key K travels only inside the sealed body of an approved participant disclosure whose redact/1 preview removed nothing (PRV-9), so the relay moderator can check the key commitment and Dec(K, C) = P without receiving more plaintext than the reporter approved.
- **PS-094-04.R09** The 12-code reasonCode taxonomy (spam, scam_fraud, prohibited_item, harassment, hate, sexual_content, violence, counterfeit, privacy_leak, impersonation, minor_safety, other) of moderation.report.received is a stable v1 vocabulary bound by the F18.S02.M02 transparency dimension reports_received and its contract test T22; adding, renaming or removing a code is a breaking change that needs a new major event schema (CTR-SCH-001 SCH-3) coordinated with F18.S02.M02.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.report.file` | moderation.report.file | { targetType, targetId, relayId, reasonCode, details?, reporterClaim?: boolean (message only), disclosureSnapshotId?: uuidv7 (approved participant disclosure from F12.S01.M02), hideLocally?: boolean, blockAuthor?: boolean } | { reportId, referenceCode, revision: 1, syncState: local_committed, evidenceSnapshotId, disclosure } | VALIDATION_FAILED, MODERATION_TARGET_UNAVAILABLE, MODERATION_REPORT_SELF, MODERATION_REPORT_DUPLICATE, MODERATION_EVIDENCE_FAILED, MODERATION_RELAY_UNKNOWN, PAYLOAD_TOO_LARGE, PRECONDITION_FAILED | moderation.report.filed | yes (Idempotency-Key) |
| `moderation.report.withdraw` | moderation.report.withdraw | { reportId, expectedRevision } | { reportId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `moderation.report.receive` | moderation.report.receive | { header: signed report header, sealedBody, signature } | { receiptId, receipt: classrup.moderation.reportreceipt/v1 { reportId, statementDigest, relaySeq, relayReceivedAt } } | VALIDATION_FAILED, MODERATION_REPORT_DUPLICATE, IDEMPOTENCY_KEY_REUSED, PAYLOAD_TOO_LARGE, RATE_LIMITED, FORBIDDEN | moderation.report.received | yes (Idempotency-Key) |
| `moderation.report.link_case` | moderation.report.link_case | { receiptId, caseRef } | { reportId, status: linked, statementQueued: boolean } | NOT_FOUND, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `moderation.report.receive_relay_statement` | moderation.report.receive_relay_statement | { statement: classrup.moderation.reportreceipt/v1 \| reportlinked/v1 \| reportoutcome/v1 } | { reportId, status, syncState, outcome?, quarantined: boolean } | FORBIDDEN, NOT_FOUND, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `moderation.localhide.add` | moderation.localhide.add | { targetRef?: { type, id, cid? }, authorDid? } | { hideId, createdAt } | VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `moderation.localhide.remove` | moderation.localhide.remove | { hideId } | { hideId, removed: true } | NOT_FOUND |  | yes (Idempotency-Key) |
| `moderation.advisorysubscription.set` | moderation.advisorysubscription.set | { publisherKey, mode: label\|hide\|ignore } | { subscriptionId, revision } | VALIDATION_FAILED, NOT_FOUND |  | yes (Idempotency-Key) |
| `moderation.advisorysubscription.sync` | moderation.advisorysubscription.sync | { subscriptionId? } | { applied, retracted, expired, quarantined, lastSeq } | NOT_FOUND, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.report.list_mine` | moderation.report.read_own | { status?, cursor?, limit ≤ 50 } | { items: { reportId, referenceCode, reasonCode, status, syncState, outcome?, disclosure, createdAt }[], nextCursor? } |  |
| `moderation.report.list_for_target` | moderation.report.read_as_relay_moderator | { targetType, targetId, status?, cursor?, limit ≤ 50 } | { items: { header, body opened from the sealed envelope (access-logged), receiptId, caseRef? }[], nextCursor? } | NOT_FOUND |
| `moderation.report.status_for_reporter` | moderation.report.read_status_own | { reportId } | { receipt, linked?: classrup.moderation.reportlinked/v1, outcome?: classrup.moderation.reportoutcome/v1 } | NOT_FOUND |
| `moderation.report.ledger_for_case` | moderation.report.read_ledger | { caseRef } | { items: { reportId, receiptId, reporterKey, reasonCode, status, outcome? }[] } |  |
| `moderation.localhide.list` | moderation.localhide.read_own | { kind?: target\|author, cursor?, limit ≤ 100 } | { items: { hideId, targetRef?, authorDid?, reportId?, createdAt }[], nextCursor? } |  |
| `moderation.localhide.check` | moderation.localhide.filter | { targetRef?: { type, id, cid? }, authorDid? } — LocalHidePort.isHidden, in-process | { hidden: boolean, by?: local_hide\|advisory, hideId?, advisoryCid? } | VALIDATION_FAILED |
| `moderation.localhide.filter` | moderation.localhide.filter | { items: { targetRef: { type, id, cid? }, authorDid }[] ≤ 500 } — LocalHidePort.filterHidden, in-process | { visible: index[], hiddenCount, labels: { index, advisoryCid, label }[] } — hidden items are dropped, label-mode advisories are returned as labels | VALIDATION_FAILED |
| `moderation.advisorysubscription.list` | moderation.advisorysubscription.read_own | { includeRevoked?: boolean } | { items: AdvisorySubscription[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.report.filed` | P3 | { reportId, relayId, targetType, targetId, targetCid, subjectKey, reasonCode, snapshotId, snapshotHash, disclosure } — vault-local in the reporter's outbox only (EVT-8); never reporterKey or details; drives local UI and diagnostics, never a relay case |
| `moderation.report.received` | P2 | { reportId, receiptId, relayId, targetType, targetId, targetCid, subjectKey (author or sender key from the snapshot envelope), reasonCode, snapshotId, snapshotHash, disclosure, relayReceivedAt } — relay-local (EVT-8), emitted in the receipt transaction; never reporterKey or details; consumed by F12.S02.M01 case intake |
| `moderation.report.dismissed` | P3 | { reportId, reporterKey, relayId, reasonCode, caseId, exempt: boolean (true for minor_safety) } — relay-local, in-process consumers only (F12.S03.M02); never logged, federated or sent to notification channels |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.case.opened` | relay only, idempotent fallback to link_case: for every receipt in reportRefs not yet linked, set the relay copy linked and queue a relay-signed classrup.moderation.reportlinked/v1 { reportId, caseRef } to the reporter's mailbox |
| `moderation.case.closed` | relay only: set the case's linked reports resolved with the case outcome (actioned, no_action, duplicate or content_removed_by_owner) and queue classrup.moderation.reportoutcome/v1 to each reporter; for outcome no_action also emit moderation.report.dismissed per linked received report, with exempt true when reasonCode is minor_safety |
| `privacy.deletion.completed` | vault: delete LocalHide rows, AdvisorySubscriptions and filed, linked or withdrawn reports; resolved reports kept as evidence (keepEvidence) get reporterKey replaced by the payload pseudonym; relay copies are pseudonymized by the DeletionPort when the relay applies the signed deletion request |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_TARGET_UNAVAILABLE | 409 | no | the vault does not hold the target with a verifiable author signature and it is not a reportable reporter claim |
| MODERATION_REPORT_SELF | 422 | no | authors cannot report their own content |
| MODERATION_REPORT_DUPLICATE | 409 | no | an open report for this key, relay, target and reason exists; params.reportId |
| MODERATION_EVIDENCE_FAILED | 500 | no | the evidence snapshot could not be created locally so no report was filed |
| MODERATION_RELAY_UNKNOWN | 404 | no | the vault knows no published, unexpired moderation key for this relay |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, F11.S01.M01): classrup.moderation.report/v1 (header signed by a registered device key of reporterKey, body sealed to the addressed relay's moderation key) and classrup.moderation.reportwithdrawal/v1 (same signer role); classrup.moderation.reportreceipt/v1, classrup.moderation.reportlinked/v1 and classrup.moderation.reportoutcome/v1 (signer role: the addressed relay key pinned when the user selected the relay); inbound classrup.moderation.advisory/v1 and classrup.moderation.advisoryretraction/v1 (F12.S02.M01 schemas, signer role the subscribed publisher key). Statements from blocked DIDs are dropped through F07.S02.M02 filterBlocked (N7). Relay statements to reporters travel through F08.S01.M01 comms.mailbox.put with a content-free push through notify.notification.dispatch (N17) and are also returned by moderation.report.status_for_reporter. Privacy ports (N6): ExportSectionPort (sections moderation.reports, moderation.advisory and moderation.hides), DeletionPort and RetentionPurgePort are registered with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
vault command moderation.report.file (local, Idempotency-Key 0192f3a4-0000-7000-8000-000000000a01)
{ "targetType": "listing", "targetId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "relayId": "did:key:z6MkRelayExample", "reasonCode": "scam_fraud", "hideLocally": true }
-> { "reportId": "0192f3b0-1111-7000-8000-000000000001", "referenceCode": "0192f3b0", "revision": 1, "syncState": "local_committed", "disclosure": "public_target" }
sync outbox (prepared) POST https://relay.example/api/v1/cmd/moderation.report.receive
-> 201 { "receiptId": "0192f3b0-1112-7000-8000-000000000002", "receipt": { "type": "classrup.moderation.reportreceipt/v1", "reportId": "0192f3b0-1111-7000-8000-000000000001", "statementDigest": "4c1d…", "relaySeq": 812, "relayReceivedAt": "2026-11-04T10:00:02Z", "sig": "…" } }
vault: 2xx recorded as transport_acknowledged, then the verified receipt as peer_accepted; relay: moderation.report.received opens case C and F12.S02.M01 calls moderation.report.link_case
later mailbox: classrup.moderation.reportlinked/v1 { reportId, caseRef: "C-0192f3b4" } -> linked; classrup.moderation.reportoutcome/v1 { outcome: "actioned" } -> resolved
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T05 | contract | PS-094-04.R01, PS-094-04.R02, PS-094-09.R02 | each command, statement and query executes; file a report with the network disabled | outputs, signed statements and the filed, received and dismissed events validate against registry schemas; each command declares vault, statement or relay mode; filed is written in the report transaction and nothing leaves the vault before the sync outbox runs |
| TEST-PS-094-09.T06 | integration | PS-094-04.R03, PS-094-03.R04 | case.opened then case.closed delivered twice on the relay | reports linked and resolved once; one reportlinked and one reportoutcome statement per reporter; the vault applies each once |
| TEST-PS-094-09.T18 | integration | PS-094-04.R04, PS-094-01.R02 | relay receives a valid report | relay copy stores the readable header and the sealed body; moderation.report.received is emitted in the receipt transaction with receiptId, subjectKey and snapshotId and without reporterKey or details; no moderation.report.filed exists on the relay; F12.S02.M01 opens one case |
| TEST-PS-094-09.T24 | chaos | PS-094-06.R02, PS-094-04.R02 | evidence blob write fails during file | no Report row, no outbox entry, no moderation.report.filed, MODERATION_EVIDENCE_FAILED returned |
| TEST-PS-094-09.T25 | integration | PS-094-04.R05 | case with three received reports (one minor_safety) closed no_action; same case.closed delivered twice | three moderation.report.dismissed events, the minor_safety one with exempt true, each carrying reporterKey only in the in-process payload; no duplicates on redelivery; no reporterKey in logs |
| TEST-PS-094-09.T26 | integration | PS-094-04.R06, PS-094-03.R04 | a second reporter's report arrives after case C is open and is merged by F12.S02.M01; moderation.case.opened redelivered | link_case called in the intake transaction; the second reporter's vault receives one reportlinked for C and reaches linked; the fallback consumer sends nothing twice |
| TEST-PS-094-09.T27 | contract | PS-094-04.R07, PS-094-01.R06, PS-094-03.R05, PS-094-02.R02 | hide author A and listing L2 of author B, file a report with hideLocally on L3, subscribe to a hide-mode advisory on L4; F06.S01.M02 and F06.S02.M03 contract fixtures call filterHidden and isHidden; unhide A; withdraw the L3 report; hide the local principal | items of A, L2, L3 and L4 dropped with by local_hide or advisory; after unhide the items of A return at the next call; L3 stays hidden after withdrawal; VALIDATION_FAILED for self; no index document removed and nothing leaves the vault |
| TEST-PS-094-09.T28 | integration | PS-094-04.R08, PS-094-02.R02 | report message M metadata-only, with a redacted disclosure (phone removed) and with an unredacted disclosure; then force K onto the redacted disclosure | header targetCid equals messageCid and the metadata carries the signed envelope without wrapped keys; no K in the first two; the third seals K and the relay records commitment verified; the forced case returns PRECONDITION_FAILED |
| TEST-PS-094-09.T30 | contract | PS-094-04.R09 | compare the reasonCode enum of the moderation.report.received schema with the F18.S02.M02 reports_received dimension fixture; a schema fixture that adds a thirteenth code within v1 | identical 12 values; the added code fails the contract check |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
