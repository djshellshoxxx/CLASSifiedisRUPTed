# PS-031-04 — Commands, queries and events: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-04.R01** The module exposes vault commands for submit, approve, request_changes and completion signing; each produces a named signed statement and a sync outbox entry in the same vault transaction.
- **PS-031-04.R02** Inbound statements are applied by an ingestion command that drops statements from blocked DIDs silently, verifies, deduplicates by cid and derives local events with actor.kind federated.
- **PS-031-04.R03** Milestones are created locally on services.booking.confirmed from the client-signed quote plan, and payment status is derived from F09 events resolved through the milestone's dealId.
- **PS-031-04.R04** Event payloads carry clientId and providerId for notification routing (N4), and services.booking.completed carries contextId, contextType, completionCid and parties as N3 requires.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.milestone.submit` | services.milestone.submit | [statement classrup.services.milestone_submission/v1 signed by provider, E2E encrypted to client] { milestoneId, expectedRevision, deliverables[] {kind, attachmentId?, sha256, name, sizeBytes, mediaType}, note } | { milestoneId, revision, submissionCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, SERVICES_BOOKING_NOT_ACTIVE, SERVICES_MILESTONE_ORDER | services.milestone.submitted | yes (Idempotency-Key) |
| `services.milestone.approve` | services.milestone.approve | [statement classrup.services.milestone_approval/v1 signed by client over the submission cid; calls commerce.deal.open in the same transaction] { milestoneId, expectedRevision, submissionCid } | { milestoneId, revision, approvalCid, dealId, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SERVICES_SUBMISSION_STALE, SERVICES_BOOKING_NOT_ACTIVE, DEPENDENCY_UNAVAILABLE | services.milestone.approved | yes (Idempotency-Key) |
| `services.milestone.request_changes` | services.milestone.request_changes | [statement classrup.services.milestone_changes_request/v1 signed by client over the submission cid] { milestoneId, expectedRevision, submissionCid, reason } | { milestoneId, revision, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SERVICES_SUBMISSION_STALE, SERVICES_CHANGE_LIMIT, VALIDATION_FAILED | services.milestone.changes_requested | yes (Idempotency-Key) |
| `services.completion.sign` | services.completion.sign | [statement classrup.services.booking_completion/v1 signed by the local party over completionCid = cid of JCS {bookingId, quoteCid, confirmationCid, milestones [{milestoneId, seq, approvalCid, dealId, proof}], settledAmount}] { bookingId } | { bookingId, completionCid, signedBy: [client\|provider], completed: boolean, syncState } | NOT_FOUND, CONFLICT_STATE, SERVICES_COMPLETION_NOT_READY | services.booking.completed | yes (Idempotency-Key) |
| `services.milestone.receive` | services.milestone.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001; blocked senders dropped silently first] { envelope, via? } | { accepted: boolean, dropped?: boolean, quarantined?: boolean, code? } | SERVICES_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED, SERVICES_SUBMISSION_STALE, CONFLICT_STATE | services.milestone.submitted, services.milestone.approved, services.milestone.changes_requested, services.booking.completed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.milestone.list_for_booking` | services.milestone.read_own | [vault-local] { bookingId } | { items: Milestone[] ordered by seq, bookingProgress: { settledCount, totalCount, settledAmount: Money, completion: awaiting_client \| awaiting_provider \| completed \| not_ready } } | NOT_FOUND |
| `services.milestone.get` | services.milestone.read_own | [vault-local] { milestoneId } | { milestone: Milestone } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.milestone.submitted` | P2 | { milestoneId, bookingId, clientId, providerId, submissionCid, deliverableCount } |
| `services.milestone.approved` | P2 | { milestoneId, bookingId, clientId, providerId, approvalCid, amount, dealId } |
| `services.booking.completed` | P2 | { contextId: bookingId, contextType: booking, bookingId, completionCid (cid of the classrup.services.booking_completion/v1 summary signed separately by both parties), parties: [{did: clientId, role: client}, {did: providerId, role: provider}], settledAmount, milestoneCount, completedAt } |
| `services.milestone.changes_requested` | P2 | { milestoneId, bookingId, clientId, providerId, round } |
| `services.milestone.settled` | P2 | { milestoneId, bookingId, clientId, providerId, dealId, proof } |

### Events consumed

| Type | Effect |
|---|---|
| `services.booking.confirmed` | create the Milestone records from the plan of the client-signed quote identified by quoteCid (one implicit milestone with seq 1 for the full total when the plan is empty), with ids uuid(sha256(bookingId + ':' + seq)); a plan in the event that differs is refused and no milestone is created |
| `services.booking.cancelled` | cancel pending, submitted and changes_requested milestones (and disputed ones whose preDisputeStatus is submitted when the reason is mutual); approved ones keep their Deal and payment obligation |
| `commerce.payment.claimed` | for the milestone whose dealId matches, add claimId and set proof claimed (unverified) |
| `commerce.payment.acknowledged` | for the milestone whose dealId matches, set proof acknowledged and settle the milestone |
| `commerce.payment.confirming` | for the milestone whose dealId matches, set proof confirming with confirmations N of M |
| `commerce.payment.confirmed` | for the milestone whose dealId matches, set proof confirmed with the confirmation count; the milestone stays approved until final |
| `commerce.payment.finalized` | for the milestone whose dealId matches, set proof final and settle the milestone |
| `commerce.payment.reorged` | for the milestone whose dealId matches, set proof reorged (shown as back to waiting, below confirming); the milestone stays approved |
| `commerce.payment.failed` | for the milestone whose dealId matches, set proof failed; the milestone stays approved and the client is prompted to claim again |
| `commerce.payment.disputed` | for the milestone whose dealId matches, set proof disputed and prompt the dispute flow |
| `commerce.payment.expired` | for the milestone whose dealId matches, set proof expired; the milestone stays approved |
| `commerce.deal.cancelled` | for the milestone whose dealId matches, reason mutual cancels the approved milestone; reason expired keeps it approved with proof expired |
| `services.dispute.opened` | for milestones in scope, submitted and approved move to disputed with preDisputeStatus and disputeCaseId stored; other states only get openDisputeLinkId and disputeCaseId |
| `commerce.dispute.resolved` | for milestones whose disputeCaseId matches, restore preDisputeStatus and clear the overlay per the F03.S02.M03 mapping, which reads the advisory disposition {kind, favouredDid?, agreedAmount?} when present and otherwise the outcome type; neither a settled or waived disposition nor refund_claimed ever changes the existing Deal |
| `commerce.dispute.withdrawn` | for milestones whose disputeCaseId matches, restore preDisputeStatus and clear the overlay |
| `privacy.deletion.completed` | replace the erased counterparty DID with the deletion pseudonym in retained milestones and completion records; signatures are kept and marked unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_SUBMISSION_STALE | 409 | no | statement names a submission cid that is not the latest |
| SERVICES_CHANGE_LIMIT | 409 | no | three change rounds already used for this milestone |
| SERVICES_BOOKING_NOT_ACTIVE | 409 | no | booking is not confirmed or in progress, is disputed, conflicted or cancelled, or the milestone is frozen |
| SERVICES_MILESTONE_ORDER | 409 | no | an earlier milestone is not yet approved and this one is not parallel |
| SERVICES_COMPLETION_NOT_READY | 409 | no | not every non-cancelled milestone is settled, or the completion cid differs |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2): classrup.services.milestone_submission/v1 provider; classrup.services.milestone_approval/v1 client; classrup.services.milestone_changes_request/v1 client; classrup.services.booking_completion/v1 client and provider, one statement each over the same completionCid, and services.booking.completed is emitted only when both are held. The Deal statement classrup.commerce.deal/v1 is produced by F09.S01.M01 when this module calls commerce.deal.open; the provider vault derives the same dealId from contextRef service_milestone and the milestoneId. The late-cancellation fee of F03.S02.M01 is advisory and opens no Deal.

### Example

```
provider vault services.milestone.submit { "milestoneId": "5f0c2a9e-7b1d-4c3e-8a6f-0d9e1b2c3a4f", "expectedRevision": 1,
  "deliverables": [{ "kind": "external_hash", "sha256": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "name": "report.pdf", "sizeBytes": 12582912, "mediaType": "application/pdf" }], "note": "Phase 1 done." }
-> { "milestoneId": "5f0c2a9e-…", "revision": 2, "submissionCid": "sha256-Hk…", "syncState": "prepared" }
client vault services.milestone.approve { "milestoneId": "5f0c2a9e-…", "expectedRevision": 2, "submissionCid": "sha256-Hk…" }
-> commerce.deal.open { "contextRef": { "type": "service_milestone", "id": "5f0c2a9e-…" }, "contextCid": "sha256-Jp…", … }
-> { "revision": 3, "approvalCid": "sha256-Jp…", "dealId": "a1b2c3d4-…", "syncState": "prepared" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T01 | integration | PS-031-01.R01, PS-031-01.R02, PS-031-01.R04, PS-031-04.R03 | booking.confirmed event delivered twice with a 3-milestone plan | exactly 3 milestones per vault with ids uuid(sha256(bookingId:seq)), plan taken from the client-signed quote; sum equals total |
| TEST-PS-031-09.T05 | integration | PS-031-03.R03, PS-031-03.R06, PS-031-04.R03 | payment claimed, confirming, confirmed, reorged, confirming, finalized; then claimed, failed; then claimed, expired; then acknowledged | proof labels follow COM-4; after the reorg proof is reorged and the milestone stays approved; settled only at acknowledged or final; booking completes only after both completion statements |
| TEST-PS-031-09.T06 | contract | PS-031-04.R01, PS-031-04.R02, PS-031-09.R02 | each command, statement and event, and the commerce.deal.open call | payloads, signatures and the Deal request (contextRef service_milestone, contextCid approvalCid, parties, obligation) validate against the registry and F09 schemas |
| TEST-PS-031-09.T14 | e2e | PS-031-01.R01, PS-031-04.R01 | mobile provider submits, client approves and records payment claim, provider acknowledges, both sign completion | milestone settled in both vaults; booking completed; axe zero serious issues |
| TEST-PS-031-09.T18 | contract | PS-031-04.R04 | services.booking.completed and milestone events against the F07.S03.M01 and F13.S01.M03 consumers | N3 fields present; completed emitted only after both completion statements; clientId and providerId present |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
