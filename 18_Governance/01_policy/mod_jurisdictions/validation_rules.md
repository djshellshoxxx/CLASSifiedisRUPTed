# PS-145-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-145-02. **Owner:** [18_Governance/01_policy/mod_jurisdictions](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_jurisdictions. **Consumers:** mod_prohibited, mod_goods, 01_LocalBazaar/01_listings/mod_publish, 06_Discovery, 11_Federation, 12_Moderation (see A-jurisdictions-17).

## Purpose and scope
Define every validation rule that gates a jurisdiction command, the exact error code returned, and the order in which checks run. Validation prevents an invalid rule binding from reaching ACTIVE. Do not assume implementation or successful external settlement.

## Requirements to specify
- PS-145-02.R01: Business outcome: an operator submitting a jurisdiction change receives one typed, actionable error for the first failing rule, with the field path and message key, and no state change occurs. Exclusions: validation of rule content (owned by mod_prohibited and mod_goods); legal correctness of a jurisdiction's scope; identity or residence checks on participants.
- PS-145-02.R02: Cases: normal (valid draft and approval); invalid (each rule below); expired (effective_from in the past at submit or approve); duplicate (scope_code already registered; replayed Idempotency-Key); concurrent (stale row_version; overlapping window with a revision approved first); offline (not applicable to writes; resolve responses are covered in observability and privacy files); adversarial (precise-location payloads, oversized lists, personal data in internal_note, forged approver identity).
- PS-145-02.R03: Accessibility and localization: errors carry `message_key` (`err.jurisdictions.<code>`) and `field_path`; no meaning is conveyed by colour alone; English catalog is required, other locales fall back. Budget: local validation completes in under 20 ms p95 excluding dependency calls.
- PS-145-02.R04: Normalization: `scope_code`, `region_codes` and `parent_scope_code` are trimmed of surrounding whitespace only. Lowercase is rejected, not silently uppercased. Strings are compared after Unicode NFC normalization. Lists are de-duplicated only by rejection (duplicates are invalid), never by silent removal.
- PS-145-02.R05: Check order (first failure wins): (1) Idempotency-Key present and well formed; (2) idempotency replay lookup; (3) authorization (CTR-CAP-001); (4) payload size and schema_version; (5) field syntax and location-precision screen; (6) cross-field rules (level, parent, window, region list, ruleset binding); (7) references (parent profile, ruleset owner, region catalog); (8) state and cardinality rules; (9) optimistic concurrency (`expected_row_version`); (10) window and overlap rules against current ACTIVE and APPROVED revisions.
- PS-145-02.R06: Dependency rule: a ruleset reference is valid only if the owner module reports the referenced ruleset as ACTIVE for the requested effective_from. When the owner cannot answer within 1 s, the command fails with JURISDICTIONS_DEPENDENCY_UNAVAILABLE (retryable) and no state changes.
- PS-145-02.R07: Location-precision screen: any request field whose name or value looks like coordinates, a postal code, a street address or a region finer than the catalog is rejected with JURISDICTIONS_LOCATION_PRECISION_FORBIDDEN. The error never echoes the offending value.
- PS-145-02.R08: Personal-data screen on internal_note: rejected with JURISDICTIONS_NOTE_INVALID when it exceeds 280 characters or matches an e-mail, telephone or postal-address pattern (A-jurisdictions-05). The error never echoes the note.

## Error catalogue
Prefix `JURISDICTIONS_` is the module prefix (module directory `mod_jurisdictions`). Envelope follows CTR-ERR-001: `code`, `retryable`, `message_key`, `field_path` (nullable), `correlation_id`. `UNRESOLVED` from the resolve query is a successful result, not an error.

| Code | HTTP | Retryable | Trigger |
|---|---|---|---|
| JURISDICTIONS_IDEMPOTENCY_KEY_MISSING | 400 | no | Command lacks a valid UUID v4 Idempotency-Key |
| JURISDICTIONS_IDEMPOTENCY_KEY_REUSED | 409 | no | Same key and actor with a different payload_hash or command_name |
| JURISDICTIONS_PERMISSION_DENIED | 403 | no | Actor lacks the capability for the action and resource |
| JURISDICTIONS_SELF_APPROVAL_FORBIDDEN | 403 | no | approver actor equals submitted_by_actor_ref |
| JURISDICTIONS_NOT_FOUND | 404 | no | jurisdiction_id or revision_id does not exist or is not visible to the actor |
| JURISDICTIONS_PAYLOAD_TOO_LARGE | 413 | no | Serialized request exceeds 8 KB |
| JURISDICTIONS_SCHEMA_VERSION_UNSUPPORTED | 400 | no | schema_version major differs from 1 |
| JURISDICTIONS_CODE_INVALID | 400 | no | scope_code fails pattern, or level and parent_scope_code disagree |
| JURISDICTIONS_CODE_DUPLICATE | 409 | no | scope_code already registered on create |
| JURISDICTIONS_PARENT_INVALID | 400 | no | Parent missing, not a COUNTRY profile, not registered, or depth would exceed 2 |
| JURISDICTIONS_NAME_KEY_INVALID | 400 | no | name_key fails pattern or is absent from the i18n catalog |
| JURISDICTIONS_WINDOW_INVALID | 400 | no | effective_from not on a whole minute, or client supplied effective_until |
| JURISDICTIONS_WINDOW_IN_PAST | 400 | no | effective_from earlier than server time at submit or approve |
| JURISDICTIONS_LEAD_TIME_TOO_SHORT | 400 | no | effective_from earlier than approval time plus lead time (24 h normal, 1 h emergency; A-jurisdictions-06) |
| JURISDICTIONS_WINDOW_OVERLAP | 409 | no | effective_from not strictly after the current ACTIVE revision's effective_from |
| JURISDICTIONS_REGION_CODE_INVALID | 400 | no | Region code not in coarse catalog or wrong shape |
| JURISDICTIONS_REGION_LIST_EMPTY | 400 | no | Empty region_codes on a non-RETIREMENT revision |
| JURISDICTIONS_REGION_LIMIT_EXCEEDED | 400 | no | More than 50 region codes, or duplicate codes |
| JURISDICTIONS_REGION_CONFLICT | 409 | no | Region code already present in another jurisdiction's in-force or approved revision with an overlapping window |
| JURISDICTIONS_RULESET_REF_INVALID | 400 | no | Ruleset ref malformed, or owner reports it not ACTIVE for the window |
| JURISDICTIONS_NO_RULESET_BINDING | 400 | no | Non-RETIREMENT revision with both ruleset refs null |
| JURISDICTIONS_DEPENDENCY_UNAVAILABLE | 503 | yes | Ruleset owner check timed out or failed |
| JURISDICTIONS_NOTE_INVALID | 400 | no | internal_note too long or matches personal-data screen |
| JURISDICTIONS_LOCATION_PRECISION_FORBIDDEN | 400 | no | Field carries coordinates, postal code, street address or sub-catalog region |
| JURISDICTIONS_STATE_CONFLICT | 409 | no | Transition not allowed from the current state (see workflow file) |
| JURISDICTIONS_REVISION_STALE | 409 | no | expected_row_version differs from stored row_version |
| JURISDICTIONS_RETIRED | 409 | no | Jurisdiction is RETIRED; no new revisions accepted |
| JURISDICTIONS_RATE_LIMITED | 429 | yes | Rate limit exceeded (A-jurisdictions-14) |
| JURISDICTIONS_INTERNAL_ERROR | 500 | yes | Unexpected failure; no state change is guaranteed to have occurred unless a result_ref exists |

## Rule details for field-level checks
- `scope_code`: pattern `^[A-Z]{2}(-[A-Z0-9]{1,3})?$`; max 6 characters; must be a value in the ISO 3166 catalog version pinned in configuration (A-jurisdictions-01).
- `region_codes`: 1 to 50 items; each item matches the scope_code pattern and exists in the coarse catalog; a region code may appear in at most one revision that is in force or APPROVED for the same window.
- `effective_from`: RFC 3339 UTC with `Z`; seconds and milliseconds must be zero; must be at least the lead time after approval time (checked at approve, not at draft, so drafts may hold any future time).
- `change_reason_code = RETIREMENT`: requires `region_codes = []`, both ruleset refs null, and a policy_owner approver.
- `change_reason_code = NEW_JURISDICTION`: valid only when `jurisdiction_id` is omitted in create_draft; all other reasons require an existing jurisdiction_id.

## Open decisions
- A-jurisdictions-04: Limits of 50 region codes per revision and 2,000 jurisdiction profiles per deployment are launch defaults, not measured needs. Revisit with F10 catalog size.
- A-jurisdictions-05: internal_note maximum 280 characters, operator-only, screened for e-mail, telephone and postal-address patterns. The screen is a best-effort guard, not a guarantee; operators are told not to enter personal data.
- Cross-references: A-jurisdictions-06 (lead time) in workflow_state_machine.md; A-jurisdictions-14 (rate limits) in privacy_retention_abuse.md; D07 retention in [DECISIONS.md](../../../DECISIONS.md) remains OPEN.

## Acceptance criteria
- [ ] Every code in the catalogue is produced by at least one negative test (TEST-PS-145-02-T01 to T08).
- [ ] No error response echoes a submitted free-text or location value (checked by TEST-PS-145-02-T06).
- [ ] Error catalogue matches CTR-ERR-001 once that contract is approved (future gate).
- [ ] Security and architecture review approval (future gate).
