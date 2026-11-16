# PS-058-01 — Domain schema: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-01.R01** A Review stores the signed statement fields, the completion proof with both parties' signatures, provenance and a verification status, and is immutable after posting except for local hide and withdrawal.
- **PS-058-01.R02** A ReviewWindow stores the eligible pairs for a completed context for 30 days, keyed by the local completion event, and limits the number of pairs to 66.
- **PS-058-01.R03** A ReputationSummary is derived, versioned by algorithm, and fully recomputable from stored reviews, so it can be thrown away and rebuilt.

## Specification

### Review

Schema `classrup.identity.review/v1` · storage **relay+device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| contextType | enum — deal \| cycle \| booking \| rental |
| contextId | uuidv7 — id of the completed transaction context |
| completionCid | string — cid of the completion statement all parties signed |
| authorDid | did — reviewer |
| subjectDid | did — reviewed party; differs from authorDid |
| authorRole | string — role in the context, 1..24 characters, for example buyer or giver |
| rating | int — 1..5 |
| tags? | array — at most 3 of as_described, on_time, communicative, safe_meetup, fair_price, careless |
| comment? | string — 0..500 code points, plain text |
| proof | object — { completionClaimedAt, signatures: array of { did, sig } covering at least authorDid and subjectDid } |
| claimedPostedAt | timestamp — author's claim |
| firstSeenAt | timestamp — local clock when this vault first saw the review |
| origin | enum — own \| received |
| provenance? | object — { originRelay?, via, receivedAt, verifiedAt } |
| cid | string — sha256-base64url of JCS(review statement without sig) |
| sig | string — Ed25519 signature by the author's account signing key |
| syncState? | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted (own reviews) |
| status | enum — pending_verification \| posted \| hidden \| quarantined \| withdrawn |
| quarantineReason? | enum — signature_invalid \| proof_incomplete \| not_eligible \| outside_window \| schema_invalid \| duplicate |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one review per (contextType, contextId, authorDid, subjectDid).
- A posted review has a valid author signature and a proof signed by both authorDid and subjectDid over completionCid.
- authorDid and subjectDid are both parties of the completion's pair list.
- Rating, tags and comment are immutable after creation.

### ReputationSummary

Schema `classrup.identity.reputation_summary/v1` · storage **derived** · privacy **P1** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| subjectDid | did — subject of the summary, unique per vault |
| reviewCount | int — posted reviews seen, raw |
| positiveCount | int — rating 4 or 5 |
| negativeCount | int — rating 1 or 2 |
| effectiveWeight | number — sum of dampening weights |
| bayesianAvg | number — (5 times priorMean + weighted rating sum) divided by (5 + effectiveWeight), shown with one decimal |
| priorMean | number — 4.0 unless the vault has at least 50 reviews, then their mean limited to 3.5..4.5 |
| completedByType | object — { deal, cycle, booking, rental } counts of distinct verified completion contexts |
| sourceCount | int — distinct transports or relays the reviews came from |
| dampeningNotice | enum — none \| many_new_authors \| linked_authors \| island |
| algorithmVersion | string — for example rep-1 |
| computedAt | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- The summary is fully reproducible from the posted reviews and algorithmVersion.
- reviewCount counts raw posted reviews and is never reduced by dampening.
- bayesianAvg is between 1.0 and 5.0.

### ReviewWindow

Schema `classrup.identity.review_window/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| contextType | enum — deal \| cycle \| booking \| rental |
| contextId | uuidv7 — completed context |
| completionCid | string — cid of the completion statement |
| pairs | array — at most 66 eligible [authorDid, subjectDid] pairs, only those involving the local principal as author |
| opensAt | timestamp — local receipt time of the completion event |
| closesAt | timestamp — opensAt plus 30 days |
| status | enum — open \| closed |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- closesAt equals opensAt plus 2 592 000 000 ms.
- One window exists per (contextType, contextId).

### Storage DDL

```sql
CREATE TABLE identity_review (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, context_type TEXT NOT NULL, context_id TEXT NOT NULL,
  author_did TEXT NOT NULL, subject_did TEXT NOT NULL, cid TEXT NOT NULL, status TEXT NOT NULL,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_review_unique ON identity_review(tenant_id, context_type, context_id, author_did, subject_did);
CREATE UNIQUE INDEX identity_review_cid ON identity_review(tenant_id, cid);
CREATE INDEX identity_review_subject ON identity_review(tenant_id, subject_did, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T01 | integration | PS-058-01.R02, PS-058-04.R03 | completion events for a deal, cycle, booking and rental | one ReviewWindow per context with the documented pairs and closesAt = opensAt plus 30 days |
| TEST-PS-058-09.T02 | unit | PS-058-01.R01, PS-058-02.R01, PS-058-02.R02 | post a valid review | statement signed, stored posted, immutable fields unchanged, cid computed |
| TEST-PS-058-09.T05 | unit | PS-058-01.R03, PS-058-09.R02 | golden review set | reviewCount raw, effectiveWeight and bayesianAvg equal golden values within 1e-9; recompute twice gives identical results |
| TEST-PS-058-09.T13 | a11y | PS-058-01.R01, PS-058-04.R01 | review sheet and reputation card with axe-core and keyboard only | zero serious or critical issues; star group labelled; notices announced |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
