# PS-146-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-04. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [12_Moderation](../../../12_Moderation); [13_Notifications](../../../13_Notifications). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-04.R01: Business outcome. Owner services get a single synchronous evaluation call per checkpoint; reviewers and administrators get explicit, audited commands; downstream consumers get versioned events for decisions, holds and version changes.
- Exclusions: transport choice (HTTP or RPC) is per F15; this spec defines logical contracts. Subject data is supplied by callers (A-prohibited-06).
- Conventions: all commands carry `schema_version: "1"`, `request_id`, `actor` (derived from credential, never trusted from body), and, for state-changing commands, `idempotency_key`. Errors use the envelope in validation_rules.md.

## Commands
| Command | Signature (logical) | Idempotency key | Caller |
|---|---|---|---|
| `prohibited.policy_version.create` | `create(source_version_id?: ULID, rules?: Rule[]) -> PolicyVersion` | `policy:create:{actor_id}:{client_token}` (client_token 1..64 chars) | policy author |
| `prohibited.policy_version.update_editing` | `update_editing(policy_version_id, expected_row_version, rules_patch) -> PolicyVersion` | not required; guarded by expected_row_version | policy author |
| `prohibited.policy_version.approve` | `approve(policy_version_id, expected_row_version, effective_from?) -> PolicyVersion` | `approve:{policy_version_id}:{expected_row_version}` | approver |
| `prohibited.policy_version.discard` | `discard(policy_version_id, expected_row_version) -> PolicyVersion` | not required; guarded by expected_row_version | policy author |
| `prohibited.decision.evaluate` | `evaluate(snapshot: SubjectSnapshot) -> PolicyDecision` | `{subject_type}:{subject_id}:{subject_revision}:{checkpoint}` (required, unique per caller) | owner service principal |
| `prohibited.hold.resolve` | `resolve(hold_id, expected_row_version, resolution_code, reviewer_note?) -> PolicyHold` | `resolve:{hold_id}:{expected_row_version}` | reviewer |
| `prohibited.hold.escalate` | `escalate(hold_id, expected_row_version, reason_code) -> PolicyHold` | `escalate:{hold_id}:{expected_row_version}` | reviewer or scheduler |
| `prohibited.hold.withdraw` | `withdraw(hold_id, expected_row_version) -> PolicyHold` | `withdraw:{hold_id}:{expected_row_version}` | owner service principal on owner's request |
| `prohibited.reevaluation.run` | `run(policy_version_id, cursor?) -> ReevaluationBatch` | `reeval:{policy_version_id}:{cursor}` | scheduler (internal only) |

## Queries
| Query | Signature (logical) | Returns |
|---|---|---|
| `prohibited.policy_version.get_active_public` | `get_active_public() -> PublicPolicySummary` | version_number, effective_from, category titles and public_title_key per rule. Never match terms or structured flags. |
| `prohibited.policy_version.get` | `get(policy_version_id) -> PolicyVersion` | Full version metadata (auditor, administrator). |
| `prohibited.decision.get` | `get(decision_id) -> PolicyDecision` | Decision; participants see own subject only, with rule_codes and public_title_keys. |
| `prohibited.decision.list_by_subject` | `list_by_subject(subject_type, subject_id, cursor?, limit=25) -> Page<PolicyDecision>` | Newest first; limit 1..100. |
| `prohibited.hold.list_open` | `list_open(cursor?, limit=25, status_in?) -> Page<PolicyHold>` | Reviewer queue ordered by due_at ascending. |
| `prohibited.audit.list` | `list(target_type?, target_id?, from?, to?, cursor?, limit=50) -> Page<PolicyAuditEntry>` | Auditor only. |

Example request and response for evaluate (checkpoint PUBLISH, HOLD outcome):
```json
{"schema_version": "1", "request_id": "req_01JDQD1A9B3C5D7E9F1G3H5J7K",
 "idempotency_key": "LISTING:01JDQ8L1S4H7B2C9F5G0J3K6MN:5:PUBLISH",
 "snapshot": {"subject_type": "LISTING", "subject_id": "01JDQ8L1S4H7B2C9F5G0J3K6MN",
   "subject_revision": 5, "checkpoint": "PUBLISH",
   "title": "Used item, pickup only", "description": "Good condition, cash on pickup.",
   "category_code": "CAT_TOOLS_GENERAL", "structured_flags": [], "jurisdiction_hint": "DE"}}
```
```json
{"schema_version": "1", "request_id": "req_01JDQD1A9B3C5D7E9F1G3H5J7K",
 "decision": {"decision_id": "01JDQ9D3EC1S0N7F2K8M4N6P1Z", "subject_type": "LISTING",
   "subject_id": "01JDQ8L1S4H7B2C9F5G0J3K6MN", "subject_revision": 5, "checkpoint": "PUBLISH",
   "policy_version_id": "01JDQ7M3V8K2Z5N0R4T6W9X1A2", "outcome": "HOLD",
   "rule_codes": ["PRH-WPN-001"], "category_codes": [], "jurisdiction_hint": "DE",
   "hold_id": "01JDQAH6R2T8V4W1Y7Z3C5E9F0GH", "status": "RECORDED",
   "evaluated_at": "2026-11-10T09:14:02.118Z", "schema_version": "1"}}
```
The response carries no subject text and no matched term; only rule_codes.

## Events
All events use the envelope required by CTR-EVT-001 (event_id, aggregate_type, aggregate_id, revision, actor_id, occurred_at, correlation_id, idempotency_key, schema_version, provenance). Event names carry a `.v1` major suffix; a breaking change publishes `.v2` alongside `.v1` for one release window.

| Event | Emitted by | Payload (identifiers only) |
|---|---|---|
| `prohibited.policy_version.activated.v1` | approve | policy_version_id, version_number, effective_from, content_sha256 |
| `prohibited.policy_version.retired.v1` | swap | policy_version_id, successor_policy_version_id |
| `prohibited.decision.recorded.v1` | evaluate, resolve | decision_id, subject_type, subject_id, subject_revision, outcome, rule_codes |
| `prohibited.decision.superseded.v1` | evaluate, resolve | decision_id, superseded_by_decision_id |
| `prohibited.hold.opened.v1` | evaluate | hold_id, decision_id, subject_type, subject_id, due_at |
| `prohibited.hold.escalated.v1` | escalate, scheduler | hold_id, escalated_at |
| `prohibited.hold.resolved.v1` | resolve | hold_id, resolution_code, resolved_at |
| `prohibited.hold.withdrawn.v1` | withdraw | hold_id, withdrawn_at |
| `prohibited.reevaluation.completed.v1` | run | policy_version_id, processed_count, changed_count |

Consumers subscribe by event name and dedupe by event_id. Event payloads never include reviewer_note or match_terms.

## Schema versioning
- PS-146-04.R02: Every command, query response and event carries `schema_version`. This spec defines version `"1"`.
- Additive optional fields are minor and do not change the major. Removing or renaming a field, or changing an enum meaning, requires a new major (`.v2` events, `schema_version: "2"`).
- Unknown `schema_version` returns PROHIBITED_SCHEMA_VERSION_UNSUPPORTED. Consumers ignore unknown optional fields.
- Registry entry follows CTR-SCH-001 (F15). Until published, A-prohibited-02 applies.

## Open decisions
- A-prohibited-02 (envelope and schema registry shape), A-prohibited-03 (command capability names, see authorization_capabilities.md), A-prohibited-06 (snapshot contract with owner modules), A-prohibited-16 (appeal handoff is out of scope; no appeal command here).
- The `client_token` format for policy creation is provisional (1..64 chars, ASCII).
