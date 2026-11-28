# PS-058-01 — Domain schema: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-01.R01** A Review stores the signed statement fields, an outcome label, the proof (the subject's review ticket for the pair, plus for subject-only reviews the full opening and outcome evidence), provenance and a verification status, and is immutable after posting except for local hide and withdrawal.
- **PS-058-01.R02** A ReviewWindow is created when a context the principal takes part in opens, holds the per-pair tickets exchanged then, opens for 30 days when an outcome event with the N3 fields arrives, and limits the number of pairs to 66.
- **PS-058-01.R03** A ReputationSummary is derived, versioned by algorithm, and fully recomputable from stored reviews and recorded no-show claims, so it can be thrown away and rebuilt.
- **PS-058-01.R04** Public reviews carry only a per-pair blinded reference and the per-pair ticket, never contextId, completionCid or a dispute case cid, so two public reviews from one cycle share no identifier.

## Specification

### Review

Schema `classrup.identity.review/v1` · storage **relay+device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| contextType | enum — deal \| cycle \| booking \| rental |
| pairRef | string — base64url SHA-256 of JCS({ contextCid, authorDid, subjectDid }); the only context reference in a public review |
| contextId? | uuidv7 — own records and subject_only reviews only |
| completionCid? | string — own records and subject_only reviews only; cid of the producer's completion statement |
| authorDid | did — reviewer |
| subjectDid | did — reviewed party; differs from authorDid |
| authorRole | string — role in the context, 1..24 characters, for example buyer or giver |
| outcome | enum — completed \| disputed \| cancelled; shown as a label |
| disputeFlag | boolean — true when outcome is disputed (dispute closed unresolved, FLOW-08) |
| disputeCaseCid? | string — own records and subject_only reviews only; cid of the F09.S02.M02 dispute case, or for a cycle recovery the first of the F02.S03.M04 reviewUnlock evidenceCids |
| audience | enum — subject_only \| public |
| rating | int — 1..5 |
| tags? | array — at most 3 of as_described, on_time, communicative, safe_meetup, fair_price, careless |
| comment? | string — 0..500 code points, plain text |
| proof | object — { ticket: classrup.identity.review_ticket/v1 signed by subjectDid naming authorDid as holder for pairRef, completionTicket?: the same schema with phase completion, openingEvidence?: { statementCid, subjectSig } in subject_only reviews only } |
| claimedPostedAt | timestamp — author's claim |
| firstSeenAt | timestamp — local clock when this vault first saw the review |
| origin | enum — own \| received |
| provenance? | object — { originRelay?, via, receivedAt, verifiedAt, notServedBy?: relay ids } |
| cid | string — per F11.S01.M03, sha256- plus base64url(SHA-256(JCS(envelope minus sig and cid))), computed by the StatementPublisherPort for own reviews |
| signerKey | string — ext.signerKey, a device key of the author not revoked in the author's latest verified document at receipt |
| sig | string — Ed25519 signature by signerKey over JCS(envelope minus sig) per F11.S01.M03; the envelope type classrup.identity.review/v1 separates it from other statement types |
| syncState? | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted (own reviews) |
| status | enum — pending_verification \| posted \| hidden \| quarantined \| withdrawn |
| quarantineReason? | enum — signature_invalid \| signer_revoked \| proof_incomplete \| not_eligible \| outside_window \| schema_invalid \| duplicate |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one review per (authorDid, pairRef).
- A posted review has a valid signature by a device key not revoked in the author's latest verified document at receipt, with no later-learned revocation effective at or before firstSeenAt, and a ticket signed by subjectDid that names authorDid as holder for pairRef.
- A public review contains no contextId, completionCid, disputeCaseCid or openingEvidence.
- Rating, tags, comment and outcome are immutable after creation.

### ReputationSummary

Schema `classrup.identity.reputation_summary/v1` · storage **derived** · privacy **P1** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| subjectDid | did — subject of the summary, unique per vault |
| reviewCount | int — posted reviews seen, raw |
| selectedReviewCount | int — reviews used for the average after input selection, at most 500 |
| authorDiversity | int — distinct authors among the selected reviews |
| positiveCount | int — rating 4 or 5 |
| negativeCount | int — rating 1 or 2 |
| outcomeCounts | object — { completed, disputed, cancelled } among posted reviews |
| effectiveWeight | number — sum of dampening weights of the selected reviews |
| bayesianAvg | number — (5 times priorMean + weighted rating sum) divided by (5 + effectiveWeight), shown with one decimal |
| priorMean | number — 4.0 unless the vault has at least 50 reviews, then their mean limited to 3.5..4.5 |
| completedByType | object — { deal, cycle, booking, rental } counts of distinct verified completed pair references |
| noShowClaims | int — comms.meetup.no_show claims recorded for the subject, displayed, weight 0 in rep-1 |
| contradictedNoShowClaims | int — claims among noShowClaims contradicted by the accused's check-in, displayed together with that check-in |
| noShowClaimRefs | array — at most 100 { meetupRefHash, reportedByDid, reportStatementCid, firstSeenAt, contradicted: boolean, checkinStatementCid? } kept as recompute input |
| sourceCount | int — distinct transports or relays the reviews came from, lowered by notServedBy entries |
| dampeningNotice | enum — none \| many_new_authors \| linked_authors \| island |
| algorithmVersion | string — for example rep-1 |
| computedAt | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- The summary is fully reproducible from the posted reviews, the recorded no-show claims and algorithmVersion.
- reviewCount counts raw posted reviews and is never reduced by dampening or selection.
- bayesianAvg is between 1.0 and 5.0, and no-show claims never change it in rep-1.

### ReviewWindow

Schema `classrup.identity.review_window/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| contextType | enum — deal \| cycle \| booking \| rental |
| contextId | uuidv7 — the transaction context |
| contextCid | string — cid of the bilateral opening statement (deal opening, cycle revision hash, booking or reservation confirmation) |
| completionCid? | string — set from the outcome event (N3) |
| outcome? | enum — completed \| disputed \| cancelled |
| disputeCaseCid? | string — set from the caseCid of commerce.dispute.resolved |
| recoveryEvidence? | object — { recoveryCaseId, evidenceCids } from mutiny.recovery.resolved reviewUnlock |
| parties | array — [{ did, role }] from the event payload (N3) |
| legs? | array — [{ legId, giverId, receiverId }] for cycles, giverId and receiverId being DIDs as in mutiny.cycle.completed and mutiny.recovery.resolved |
| completionProof? | object — { kind: deal_completion\|cycle_receipts\|booking_completion\|rental_completion\|return_attestation\|dispute_case\|recovery_evidence, statementCids: array, verifiedAt? } the statements this vault verified before opening |
| closeReason? | enum — completed \| deposit_unsettled; rentals only, from rentals.rental.closed |
| pairs | array — at most 66 eligible [authorDid, subjectDid] pairs where the local principal is the author |
| issuedTicketCids | array — tickets this principal signed for its counterparties |
| receivedTickets | array — { subjectDid, ticketCid, phase: opening\|completion } tickets naming the principal as holder |
| missingFields? | array — N3 fields absent from the outcome event, or completion statements and receipts not yet verified in this vault |
| opensAt? | timestamp — local receipt time of the outcome event |
| closesAt? | timestamp — opensAt plus 30 days |
| status | enum — pending \| open \| quarantined \| closed |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- closesAt equals opensAt plus 2 592 000 000 ms whenever the window has opened.
- One window exists per (contextType, contextId).
- For cycles, pairs and issued tickets cover only leg-connected counterparties.

### Storage DDL

```sql
CREATE TABLE identity_review (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, context_type TEXT NOT NULL, pair_ref TEXT NOT NULL,
  author_did TEXT NOT NULL, subject_did TEXT NOT NULL, cid TEXT NOT NULL, status TEXT NOT NULL,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_review_unique ON identity_review(tenant_id, author_did, pair_ref);
CREATE UNIQUE INDEX identity_review_cid ON identity_review(tenant_id, cid);
CREATE INDEX identity_review_subject ON identity_review(tenant_id, subject_did, status);
CREATE TABLE identity_review_window (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, context_type TEXT NOT NULL, context_id TEXT NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_review_window_ctx ON identity_review_window(tenant_id, context_type, context_id);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T01 | integration | PS-058-01.R02, PS-058-04.R02 | opening events then completion events for a deal, a cycle, a booking and a rental | pending windows with tickets exchanged for eligible pairs, then open windows with the documented pairs and closesAt = opensAt plus 30 days |
| TEST-PS-058-09.T02 | unit | PS-058-01.R01, PS-058-02.R01 | post a valid review | statement signed by an active device key, stored posted, immutable fields unchanged, outcome label set, cid computed |
| TEST-PS-058-09.T05 | unit | PS-058-01.R03, PS-058-09.R02 | golden review set with no-show claims | reviewCount raw, selection, effectiveWeight and bayesianAvg equal golden values within 1e-9; no-show claims leave the average unchanged; recompute twice gives identical results |
| TEST-PS-058-09.T18 | abuse | PS-058-01.R04, PS-058-09.R04 | two public reviews from one 4-party cycle (A about B, C about D) and one subject_only review | the public ones share no identifier (different pairRef, no contextId or completionCid); the subject_only one carries the full ids encrypted to its subject |
| TEST-PS-058-09.T30 | integration | PS-058-04.R02, PS-058-01.R02 | mutiny.cycle.completed with receiptCids for all legs; mutiny.recovery.resolved with outcome unresolved, with dispute_outcome and with agreed for another cycle | the completed cycle opens leg-connected windows with the receipts as proof; unresolved and dispute_outcome give outcome disputed with disputeFlag and the evidenceCids recorded; agreed gives outcome cancelled; non-adjacent pairs get no window |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
