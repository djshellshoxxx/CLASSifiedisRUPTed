# PS-094-01 — Domain schema: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-01.R01** A Report stores reporter key, relay target, content target (id, content id and revision seen), subject key, reason code, optional details, evidence snapshot reference, disclosure mode, sync state and status, with tenant and revision per CTR-ID-001.
- **PS-094-01.R02** The report statement sent to a relay is P2 between the reporter and that relay's moderation role: a signed header the relay reads (reportId, relayId, reporterKey, subjectKey, targetType, targetId, targetCid, reasonCode) drives dedupe, caps and case linking, only the details and evidence body are sealed to the relay's moderation key, local-only fields stay P3 in the vault, and the relay copy is retained under RET-EVIDENCE per relay policy.
- **PS-094-01.R03** A report is immutable after filing except for sync state, status, case reference and outcome; details cannot be edited, only withdrawn and refiled.
- **PS-094-01.R04** An AdvisorySubscription stores a publisher key, mode and last verified sequence, is P3 and local to the vault, and changes only through the subscription commands.
- **PS-094-01.R05** Advisory labels are applied only from verified advisories that are unexpired and unretracted; a verified retraction from the same publisher or the advisory's expiresAt removes the label without touching local records.
- **PS-094-01.R06** A LocalHide row stores exactly one of targetRef { type, id, cid? } or authorDid, an optional reportId when it came from filing, and the creation time; it is P3, device-only, never synced or sent, and exists until the user unhides it or deletes their vault.

## Specification

### Report

Schema `classrup.moderation.report/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key (reportId), generated in the vault; header field |
| tenantId | uuidv7 — relay hosting scope the report is addressed to (the vault's own scope locally) |
| reporterKey | did:key — pseudonymous principal that signs the header; P2 to the addressed relay's moderation role only |
| relayId | string — did:key of the user-selected destination relay; signed header field bound to the receiving relay |
| moderationKeyId | string — id of the relay moderation key the body is sealed to |
| subjectKey | did:key — author or sender key of the target envelope; header field |
| targetType | enum — listing \| auction \| message \| profile \| review \| bid \| offer \| attachment \| cycle_proposal |
| targetId | uuidv7 — id of the reported content |
| targetCid | string — content id (sha256-…) of the signed author envelope held by the reporter; for targetType message the F08.S01.M01 messageCid of the exact signed envelope |
| targetRevision | int — revision of the target at report time |
| reasonCode | enum — spam \| scam_fraud \| prohibited_item \| harassment \| hate \| sexual_content \| violence \| counterfeit \| privacy_leak \| impersonation \| minor_safety \| other |
| details? | string — plain text, 0..1000 code points, sealed body |
| evidenceSnapshotId | uuidv7 — ref F12.S01.M02 EvidenceSnapshot in the storing store |
| snapshotHash | string — contentHash of the snapshot as sent, 64 hex |
| disclosure | enum — public_target \| metadata_only \| participant_disclosure \| reporter_claim |
| statementDigest | string — SHA-256 hex of the JCS bytes of the signed statement; dedupe and receipt binding |
| syncState | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted (vault copy only) |
| relayReceivedAt? | timestamp — relay receive time from the receipt (relay-clock claim) |
| receiptId? | uuidv7 — id of the relay-signed classrup.moderation.reportreceipt/v1 |
| caseRef? | string — relay case reference from the verified reportlinked statement |
| status | enum — filed \| linked \| resolved \| withdrawn |
| outcome? | enum — actioned \| no_action \| duplicate \| content_removed_by_owner |
| hideLocally | boolean — local-only P3 choice, never sent; true writes a LocalHide row for the target in the file transaction |
| messageKeyDisclosed | boolean — true only for a message participant_disclosure whose approved redact/1 preview removed nothing; the sealed body then carries the 32-byte message key K read from F08.S01.M01 so the reviewer can recompute the key commitment and check Dec(K, C) = P; false for metadata_only, reporter_claim and redacted disclosures |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local device clock (a claim, not evidence) |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one report with status filed or linked per (reporterKey, relayId, targetType, targetId, reasonCode).
- syncState transport_acknowledged implies a relay transport acknowledgement was recorded; peer_accepted implies a verified relay-signed receipt bound to id and statementDigest is stored.
- status linked implies caseRef is set; a report always has an evidenceSnapshotId and a snapshotHash.
- disclosure participant_disclosure implies the referenced snapshot reached export prepared in F12.S01.M02; disclosure reporter_claim implies targetType message.
- messageKeyDisclosed true implies targetType message, disclosure participant_disclosure and a snapshot whose redaction counts are all 0 and whose commitmentStatus is verified (F12.S01.M02).

### AdvisorySubscription

Schema `classrup.moderation.advisorysubscription/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| publisherKey | did:key — signer of advisory and retraction statements |
| mode | enum — label \| hide \| ignore |
| lastSeq | int — highest verified advisory sequence number (CTR-FED-001 FED-3) |
| publisherStatus | enum — active \| revoked \| unreachable |
| activeAdvisories | object[] — derived label index { advisoryCid, seq, targetCid, ruleRef, label, expiresAt? }, at most 10 000, rebuilt from verified statements |
| createdAt | timestamp — RFC 3339 UTC |

**Invariants**
- Advisory items are applied only if their signature verifies against publisherKey and the key is not revoked in the vault's key registry.
- An advisory never deletes local records; mode hide only filters views and can be undone.
- activeAdvisories never contains an advisory whose expiresAt has passed or that a verified retraction of the same publisher references.

**Note:** LocalHide (vault-local table, not a catalog entity; P3, storage device, RET-STANDARD; fields classified per F10.S02.M02): id uuidv7, tenantId, targetType? and targetId? and targetCid? (the targetRef), authorDid? (did:key), reportId? (uuidv7, set when created by moderation.report.file with hideLocally true), createdAt; unique per (tenantId, targetType, targetId) and per (tenantId, authorDid). LocalHidePort.isHidden and filterHidden read it together with the hide-mode advisory index of AdvisorySubscription.

### Storage DDL

```sql
CREATE TABLE moderation_report (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, reporter_key TEXT NOT NULL, relay_id TEXT NOT NULL,
  subject_key TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason_code TEXT NOT NULL,
  statement_digest TEXT NOT NULL, sync_state TEXT, status TEXT NOT NULL, case_ref TEXT, revision INTEGER NOT NULL,
  created_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_report_open ON moderation_report(reporter_key, relay_id, target_type, target_id, reason_code)
  WHERE status IN ('filed','linked');
CREATE INDEX moderation_report_target ON moderation_report(tenant_id, target_type, target_id, status);
CREATE INDEX moderation_report_case ON moderation_report(tenant_id, case_ref);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T01 | unit | PS-094-01.R01, PS-094-01.R03 | file a valid scam report in the vault, then try to edit details | Report stored with syncState local_committed, subjectKey from the envelope, snapshot reference and hash set; details edit refused with CONFLICT_STATE |
| TEST-PS-094-09.T12 | unit | PS-094-01.R04, PS-094-01.R05 | subscribe to an advisory feed, publisher retracts one advisory, another reaches expiresAt, then publisher key revoked | labels applied, retracted and expired labels removed, all labels dropped after verified revocation; no local record deleted |
| TEST-PS-094-09.T18 | integration | PS-094-04.R04, PS-094-01.R02 | relay receives a valid report | relay copy stores the readable header and the sealed body; moderation.report.received is emitted in the receipt transaction with receiptId, subjectKey and snapshotId and without reporterKey or details; no moderation.report.filed exists on the relay; F12.S02.M01 opens one case |
| TEST-PS-094-09.T27 | contract | PS-094-04.R07, PS-094-01.R06, PS-094-03.R05, PS-094-02.R02 | hide author A and listing L2 of author B, file a report with hideLocally on L3, subscribe to a hide-mode advisory on L4; F06.S01.M02 and F06.S02.M03 contract fixtures call filterHidden and isHidden; unhide A; withdraw the L3 report; hide the local principal | items of A, L2, L3 and L4 dropped with by local_hide or advisory; after unhide the items of A return at the next call; L3 stays hidden after withdrawal; VALIDATION_FAILED for self; no index document removed and nothing leaves the vault |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
