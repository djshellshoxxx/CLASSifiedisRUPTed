# PS-070-01 — Domain schema: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-01.R01** A DisputeCase stores contextRef {type, id}, opener, respondents, optional mediator, reason, evidence references, outcome, status, deadlines and revision, mirrored in each party's vault from signed statements.
- **PS-070-01.R02** Cases are P2 (parties and an explicitly accepted mediator), retained as RET-EVIDENCE, and never public or federated.
- **PS-070-01.R03** Outcome and money are decoupled by schema, because the outcome has no executable fields, only advisory ones - an optional advisory refund Money amount and an advisory disposition {kind, favouredDid, agreedAmount}.
- **PS-070-01.R04** Attachment evidence is an F15.S02.M03 MediaBlob ref (blob:sha256-<base64url>, at most 5 MiB) whose bytes were stripped of EXIF, XMP, IPTC and GPS metadata by F10.S02.M03 before encryption; the case stores only refs, hashes, sizes and captions.
- **PS-070-01.R05** A mediator record embeds the relay-signed directory entry {mediatorDid, relayId, policyUrl, validUntil} when one exists and its trust (relay_verified or self_declared), plus the set of parties that signed acceptance.
- **PS-070-01.R06** The case stores the parties [{did, role}] and contextCid returned by DisputeContextPort.resolve when it was opened, so every mirror derives the same respondents.

## Specification

### DisputeCase

Schema `classrup.commerce.dispute/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuid — deterministic from sha256 of contextRef plus opener did plus openedSeq so mirrors converge |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| contextRef | object — {type: a DisputeContextPort-registered type - deal {id dealId} \| payment_claim {id claimId} \| cycle {id cycleId} \| booking {id bookingId} \| rental_deposit {id depositId, resolved by F05.S01.M02} \| rental_damage {id damage claimId, resolved by F05.S02.M03}, id: uuid}; carried unchanged in every dispute statement and event |
| contextCid | string — cid of the signed context statement returned by DisputeContextPort.resolve |
| parties | array — [{did, role}] returned by DisputeContextPort.resolve; opener plus respondents, 2..20 |
| openerId | did — party who opened |
| respondentIds | array — 1..19 dids |
| reason | enum — not_received \| not_as_described \| payment_not_acknowledged \| no_show \| damage \| other |
| serviceScope? | object — {scope, scopeKey (1..200 chars), milestoneId?: uuid}; only for contextRef type booking, supplied by F03.S02.M03 and signed into classrup.commerce.dispute/v1 |
| idempotencyRef? | string — caller reference (F03.S02.M03 linkId); a repeated open with the same value returns the existing case |
| description | string — 1..1000 code points plain text |
| evidence | array — up to 20 per party {id, authorId, kind: message\|attachment\|receipt\|claim\|statement\|note, refCid (blob:sha256-<base64url> for attachments), sha256?, sizeBytes ≤ 5242880, stripped: boolean, caption ≤ 280, sharedWithMediator: boolean} |
| mediator? | object — {did, relayId, directoryEntry?: {mediatorDid, relayId, policyUrl, validUntil, relaySig}, trust: relay_verified\|self_declared, acceptedBy: dids[], status: proposed\|active\|unavailable} |
| outcome? | object — {type: no_fault_close\|refund_claimed\|return_agreed\|enforcement_referral, proposedBy: did, advisoryRefund?: Money, disposition?: {kind: continue\|settled\|cancelled\|waived, favouredDid?, agreedAmount?: Money}, note ≤ 500, acceptedBy: dids[], rejectedBy: dids[], outcomeCid} |
| round | int — outcome proposal round, 1..3 |
| noResponseReceivedHere | boolean — set when the 7-day response window passes without any respondent statement received in this vault (stored statements from blocked parties count as received) |
| hiddenFromBlocked | int — number of stored statements from parties this vault has blocked |
| status | enum — opened \| evidence \| mediation \| outcome_proposed \| resolved \| withdrawn |
| resolution? | enum — no_fault_close \| refund_claimed \| return_agreed \| enforcement_referral \| lapsed (the FLOW-08 closed-unresolved outcome after 30 days of inactivity) |
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
- No field or event of this module triggers a payment, refund, freeze or release; advisoryRefund and disposition are informational.
- mediator.status active implies mediator.acceptedBy equals the full party set.
- A resolution decided by a mediator alone implies mediator.trust relay_verified.

### Storage DDL

```sql
CREATE TABLE commerce_dispute_case (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, context_type TEXT NOT NULL, context_id TEXT NOT NULL,
  opener_id TEXT NOT NULL, status TEXT NOT NULL, lapse_at TEXT NOT NULL, idempotency_ref TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_dispute_open ON commerce_dispute_case(vault_id, context_type, context_id, opener_id)
  WHERE status NOT IN ('resolved','withdrawn');
CREATE UNIQUE INDEX commerce_dispute_idem ON commerce_dispute_case(vault_id, idempotency_ref) WHERE idempotency_ref IS NOT NULL;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T01 | unit | PS-070-01.R01, PS-070-01.R02, PS-070-02.R01 | open a case on a deal | case stored with deadlines and parties from DisputeContextPort, signed statement created, caseId deterministic |
| TEST-PS-070-09.T02 | unit | PS-070-01.R03, PS-070-02.R03 | inspect schema and propose refund_claimed with advisoryRefund and a settled disposition | no executable field exists; advisory refund and disposition stored; no payment API called |
| TEST-PS-070-09.T13 | integration | PS-070-01.R02 | principal deletion completes during an open case | did pseudonymized, signatures flagged, the deleted user's evidence blobs crypto-shredded, counterparty copy untouched |
| TEST-PS-070-09.T18 | integration | PS-070-03.R05, PS-070-01.R05 | 3-party cycle case; A selects mediator M and B accepts; then C accepts | M stays proposed and receives nothing after A and B; becomes active only when acceptedBy equals {A, B, C} |
| TEST-PS-070-09.T19 | abuse | PS-070-05.R04, PS-070-01.R05 | B selects a mediator did with no directory entry, then one with an entry signed by a different relay key, and that mediator proposes no_fault_close | both labelled self_declared; the mediator-only outcome is refused with COMMERCE_DISPUTE_MEDIATOR_UNVERIFIED; the same outcome resolves only after every party accepts |
| TEST-PS-070-09.T20 | abuse | PS-070-07.R05, PS-070-01.R04 | A attaches a JPEG with GPS EXIF tags and shares it with active mediator M | B and M receive a MediaBlob of at most 5 MiB with no EXIF, XMP or GPS data; an attachment whose stripping failed is refused |
| TEST-PS-070-09.T23 | contract | PS-070-04.R05, PS-070-01.R03 | resolve one case per consumer context type with and without a disposition | resolved payload carries the advisory disposition when present; for deal and payment_claim the default mapping applies when absent; no consumer command that moves money is invoked |
| TEST-PS-070-09.T24 | unit | PS-070-02.R04, PS-070-01.R06 | open cases for each registered type and for an unregistered type | registered types store parties and contextCid from their resolver; unregistered returns COMMERCE_DISPUTE_CONTEXT_INVALID |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
