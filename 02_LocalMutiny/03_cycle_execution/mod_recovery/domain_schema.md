# PS-024-01 — Domain schema: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-01.R01** A HandoverAttestation is an immutable signed statement by a giver or receiver about one leg, with the kind, the items covered, a claimed time, an optional note up to 280 code points and up to 3 stripped evidence attachments.
- **PS-024-01.R02** A RecoveryCase is the local aggregate that tracks which legs were handed over or received, which options were proposed, accepted or completed, any linked dispute, and the per-leg disposition of remaining reservations.
- **PS-024-01.R03** Both records are P2, retained as RET-EVIDENCE, exchanged only as end-to-end encrypted signed envelopes to the cycle's participants, and verified by each vault before use.
- **PS-024-01.R04** Local receive time is the only time used for decisions, and claimed times are shown as claims.

## Specification

### HandoverAttestation

Schema `classrup.mutiny.handover_attestation/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| cycleId | uuidv7 — cycle the leg belongs to |
| legId | uuidv7 — TradeLeg id (F02.S01.M03) |
| kind | enum — handed_over \| received \| issue_reported \| returned \| return_confirmed |
| attestorId | did — signer; giver for handed_over and returned, receiver for received and issue_reported, original giver for return_confirmed |
| attestorRole | enum — giver \| receiver |
| items | array — 1..5 items {inventoryItemId uuidv7, quantity int 1..99} covered by the statement; must equal the leg lines unless issue_reported names a subset |
| issueCode? | enum — not_received \| not_as_described \| damaged \| other; required for issue_reported |
| note? | string — ≤ 280 code points, plain text |
| evidenceRefs | array — 0..3 attachment ids (F08.S01.M03, metadata stripped) |
| claimedAt | timestamp — signer's clock, a claim |
| receivedAtLocal | timestamp — local clock when verified, or creation time for own |
| direction | enum — own \| peer |
| cid | cid — sha256 of JCS(envelope minus sig) |
| sig | string — Ed25519 signature (base64url) per CTR-FED-001 FED-2; evidences the signer's assertion, not delivery |
| deviceKeyId | string — id of the registered device key used |
| status | enum — valid \| invalid |
| provenance? | object — {originRelay?, receivedAt, via[], verifiedAt} for peer statements |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- For one (legId, kind) among handed_over and received at most one valid attestation exists.
- handed_over and returned are signed only by the leg's giver, received and issue_reported only by the leg's receiver, and return_confirmed only by the original giver.
- An attestation is never modified or deleted; a mistake is addressed with a later attestation or a recovery option.
- Evidence attachments contain no GPS or other location metadata.

### RecoveryCase

Schema `classrup.mutiny.recovery_case/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| cycleId | uuidv7 — cycle concerned; may be in status cancelled for late-evidence cases |
| trigger | enum — participant_dropped \| execution_timeout \| issue_reported \| late_attestation |
| handedOverLegIds | array — 0..8 leg ids with a valid handed_over attestation |
| receivedLegIds | array — 0..8 leg ids with a valid received attestation |
| pendingLegIds | array — 0..8 leg ids with neither |
| options | array — 0..12 items {optionId, kind return_item\|compensation\|waive\|dispute, legId?, compensationLegId?, proposedBy did, proposalCid cid, status proposed\|accepted\|rejected\|completed} |
| dispositions | array — 0..8 items {legId, disposition converted\|released} decided when resolved |
| disputeCaseId? | uuidv7 — F09.S02.M02 case id when escalated |
| status | enum — open \| escalated \| resolved \| closed_unresolved |
| outcome? | enum — agreed \| dispute_outcome \| unresolved |
| openedAt | timestamp — local clock |
| deadlineAt | timestamp — openedAt + 14 d, after which the UI states that only a dispute or waiver remains |
| lastActivityAt | timestamp — local clock |
| closedAt? | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one non-terminal RecoveryCase exists per cycle.
- handedOverLegIds, receivedLegIds and pendingLegIds are disjoint or receivedLegIds is a subset of handedOverLegIds ∪ receivedLegIds, and their union covers all legs.
- status resolved implies every option with status accepted is completed or waived and every leg has a disposition.
- A closed case never reopens; a new problem opens a new case only if the cycle has none open.

### Storage DDL

```sql
CREATE TABLE mutiny_handover_attestation (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cycle_id TEXT NOT NULL, leg_id TEXT NOT NULL, kind TEXT NOT NULL,
  attestor_id TEXT NOT NULL, status TEXT NOT NULL, cid TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_attestation_leg_kind ON mutiny_handover_attestation(tenant_id, leg_id, kind) WHERE status = 'valid' AND kind IN ('handed_over','received');
CREATE UNIQUE INDEX mutiny_attestation_cid ON mutiny_handover_attestation(tenant_id, cid);
CREATE TABLE mutiny_recovery_case (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cycle_id TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_recovery_open ON mutiny_recovery_case(tenant_id, cycle_id) WHERE status IN ('open','escalated');
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T01 | integration | PS-024-01.R01, PS-024-03.R01, PS-024-04.R03 | 3-party cycle with all handed_over and received attestations delivered | each vault emits leg.received per leg and completed after the third receipt |
| TEST-PS-024-09.T02 | integration | PS-024-01.R04, PS-024-03.R01 | 2-party cycle; receiver attests without giver attestation | leg received and cycle completes; giver evidence not required |
| TEST-PS-024-09.T07 | integration | PS-024-03.R03, PS-024-01.R02 | return_item proposed by Alice, accepted by Bob, returned and return_confirmed attested | case resolved with dispositions released for returned legs |
| TEST-PS-024-09.T19 | e2e | PS-024-01.R03, PS-024-02.R02 | two mobile browsers perform hand-over attestations | statement of what a signature means shown; payment labels as text; axe zero serious issues |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
