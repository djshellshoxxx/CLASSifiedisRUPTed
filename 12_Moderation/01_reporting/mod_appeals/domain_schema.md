# PS-092-01 — Domain schema: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-01.R01** An Appeal stores the contested action reference, appellant key, statement, optional attachments, reviewer key (relay copy only), status with moot reason, outcome with reasons, rule IDs, typed reduced outcome and sync state, with tenant and revision per CTR-ID-001.
- **PS-092-01.R02** Appeals are P2 between appellant and the relay's moderators and retained under RET-EVIDENCE with the action they contest.
- **PS-092-01.R03** An appeal is immutable after filing except for assignment, status and decision fields written by the relay and verified by the vault.
- **PS-092-01.R04** The reduced outcome is typed as reducedTo { kind, expiresAt?, restrictedCapabilities? } and is never more severe, longer or broader than the contested action.

## Specification

### Appeal

Schema `classrup.moderation.appeal/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key (appealId) generated in the appellant vault |
| tenantId | uuidv7 — relay hosting scope that issued the action |
| relayId | string — did:key of the relay the appeal is addressed to; signed field bound to the receiving relay |
| actionId | uuidv7 — ref F12.S02.M01 EnforcementAction on that relay |
| appellantKey | did:key — signer of the appeal statement; must equal the action subject key |
| statement | string — plain text, 20..2000 code points |
| attachmentHashes | string[] — up to 3 files, each ≤ 5 MiB, SHA-256 hex |
| reasonsStatementCid | string — content id of the relay-signed statement of reasons being appealed |
| reasonsIssuedAt | timestamp — relay-signed time of the statement of reasons (relay clock evidence) |
| deadlineAt | timestamp — reasonsIssuedAt + 30 days, compared with relayReceivedAt |
| statementDigest | string — SHA-256 hex of the JCS bytes of the signed appeal statement; dedupe and receipt binding |
| relayReceivedAt? | timestamp — relay receive time of the first delivery (relay clock; decides the window) |
| receiptId? | uuidv7 — id of the relay-signed classrup.moderation.appealreceipt/v1 |
| status | enum — filed \| awaiting_reviewer \| in_review \| decided \| withdrawn \| moot |
| mootReason? | enum — action_reverted \| action_expired |
| reviewerKey? | did:key — assigned relay moderator; relay copy only, never in the vault copy or in any statement |
| reassignCount | int — 0..10, number of reassignments |
| outcome? | enum — upheld \| overturned \| reduced \| moot |
| reducedTo? | object — { kind: warn\|remove_from_index\|restrict_feature\|suspend_relay_access, expiresAt?: timestamp, restrictedCapabilities?: string[] } when outcome reduced |
| decisionReasons? | string — 50..2000 code points shown to the appellant |
| decisionRuleIds? | string[] — policy rule IDs with versions, ≥ 1 when decided |
| decisionStatementCid? | string — content id of the relay-signed decision statement |
| mootNoticeCid? | string — content id of the relay-signed moot notice |
| syncState | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted (vault copy only) |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, appellant device clock (a claim, never used for the window) |

**Invariants**
- At most one appeal exists per (tenantId, actionId).
- The reviewer's principal (all keys linked through F07.S02.M01 and the relay moderator registry) differs from the decider's principal, the proposer's principal of a host-policy action (F12.S02.M01 proposerKey), the subject's principal and the principal of every reporter of a report linked to the action's case.
- status decided implies outcome is upheld, overturned or reduced and decisionReasons, decisionRuleIds and decisionStatementCid are set and the relay signature verified; status moot implies outcome moot, mootReason and mootNoticeCid are set and no decisionRuleIds exist.
- outcome reduced implies reducedTo is set, its kind is no more severe, its expiresAt no later and its restrictedCapabilities a subset of the contested action's.
- reviewerKey never appears in the vault copy, in a statement to the appellant or in an event payload.

### Storage DDL

```sql
CREATE TABLE moderation_appeal (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, action_id TEXT NOT NULL, appellant_key TEXT NOT NULL,
  statement_digest TEXT NOT NULL, status TEXT NOT NULL, reviewer_key TEXT, deadline_at TEXT NOT NULL, relay_received_at TEXT,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_appeal_action ON moderation_appeal(tenant_id, action_id);
CREATE INDEX moderation_appeal_queue ON moderation_appeal(tenant_id, status, deadline_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T01 | unit | PS-092-01.R01, PS-092-01.R03 | file a valid appeal, then try to change its statement | Appeal stored with deadlineAt = reasonsIssuedAt + 30 days, statementDigest and status filed; statement change refused with CONFLICT_STATE |
| TEST-PS-092-09.T15 | e2e | PS-092-01.R02, PS-092-04.R01 | mobile appellant files offline and reconnects | appeal reaches the relay, timeline shows honest states, axe zero serious issues |
| TEST-PS-092-09.T20 | unit | PS-092-01.R04 | decide reduced with a more severe kind, a later expiry, an extra capability, and a valid warn | VALIDATION_FAILED three times; valid reduced stored with typed reducedTo |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
