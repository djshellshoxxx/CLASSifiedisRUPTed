# PS-101-04 — Commands, queries and events: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-04.R01** The module exposes a manual record command and three queries; automated ingestion happens through event consumers.
- **PS-101-04.R02** Every recorded signal emits moderation.signal.recorded in the same transaction as the row.
- **PS-101-04.R03** The consumed event table below is fixed per rulesVersion (signals/3), and every mapping names its subject, source key and evidence fields from the producer's payload.
- **PS-101-04.R04** Report outcomes map to relay signals: an applied action records report_actioned by kind, a revert other than expiry records a compensation, and moderation.report.dismissed records report_dismissed_bad_faith only when one reporter key reaches 5 non-exempt dismissals in 30 days.
- **PS-101-04.R05** The in-process summarize read exposes per-kind counts in a window for F12.S03.M01 scoring, and the moderation.signal.recorded event of kind report_dismissed_bad_faith is what F12.S03.M03 uses to select the reduced report class for 30 days.
- **PS-101-04.R06** SignalPort.record is the in-process relay port (command moderation.signal.record_module) through which relay-local modules record signals of the module table without a catalog event: proximity_pattern from F06.S02.M03, weight 10, half-life 7 days, against the caller's did:key; it deduplicates on (kind, sourceRef) and emits moderation.signal.recorded like any other signal.
- **PS-101-04.R07** Claims that the other party has not answered carry no weight: rentals.damage.claimed and a comms.meetup.no_show with contradicted true record nothing, rentals.damage.resolved records damage_agreed only for outcomes accepted, counter_accepted, refund_claimed or return_agreed (F05.S02.M03 applies no automatic penalty), and comms.meetup.no_show_contradicted records a compensation of the weighed no_show signal.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.signal.record_manual` | moderation.signal.record_manual | { subjectKey, kind: manual_concern\|manual_positive\|compensation, weight, halfLifeDays?, reason, supersedesSignalId? } | { signalId, expiresAt } | VALIDATION_FAILED, NOT_FOUND, MODERATION_SIGNAL_MANUAL_CAP, FORBIDDEN | moderation.signal.recorded | yes (Idempotency-Key) |
| `moderation.signal.record_module` | moderation.signal.record_module | { kind: proximity_pattern, subjectKey: did:key of the caller principal of the relay access token or signed request, sourceModule, sourceRef (unique per detection), evidenceRef? (pattern id, never cells) } | { signalId, expiresAt, duplicate: boolean } | VALIDATION_FAILED, FORBIDDEN | moderation.signal.recorded | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.signal.list_for_subject` | moderation.signal.read_as_reviewer | { subjectKey, since?, kind?, cursor?, limit ≤ 100 } | { items: Signal[] with decayedWeight and countsForScoring, nextCursor? } |  |
| `moderation.signal.summarize` | moderation.signal.read_summary | { subjectKey, asOf?, kinds?: kind[], windowDays?: 1..365 } | { totalDecayedWeight, byKind: { kind: { count, decayedWeight } }, sourceCapped: int, computedAt } |  |
| `moderation.signal.categories_own` | moderation.signal.read_categories | { subjectKey, windowDays ≤ 90 } | { byKind: { kind: count } } for the local vault, or for the caller's own key on a relay |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.signal.recorded` | P2 | { signalId, subjectKey, kind, weight, halfLifeDays, sourceModule, sourceEventId?, observedAt } — store-local (EVT-8); never sourceKey |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.spam.detected` | record spam_detected against payload subjectKey, weight 5 per full 10 score points above 50, half-life 14 days, evidenceRef targetCid |
| `auctions.shill.suspected` | host relay: record shill_suspected against subjectId, weight 40, half-life 90 days, evidenceRef checkId |
| `auctions.result.voided` | host relay (N22): record auction_voided against each key in the host-only subjectKeys of the host-local event (seller for seller_fraud and listing_prohibited, confirmed bidders for shill_bidding and bidder_collusion, nobody for technical_error), weight 25, half-life 90 days, evidenceRef voidCid; never against parties named elsewhere in the payload; vault-derived events without subjectKeys record nothing |
| `commerce.dispute.opened` | vault: record dispute_opened against each respondentIds entry, sourceKey openerId, weight 10, half-life 60 days, evidenceRef caseId |
| `commerce.dispute.resolved` | vault: resolution refund_claimed or return_agreed (accepted by every party in F09.S02.M02) records refund_agreed, weight 10, half-life 60 days, against the subjects of this store's dispute_opened signals with evidenceRef caseId; no_fault_close records compensations of those signals; lapsed and enforcement_referral change nothing |
| `commerce.dispute.withdrawn` | vault: record compensations of the dispute_opened signals with evidenceRef caseId |
| `commerce.payment.disputed` | vault: record payment_claim_disputed against payerId, sourceKey payeeId, weight 15, half-life 60 days |
| `commerce.payment.expired` | vault: record payment_claim_expired against payerId, weight 6, half-life 30 days, no sourceKey |
| `commerce.deal.completed` | vault: when completionCid is set, record deal_completed, weight -4, half-life 120 days, for each did in parties[] (N3) other than the local principal, evidenceRef dealId |
| `comms.meetup.no_show` | vault: contradicted false records no_show against targetDid, sourceKey reportedByDid, weight 10, half-life 60 days, evidenceRef reportStatementCid; contradicted true records nothing (a contradicted claim carries no weight) |
| `comms.meetup.no_show_contradicted` | vault: record a compensation of the no_show signal with evidenceRef reportStatementCid for targetDid (weight −10, sourceEventId the corrected signal id); nothing when no such signal exists |
| `mutiny.cycle.participant_dropped` | vault: record cycle_dropout against participantId when afterConsent is true, weight 12, half-life 60 days |
| `rentals.damage.resolved` | vault: outcome accepted, counter_accepted, refund_claimed or return_agreed records damage_agreed against renterId, sourceKey ownerId, weight 8, half-life 90 days, evidenceRef claimId; outcomes withdrawn and dispute_unresolved record nothing; rentals.damage.claimed (an unanswered owner assertion) is not consumed |
| `moderation.action.applied` | relay origin only: record report_actioned against subjectKey with weight warn 10, remove_from_index 15, restrict_feature 20, suspend_relay_access 40, half-life 180 days, evidenceRef actionId; caseSource auction_review (host-policy auction void records) records nothing because auctions.result.voided carries that weight (N22) |
| `moderation.action.reverted` | relay origin only: reasons appeal_overturned, appeal_reduced, moderator_decision and error_correction record a compensation of the report_actioned signal with evidenceRef actionId when one exists; reason expired changes nothing |
| `moderation.report.dismissed` | relay only: exempt false records report_dismissed (weight 0, half-life 7 days) against reporterKey with evidenceRef reportId; when that key then holds 5 report_dismissed signals observed in 30 days and no report_dismissed_bad_faith in that window, also record report_dismissed_bad_faith (weight 15, half-life 7 days); exempt true records nothing |
| `privacy.deletion.completed` | vault: only the local principal's own completed deletion removes this vault's signals, through the DeletionPort; relay: signals whose subjectKey or sourceKey is the deleted principal get the payload pseudonym when the relay applies the signed deletion request; a counterparty's deletion or tombstone never removes signals in another vault |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_SIGNAL_DUPLICATE_SOURCE | 409 | no | a signal for this source event already exists; ingestion is a no-op |
| MODERATION_SIGNAL_MANUAL_CAP | 422 | no | manual signals for this subject exceed the 30-day cap |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Module table signals/3 for SignalPort.record: proximity_pattern (F06.S02.M03, relay only, weight 10, half-life 7 days, subject the caller's did:key, evidenceRef the detector's pattern id). Producers call the port and depend on this module; this module does not depend on them. Privacy ports (N6): ExportSectionPort (section moderation.signals, vault only), DeletionPort and RetentionPurgePort (RET-SIGNAL: until expiresAt, at most 365 days, counts-only rollup 365 days) are registered with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
vault command moderation.signal.record_manual (local, Idempotency-Key 0192f3e0-0000-7000-8000-000000000f01)
{ "subjectKey": "did:key:z6MkCounterpartyExample", "kind": "manual_concern", "weight": 8, "reason": "Asked to move the payment outside the app twice." }
-> { "signalId": "0192f3e0-7777-7000-8000-000000000007", "expiresAt": "2027-01-23T10:00:00Z" }
consumed comms.meetup.no_show { "targetDid": "did:key:z6MkCounterpartyExample", "reportedByDid": "did:key:z6MkMe" } -> Signal { kind: "no_show", weight: 10, sourceKey: "did:key:z6MkMe" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T04 | contract | PS-101-04.R03, PS-101-06.R01, PS-101-09.R03 | each consumed event delivered twice with the producer's documented payload fixture | exactly one signal per source event with the documented kind, weight, half-life, subject field and sourceKey field |
| TEST-PS-101-09.T05 | contract | PS-101-04.R01, PS-101-04.R02, PS-101-09.R02 | command, queries and event | validate against registry schemas; signal.recorded emitted in the row transaction without sourceKey |
| TEST-PS-101-09.T15 | integration | PS-101-04.R04 | on relay X: action.applied remove_from_index, then reverted appeal_overturned; another applied then expired; 5 non-exempt report.dismissed for reporter R in 30 days and 1 exempt | report_actioned 15 then compensation; expired one kept; report_dismissed_bad_faith recorded once at the 5th dismissal; exempt dismissal records nothing |
| TEST-PS-101-09.T16 | contract | PS-101-04.R05 | F12.S03.M01 calls summarize with kinds and windowDays; the 5th dismissal's moderation.signal.recorded is delivered to the F12.S03.M03 contract fixture | byKind counts for the window returned, report_dismissed_bad_faith count 1 within 30 days and 0 after 31 days; F12.S03.M03 writes one reduced marker for the reporter key |
| TEST-PS-101-09.T20 | contract | PS-101-04.R06, PS-101-02.R04 | F06.S02.M03 contract fixture calls SignalPort.record with proximity_pattern for a token caller twice with one sourceRef, for an anonymous caller without did:key, with an unregistered kind, with a cell in evidenceRef, and over HTTP | one signal weight 10 half-life 7 days and duplicate true on the repeat, moderation.signal.recorded once; VALIDATION_FAILED three times; no route |
| TEST-PS-101-09.T21 | integration | PS-101-04.R07, PS-101-04.R03 | rentals.damage.claimed; rentals.damage.resolved with each outcome; comms.meetup.no_show contradicted false then comms.meetup.no_show_contradicted for it; comms.meetup.no_show with contradicted true; moderation.action.applied with caseSource auction_review and auctions.result.voided with subjectKeys [seller] for the same auction | nothing for claimed; damage_agreed only for accepted, counter_accepted, refund_claimed and return_agreed; no_show then its compensation; nothing for the contradicted arrival; only auction_voided against the seller and no report_actioned |

## Dependencies

Module depends on: F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
