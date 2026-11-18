# PS-147-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-147-04. **Owner:** [18_Governance/02_community/mod_governance](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_governance. **Consumers:** F13 notifications, [mod_transparency](../mod_transparency/SPEC.md), F12 moderation (proposed; see [dependency matrix](../../../DEPENDENCY_MATRIX.md)).

## Requirements
- PS-147-04.R01: Business outcome, actors and exclusions. This file defines the public interface of the module: commands that change state, queries that read it, and events that announce changes. Exclusions: transport binding (HTTP paths are illustrative), UI, and membership writes.
- PS-147-04.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial cases map to codes in [validation rules](validation_rules.md) and recovery in [failure recovery](failure_recovery_idempotency.md).
- PS-147-04.R03: Response size budgets: single-record reads under 8 KB; list reads capped at 100 items; audit list capped at 500 items. Localization: no display strings in responses except `message_key` on errors.
- PS-147-04.R04: Every state-changing command takes an `Idempotency-Key` header (ULID) and a `schema_version`. Queries do not.
- PS-147-04.R05: Events are versioned by name (`.vN` suffix) and carry the CTR-EVT-001 envelope. No event carries a vote choice.
- PS-147-04.R06: Command and query signatures below are the contract. Field additions within a major version are backward compatible (A-governance-02).

## Commands
Signatures use `name(caller, inputs) -> result`. Caller roles: `steward`, `proposer` (steward who created the proposal), `participant` (eligible member), `operator`, `system`.

| Command | Signature | Caller | Idempotency key | Schema version | Success | Event(s) |
|---|---|---|---|---|---|---|
| C1 CreateCommunity | (operator, slug, display_name, region_code?, bootstrap_steward_participant_id) -> Community | operator | required | 1 | 201 | community.created.v1, role.granted.v1 |
| C2 SetCommunityStatus | (operator, community_id, status, status_reason_code, revision) -> Community | operator | required | 1 | 200 | community.status_changed.v1 |
| C3 CreateCharterDraft | (steward, community_id, body_text, body_locale) -> CharterVersion | steward | required | 1 | 201 | charter.drafted.v1 |
| C4 UpdateCharterDraft | (steward, charter_version_id, body_text, body_locale, revision) -> CharterVersion | steward | required | 1 | 200 | charter.drafted.v1 |
| C5 CreateProposal | (steward, community_id, proposal_type, title, rationale_text?, payload) -> Proposal | steward | required | 1 | 201 | proposal.drafted.v1 |
| C6 UpdateProposal | (proposer, proposal_id, title?, rationale_text?, payload?, revision) -> Proposal | proposer | required | 1 | 200 | proposal.updated.v1 |
| C7 OpenProposal | (proposer, proposal_id, voting_window_hours, revision) -> Proposal | proposer | required | 1 | 200 | proposal.opened.v1 |
| C8 WithdrawProposal | (proposer, proposal_id, revision) -> Proposal | proposer | required | 1 | 200 | proposal.withdrawn.v1 |
| C9 CastVote | (participant, proposal_id, choice) -> Vote | participant | required | 1 | 200 (upsert) | vote.cast.v1 |
| C10 TallyProposal | (system, proposal_id) -> Decision | system | natural key: proposal_id | 1 | internal | proposal.closed.v1, decision.recorded.v1 |
| C11 ExecuteDecision | (system, decision_id) -> Proposal | system | natural key: decision_id | 1 | internal | proposal.executed.v1 or proposal.execution_failed.v1, charter.activated.v1, role.granted.v1, role.revoked.v1 |
| C12 RetryExecution | (operator, proposal_id, revision) -> Proposal | operator | required | 1 | 200 | as C11 |
| C13 ExpireDrafts | (system, community_id) -> count | system | natural key: community_id + date | 1 | internal | proposal.withdrawn.v1 |
| C14 RequestExport | (steward, community_id, scope) -> ExportJob | steward | required | 1 | 202 | export.completed.v1 (later) |

`scope` for C14 is one of `governance_records` or `own_votes`. Individual votes of others are never exported (A-governance-25).

## Queries
| Query | Signature | Visible to | Notes |
|---|---|---|---|
| Q1 GetCommunity | (community_id) -> Community | visitor for active; members otherwise | `region_code` only; no precise location |
| Q2 GetActiveCharter | (community_id) -> CharterVersion | visitor | `body_text` of the active version |
| Q3 ListCharterVersions | (community_id, cursor, limit <= 100) -> page | members | status, version_no, activated_at |
| Q4 ListRoleAssignments | (community_id, active_only) -> page | members | participant_id pseudonymous |
| Q5 GetProposal | (proposal_id) -> Proposal | members | Tally fields hidden until state is `closed` or later (A-governance-05) |
| Q6 ListProposals | (community_id, state?, cursor, limit <= 100) -> page | members | |
| Q7 GetMyVote | (proposal_id) -> Vote or null | the voter | Only the caller's own choice |
| Q8 GetDecision | (proposal_id) -> Decision | members | Available after state `closed` |
| Q9 ListAuditEntries | (community_id, from_seq, limit <= 500) -> page | stewards | Hash chain fields included |

## Events
Envelope (CTR-EVT-001 placeholder): `event_id` (ULID), `event_type`, `schema_version`, `aggregate_type`, `aggregate_id`, `aggregate_revision`, `community_id`, `actor_ref` (`system` or HMAC, A-governance-24), `occurred_at`, `correlation_id`, `idempotency_key`, `payload`. Signature and provenance are omitted in MVP because nothing is federated (A-governance-02).

| Event | Payload fields (besides envelope) |
|---|---|
| governance.community.created.v1 | community_id, slug, status |
| governance.community.status_changed.v1 | community_id, status, status_reason_code |
| governance.charter.drafted.v1 | charter_version_id, version_no, body_sha256 (body text is not in the event) |
| governance.charter.activated.v1 | charter_version_id, superseded_charter_version_id (optional, null for first charter) |
| governance.role.granted.v1 | role_assignment_id, participant_id, source_proposal_id (optional, null for bootstrap) |
| governance.role.revoked.v1 | role_assignment_id, reason_code |
| governance.proposal.drafted.v1 | proposal_id, proposal_type, proposer_participant_id |
| governance.proposal.updated.v1 | proposal_id, revision |
| governance.proposal.opened.v1 | proposal_id, voting_closes_at, eligible_count |
| governance.proposal.withdrawn.v1 | proposal_id, reason_code (`proposer_request`, `draft_expired`, `proposer_no_longer_steward`) |
| governance.proposal.closed.v1 | proposal_id |
| governance.vote.cast.v1 | proposal_id, vote_id, revision (no choice) |
| governance.decision.recorded.v1 | decision_id, proposal_id, outcome, tally_approve, tally_reject, tally_abstain |
| governance.proposal.executed.v1 | proposal_id, decision_id |
| governance.proposal.execution_failed.v1 | proposal_id, decision_id, execution_attempts, reason_code |
| governance.export.completed.v1 | export_id, community_id, scope |

Vote choice is available only through Q7 and to stewards through the stored tally. Events deliberately omit it.

## Example: CreateProposal
Request:
```http
POST /v1/communities/01J9Z3K8Q0M5R7T2X4V6B8N1C3/proposals
Idempotency-Key: 01J9ZD2E3F4G5H6J7K8M9N0P1Q
Content-Type: application/json

{
  "schema_version": 1,
  "proposal_type": "steward_grant",
  "title": "Admit a second moderator steward",
  "rationale_text": "We need coverage on weekends.",
  "payload": { "target_participant_id": "01J9Z8Q9R0S1T2U3V4W5X6Y7Z8" }
}
```
Response `201`:
```json
{
  "proposal_id": "01J9Z5R6S7T8U9V0W1X2Y3Z4A5",
  "state": "draft",
  "revision": 1,
  "draft_expires_at": "2026-12-10T09:30:00.000Z",
  "schema_version": 1
}
```

## Example: CastVote
Request:
```http
POST /v1/proposals/01J9Z5R6S7T8U9V0W1X2Y3Z4A5/votes
Idempotency-Key: 01J9ZE3F4G5H6J7K8M9N0P1Q2R
Content-Type: application/json

{ "schema_version": 1, "choice": "approve" }
```
Response `200`:
```json
{
  "vote_id": "01J9Z9A0B1C2D3E4F5G6H7J8K9",
  "proposal_id": "01J9Z5R6S7T8U9V0W1X2Y3Z4A5",
  "choice": "approve",
  "revision": 2,
  "cast_at": "2026-11-15T18:42:03.118Z",
  "schema_version": 1
}
```

## Example: event envelope
```json
{
  "event_id": "01J9ZF4G5H6J7K8M9N0P1Q2R3S",
  "event_type": "governance.vote.cast.v1",
  "schema_version": 1,
  "aggregate_type": "vote",
  "aggregate_id": "01J9Z9A0B1C2D3E4F5G6H7J8K9",
  "aggregate_revision": 2,
  "community_id": "01J9Z3K8Q0M5R7T2X4V6B8N1C3",
  "actor_ref": "3b0f2a9c64d1e7f8a0b5c3d2e1f4a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3",
  "occurred_at": "2026-11-15T18:42:03.118Z",
  "correlation_id": "01J9ZE3F4G5H6J7K8M9N0P1Q2R",
  "idempotency_key": "01J9ZE3F4G5H6J7K8M9N0P1Q2R",
  "payload": { "proposal_id": "01J9Z5R6S7T8U9V0W1X2Y3Z4A5", "vote_id": "01J9Z9A0B1C2D3E4F5G6H7J8K9", "revision": 2 }
}
```

## Schema versioning
- `schema_version` is an integer major version. A breaking change creates `.v2` event names and commands at a new path. Old versions are supported for at least one release after the new version ships (A-governance-02).
- Compatibility rules and the registry are owned by CTR-SCH-001 (F15, not yet decided). Until then this module follows the rule above.
- Unknown `schema_version` on a request: `GOVERNANCE_SCHEMA_VERSION_UNSUPPORTED`.

## Open decisions
- A-governance-02: integer major schema versions, event names suffixed `.vN`, one-release support window. Pending CTR-SCH-001.
- A-governance-05: tallies and individual choices are not shown to members before close. Default adopted.
- A-governance-25: export excludes individual votes and eligibility lists of other participants.
