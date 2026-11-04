# PS-031-04 — Commands, queries and events: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-04.R01** The module exposes vault commands for submit, approve and request_changes; each produces a named signed statement and a sync outbox entry in the same vault transaction.
- **PS-031-04.R02** Inbound statements are applied by an ingestion command that verifies, deduplicates by cid and derives local events with actor.kind federated.
- **PS-031-04.R03** Milestones are created locally on services.booking.confirmed and payment status is derived from F09 events whose context reference is a milestone of this module.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.milestone.submit` | services.milestone.submit | [statement classrup.services.milestone_submission/v1 signed by provider, E2E encrypted to client] { milestoneId, expectedRevision, deliverables[], note } | { milestoneId, revision, submissionCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, SERVICES_BOOKING_NOT_ACTIVE, SERVICES_MILESTONE_ORDER | services.milestone.submitted | yes (Idempotency-Key) |
| `services.milestone.approve` | services.milestone.approve | [statement classrup.services.milestone_approval/v1 signed by client over the submission cid] { milestoneId, expectedRevision, submissionCid } | { milestoneId, revision, approvalCid, paymentContext, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SERVICES_SUBMISSION_STALE, SERVICES_BOOKING_NOT_ACTIVE | services.milestone.approved | yes (Idempotency-Key) |
| `services.milestone.request_changes` | services.milestone.request_changes | [statement classrup.services.milestone_changes_request/v1 signed by client over the submission cid] { milestoneId, expectedRevision, submissionCid, reason } | { milestoneId, revision, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, SERVICES_SUBMISSION_STALE, SERVICES_CHANGE_LIMIT, VALIDATION_FAILED | services.milestone.changes_requested | yes (Idempotency-Key) |
| `services.milestone.receive` | services.milestone.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code? } | SERVICES_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, SERVICES_SUBMISSION_STALE, CONFLICT_STATE | services.milestone.submitted, services.milestone.approved, services.milestone.changes_requested | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.milestone.list_for_booking` | services.milestone.read_own | [vault-local] { bookingId } | { items: Milestone[] ordered by seq, bookingProgress: { settledCount, totalCount, settledAmount: Money } } | NOT_FOUND |
| `services.milestone.get` | services.milestone.read_own | [vault-local] { milestoneId } | { milestone: Milestone } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.milestone.submitted` | P2 | { milestoneId, bookingId, submissionCid, deliverableCount } |
| `services.milestone.approved` | P2 | { milestoneId, bookingId, approvalCid, amount } |
| `services.booking.completed` | P2 | { bookingId, settledAmount, milestoneCount } |
| `services.milestone.changes_requested` | P2 | { milestoneId, bookingId, round } |
| `services.milestone.settled` | P2 | { milestoneId, bookingId, proof } |

### Events consumed

| Type | Effect |
|---|---|
| `services.booking.confirmed` | create the Milestone records from the plan in the confirmation, or one implicit milestone for the full total when the plan is empty |
| `services.booking.cancelled` | cancel pending, submitted and changes_requested milestones; approved ones keep their payment obligation |
| `commerce.payment.claimed` | for context type service_milestone set payment.proof to claimed (unverified) |
| `commerce.payment.acknowledged` | for context type service_milestone set proof acknowledged and settle the milestone |
| `commerce.payment.finalized` | for context type service_milestone set proof final and settle the milestone |
| `commerce.payment.confirming` | for context type service_milestone set proof confirming with confirmations N of M |
| `commerce.payment.disputed` | for context type service_milestone set proof disputed and prompt the dispute flow |
| `commerce.payment.expired` | for context type service_milestone set proof expired; the milestone stays approved |
| `services.dispute.opened` | freeze the milestones in dispute scope |
| `commerce.dispute.resolved` | leave disputed according to the resolution outcome |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_STATEMENT_INVALID | 422 | no | signature, signer role or referenced cid check failed; statement quarantined |
| SERVICES_SUBMISSION_STALE | 409 | no | statement names a submission cid that is not the latest |
| SERVICES_CHANGE_LIMIT | 409 | no | three change rounds already used for this milestone |
| SERVICES_BOOKING_NOT_ACTIVE | 409 | no | booking is not confirmed or in progress, or is disputed or cancelled |
| SERVICES_MILESTONE_ORDER | 409 | no | an earlier milestone is not yet approved |
| SERVICES_MILESTONE_SUM_MISMATCH | 422 | no | milestone amounts do not sum to the booking total |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
provider vault services.milestone.submit { "milestoneId": "0192f3d0-0001-…", "expectedRevision": 1,
  "deliverables": [{ "attachmentId": "0192f3d0-00a1-…", "sha256": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "name": "report.pdf" }], "note": "Phase 1 done." }
-> { "milestoneId": "0192f3d0-0001-…", "revision": 2, "submissionCid": "sha256-Hk…", "syncState": "prepared" }
client vault services.milestone.approve { "milestoneId": "0192f3d0-0001-…", "expectedRevision": 2, "submissionCid": "sha256-Hk…" }
-> { "revision": 3, "approvalCid": "sha256-Jp…", "paymentContext": { "type": "service_milestone", "id": "0192f3d0-0001-…" } }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T01 | integration | PS-031-01.R01, PS-031-01.R02, PS-031-04.R03 | booking.confirmed event delivered twice with a 3-milestone plan | exactly 3 milestones per vault with identical ids; sum equals total |
| TEST-PS-031-09.T05 | integration | PS-031-03.R03, PS-031-04.R03 | payment claimed, confirming, expired, acknowledged, finalized events in turn | proof labels follow COM-4; settled only at acknowledged or final; booking completes only after all non-cancelled milestones settled |
| TEST-PS-031-09.T06 | contract | PS-031-04.R01, PS-031-04.R02, PS-031-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
