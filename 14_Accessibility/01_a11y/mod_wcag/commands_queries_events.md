# PS-111-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-111-04. **Owner:** [14_Accessibility/01_a11y/mod_wcag](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_wcag. **Consumers:** F07, F10, F15, F16 shared contracts per [dependency matrix](../../../DEPENDENCY_MATRIX.md); release gate, notifications, evidence per [01_a11y SPEC](../SPEC.md).

## Purpose and scope
**Business outcome:** release tools, reviewers and managers have a small, versioned set of commands and queries to start checks, record results, review findings, manage waivers and read the gate.

**Exclusions:** no command edits the criterion catalog; no command deletes a row; no command accepts personal data beyond pseudonymous actor IDs; no command publishes a public conformance statement.

## Requirements
- PS-111-04.R01 — Outcome, actors and exclusions as stated above.
- PS-111-04.R02 — Every command is idempotent under its `Idempotency-Key`. Cases covered: duplicate delivery, retry after timeout, stale expected version, out-of-order batch, replay after revocation.
- PS-111-04.R03 — Budgets: command p95 500 ms server-side; query p95 200 ms for `wcag.gate.get`, 300 ms for list queries (see [observability_performance.md](observability_performance.md)).
- PS-111-04.R04 — Command catalogue with signatures, examples and idempotency keys.
- PS-111-04.R05 — Query catalogue with pagination rules.
- PS-111-04.R06 — Event catalogue; every state change emits exactly one event through the outbox.
- PS-111-04.R07 — Schema version on every command, query response and event. Compatibility follows CTR-SCH-001 (owner F15).

## Common envelope
- Transport: HTTPS JSON. Body is `application/json; charset=utf-8`, max 256 KiB (batch max 200 findings, so practical size is below this).
- Header `Idempotency-Key` required on every command (format in [validation_rules.md](validation_rules.md)).
- Body field `schema_version`: string `"1.0"` for this release. Major change breaks compatibility; minor adds optional fields only.
- Actor is taken from the authenticated token, never from the body except where a field is explicitly named `*_actor_id` (waiver approver, reviewer).
- Response header `X-Correlation-Id` echoed on every response.

## Commands
Signatures use the notation `name(params) -> result`. `?` marks optional.

1. **`wcag.profile.set`** — `SetWcagProfile(scope_key, wcag_version, target_level, status, expected_version?) -> WcagProfile`. Create when `expected_version` is absent. Otherwise compare-and-set. Returns 201 on create, 200 on update.
2. **`wcag.check_run.start`** — `StartCheckRun(scope_key, surface_id, release_ref, method, tool_name?, tool_version?) -> WcagCheckRun`. Returns 201 with status QUEUED.
3. **`wcag.check_run.record_findings`** — `RecordFindings(check_run_id, findings[1..200]) -> {accepted, revisions[]}`. All-or-nothing. Returns 200.
4. **`wcag.check_run.complete`** — `CompleteCheckRun(check_run_id) -> WcagCheckRun`. Requires exact coverage (see workflow).
5. **`wcag.check_run.cancel`** — `CancelCheckRun(check_run_id, reason_code) -> WcagCheckRun`. `reason_code` enum: `SUPERSEDED`, `WRONG_RELEASE`, `OPERATOR_STOP`.
6. **`wcag.finding.review`** — `ReviewFinding(finding_id, expected_revision, outcome, reviewer_actor_id, note?) -> WcagFinding`. Sets review_state CONFIRMED when outcome equals the prior outcome, OVERRIDDEN otherwise.
7. **`wcag.waiver.grant`** — `GrantWaiver(surface_id, sc_id, reason_code, expires_at, requested_by_actor_id, note?) -> WcagWaiver`. Called by the approver. `requested_by_actor_id` must match the requester recorded by the review tracker (A-wcag-08). Returns 201.
8. **`wcag.waiver.revoke`** — `RevokeWaiver(waiver_id, reason_code) -> WcagWaiver`. `reason_code` enum: `ISSUE_FIXED`, `SCOPE_CHANGED`, `GRANTED_IN_ERROR`.

## Queries
- **`wcag.profile.get`** — `GetWcagProfile(scope_key) -> WcagProfile`.
- **`wcag.gate.get`** — `GetGate(surface_id, release_ref) -> GateResult`. `GateResult` = `{gate_status, check_run_id?, failing_sc_ids[], waived_sc_ids[], unreviewed_sc_ids[], catalog_version, schema_version}`. Lists are sorted by `sc_id`, max 50 entries each.
- **`wcag.check_run.get`** — `GetCheckRun(check_run_id) -> WcagCheckRun`.
- **`wcag.findings.list`** — `ListFindings(check_run_id, outcome?, cursor?, limit?) -> Page<WcagFinding>`. `limit` 1..100, default 50.
- **`wcag.waivers.list`** — `ListWaivers(surface_id, status?, cursor?, limit?) -> Page<WcagWaiver>`.
- **`wcag.criteria.list`** — `ListCriteria(catalog_version, level?) -> Page<WcagCriterion>`.

Pagination: opaque cursor, valid for 1 hour, returns `next_cursor` or null. Cursor encodes the last sort key only.

## Example: record findings
Request:
```http
POST /v1/wcag/check-runs/01J9Z4R7T8U9V0W1X2Y3Z4A5B6/findings HTTP/1.1
Idempotency-Key: rec-01J9Z4R7-batch-0007
Content-Type: application/json

{
  "schema_version": "1.0",
  "findings": [
    {"sc_id": "1.4.3", "outcome": "FAIL", "note": "Badge text contrast 3.9:1", "evidence_ref": "evidence:shot-0a91c3e2"},
    {"sc_id": "2.4.7", "outcome": "PASS"},
    {"sc_id": "1.1.1", "outcome": "NEEDS_REVIEW"}
  ]
}
```
Response `200`:
```json
{
  "schema_version": "1.0",
  "check_run_id": "01J9Z4R7T8U9V0W1X2Y3Z4A5B6",
  "accepted": 3,
  "revisions": [
    {"sc_id": "1.4.3", "finding_id": "01J9Z5B1C2D3E4F5G6H7J8K9M0", "revision": 1},
    {"sc_id": "2.4.7", "finding_id": "01J9Z5B1C2D3E4F5G6H7J8K9M1", "revision": 1},
    {"sc_id": "1.1.1", "finding_id": "01J9Z5B1C2D3E4F5G6H7J8K9M2", "revision": 1}
  ]
}
```

## Example: start a check run
Request body: `{"schema_version":"1.0","scope_key":"pwa.core","surface_id":"surf.f01.listing_detail","release_ref":"4f2c9a1","method":"MIXED","tool_name":"example-scanner","tool_version":"2.14.0"}`.
Response `201`: `WcagCheckRun` with `status: "QUEUED"`, `attempt: 1`, `criteria_total` computed from the profile target.

## Idempotency keys per command
| Command | Key scope | Replay result |
|---|---|---|
| profile.set | actor + key | Original response |
| check_run.start | actor + key | Original response; no second run |
| record_findings | actor + key | Original response; no second write |
| check_run.complete | actor + key | Original response |
| check_run.cancel | actor + key | Original response |
| finding.review | actor + key | Original response |
| waiver.grant | actor + key | Original response; no second waiver |
| waiver.revoke | actor + key | Original response |

Key retention is 72 hours (A-wcag-07). Same key with different body hash returns `WCAG_IDEMPOTENCY_KEY_REUSED`.

## Events
Envelope fields follow CTR-EVT-001: `event_id`, `event_type`, `aggregate_type`, `aggregate_id`, `aggregate_revision`, `actor_pseudonym`, `occurred_at`, `correlation_id`, `idempotency_key_hash`, `schema_version`. Payloads carry IDs and enums only. No note text.

| Event type | Emitted by | Payload keys |
|---|---|---|
| `wcag.profile.changed.v1` | profile.set | profile_id, scope_key, version, status, target_level |
| `wcag.check_run.started.v1` | check_run.start | check_run_id, surface_id, release_ref, attempt |
| `wcag.check_run.running.v1` | first record_findings batch | check_run_id, attempt |
| `wcag.check_run.completed.v1` | check_run.complete | check_run_id, counts |
| `wcag.check_run.failed.v1` | sweeper or tool error | check_run_id, attempt, reason |
| `wcag.check_run.cancelled.v1` | check_run.cancel or sweeper | check_run_id, reason_code |
| `wcag.finding.recorded.v1` | record_findings | finding_id, check_run_id, sc_id, outcome, revision |
| `wcag.finding.reviewed.v1` | finding.review | finding_id, outcome, review_state, revision |
| `wcag.waiver.granted.v1` | waiver.grant | waiver_id, surface_id, sc_id, expires_at |
| `wcag.waiver.revoked.v1` | waiver.revoke | waiver_id, reason_code |
| `wcag.waiver.expired.v1` | sweeper | waiver_id |

Delivery is at least once. Consumers dedupe on `event_id`. Ordering is guaranteed per aggregate by `aggregate_revision` only.

## Open decisions
- A-wcag-02: ULID identifiers.
- A-wcag-04: automated results arrive through a `release_bot` service identity. Scanner product not chosen.
- A-wcag-07: 72 hour idempotency retention.
- A-wcag-08: waiver approval requires two distinct actors. Requester identity comes from a tracker ticket signed by F16; the signing format is not yet published.
- A-wcag-10: envelope field names follow CTR-EVT-001 list; exact wire format pending F15.

## Testing expectations
- Contract tests `TEST-PS-111-04-T01` to `TEST-PS-111-04-T09`, one per command, plus `T10` for event emission and `T11` for schema version rejection. Defined in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).

## Acceptance criteria
- Every command has a signature, one request example or reference, an idempotency scope and a schema version.
- Every state change in [workflow_state_machine.md](workflow_state_machine.md) has exactly one event in the table above.
- Replaying any command with the same key returns the original response in under 100 ms and writes nothing.
