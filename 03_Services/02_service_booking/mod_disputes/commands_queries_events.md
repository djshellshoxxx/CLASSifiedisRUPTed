# PS-030-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-030-04. **Owner:** [03_Services/02_service_booking/mod_disputes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_disputes. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); event subscribers listed below.

## Purpose and scope
Defines the versioned command, query and event surface of the dispute module. Transport is HTTPS JSON through the relay. Command names map to `POST /v1/disputes/{verb}` paths. Every write is idempotent and carries a schema version. Event names and envelope follow CTR-EVT-001 and CTR-SCH-001 placeholders (A-disputes-06).

Exclusions: binary upload transport (shared upload service, A-disputes-05); notification rendering; moderation queue ordering policy beyond the query defined here.

## Requirements
- **PS-030-04.R01**: Business outcome: every user-facing dispute action is one named command with a stable signature, one response shape and one event. Actors: claimant, respondent, moderator, system. Exclusions as above.
- **PS-030-04.R02**: Cases covered: duplicate submission (same key, same body), conflicting submission (same key, different body), stale revision, offline replay, malformed payload, unsupported schema version, deadline passed.
- **PS-030-04.R03**: Latency: command response p95 at most 600 ms; query p95 at most 300 ms; queries return at most 50 items per page, and timeline at most 100.
- **PS-030-04.R04**: Every state-changing command requires `Idempotency-Key` (header) and `schema_version` (body). Every command against an existing dispute requires `expected_revision`.
- **PS-030-04.R05**: Events are immutable, versioned by name suffix (`.v1`), and carry no free text beyond what the subscriber's disclosure class allows (see [privacy_retention_abuse.md](privacy_retention_abuse.md)).
- **PS-030-04.R06**: Forward compatibility: new optional fields are additive within v1. Removing or renaming a field requires v2 and a dual-publish period of at least 30 days.

## Commands
Common headers: `Authorization` (relay session), `Idempotency-Key` (16 to 64 chars), `Content-Type: application/json`.

| Command | Path | Target | Key payload fields | Success response |
|---|---|---|---|---|
| OpenDispute | POST /v1/disputes | new | `booking_ref`, `milestone_ref?`, `category`, `claim_text`, `requested_remedy`, `claimed_amount_minor?`, `claimed_currency?` | 201 dispute summary |
| RespondToDispute | POST /v1/disputes/{id}/response | dispute | `expected_revision`, `response_text`, `requested_remedy?` | 200 |
| SubmitEvidence | POST /v1/disputes/{id}/evidence | dispute | `expected_revision`, `kind`, `upload_ref?`, `content_text?`, `label?` | 201 (text, link) or 202 (binary pending finalize) |
| WithdrawEvidence | POST /v1/disputes/{id}/evidence/{evd}/withdraw | evidence | `expected_revision` | 200 |
| WithdrawDispute | POST /v1/disputes/{id}/withdraw | dispute | `expected_revision`, `reason_code` | 200 |
| ProposeSettlement | POST /v1/disputes/{id}/settlements | dispute | `expected_revision`, `note?` | 201 |
| RespondToSettlement | POST /v1/disputes/{id}/settlements/{stl}/respond | proposal | `expected_revision`, `decision` (`accept` or `reject`) | 200 |
| EscalateDispute | POST /v1/disputes/{id}/escalate | dispute | `expected_revision` | 200 |
| AssignReviewer | POST /v1/disputes/{id}/review/assign | dispute | `expected_revision` | 200 |
| ReleaseReviewer | POST /v1/disputes/{id}/review/release | dispute | `expected_revision`, `reason_code` | 200 |
| ReturnForMoreInfo | POST /v1/disputes/{id}/review/return | dispute | `expected_revision`, `request_text` | 200 |
| AddReviewerNote | POST /v1/disputes/{id}/review/notes | dispute | `expected_revision`, `note_text` | 201 |
| RecordDecision | POST /v1/disputes/{id}/review/decision | dispute | `expected_revision`, `outcome`, `reason_code`, `decision_text?` | 200 |
| RejectAtIntake | POST /v1/disputes/{id}/review/reject | dispute | `expected_revision`, `reason_code` | 200 |
| FileAppeal | POST /v1/disputes/{id}/appeal | dispute | `expected_revision`, `grounds_text` | 201 |

Example: OpenDispute request and response.
```json
{
  "schema_version": 1,
  "booking_ref": "bkg_01J9ZQ2A1B3C4D5E6F7G8H9J0K",
  "milestone_ref": null,
  "category": "non_delivery",
  "claim_text": "The agreed session did not take place and no notice was given.",
  "requested_remedy": "refund",
  "claimed_amount_minor": 4500,
  "claimed_currency": "EUR"
}
```
```json
{
  "dispute_id": "dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E",
  "schema_version": 1,
  "status": "open",
  "revision": 1,
  "opened_at": "2026-11-10T08:15:00Z",
  "response_due_at": "2026-11-17T08:15:00Z"
}
```

Example: revision conflict (409).
```json
{
  "error": {
    "code": "DISPUTES_REVISION_CONFLICT",
    "http_status": 409,
    "retryable": true,
    "message_key": "disputes.error.revision_conflict",
    "diagnostic_id": "dgn_01J9ZR9K0M1N2P3Q4R5S6T7U8V",
    "current_revision": 3
  }
}
```

## Queries
| Query | Path | Parameters | Returns | Caller |
|---|---|---|---|---|
| GetDispute | GET /v1/disputes/{id} | none | Projection by role: party view or moderator view | party, moderator |
| ListMyDisputes | GET /v1/disputes | `role` (claimant or respondent), `status?`, `cursor?`, `limit` (max 50) | Page of summaries | participant |
| GetDisputeTimeline | GET /v1/disputes/{id}/timeline | `cursor?`, `limit` (max 100) | Transitions with `to_status`, `occurred_at`, `actor_role`; no actor refs for counterparty | party, moderator |
| ListReviewQueue | GET /v1/disputes/review-queue | `status=escalated`, `cursor?`, `limit` (max 50) | Summaries without statement bodies | moderator |

Queries never change state. Responses set `Cache-Control: private, no-store`.

## Events
Envelope fields (CTR-EVT-001): `event_id` (ULID), `event_name`, `schema_version`, `aggregate_type` (`dispute`), `aggregate_id`, `revision`, `actor_role`, `actor_ref` (nullable), `occurred_at`, `correlation_id`, `idempotency_key_hash`, `payload`.

| Event | Emitted by | Payload (minimum) |
|---|---|---|
| disputes.dispute_opened.v1 | T01 | `booking_ref`, `milestone_ref`, `category`, `response_due_at` |
| disputes.dispute_responded.v1 | T02 | `evidence_due_at` |
| disputes.evidence_submitted.v1 | SubmitEvidence | `evidence_id`, `kind`, `state` |
| disputes.evidence_withdrawn.v1 | WithdrawEvidence | `evidence_id` |
| disputes.settlement_proposed.v1 | T06 | `settlement_id`, `expires_at` |
| disputes.settlement_responded.v1 | T09, T10 | `settlement_id`, `decision` |
| disputes.dispute_escalated.v1 | T03, T07, T16 | `reason_code` |
| disputes.review_started.v1 | T12 | `assigned_at` |
| disputes.review_sla_breached.v1 | timer | `assigned_at`, `sla_days` |
| disputes.dispute_decided.v1 | T14 | `outcome`, `reason_code`, `appeal_deadline_at` |
| disputes.appeal_filed.v1 | T18 | `grounds_length` |
| disputes.dispute_closed.v1 | T17, T19 | `outcome` |
| disputes.dispute_withdrawn.v1 | T04, T08, T11, T13 | `reason_code` |
| disputes.dispute_resolved_mutual.v1 | T09 | none beyond envelope |
| disputes.dispute_rejected_at_intake.v1 | T05 | `reason_code` |

Subscriber map (roles; concrete owners unresolved, A-disputes-06): notifications (party-facing summaries only, no `decision_text` unless the recipient is a party); moderation (all events); evidence (`evidence_submitted`, `evidence_withdrawn`); observability (all events, metadata only). Federation: no subscriber in v1 (A-disputes-15).

Event example:
```json
{
  "event_id": "01J9ZRA1B2C3D4E5F6G7H8J9K0",
  "event_name": "disputes.dispute_responded.v1",
  "schema_version": 1,
  "aggregate_type": "dispute",
  "aggregate_id": "dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E",
  "revision": 2,
  "actor_role": "respondent",
  "actor_ref": "pid_01J9ZQ5B9C0D1E2F3G4H5J6K7M",
  "occurred_at": "2026-11-11T09:30:00Z",
  "correlation_id": "01J9ZR7H8J9K0M1N2P3Q4R5S6T",
  "idempotency_key_hash": "a3f1c2d4e5b6a7f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "payload": { "evidence_due_at": "2026-11-18T09:30:00Z" }
}
```

## Idempotency and schema versioning
- Scope: `(actor_ref, command_name, Idempotency-Key)`. Retention 72 hours (A-disputes-07). Replays return the stored response resource ID with status 200 or 201 as first returned.
- Same key with a different canonical payload hash returns `DISPUTES_IDEMPOTENCY_KEY_REUSED`.
- `schema_version` other than 1 returns `DISPUTES_SCHEMA_VERSION_UNSUPPORTED`. Version negotiation follows CTR-SCH-001.

## Open decisions
- A-disputes-06: Event naming `disputes.<name>.v1` and envelope fields are provisional until CTR-EVT-001 is published by F15. Concrete notification and moderation consumers are not yet named in [CONTRACTS.md](../../../planning/CONTRACTS.md).
- A-disputes-15: Federated dispute exchange is out of v1 scope (D01 OPEN).
