# PS-148-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-148-04. **Owner:** [18_Governance/02_community/mod_transparency](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_transparency. **Consumers:** F12 moderation, [mod_governance](../mod_governance/SPEC.md), F13 notifications (receives `entry_id` in notices sent by source modules), F15 platform gateway, public web client (PWA); declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Define the external contract of the module: the commands that change state, the queries that read it, and the domain events emitted after commit. Shapes follow the typed error envelope and event envelope placeholders in [CONTRACTS.md](../../../planning/CONTRACTS.md) (CTR-ERR-001, CTR-EVT-001); this file does not redefine them.

Exclusions: transport choice (HTTP paths are illustrative only), client UI, and any command that moves money, escrow or assets.

## Requirements
- PS-148-04.R01: Business outcome: authors and reviewers can complete the decision publication path, and the public and participants can read only what their disclosure class allows. Actors: see PS-148-05.
- PS-148-04.R02: Cases: duplicate command with same idempotency key (returns stored response); same key with different body (rejected); stale `expected_revision`; unknown `schema_version` MAJOR; list query beyond the last page; query for a PREPARING entry by a public caller (NOT_FOUND).
- PS-148-04.R03: Responses contain codes, dates (UTC day) and localized text fields only; no field requires colour or icon to interpret. Latency budgets: PS-148-08.R05.
- PS-148-04.R04: Every state-changing command takes `idempotency_key` (1 to 64 characters, `[A-Za-z0-9_-]`), `schema_version` and `expected_revision` (except Create commands).
- PS-148-04.R05: Every command returns the post-change view with `revision` and `state`, so clients need no follow-up read.
- PS-148-04.R06: Events are emitted through a transactional outbox after commit, with `event_id`, `aggregate_id`, `revision`, `schema_version` and `correlation_id`. Consumers deduplicate on `event_id` (A-TRANSPARENCY-18).
- PS-148-04.R07: Versioning: event and command names carry the MAJOR version (`.v1`). Additive fields are MINOR; removal or meaning change requires a new MAJOR and a 90-day overlap during which both are served (A-TRANSPARENCY-17).
- PS-148-04.R08: Queries are paginated with opaque cursors, `limit` 1 to 100 (default 25), and never return `subject_token`, `participant_explanation` or actor refs to public callers.

## Commands (signatures)
| Command | Signature | Idempotent by key | Emits |
|---|---|---|---|
| CreateDecisionLogEntry | (key, schema_version, source_type, source_ref, category_code, outcome, policy_version_ref, subject_token?, disclosure_class, public_summary?, participant_explanation?, redaction_profile_id?, region_code?, locale) -> EntryView | yes | decision_entry.created |
| UpdateDecisionLogEntry | (key, entry_id, expected_revision, patch) -> EntryView; PREPARING only | yes | decision_entry.updated |
| SubmitDecisionLogEntry | (key, entry_id, expected_revision) -> EntryView | yes | decision_entry.submitted |
| ApproveDecisionLogEntry | (key, entry_id, expected_revision) -> EntryView | yes | decision_entry.published (and superseded for predecessor) |
| RejectDecisionLogEntry | (key, entry_id, expected_revision, reason_code) -> EntryView | yes | decision_entry.rejected |
| WithdrawDecisionLogEntry | (key, entry_id, expected_revision, reason_code) -> EntryView | yes | decision_entry.withdrawn |
| CreateTransparencyReport | (key, schema_version, period_start, period_end, supersedes_report_id?) -> ReportView | yes | report.created |
| FreezeTransparencyReport | (key, report_id, expected_revision) -> ReportView | yes | report.frozen |
| UnfreezeTransparencyReport | (key, report_id, expected_revision, reason_code) -> ReportView | yes | report.unfrozen |
| PublishTransparencyReport | (key, report_id, expected_revision) -> ReportView | yes | report.published (and superseded for predecessor) |
| WithdrawTransparencyReport | (key, report_id, expected_revision, reason_code) -> ReportView | yes | report.withdrawn |

`reason_code` is an enum from the module catalogue (for example `CORRECTION_REQUIRED`, `LEGAL_REQUEST`, `DUPLICATE`, `REVIEW_TIMEOUT`); free-text reasons are not accepted.

## Queries (signatures)
| Query | Signature | Caller |
|---|---|---|
| GetDecisionLogEntry | (entry_id) -> PublicEntryView | public; only PUBLISHED with PUBLIC_* class |
| ListPublishedDecisionLogEntries | (cursor?, limit?, category_code?, outcome?, policy_version_ref?) -> Page<PublicEntryView> | public |
| GetTransparencyReport | (report_id) -> PublicReportView | public; only PUBLISHED or SUPERSEDED |
| ListTransparencyReports | (cursor?, limit?) -> Page<PublicReportView> | public |
| GetParticipantExplanation | (entry_id) -> ParticipantExplanationView | subject participant only (token match) |
| ListReviewQueue | (cursor?, limit?, state=REVIEW) -> Page<EntryView> | GOVERNANCE_REVIEWER |

## Example: create a decision entry
Request:
```json
{
  "idempotency_key": "rv-2026-11-03-0042-create",
  "schema_version": "1.0",
  "source_type": "MODERATION_ACTION",
  "source_ref": "01J9Z3M0A6H4D8F2K5N7P9Q1RS",
  "category_code": "CONTENT_REMOVAL",
  "outcome": "REMOVED",
  "policy_version_ref": "POL-2026.02",
  "subject_token": "pQ7mR2tV9xL4kN1sW8zB3cF6hJ0dG5yA2uE7iO9lT4q",
  "disclosure_class": "PUBLIC_REDACTED",
  "public_summary": "Listing removed after community reports were upheld on review.",
  "participant_explanation": "Your listing was removed under POL-2026.02. Use the appeal path to request review.",
  "redaction_profile_id": "RP-DEFAULT",
  "region_code": "REG-A01",
  "locale": "en"
}
```
Response (HTTP 201):
```json
{
  "entry_id": "01J9Z3K8Q4M2W7X5T1R6N0BVCD",
  "schema_version": "1.0",
  "state": "PREPARING",
  "revision": 1,
  "category_code": "CONTENT_REMOVAL",
  "outcome": "REMOVED",
  "policy_version_ref": "POL-2026.02",
  "disclosure_class": "PUBLIC_REDACTED",
  "published_at": null,
  "created_at": "2026-11-03T09:14:07.318Z"
}
```
The subject_token in the request is a placeholder value; the real token is derived per PS-148-07.R06.

## Example: list published entries (public)
Request: `GET /transparency/entries?category_code=CONTENT_REMOVAL&limit=2`
Response (HTTP 200):
```json
{
  "items": [
    {"entry_id": "01J9Z3K8Q4M2W7X5T1R6N0BVCD", "category_code": "CONTENT_REMOVAL", "outcome": "REMOVED", "policy_version_ref": "POL-2026.02", "public_summary": "Listing removed after community reports were upheld on review.", "published_at": "2026-11-04", "locale": "en"}
  ],
  "next_cursor": "eyJvZmZzZXQiOjJ9"
}
```

## Typed error example
```json
{"error": {"code": "TRANSPARENCY_REVISION_CONFLICT", "retryable": true, "http_status": 409, "message_key": "transparency.revision_conflict", "request_id": "req_01J9Z6", "details": {"expected_revision": 2, "stored_revision": 3}}}
```

## Event envelope (CTR-EVT-001 fields)
`event_id` (ULID), `event_type` (for example `transparency.decision_entry.published.v1`), `schema_version`, `aggregate_type`, `aggregate_id`, `revision`, `occurred_at` (UTC), `actor_ref` (ULID or `system`), `correlation_id`, `payload`. Payloads contain IDs, codes and state only, never summary or explanation text, to keep consumers free of personal data.

## Events
- transparency.decision_entry.created.v1, .updated.v1, .submitted.v1, .published.v1, .rejected.v1, .superseded.v1, .withdrawn.v1, .review_timed_out.v1, .purged.v1
- transparency.report.created.v1, .frozen.v1, .unfrozen.v1, .published.v1, .superseded.v1, .withdrawn.v1
- Participant notice: this module never holds `participant_id`, so it cannot route notices itself. The source module (F12 or mod_governance) that knows the subject sends the notice through F13 and includes `entry_id` only (A-TRANSPARENCY-12). The published event is not a routing trigger for notices.

## Open decisions
- A-TRANSPARENCY-12: Participant notices carry only `entry_id` and a generic message key; explanation text is fetched through GetParticipantExplanation after authentication.
- A-TRANSPARENCY-17: Versioning uses MAJOR.MINOR with a 90-day overlap for MAJOR changes, pending CTR-SCH-001.
