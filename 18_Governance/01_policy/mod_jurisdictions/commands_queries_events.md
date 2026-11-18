# PS-145-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-145-04. **Owner:** [18_Governance/01_policy/mod_jurisdictions](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_jurisdictions. **Consumers:** mod_prohibited, mod_goods, 01_LocalBazaar/01_listings/mod_publish, 06_Discovery, 11_Federation, 12_Moderation (see A-jurisdictions-17).

## Purpose and scope
Define the versioned command, query and event interface of the jurisdiction register. Other modules use the resolve query and the coverage events; operators use the command set. Do not assume implementation or successful external settlement.

## Requirements to specify
- PS-145-04.R01: Business outcome: operators change jurisdiction profiles through commands; consumers read the in-force answer through `jurisdiction.resolve` and react to events. Exclusions: no command creates or edits rule content; no command activates a revision directly (activation is the job only); no bulk free-text search.
- PS-145-04.R02: Cases: normal command and query; invalid payload (see validation file); duplicate command (same Idempotency-Key replayed); concurrent command (stale expected_row_version); offline client (no queued writes); adversarial caller (forged actor, oversized list, unknown fields rejected, not ignored).
- PS-145-04.R03: Budgets and accessibility: resolve p95 100 ms server-side; list and get p95 150 ms; commands p95 300 ms (see observability file). Operator console forms follow WCAG 2.2 AA; API messages are localized via message_key.
- PS-145-04.R04: Envelope: every command carries `schema_version` (semver, major must be 1), `Idempotency-Key` (UUID v4, required on all state-changing commands) and `expected_row_version` where a transition is conditional. Responses carry `row_version`, `revision_id`, `state` and `correlation_id`.
- PS-145-04.R05: Unknown request fields are rejected with JURISDICTIONS_SCHEMA_VERSION_UNSUPPORTED or JURISDICTIONS_CODE_INVALID as applicable; they are never silently dropped, so that clients cannot smuggle location-precision data.
- PS-145-04.R06: Events follow the CTR-EVT-001 envelope with `event_id`, `aggregate_id`, `aggregate_revision`, `actor_ref`, `occurred_at`, `correlation_id`, `provenance`, `schema_version` and `payload`. Event names carry the major version suffix (`.v1`). Events never carry internal_note, approver free text or precise location.
- PS-145-04.R07: Interfaces and consumers: this module is the producer of the events below. Downstream consumers are listed in the table at the end of this file; each consumer must dedupe on `event_id`.

## Commands
Common header: `Idempotency-Key`, `schema_version: 1.0.0`, authenticated actor (pseudonymous). Signatures are shown as request schemas.

| Command | Request fields | Response | Idempotent by key | Concurrency control |
|---|---|---|---|---|
| jurisdiction.create_draft | jurisdiction_id (optional; omit for NEW_JURISDICTION), scope_code, parent_scope_code, name_key, region_codes[], prohibited_ruleset_ref, goods_ruleset_ref, effective_from, change_reason_code, internal_note | jurisdiction_id, revision_id, revision_no, state=DRAFT, row_version | yes | jurisdiction row lock; create conflicts return CODE_DUPLICATE or STATE_CONFLICT |
| jurisdiction.submit_revision | revision_id, expected_row_version | revision_id, state=PENDING_REVIEW, row_version | yes | expected_row_version required |
| jurisdiction.approve_revision | revision_id, expected_row_version | revision_id, state=APPROVED, effective_from, row_version | yes | expected_row_version required |
| jurisdiction.reject_revision | revision_id, expected_row_version, reason_code (`POLICY_MISMATCH`, `REGION_UNCLEAR`, `RULESET_MISSING`, `OTHER`) | revision_id, state=REJECTED, row_version | yes | expected_row_version required |
| jurisdiction.return_revision | revision_id, expected_row_version, reason_code (as above) | revision_id, state=DRAFT, row_version | yes | expected_row_version required |
| jurisdiction.withdraw_revision | revision_id, expected_row_version | revision_id, state=WITHDRAWN, row_version | yes | expected_row_version required |

Retirement uses `create_draft` with change_reason_code = RETIREMENT and region_codes = [], followed by submit and approve like any revision. Activation is not a command.

## Queries
| Query | Parameters | Result | Visibility |
|---|---|---|---|
| jurisdiction.get | jurisdiction_id, as_of (optional UTC timestamp) | jurisdiction row, in-force revision at as_of (or now), derived status | public projection for everyone; full fields for operators (see authorization file) |
| jurisdiction.list | scope_prefix (optional), status[] (optional), cursor, limit (max 100) | page of public projections | public projection |
| jurisdiction.resolve | region_codes[] (1 to 50), at (optional UTC, default now) | status (RESOLVED or UNRESOLVED), matches[] | public |
| jurisdiction.history | jurisdiction_id, cursor, limit (max 100) | revisions and state changes | governance roles only |

Resolve semantics: for each requested region code R, the query returns (a) jurisdictions whose in-force revision at `at` lists R exactly (match_basis = EXACT) and (b) jurisdictions whose in-force revision lists an ancestor of R, where the ancestor is the country part of R (match_basis = ANCESTOR) (A-jurisdictions-08). `UNRESOLVED` means no match for any requested code; it is a successful result.

## Request and response examples
Create a draft (request):
```json
{
  "schema_version": "1.0.0",
  "scope_code": "US-CA",
  "parent_scope_code": "US",
  "name_key": "jur.us_ca.name",
  "region_codes": ["US-CA"],
  "prohibited_ruleset_ref": "rs_01J9ZK5B2P8Q4R6S0T3V7W9X1Y",
  "goods_ruleset_ref": null,
  "effective_from": "2026-11-12T00:00:00.000Z",
  "change_reason_code": "NEW_JURISDICTION",
  "internal_note": null
}
```
Headers: `Idempotency-Key: 6b1f9c2e-3d4a-4f7e-9a10-2c8d5e7f0a11`. Response 201:
```json
{
  "jurisdiction_id": "01J9ZK3Q8V2M7R4T6W1X5Y0B9C",
  "revision_id": "01J9ZK4A1N7X3C5E8G2H6J0K4M",
  "revision_no": 1,
  "state": "DRAFT",
  "row_version": 1,
  "correlation_id": "c3a1e0d4-7b2f-4e8a-8d61-5f9b0c2e7a33"
}
```

Resolve (request) and response 200:
```json
{ "schema_version": "1.0.0", "region_codes": ["US-CA"], "at": "2026-11-12T00:00:00.000Z" }
```
```json
{
  "status": "RESOLVED",
  "matches": [
    { "jurisdiction_id": "01J9ZK3Q8V2M7R4T6W1X5Y0B9C", "scope_code": "US-CA", "revision_id": "01J9ZK4A1N7X3C5E8G2H6J0K4M", "match_basis": "EXACT", "prohibited_ruleset_ref": "rs_01J9ZK5B2P8Q4R6S0T3V7W9X1Y", "goods_ruleset_ref": null },
    { "jurisdiction_id": "01J9ZK2F6H8J0K2M4N6P8Q0R2S", "scope_code": "US", "revision_id": "01J9ZK2G7J9K1M3N5P7Q9R1S3T", "match_basis": "ANCESTOR", "prohibited_ruleset_ref": "rs_01J9ZK2H8K0M2N4P6Q8R0S2T4V", "goods_ruleset_ref": null }
  ],
  "correlation_id": "d8e2a1f0-5c3b-4a9d-8e72-1b6c4f0d9a44"
}
```

## Events
| Event | Emitted when | Payload keys (besides envelope) |
|---|---|---|
| jurisdiction.created.v1 | new profile created | jurisdiction_id, scope_code, level, parent_scope_code |
| jurisdiction.revision_drafted.v1 | any draft created | jurisdiction_id, revision_id, revision_no, change_reason_code |
| jurisdiction.revision_submitted.v1 | submit | revision_id, revision_no |
| jurisdiction.revision_approved.v1 | approve | revision_id, revision_no, effective_from |
| jurisdiction.revision_rejected.v1 | reject | revision_id, revision_no, reason_code |
| jurisdiction.revision_returned.v1 | return or expiry | revision_id, revision_no, reason_code (`EXPIRED_REVIEW` for expiry) |
| jurisdiction.revision_withdrawn.v1 | withdraw or activation_blocked | revision_id, revision_no, reason_code |
| jurisdiction.revision_activated.v1 | activation job | revision_id, revision_no, effective_from, state (ACTIVE or RETIRED) |
| jurisdiction.revision_superseded.v1 | prior ACTIVE revision ends | revision_id, revision_no, effective_until |
| jurisdiction.coverage_changed.v1 | activation where region_codes differ from predecessor | jurisdiction_id, added_region_codes[], removed_region_codes[], effective_from |
| jurisdiction.retired.v1 | RETIRED reached | jurisdiction_id, retired_at |
| jurisdiction.activation_blocked.v1 | activation job found ruleset not ACTIVE | revision_id, revision_no, blocked_ref_kind (`PROHIBITED` or `GOODS`) |

Example envelope (coverage change):
```json
{
  "event_id": "01J9ZK7M3P5Q7R9S1T3V5W7X9Y",
  "event_type": "jurisdiction.coverage_changed.v1",
  "aggregate_id": "01J9ZK3Q8V2M7R4T6W1X5Y0B9C",
  "aggregate_revision": 3,
  "actor_ref": "SYSTEM",
  "occurred_at": "2026-11-12T00:00:02.114Z",
  "correlation_id": "c3a1e0d4-7b2f-4e8a-8d61-5f9b0c2e7a33",
  "provenance": "SCHEDULER",
  "schema_version": "1.0.0",
  "signature": null,
  "payload": { "jurisdiction_id": "01J9ZK3Q8V2M7R4T6W1X5Y0B9C", "added_region_codes": [], "removed_region_codes": ["US-CA-X1"], "effective_from": "2026-11-12T00:00:00.000Z" }
}
```
Note: `US-CA-X1` above is a deliberately invalid catalog code used only to show the shape; a real removed code must come from the catalog.

## Consumers (inferred, not yet in the dependency matrix)
| Consumer | Uses | Reads or subscribes |
|---|---|---|
| mod_prohibited (01_policy) | ruleset refs; jurisdiction_id | resolve, coverage_changed, revision_activated |
| mod_goods (01_policy) | ruleset refs; jurisdiction_id | resolve, coverage_changed, revision_activated |
| 01_LocalBazaar/01_listings/mod_publish | resolve for listing region | resolve (synchronous) |
| 06_Discovery | region filter | resolve, coverage_changed |
| 11_Federation | region-scoped delivery | coverage_changed (after CTR-FED-001 approval) |
| 12_Moderation | jurisdiction routing of reports | revision_activated, jurisdiction.retired |

## Open decisions
- A-jurisdictions-08: Resolve includes ancestor country matches. Alternative: exact match only, with consumers doing their own parent lookup.
- A-jurisdictions-17: Consumer list is inferred from the module map and the module SPEC downstream list. It is not in planning/DEPENDENCY_MATRIX.md (root DEPENDENCY_MATRIX.md lists only F07, F10, F15, F16) and needs confirmation in Prompt 3. Subscriber maps are a cross-module contract gap.
- Cross-reference: A-jurisdictions-02 (ID format) and CTR-EVT-001, CTR-ERR-001 in [contract placeholders](../../../planning/CONTRACTS.md).

## Acceptance criteria
- [ ] Every command and query in the tables has a contract test (TEST-PS-145-04-T01 to T07).
- [ ] Event payloads validated against the envelope schema in CI (TEST-PS-145-04-T05).
- [ ] Security and architecture review approval (future gate).
