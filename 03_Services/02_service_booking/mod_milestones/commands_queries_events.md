# PS-031-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review.
**Requirement ID:** PS-031-04. **Owner:** [03_Services/02_service_booking/mod_milestones](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_milestones. **Consumers:** F07 identity, F10 privacy, F15 platform, F16 security (per [dependency matrix](../../../DEPENDENCY_MATRIX.md)); mod_disputes (PS-030) produces dispute outcome events; mod_quotes (PS-032) is queried for quote acceptance.

## Purpose and scope
Business outcome: parties and the system can create, agree, perform and close a milestone plan through a fixed set of versioned commands, read it through queries, and observe every state change through versioned domain events, with no command ever causing a second effect when retried.

Exclusions: no payment, escrow or funds commands; no dispute decision commands; no file upload or deliverable byte transfer; no bulk import; no federation envelope (CTR-FED-001).

## Conventions
- Transport: HTTPS JSON. Base path `/v1/milestones`. Request and response bodies carry `schema_version` = 1 (CTR-SCH-001).
- Every write requires header `Idempotency-Key` (ULID, 26 characters) and body field `expected_row_version` except `plan.create`.
- Writes return `200` with the new view, or `201` on create; a replayed key returns the original status and body (see failure_recovery_idempotency.md).
- Errors use codes from validation_rules.md; envelope per CTR-ERR-001.
- Timestamps are UTC RFC 3339 with `Z`, millisecond precision. Amounts are integer minor units.
- Every event uses envelope CTR-EVT-001 with fields: `event_id`, `event_type`, `event_version`, `plan_id`, `aggregate_row_version`, `occurred_at`, `actor_role` (never a name), `correlation_id`, `payload`.

## Commands (signatures)
| Command | Signature | Idempotent by | Emits |
|---|---|---|---|
| milestones.plan.create | `create(booking_ref, quote_ref, client_participant_id, currency_code, sequencing) -> PlanView` | key | plan.drafted |
| milestones.plan.edit_draft | `edit_draft(plan_id, items[], total_amount_minor, expected_row_version) -> PlanView` | key | none (draft edits are not published; the plan is not yet visible to the counterparty as agreed) |
| milestones.plan.propose | `propose(plan_id, expected_row_version) -> PlanView` | key | plan.proposed |
| milestones.plan.consent | `consent(plan_id, revision, content_digest, expected_row_version) -> PlanView` | key | plan.consented, plan.agreed (on second consent) |
| milestones.plan.reject_proposal | `reject_proposal(plan_id, reason_code, expected_row_version) -> PlanView` | key | plan.proposal_rejected |
| milestones.plan.withdraw_proposal | `withdraw_proposal(plan_id, expected_row_version) -> PlanView` | key | plan.proposal_withdrawn |
| milestones.plan.propose_revision | `propose_revision(plan_id, items[], total_amount_minor, expected_row_version) -> PlanView` | key | plan.revision_proposed |
| milestones.plan.cancel_draft | `cancel_draft(plan_id, expected_row_version) -> PlanView` | key | plan.cancelled |
| milestones.plan.request_mutual_cancel | `request_mutual_cancel(plan_id, expected_row_version) -> PlanView` | key | plan.mutual_cancel_requested |
| milestones.plan.confirm_mutual_cancel | `confirm_mutual_cancel(plan_id, expected_row_version) -> PlanView` | key | plan.cancelled |
| milestones.item.start | `start(item_id, expected_row_version) -> ItemView` | key | item.started, plan.activated (first only) |
| milestones.item.submit | `submit(item_id, evidence_digest, evidence_uri?, note_text?, expected_row_version) -> ItemView` | key | item.submitted |
| milestones.item.accept | `accept(item_id, expected_row_version) -> ItemView` | key | item.accepted, plan.completed (if last) |
| milestones.item.reject | `reject(item_id, reason_code, reason_text?, expected_row_version) -> ItemView` | key | item.rejected |
| milestones.item.open_dispute | `open_dispute(item_id, dispute_ref, expected_row_version) -> ItemView` | key | item.disputed |

System-only (not on public API): `apply_dispute_outcome(item_id, dispute_ref, outcome, dispute_event_id)` and `expire_item(item_id, expected_row_version)`. Both are idempotent by `dispute_event_id` or by the row version.

## Queries
| Query | Signature | Notes |
|---|---|---|
| milestones.plan.get | `get(plan_id) -> PlanView` | includes items; redacted for operators |
| milestones.plan.list_by_booking | `list_by_booking(booking_ref, cursor?, limit<=50) -> Page<PlanSummary>` | keyset pagination |
| milestones.plan.list_revisions | `list_revisions(plan_id) -> RevisionSummary[]` | digests and metadata only |
| milestones.item.get | `get(item_id) -> ItemView` | |

## Request and response examples
Create request (`POST /v1/milestones/plans`, header `Idempotency-Key: 01J9Z6F0T3KQ8W2M5VNB1XDRPE`):
```json
{
  "schema_version": 1,
  "booking_ref": "01J9Z2B0YH6T3D8F5KQ1N7WSMA",
  "quote_ref": "01J9Z2C4R8PX0E6G2MN9Q3VTKD",
  "client_participant_id": "01J9Z1S8M3VN2T6Y0CA4G7HZ9J",
  "currency_code": "EUR",
  "sequencing": "sequential"
}
```
Create response `201`:
```json
{
  "schema_version": 1,
  "plan_id": "01J9Z3K7Q4M2W8X6R1T5V0N8BC",
  "plan_state": "draft",
  "plan_revision": 1,
  "agreed_revision": null,
  "proposed_revision": null,
  "total_amount_minor": 0,
  "currency_code": "EUR",
  "row_version": 1,
  "items": []
}
```
Submit request (`POST /v1/milestones/items/{item_id}/submissions`):
```json
{
  "schema_version": 1,
  "evidence_digest": "3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b",
  "evidence_uri": "https://files.example.invalid/deliverables/abc123",
  "note_text": "Survey report attached.",
  "expected_row_version": 3
}
```
Submit response `200`:
```json
{
  "schema_version": 1,
  "item_id": "01J9Z4A1BD5RG8N2TQ6XW0YKEM",
  "milestone_state": "submitted",
  "submission_count": 1,
  "current_submission_id": "01J9Z7M2NB4QK9V0XR3TD6WEHA",
  "row_version": 4
}
```
Error response example (stale row version):
```json
{
  "schema_version": 1,
  "error": {"code": "MILESTONES_REVISION_CONFLICT", "retryable": true, "http_status": 409, "details": {"current_row_version": 5}}
}
```

## Events
| Event type | Version | Key payload fields (IDs and codes only) |
|---|---|---|
| milestones.plan.drafted | 1 | plan_id, booking_ref, quote_ref, provider_participant_id, client_participant_id |
| milestones.plan.proposed | 1 | plan_id, revision, content_digest, item_count, total_amount_minor |
| milestones.plan.consented | 1 | plan_id, revision, role, content_digest |
| milestones.plan.agreed | 1 | plan_id, revision, content_digest |
| milestones.plan.proposal_rejected | 1 | plan_id, revision, reason_code |
| milestones.plan.proposal_withdrawn | 1 | plan_id, revision |
| milestones.plan.revision_proposed | 1 | plan_id, revision, content_digest, change_summary_code |
| milestones.plan.activated | 1 | plan_id, agreed_revision |
| milestones.plan.completed | 1 | plan_id, accepted_item_count |
| milestones.plan.cancelled | 1 | plan_id, cancel_reason_code |
| milestones.plan.mutual_cancel_requested | 1 | plan_id, requested_by_role |
| milestones.plan.stalled | 1 | plan_id, days_without_change |
| milestones.item.started | 1 | item_id, plan_id, sequence_no |
| milestones.item.submitted | 1 | item_id, plan_id, submission_id, submission_count, evidence_digest |
| milestones.item.accepted | 1 | item_id, plan_id, decision_id |
| milestones.item.rejected | 1 | item_id, plan_id, decision_id, reason_code |
| milestones.item.disputed | 1 | item_id, plan_id, dispute_ref |
| milestones.item.dispute_resolved | 1 | item_id, plan_id, dispute_ref, outcome |
| milestones.item.expired | 1 | item_id, plan_id, due_date |
| milestones.item.review_overdue | 1 | item_id, plan_id, days_since_submission |

Event payloads never contain titles, descriptions, notes, URIs, or any name or contact. Consumers that need content use the query API under their own capability.

## Schema versioning
- Command, query and event shapes are version 1. Adding an optional field is a minor change within version 1; removing or renaming a field, or changing a type, requires version 2 and a dual-publish period of 90 days (CTR-SCH-001).
- Unknown response fields must be ignored by clients; unknown request fields are rejected (validation_rules.md).

## Assumptions and open decisions
- A-MILESTONES-01: Identifiers are ULIDs in all examples.
- A-MILESTONES-02: `booking_ref` and `quote_ref` are references; existence is checked through owner queries.
- A-MILESTONES-09: `dispute_resolved` is consumed from mod_disputes; event name and outcome enum are proposed and need PS-030 confirmation.
- Open: whether `milestones.plan.edit_draft` and `propose_revision` should be merged into one command. Current choice keeps them separate for audit clarity.
