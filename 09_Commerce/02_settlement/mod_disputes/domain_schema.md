# PS-070-01 — Domain schema: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-01.R01** A DisputeCase stores contextRef {type, id}, opener, respondents, optional mediator, reason, evidence references, outcome, status, deadlines and revision, mirrored in each party's vault from signed statements.
- **PS-070-01.R02** Cases are P2 (parties and an explicitly accepted mediator), retained as RET-EVIDENCE, and never public or federated.
- **PS-070-01.R03** Outcome and money are decoupled by schema, because the outcome has no executable fields, only an optional advisory refund Money amount.

## Specification

### DisputeCase

Schema `classrup.commerce.dispute/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuid — deterministic from sha256 of contextRef plus opener did plus openedSeq so mirrors converge |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| contextRef | object — {type: deal\|payment_claim\|cycle\|booking\|rental, id: uuid} |
| openerId | did — party who opened |
| respondentIds | array — 1..19 dids |
| reason | enum — not_received \| not_as_described \| payment_not_acknowledged \| no_show \| damage \| other |
| description | string — 1..1000 code points plain text |
| evidence | array — up to 20 per party {id, authorId, kind: message\|attachment\|receipt\|claim\|statement\|note, refCid, sha256?, sizeBytes ≤ 10485760, caption ≤ 280} |
| mediator? | object — {did, relayId, acceptedBy: dids[], status: proposed\|active\|unavailable} |
| outcome? | object — {type: no_fault_close\|refund_claimed\|return_agreed\|enforcement_referral, proposedBy: did, advisoryRefund?: Money, note ≤ 500, acceptedBy: dids[], rejectedBy: dids[]} |
| round | int — outcome proposal round, 1..3 |
| respondentSilent | boolean — set when the 7-day response window passes without response |
| status | enum — opened \| evidence \| mediation \| outcome_proposed \| resolved \| withdrawn |
| resolution? | enum — no_fault_close \| refund_claimed \| return_agreed \| enforcement_referral \| lapsed |
| deadlines | object — {responseBy, evidenceBy, proposalBy, lapseAt} local clock |
| caseCid | string — sha256 of the opening statement |
| forkDetected | boolean — conflicting accepted outcomes seen |
| peerSync | object — per party sync state: local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |
| updatedAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- openerId is a party of the context and is not in respondentIds.
- At most one non-terminal case per (contextRef, openerId).
- resolution refund_claimed or return_agreed implies every party appears in outcome.acceptedBy.
- No field or event of this module triggers a payment, refund, freeze or release; advisoryRefund is informational.

### Storage DDL

```sql
CREATE TABLE commerce_dispute_case (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, context_type TEXT NOT NULL, context_id TEXT NOT NULL,
  opener_id TEXT NOT NULL, status TEXT NOT NULL, lapse_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_dispute_open ON commerce_dispute_case(vault_id, context_type, context_id, opener_id)
  WHERE status NOT IN ('resolved','withdrawn');
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T01 | unit | PS-070-01.R01, PS-070-01.R02, PS-070-02.R01 | open a case on a deal | case stored with deadlines, signed statement created, caseId deterministic |
| TEST-PS-070-09.T02 | unit | PS-070-01.R03, PS-070-02.R03 | inspect schema and propose refund_claimed with advisoryRefund | no executable field exists; advisory refund stored; no payment API called |
| TEST-PS-070-09.T13 | integration | PS-070-07.R02, PS-070-01.R02 | principal deletion completes during an open case | did pseudonymized, signatures flagged, evidence blobs crypto-shredded, counterparty copy untouched |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
