# PS-147-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-147-01. **Owner:** [18_Governance/02_community/mod_governance](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_governance. **Consumers:** F13 notifications, [mod_transparency](../mod_transparency/SPEC.md), F12 moderation (proposed; see [dependency matrix](../../../DEPENDENCY_MATRIX.md)).

## Business outcome and exclusions
- Outcome: each community has one active charter and a visible steward set. Every charter change and every steward grant or revoke is an explicit, attributable, reproducible record. Members can see which rules are in force and who holds stewardship.
- Actors: participant (pseudonymous, identified by `participant_id` owned by F07), steward (role holder), platform operator, system scheduler.
- Exclusions: platform-wide prohibited-goods and jurisdiction rules ([01_policy](../../01_policy/SPEC.md)); moderation reports and sanctions (F12); membership join and leave records (external source, see A-governance-03); names, email addresses, postal addresses, device or precise location data; funds, escrow, payment or deposit records (no platform custody); legal-compliance obligations (not in MVP scope).

## Conventions
- IDs: ULID strings, 26 characters, Crockford base32, uppercase (A-governance-01).
- Timestamps: RFC 3339 UTC with millisecond precision, stored as `timestamptz`.
- Text: NFC-normalized before length checks; control characters other than LF and TAB rejected.
- `revision`: integer starting at 1, incremented on every mutation (optimistic concurrency).
- Every table carries `schema_version smallint not null default 1`.

## Entities

### community
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| community_id | char(26) | no | PK | generated | 01J9Z3K8Q0M5R7T2X4V6B8N1C3 |
| slug | varchar(40) | no | unique; `^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$` | none | example-garden-club |
| display_name | varchar(80) | no | 1–80 code points | none | Example Garden Club |
| status | varchar(16) | no | `active`, `frozen`, `archived` | `active` | active |
| status_reason_code | varchar(40) | yes | required when status is not `active` | null | operator_review |
| region_code | varchar(12) | yes | coarse only, `^[A-Z]{2}(-[A-Z0-9]{1,6}){0,2}$` (D05) | null | DE-NW |
| revision | integer | no | >= 1 | 1 | 4 |
| created_at | timestamptz | no | immutable | now | 2026-11-10T09:30:00.000Z |
| updated_at | timestamptz | no | >= created_at | now | 2026-11-10T11:02:14.512Z |

### charter_version
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| charter_version_id | char(26) | no | PK | generated | 01J9Z4A1B2C3D4E5F6G7H8J9K0 |
| community_id | char(26) | no | FK community | none | 01J9Z3K8Q0M5R7T2X4V6B8N1C3 |
| version_no | integer | no | >= 1; unique with community_id | none | 2 |
| status | varchar(16) | no | `draft`, `active`, `superseded` | `draft` | active |
| body_text | text | no | 1–20000 code points after NFC; no controls except LF and TAB | none | Members share tools and respect pickup times. |
| body_locale | varchar(35) | no | BCP 47 (RFC 5646) | `en` | en |
| body_sha256 | char(64) | no | lowercase hex of SHA-256 over UTF-8 `body_text` | computed | 9f2c…(64 hex) |
| source_proposal_id | char(26) | yes | FK governance_proposal; null while draft | null | 01J9Z5R6S7T8U9V0W1X2Y3Z4A5 |
| created_by_participant_id | char(26) | no | pseudonymous ID from F07 | none | 01J9Z2P7W8X9Y0Z1A2B3C4D5E6 |
| activated_at | timestamptz | yes | set once, on activation | null | 2026-11-12T08:00:00.000Z |
| superseded_at | timestamptz | yes | set once, on supersession | null | null |
| revision | integer | no | >= 1; only draft rows mutate | 1 | 3 |

### role_assignment
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| role_assignment_id | char(26) | no | PK | generated | 01J9Z6M0N1P2Q3R4S5T6U7V8W9 |
| community_id | char(26) | no | FK community | none | 01J9Z3K8Q0M5R7T2X4V6B8N1C3 |
| participant_id | char(26) | no | pseudonymous ID; all-zero sentinel after erasure (A-governance-24) | none | 01J9Z2P7W8X9Y0Z1A2B3C4D5E6 |
| role | varchar(16) | no | `steward` (only role in MVP) | `steward` | steward |
| granted_by_proposal_id | char(26) | yes | null only for bootstrap steward created by C1 | null | 01J9Z7… |
| granted_at | timestamptz | no | immutable | now | 2026-11-13T10:00:00.000Z |
| revoked_at | timestamptz | yes | set once | null | null |
| revoked_by_proposal_id | char(26) | yes | set with revoked_at, unless erasure | null | null |
| revocation_reason_code | varchar(40) | yes | `decision_revoke`, `participant_erased`, `bootstrap_correction` | null | null |

### governance_proposal
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| proposal_id | char(26) | no | PK | generated | 01J9Z5R6S7T8U9V0W1X2Y3Z4A5 |
| community_id | char(26) | no | FK community | none | 01J9Z3K8Q0M5R7T2X4V6B8N1C3 |
| proposal_type | varchar(24) | no | `charter_amend`, `steward_grant`, `steward_revoke` (A-governance-16) | none | steward_grant |
| state | varchar(24) | no | see [workflow](workflow_state_machine.md) | `draft` | open |
| proposer_participant_id | char(26) | no | must hold active steward role at each command | none | 01J9Z2P7W8X9Y0Z1A2B3C4D5E6 |
| title | varchar(120) | no | 1–120 code points after NFC | none | Admit a second moderator steward |
| rationale_text | varchar(2000) | yes | 0–2000 code points; no controls except LF and TAB | null | We need coverage on weekends. |
| payload_json | jsonb | no | <= 4096 bytes; schema per type in [validation rules](validation_rules.md) | none | {"target_participant_id":"01J9Z8…"} |
| draft_expires_at | timestamptz | yes | created_at + 30 days; null after open | now + 30d | 2026-12-10T09:30:00.000Z |
| voting_window_hours | smallint | yes | 24–720 (A-governance-08) | null | 168 |
| voting_opens_at | timestamptz | yes | set at open | null | 2026-11-14T09:00:00.000Z |
| voting_closes_at | timestamptz | yes | voting_opens_at + voting_window_hours | null | 2026-11-21T09:00:00.000Z |
| eligible_count | integer | yes | 3–10000 (A-governance-07) | null | 42 |
| quorum_required | integer | yes | max(3, ceil(0.20 × eligible_count)) (A-governance-04) | null | 9 |
| approval_threshold_bp | smallint | yes | 5000 or 6667 by type (A-governance-04) | null | 6667 |
| decision_id | char(26) | yes | FK governance_decision; unique | null | null |
| execution_attempts | smallint | no | 0–5 automatic, operator retries counted separately | 0 | 0 |
| revision | integer | no | >= 1 | 1 | 3 |
| created_at | timestamptz | no | immutable | now | 2026-11-10T09:30:00.000Z |
| updated_at | timestamptz | no | >= created_at | now | 2026-11-14T09:00:00.000Z |

### proposal_eligibility
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| proposal_id | char(26) | no | PK part; FK governance_proposal | none | 01J9Z5R6S7T8U9V0W1X2Y3Z4A5 |
| participant_id | char(26) | no | PK part; pseudonymous ID | none | 01J9Z2P7W8X9Y0Z1A2B3C4D5E6 |
| snapshot_at | timestamptz | no | written once at open | none | 2026-11-14T09:00:00.000Z |

### vote
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| vote_id | char(26) | no | PK | generated | 01J9Z9A0B1C2D3E4F5G6H7J8K9 |
| proposal_id | char(26) | no | FK governance_proposal | none | 01J9Z5R6S7T8U9V0W1X2Y3Z4A5 |
| voter_participant_id | char(26) | no | unique with proposal_id; must be in proposal_eligibility | none | 01J9Z2P7W8X9Y0Z1A2B3C4D5E6 |
| choice | varchar(8) | no | `approve`, `reject`, `abstain` | none | approve |
| cast_at | timestamptz | no | server clock; updated on change | now | 2026-11-15T18:42:03.118Z |
| revision | integer | no | >= 1; increments on change | 1 | 2 |

### governance_decision
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| decision_id | char(26) | no | PK | generated | 01J9ZAB0C1D2E3F4G5H6J7K8M9 |
| proposal_id | char(26) | no | unique; FK governance_proposal | none | 01J9Z5R6S7T8U9V0W1X2Y3Z4A5 |
| outcome | varchar(16) | no | `adopted`, `rejected`, `no_quorum` | none | adopted |
| tally_approve | integer | no | >= 0 | 0 | 7 |
| tally_reject | integer | no | >= 0 | 0 | 1 |
| tally_abstain | integer | no | >= 0 | 0 | 1 |
| eligible_count | integer | no | copied from proposal | none | 42 |
| quorum_required | integer | no | copied from proposal | none | 9 |
| approval_threshold_bp | smallint | no | copied from proposal | none | 6667 |
| decided_at | timestamptz | no | immutable | now | 2026-11-21T09:00:02.004Z |
| result_sha256 | char(64) | no | SHA-256 of canonical JSON of the tally block | computed | 3ab0…(64 hex) |

### audit_entry
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| audit_entry_id | char(26) | no | PK | generated | 01J9ZC1D2E3F4G5H6J7K8M9N0P |
| community_id | char(26) | no | FK community | none | 01J9Z3K8Q0M5R7T2X4V6B8N1C3 |
| seq | bigint | no | >= 1; unique with community_id; contiguous | none | 17 |
| event_type | varchar(80) | no | event names in [commands](commands_queries_events.md) | none | governance.role.granted.v1 |
| aggregate_type | varchar(32) | no | `community`, `charter_version`, `role_assignment`, `governance_proposal`, `governance_decision` | none | role_assignment |
| aggregate_id | char(26) | no | ID of aggregate | none | 01J9Z6M0N1P2Q3R4S5T6U7V8W9 |
| actor_ref | char(64) | no | HMAC-SHA256 hex of participant_id, or literal `system` (A-governance-24) | none | system |
| occurred_at | timestamptz | no | server clock | now | 2026-11-13T10:00:00.000Z |
| payload_json | jsonb | no | <= 2048 bytes; IDs, codes and counts only; no free text | none | {"proposal_id":"01J9Z5…"} |
| prev_hash | char(64) | no | genesis entry uses 64 zeros | none | 0000…0000 |
| entry_hash | char(64) | no | SHA-256 over prev_hash and canonical entry (A-governance-11) | computed | 7d1e…(64 hex) |

### idempotency_record
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| principal_ref | char(64) | no | HMAC-SHA256 hex of caller ID; PK part | none | 4c8a…(64 hex) |
| idempotency_key | char(26) | no | ULID; PK part | none | 01J9ZD2E3F4G5H6J7K8M9N0P1Q |
| command_name | varchar(64) | no | command in [commands](commands_queries_events.md) | none | CreateProposal |
| request_sha256 | char(64) | no | hash of canonical request body | none | 5e21…(64 hex) |
| response_status | smallint | no | HTTP status returned first time | none | 201 |
| response_body_json | jsonb | no | <= 8192 bytes | none | {"proposal_id":"01J9Z5…"} |
| expires_at | timestamptz | no | created_at + 7 days (A-governance-15) | computed | 2026-11-17T09:30:00.000Z |

## Invariants
- I1: at most one `charter_version` with status `active` per community (partial unique index).
- I2: at most one active `role_assignment` per (community_id, participant_id, role) where `revoked_at` is null.
- I3: an `active` community has at least one active steward. Revocation that would break this is rejected in the same transaction.
- I4: at most one `vote` per (proposal_id, voter_participant_id).
- I5: a `governance_decision` row exists if and only if the proposal state is `adopted`, `rejected`, `no_quorum`, `executed` or `execution_failed`.
- I6: `audit_entry.seq` is contiguous per community starting at 1. `prev_hash` equals the previous `entry_hash`.
- I7: `governance_decision` rows are never updated after insert. A `charter_version` row is immutable once `active`, except that `status`, `activated_at` and `superseded_at` each change once, in that order.
- I8: `payload_json` contains only IDs and enumerated values. Free text lives only in `title` and `rationale_text`.
- I9: `proposal_eligibility` rows are written once at open and never change.

## Example: governance_proposal (steward_grant, open)
```json
{
  "proposal_id": "01J9Z5R6S7T8U9V0W1X2Y3Z4A5",
  "community_id": "01J9Z3K8Q0M5R7T2X4V6B8N1C3",
  "proposal_type": "steward_grant",
  "state": "open",
  "proposer_participant_id": "01J9Z2P7W8X9Y0Z1A2B3C4D5E6",
  "title": "Admit a second moderator steward",
  "payload_json": { "target_participant_id": "01J9Z8Q9R0S1T2U3V4W5X6Y7Z8" },
  "voting_window_hours": 168,
  "eligible_count": 42,
  "quorum_required": 9,
  "approval_threshold_bp": 5000,
  "revision": 3
}
```

## Open decisions
- A-governance-01: ULID IDs, pending the CTR-ID-001 decision (D10 related). Replace if CTR-ID-001 chooses UUIDv7.
- A-governance-03: membership standing (active member for at least 14 days) is read from an external membership query. This module does not write membership.
- A-governance-11: audit log is a per-community SHA-256 hash chain, append-only at the storage layer. Chain verification is a scheduled job.
- A-governance-16: MVP proposal types are the three listed above. Founder transfer and community archival are deferred to a later spec revision.
- A-governance-24: erasure replaces `participant_id` with the all-zero sentinel `00000000000000000000000000` and destroys the per-subject HMAC key, so `actor_ref` values cannot be linked back.
- Related decision: D05 (coarse `region_code` only), D07 (retention, see [privacy](privacy_retention_abuse.md)).
