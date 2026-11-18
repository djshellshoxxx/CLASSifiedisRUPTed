# PS-147-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-147-02. **Owner:** [18_Governance/02_community/mod_governance](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_governance. **Consumers:** F13 notifications, [mod_transparency](../mod_transparency/SPEC.md), F12 moderation (proposed; see [dependency matrix](../../../DEPENDENCY_MATRIX.md)).

## Requirements
- PS-147-02.R01: Business outcome, actors and exclusions. Validation guarantees that only well-formed, authorized, state-valid governance changes reach storage. It does not decide whether a proposal is wise, and it does not validate membership standing (owned by the membership source, A-governance-03).
- PS-147-02.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial inputs are each mapped to one error code in the catalogue below. Duplicate and offline replays are handled by [failure recovery](failure_recovery_idempotency.md).
- PS-147-02.R03: Error messages are localized through `message_key` (CTR-ERR-001). Error payloads carry no personal data and no title, body or rationale text. Validation budget: p95 under 5 ms per command, excluding dependency calls.
- PS-147-02.R04: Every rejection returns exactly one code from the catalogue. Codes are stable and never reused for another meaning.
- PS-147-02.R05: Payload schema per `proposal_type` is closed. Unknown fields are rejected.
- PS-147-02.R06: Quorum, approval thresholds and voting windows are computed by the rules in this file, and nowhere else.

## Normalization and validation order
1. Parse the request. Reject bodies over 16 KB with `GOVERNANCE_PAYLOAD_TOO_LARGE`.
2. Authenticate and resolve capability (see [authorization](authorization_capabilities.md)). Failure: `GOVERNANCE_NOT_AUTHORIZED`.
3. Normalize text to NFC, then check field constraints. Failure: field code below.
4. Load the community. Status `frozen` or `archived` rejects every write except operator `SetCommunityStatus`: `GOVERNANCE_COMMUNITY_NOT_ACTIVE`.
5. Load the target aggregate and compare `revision` if supplied. Mismatch: `GOVERNANCE_CONCURRENT_MODIFICATION`.
6. Check state (see [workflow](workflow_state_machine.md)). Failure: `GOVERNANCE_PROPOSAL_STATE_INVALID` or `GOVERNANCE_VOTING_CLOSED`.
7. Check business guards (steward cap, last steward, eligibility, limits).

## Field rules
| Input | Rule | Code on failure |
|---|---|---|
| slug | `^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$`, unique | `GOVERNANCE_SLUG_INVALID`, `GOVERNANCE_SLUG_TAKEN` |
| display_name | 1–80 code points, no controls | `GOVERNANCE_NAME_INVALID` |
| body_text | 1–20000 code points, LF and TAB only as controls | `GOVERNANCE_CHARTER_BODY_INVALID` |
| body_locale | BCP 47, max 35 characters, well-formed | `GOVERNANCE_CHARTER_LOCALE_INVALID` |
| title | 1–120 code points, no controls | `GOVERNANCE_TITLE_INVALID` |
| rationale_text | 0–2000 code points, LF and TAB only | `GOVERNANCE_RATIONALE_TOO_LONG` (over length) or `GOVERNANCE_TITLE_INVALID` (controls) |
| proposal_type | one of three enumerated values | `GOVERNANCE_PAYLOAD_INVALID` |
| payload_json | serialized <= 4096 bytes; matches type schema (R05) | `GOVERNANCE_PAYLOAD_TOO_LARGE`, `GOVERNANCE_PAYLOAD_INVALID` |
| voting_window_hours | integer 24–720 | `GOVERNANCE_VOTING_WINDOW_INVALID` |
| choice | `approve`, `reject`, `abstain` | `GOVERNANCE_VOTE_CHOICE_INVALID` |
| Idempotency-Key | ULID, 26 characters | `GOVERNANCE_IDEMPOTENCY_KEY_INVALID` |

## Payload schema per proposal_type (closed)
- `charter_amend`: `{ "charter_version_id": ULID }`. Must reference a charter version in status `draft` belonging to the same community, with non-empty `body_text`. Otherwise `GOVERNANCE_CHARTER_TARGET_MISSING`.
- `steward_grant`: `{ "target_participant_id": ULID }`. Target must hold `active` standing (A-governance-03) and must not already be an active steward. Otherwise `GOVERNANCE_TARGET_NOT_ELIGIBLE` or `GOVERNANCE_TARGET_ALREADY_STEWARD`. Grant is rejected at open if active stewards already equal 9: `GOVERNANCE_STEWARD_CAP_REACHED`.
- `steward_revoke`: `{ "role_assignment_id": ULID }`. Target must be an active steward role. Otherwise `GOVERNANCE_ROLE_NOT_ACTIVE`. Revocation that would leave zero active stewards is rejected: `GOVERNANCE_LAST_STEWARD`.

## Quorum, threshold and eligibility rules (A-governance-04, -07, -08, -17)
- Eligible voters = snapshot of standing participants at open. Fewer than 3: `GOVERNANCE_ELIGIBLE_TOO_FEW`. More than 10000: `GOVERNANCE_ELIGIBLE_SET_TOO_LARGE`.
- `quorum_required = max(3, ceil(0.20 × eligible_count))`. Quorum counts approve, reject and abstain votes.
- `approval_threshold_bp`: `charter_amend` 6667; `steward_revoke` 6667; `steward_grant` 5000.
- Adopted if and only if quorum is met and `approve × 10000 > approval_threshold_bp × (approve + reject)`. Ties always reject. With threshold 5000 this is strict majority of decisive votes.
- Voting window: default 168 hours; accepted range 24–720 hours. Outside range: `GOVERNANCE_VOTING_WINDOW_INVALID`.
- Steward count bounds: maximum 9 active stewards, minimum 1 while the community is `active`.

## Rate and limit checks (A-governance-22)
- Open plus draft proposals per proposer: at most 5. Over: `GOVERNANCE_PROPOSAL_LIMIT_REACHED`.
- Open proposals per community: at most 10. Over: `GOVERNANCE_PROPOSAL_LIMIT_REACHED`.
- Writes per participant: 30 per minute. Over: `GOVERNANCE_RATE_LIMITED` with `Retry-After`.

## Error catalogue
Typed envelope (CTR-ERR-001 placeholder fields): `code`, `http_status`, `retryable`, `message_key`, `diagnostics_id`. `diagnostics_id` is an opaque ID that support staff can join to logs without personal data.

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_NOT_AUTHORIZED | 403 | no | Caller lacks capability |
| GOVERNANCE_COMMUNITY_NOT_FOUND | 404 | no | Unknown community_id |
| GOVERNANCE_COMMUNITY_NOT_ACTIVE | 409 | no | Community frozen or archived |
| GOVERNANCE_SLUG_INVALID | 422 | no | Slug format |
| GOVERNANCE_SLUG_TAKEN | 409 | no | Slug already used |
| GOVERNANCE_NAME_INVALID | 422 | no | display_name rule failed |
| GOVERNANCE_CHARTER_BODY_INVALID | 422 | no | body_text rule failed |
| GOVERNANCE_CHARTER_LOCALE_INVALID | 422 | no | body_locale rule failed |
| GOVERNANCE_CHARTER_NOT_DRAFT | 409 | no | Mutation attempted on active or superseded charter |
| GOVERNANCE_CHARTER_TARGET_MISSING | 422 | no | charter_amend target not a valid draft |
| GOVERNANCE_TITLE_INVALID | 422 | no | title rule failed |
| GOVERNANCE_RATIONALE_TOO_LONG | 422 | no | rationale_text over 2000 code points |
| GOVERNANCE_PAYLOAD_INVALID | 422 | no | Payload fails closed schema |
| GOVERNANCE_PAYLOAD_TOO_LARGE | 413 | no | Payload over 4096 bytes or body over 16 KB |
| GOVERNANCE_PROPOSAL_NOT_FOUND | 404 | no | Unknown proposal_id |
| GOVERNANCE_PROPOSAL_STATE_INVALID | 409 | no | Transition not allowed from current state |
| GOVERNANCE_PROPOSAL_LIMIT_REACHED | 429 | no | Proposal count limit |
| GOVERNANCE_VOTING_WINDOW_INVALID | 422 | no | Window outside 24–720 hours |
| GOVERNANCE_ELIGIBLE_TOO_FEW | 422 | no | Fewer than 3 eligible voters |
| GOVERNANCE_ELIGIBLE_SET_TOO_LARGE | 422 | no | More than 10000 eligible voters |
| GOVERNANCE_TARGET_NOT_ELIGIBLE | 422 | no | Grant target lacks standing |
| GOVERNANCE_TARGET_ALREADY_STEWARD | 409 | no | Grant target already active |
| GOVERNANCE_ROLE_NOT_ACTIVE | 409 | no | Revoke target not an active role |
| GOVERNANCE_LAST_STEWARD | 409 | no | Revoke would leave zero stewards |
| GOVERNANCE_STEWARD_CAP_REACHED | 409 | no | Nine active stewards already |
| GOVERNANCE_VOTE_NOT_ELIGIBLE | 403 | no | Voter not in eligibility snapshot |
| GOVERNANCE_VOTING_CLOSED | 409 | no | Vote after voting_closes_at or after close |
| GOVERNANCE_VOTE_CHOICE_INVALID | 422 | no | Choice not in enumeration |
| GOVERNANCE_CONCURRENT_MODIFICATION | 409 | yes, after refetch | revision mismatch |
| GOVERNANCE_IDEMPOTENCY_KEY_INVALID | 400 | no | Key not a ULID |
| GOVERNANCE_IDEMPOTENCY_KEY_REUSED | 409 | no | Same key, different request body |
| GOVERNANCE_SCHEMA_VERSION_UNSUPPORTED | 400 | no | Request schema_version unknown |
| GOVERNANCE_RATE_LIMITED | 429 | yes, after Retry-After | Rate limit |
| GOVERNANCE_DEPENDENCY_UNAVAILABLE | 503 | yes | Membership query or store unavailable |
| GOVERNANCE_IMPORT_CONFLICT | 409 | no | Import collides with existing IDs (see [import](import_export_backup_rollback.md)) |

## Open decisions
- A-governance-04: quorum 20 percent with minimum 3, and thresholds 5000 or 6667 by type. Default adopted; review with stewards in pilot.
- A-governance-07: minimum 3 and maximum 10000 eligible voters per proposal.
- A-governance-08: voting window 24–720 hours, default 168.
- A-governance-17: steward cap 9, minimum 1.
- A-governance-22: rate limits (5 open plus draft per proposer, 10 open per community, 30 writes per minute per participant). Values are defaults, not measured.
