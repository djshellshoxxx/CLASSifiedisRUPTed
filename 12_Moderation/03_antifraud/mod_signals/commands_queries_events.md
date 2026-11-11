# PS-101-04 — Commands, queries and events: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-04.R01** The module exposes a manual record command and three queries; automated ingestion happens through event consumers.
- **PS-101-04.R02** Every recorded signal emits moderation.signal.recorded in the same transaction as the row.
- **PS-101-04.R03** The consumed event table below is fixed per rulesVersion and uses only events that exist in the module catalog.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.signal.record_manual` | moderation.signal.record_manual | { subjectKey, kind: manual_concern\|manual_positive\|compensation, weight, halfLifeDays?, reason, supersedesSignalId? } | { signalId, expiresAt } | VALIDATION_FAILED, NOT_FOUND, SIGNALS_MANUAL_CAP, FORBIDDEN | moderation.signal.recorded | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.signal.list_for_subject` | moderation.signal.read_as_reviewer | { subjectKey, since?, kind?, cursor?, limit ≤ 100 } | { items: Signal[] with decayedWeight, nextCursor? } |  |
| `moderation.signal.summarize` | moderation.signal.read_summary | { subjectKey, asOf? } | { totalDecayedWeight, byKind: { kind: { count, decayedWeight } }, computedAt } |  |
| `moderation.signal.categories_own` | moderation.signal.read_categories | { subjectKey, windowDays ≤ 90 } | { byKind: { kind: count } } for the local vault only |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.signal.recorded` | P3 | { signalId, subjectKey, kind, weight, halfLifeDays, sourceModule, sourceEventId?, observedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.spam.detected` | record spam_detected, weight 5 per 10 score points above 50, half-life 14 days |
| `auctions.shill.suspected` | record shill_suspected, weight 40, half-life 90 days, against the suspected bidder key |
| `auctions.result.voided` | record auction_voided, weight 25, half-life 90 days, against the party named in the event |
| `commerce.dispute.opened` | record dispute_opened, weight 10 against the respondent, half-life 60 days |
| `commerce.dispute.resolved` | record dispute_lost weight 20 against the losing party or compensation of the opened signal when the respondent prevailed |
| `commerce.payment.disputed` | record payment_claim_disputed, weight 15 against the claimant, half-life 60 days |
| `commerce.payment.expired` | record payment_claim_expired, weight 6 against the claimant, half-life 30 days |
| `commerce.deal.completed` | record deal_completed, weight -4 for both parties, half-life 120 days |
| `comms.meetup.no_show` | record no_show, weight 10 against the party who did not check in, half-life 60 days |
| `mutiny.cycle.participant_dropped` | record cycle_dropout, weight 12 against the dropper when the drop happened after consent, half-life 60 days |
| `rentals.damage.claimed` | record damage_claimed, weight 8 against the renter, half-life 90 days |
| `moderation.action.applied` | relay only: record report_actioned, weight by severity 10, 20, 40 for warn, restrict, suspend, half-life 180 days |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SIGNALS_DUPLICATE_SOURCE | 409 | no | a signal for this source event already exists; ingestion is a no-op |
| SIGNALS_MANUAL_CAP | 422 | no | manual signals for this subject exceed the 30-day cap |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command moderation.signal.record_manual (local, Idempotency-Key 0192f3e0-0000-7000-8000-000000000f01)
{ "subjectKey": "did:key:z6MkCounterpartyExample", "kind": "manual_concern", "weight": 8, "reason": "Asked to move the payment outside the app twice." }
-> { "signalId": "0192f3e0-7777-7000-8000-000000000007", "expiresAt": "2027-01-23T10:00:00Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T04 | integration | PS-101-04.R03, PS-101-06.R01 | each consumed event delivered twice | exactly one signal per source event with documented weight |
| TEST-PS-101-09.T05 | contract | PS-101-04.R01, PS-101-04.R02, PS-101-09.R02 | command, queries and event | validate against registry schemas |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
