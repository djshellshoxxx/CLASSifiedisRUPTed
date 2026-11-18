# PS-111-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-111-02. **Owner:** [14_Accessibility/01_a11y/mod_wcag](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_wcag. **Consumers:** F07, F10, F15, F16 shared contracts per [dependency matrix](../../../DEPENDENCY_MATRIX.md); commands in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
**Business outcome:** every command is accepted or rejected with one typed error code, so a release tool or reviewer knows exactly what to fix. Invalid data never reaches storage.

**Actors affected:** `release_bot`, `a11y_reviewer`, `release_manager`, `operator`.

**Exclusions:** semantic checks of the accessibility of a UI (done by the tool or reviewer, not here); validation of federated content (out of scope, F11).

## Requirements
- PS-111-02.R01 — Outcome, actors and exclusions as stated above.
- PS-111-02.R02 — Cases covered: normal, invalid syntax, unknown reference, expired waiver, duplicate criterion in batch, concurrent version change, offline replay of an old command, and adversarial payloads (oversized, injected markup, personal data).
- PS-111-02.R03 — Budget: validation completes in under 20 ms p95 per command, excluding storage round-trips.
- PS-111-02.R04 — Validation order is fixed (see Order).
- PS-111-02.R05 — Every rejection returns the typed error envelope (see Error envelope).
- PS-111-02.R06 — Notes and references are checked for personal data and unsafe content.
- PS-111-02.R07 — Batch ingestion is all-or-nothing and validated before any write.

## Order
1. Authenticate the caller and read the idempotency key (see [failure_recovery_idempotency.md](failure_recovery_idempotency.md)).
2. Authorize the capability (see [authorization_capabilities.md](authorization_capabilities.md)). Denied callers receive `WCAG_CAPABILITY_DENIED` without learning whether the referenced record exists.
3. Syntax checks on every field.
4. Referential checks (profile, run, surface, criterion, waiver).
5. State checks (run state, profile status, version).
6. Business rules (limits, separation of duties, manual-only rule).

The first failing step wins. No partial error lists.

## Error envelope
All rejections use the envelope from CTR-ERR-001 (owner F15; field names proposed here, see A-wcag-10):
```json
{
  "error": {
    "code": "WCAG_SC_UNKNOWN",
    "http_status": 422,
    "retryable": false,
    "message_key": "wcag.err.sc_unknown",
    "field": "findings[3].sc_id",
    "correlation_id": "01J9Z7H3K4M5N6P7Q8R9S0T1U2"
  }
}
```
`message_key` is localized by the client. The envelope never echoes personal data, note text or evidence content.

## Error codes
Format `WCAG_<CODE>`. `retryable` is the value returned to the client.

| Code | HTTP | Retryable | Rule |
|---|---|---|---|
| WCAG_CAPABILITY_DENIED | 403 | no | Caller lacks the capability for the action or resource |
| WCAG_SCOPE_KEY_INVALID | 400 | no | `scope_key` fails regex in [domain_schema.md](domain_schema.md) |
| WCAG_TARGET_LEVEL_INVALID | 400 | no | `target_level` not in A, AA, AAA |
| WCAG_VERSION_UNSUPPORTED | 400 | no | `wcag_version` not `2.2` |
| WCAG_PROFILE_NOT_FOUND | 404 | no | No profile for `scope_key` |
| WCAG_PROFILE_VERSION_CONFLICT | 409 | yes | `expected_version` differs from stored `version`; client re-reads and retries |
| WCAG_PROFILE_NOT_ACTIVE | 409 | no | Run start requested for a DISABLED or RETIRED profile |
| WCAG_SURFACE_UNKNOWN | 422 | no | `surface_id` not in surface catalog (A-wcag-03) |
| WCAG_RELEASE_REF_INVALID | 400 | no | `release_ref` fails regex |
| WCAG_METHOD_TOOL_MISMATCH | 400 | no | method AUTOMATED or MIXED without `tool_name` and `tool_version`, or MANUAL with them |
| WCAG_CHECK_RUN_IN_PROGRESS | 409 | yes | A QUEUED or RUNNING run exists for the same surface and release_ref |
| WCAG_CHECK_RUN_NOT_FOUND | 404 | no | Unknown `check_run_id` |
| WCAG_CHECK_RUN_STATE_INVALID | 409 | no | Operation not allowed in the run's current state |
| WCAG_CHECK_RUN_ATTEMPTS_EXCEEDED | 409 | no | Third failed attempt reached; a new run must be started |
| WCAG_SC_UNKNOWN | 422 | no | `sc_id` not in catalog at the run's `catalog_version` |
| WCAG_OUTCOME_INVALID | 400 | no | `outcome` not in PASS, FAIL, NEEDS_REVIEW, NOT_APPLICABLE |
| WCAG_MANUAL_ONLY_CRITERION | 422 | no | Automated tool sends PASS or NOT_APPLICABLE for a criterion with `manual_only = true` |
| WCAG_DUPLICATE_CRITERION | 400 | no | Same `sc_id` twice in one batch |
| WCAG_BATCH_TOO_LARGE | 413 | no | More than 200 findings in one batch |
| WCAG_BATCH_ROLLED_BACK | 503 | yes | Batch failed inside storage transaction; no rows written |
| WCAG_NOTE_TOO_LONG | 400 | no | `note` longer than 500 characters |
| WCAG_PII_DETECTED | 422 | no | `note` matches an e-mail, phone or URL pattern (below) |
| WCAG_EVIDENCE_REF_INVALID | 400 | no | `evidence_ref` fails regex or points outside the `evidence:` scheme |
| WCAG_FINDING_REVISION_CONFLICT | 409 | yes | `expected_revision` differs from stored revision |
| WCAG_REVIEWER_REQUIRED | 422 | no | Manual confirmation without `reviewer_actor_id` |
| WCAG_WAIVER_NOT_FOUND | 404 | no | Unknown `waiver_id` |
| WCAG_WAIVER_REASON_INVALID | 400 | no | `reason_code` not in enum |
| WCAG_WAIVER_EXPIRY_INVALID | 400 | no | `expires_at` in the past or more than 90 days after creation |
| WCAG_WAIVER_SELF_APPROVAL | 403 | no | `approved_by_actor_id` equals `requested_by_actor_id` |
| WCAG_WAIVER_LIMIT_EXCEEDED | 409 | no | More than 20 ACTIVE waivers on the surface |
| WCAG_WAIVER_NOT_ACTIVE | 409 | no | Revoke requested for a waiver not in ACTIVE status |
| WCAG_IDEMPOTENCY_KEY_INVALID | 400 | no | Key missing, not 16 to 64 characters, or not in `[A-Za-z0-9_-]` |
| WCAG_IDEMPOTENCY_KEY_REUSED | 409 | no | Same key, different request body hash |
| WCAG_RATE_LIMITED | 429 | yes | Rate limit from [privacy_retention_abuse.md](privacy_retention_abuse.md) exceeded |
| WCAG_INTERNAL_ERROR | 500 | yes | Unexpected failure; correlation ID returned, no detail |

## Field rules
- **Identifiers:** ULID regex `^[0-9A-HJKMNP-TV-Z]{26}$`.
- **Notes:** plain text, UTF-8, max 500 characters after Unicode NFC normalization. Control characters other than newline are rejected. Rendered as text only; no markup is parsed.
- **PII pattern (case-insensitive), any match rejects with `WCAG_PII_DETECTED`:**
  - e-mail: `[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}`
  - phone: 7 or more digits with optional `+`, spaces, dashes or parentheses
  - URL: `https?://` or `www.`
  This is a defence-in-depth check, not a guarantee. Authors must still not write personal data (A-wcag-13).
- **Evidence references:** only `evidence:` prefix. Never a URL, path or data URI.
- **Timestamps:** RFC 3339 UTC with `Z`. Offsets are rejected.

## Business rules
- Automated tool results for a criterion with `manual_only = true` may be FAIL or NEEDS_REVIEW only (`WCAG_MANUAL_ONLY_CRITERION` otherwise).
- A criterion appears at most once per batch and per run.
- A waiver's approver must hold the approve capability and must differ from the requester.
- A confirmed finding must name a reviewer. Reviewer must differ from the run's `release_bot` identity.

## Open decisions
- A-wcag-10: Error and event envelopes follow CTR-ERR-001 and CTR-EVT-001 field lists. Exact envelope pending F15 publication.
- A-wcag-12: `manual_only` is catalog data. It is set by this module from the WCAG 2.2 criterion documentation and reviewed on each catalog version.
- A-wcag-13: Notes are plain text capped at 500 characters with the PII pattern check above.

## Testing expectations
- One negative test per row in the error table, named `TEST-PS-111-02-Tnn`, defined in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).

## Acceptance criteria
- Every error code in the table is returned by at least one test.
- No rejection body contains note text, evidence content or personal data.
- Batch with any invalid row writes zero rows.
