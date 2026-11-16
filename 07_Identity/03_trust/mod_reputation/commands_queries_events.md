# PS-058-04 — Commands, queries and events: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-04.R01** post, withdraw and hide are vault commands; post produces the signed statement classrup.identity.review/v1 and withdraw produces classrup.federation.tombstone/v1; receive is the vault intake of someone else's review.
- **PS-058-04.R02** Completion events open review windows; they never create reviews by themselves.
- **PS-058-04.R03** Every command emits its events in the same local transaction as the state change.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.review.post` | identity.review.post | { contextType, contextId, subjectDid, rating, tags?, comment?, audience: subject_only\|public, targetRelays? } | { reviewId, cid, statement: classrup.identity.review/v1, syncState: local_committed } | VALIDATION_FAILED, IDENTITY_REVIEW_NOT_ELIGIBLE, IDENTITY_REVIEW_DUPLICATE, IDENTITY_REVIEW_WINDOW_CLOSED, IDENTITY_REVIEW_PROOF_INCOMPLETE, BLOCKED_PARTY, RATE_LIMITED | identity.review.posted | yes (Idempotency-Key) |
| `identity.review.receive` | identity.review.receive | { statement: classrup.identity.review/v1, provenance } | { reviewId, status: posted\|quarantined, quarantineReason? } | IDENTITY_REVIEW_SIGNATURE_INVALID, IDENTITY_REVIEW_PROOF_INCOMPLETE, IDENTITY_REVIEW_NOT_ELIGIBLE, IDENTITY_REVIEW_DUPLICATE, IDENTITY_REVIEW_WINDOW_CLOSED, BLOCKED_PARTY, RATE_LIMITED | identity.review.posted | yes (Idempotency-Key) |
| `identity.review.withdraw` | identity.review.withdraw | { reviewId, expectedRevision } | { reviewId, revision, tombstone: classrup.federation.tombstone/v1 } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.reputation.recomputed | yes (Idempotency-Key) |
| `identity.review.hide` | identity.review.hide_local | { reviewId, hidden: boolean, expectedRevision } | { reviewId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.reputation.recomputed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.reputation.get` | identity.reputation_summary.read | { subjectDid } | { summary: ReputationSummary, note: 'based on reviews seen by this device' } | NOT_FOUND |
| `identity.review.list_for_subject` | identity.review.read | { subjectDid, status?: posted\|hidden, cursor?, limit? (1..50) } | { items: Review[], nextCursor? } | NOT_FOUND |
| `identity.review.list_eligible` | identity.review_window.read_own | { cursor?, limit? (1..50) } | { items: [{ windowId, contextType, contextId, subjectDid, closesAt }], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.review.posted` | P1 | { reviewId, contextType, contextId, authorDid, subjectDid, rating, origin } |
| `identity.reputation.recomputed` | P1 | { subjectDid, reviewCount, bayesianAvg, effectiveWeight, algorithmVersion } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.deal.completed` | open a ReviewWindow for the deal with the eligible pair of the two parties when the local principal took part |
| `mutiny.cycle.completed` | open a ReviewWindow with leg-connected pairs involving the local principal |
| `services.booking.completed` | open a ReviewWindow for the client and provider pair |
| `rentals.rental.closed` | open a ReviewWindow for the owner and renter pair |
| `federation.tombstone.applied` | mark the targeted review withdrawn and recompute the subject summary |
| `privacy.deletion.completed` | vault erase - delete all reviews, windows and summaries |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_REVIEW_SIGNATURE_INVALID | 422 | no | review signature does not verify against the author DID |
| IDENTITY_REVIEW_PROOF_INCOMPLETE | 422 | no | completion proof lacks the signature of the author or the subject |
| IDENTITY_REVIEW_NOT_ELIGIBLE | 422 | no | author and subject are not an eligible pair of the completed context |
| IDENTITY_REVIEW_DUPLICATE | 409 | no | a review already exists for this context, author and subject |
| IDENTITY_REVIEW_WINDOW_CLOSED | 410 | no | the 30 day review window has closed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
event commerce.deal.completed (local) -> ReviewWindow { contextType: "deal", closesAt: "2026-12-04T10:00:00.000Z" }
vault command: identity.review.post { "contextType": "deal", "contextId": "0192f450-…", "subjectDid": "did:key:z6Mk…", "rating": 5, "tags": ["on_time", "as_described"], "comment": "Smooth handover.", "audience": "public" }
-> { "reviewId": "0192f451-…", "cid": "sha256-Qm…", "syncState": "local_committed" }
weight(review) = w_age * w_exp * w_repeat * w_recip * w_island, each in 0.1..1.0 except w_island in 0.25..1.0; bayesianAvg = (5 * 4.0 + sum(w * rating)) / (5 + sum(w))
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T01 | integration | PS-058-01.R02, PS-058-04.R03 | completion events for a deal, cycle, booking and rental | one ReviewWindow per context with the documented pairs and closesAt = opensAt plus 30 days |
| TEST-PS-058-09.T08 | contract | PS-058-04.R01, PS-058-04.R02, PS-058-09.R03 | commands, queries, events run | outputs, statements and payloads validate against registry schemas; tombstone verifies |
| TEST-PS-058-09.T13 | a11y | PS-058-01.R01, PS-058-04.R01 | review sheet and reputation card with axe-core and keyboard only | zero serious or critical issues; star group labelled; notices announced |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
