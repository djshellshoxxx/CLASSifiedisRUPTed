# PS-146-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-02. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [12_Moderation](../../../12_Moderation). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-02.R01: Business outcome. Every input is validated before any rule matching or persistence, so that invalid, oversized or hostile data cannot produce a silent ALLOW. Validation failures return a typed error; they never return a partial decision.
- Scope: subject snapshots (domain_schema.md), rule sets at activation, hold notes, idempotency keys, query parameters.
- Exclusions: business authorization (see authorization_capabilities.md), state transitions (see workflow_state_machine.md), outcome of matching (defined below only as deterministic semantics).
- PS-146-02.R02: Cases covered: normal; missing field; wrong type; out-of-range; oversized; control characters; unknown enum; duplicate rule_code; duplicate idempotency key with different payload; stale subject_revision; concurrent activation; expired hold; adversarial regex or term-flood input; Unicode confusables and zero-width characters.
- PS-146-02.R03: Budgets. Full validation of a subject snapshot completes in under 2 ms p95 at 4 KiB. Rule-set validation at activation of 2000 rules completes in under 5 s. Validation is locale-independent; messages use `message_key` only (localized by F14).

## Validation order
1. Authentication and schema_version (`PROHIBITED_SCHEMA_VERSION_UNSUPPORTED`).
2. Envelope shape and enum membership.
3. Idempotency key format.
4. Field-level snapshot and note rules.
5. Business state checks (state, revision, conflicts).
Validation stops at the first failing step; errors list at most 10 field violations in `details`.

## Error envelope (CTR-ERR-001, shape assumed per A-prohibited-02)
```json
{"error": {"code": "PROHIBITED_SUBJECT_TEXT_TOO_LONG", "http_status": 422, "retryable": false,
  "message_key": "prohibited.error.subject_text_too_long",
  "details": {"field": "description", "max_chars": 4000}, "request_id": "req_01JDQCZ7K2M4N6P8R0S2T4V6W8"}}
```
`details` never echoes subject text, never includes rule terms, and never includes account identifiers beyond the caller's own.

## Error catalogue
| Code | HTTP | Retryable | Trigger |
|---|---|---|---|
| PROHIBITED_VALIDATION_FAILED | 400 | no | Generic envelope failure not covered below |
| PROHIBITED_SCHEMA_VERSION_UNSUPPORTED | 400 | no | schema_version not "1" |
| PROHIBITED_SUBJECT_TYPE_INVALID | 400 | no | subject_type not in enum |
| PROHIBITED_IDEMPOTENCY_KEY_INVALID | 400 | no | key fails `^[A-Za-z0-9._:-]{1,128}$` |
| PROHIBITED_CURSOR_INVALID | 400 | no | pagination cursor malformed or expired |
| PROHIBITED_UNAUTHENTICATED | 401 | no | missing or invalid credential |
| PROHIBITED_FORBIDDEN | 403 | no | capability missing (authorization_capabilities.md) |
| PROHIBITED_APPROVER_NOT_INDEPENDENT | 403 | no | approver equals author |
| PROHIBITED_HOLD_REVIEWER_CONFLICT | 403 | no | reviewer is subject owner or policy author |
| PROHIBITED_DECISION_NOT_FOUND | 404 | no | unknown decision_id or not visible to caller |
| PROHIBITED_HOLD_NOT_FOUND | 404 | no | unknown hold_id or not visible to caller |
| PROHIBITED_REVISION_CONFLICT | 409 | no | row_version mismatch |
| PROHIBITED_IDEMPOTENCY_CONFLICT | 409 | no | same key, different snapshot digest |
| PROHIBITED_SUBJECT_REVISION_STALE | 409 | no | subject_revision lower than latest recorded for subject |
| PROHIBITED_POLICY_STATE_INVALID | 409 | no | illegal PolicyVersion transition |
| PROHIBITED_POLICY_VERSION_LOCKED | 409 | no | edit attempted on ACTIVE or RETIRED version |
| PROHIBITED_HOLD_STATE_INVALID | 409 | no | illegal PolicyHold transition |
| PROHIBITED_SUBJECT_TEXT_TOO_LONG | 422 | no | title > 200 or description > 4000 characters after NFKC |
| PROHIBITED_SUBJECT_TEXT_INVALID | 422 | no | control characters or invalid UTF-8 |
| PROHIBITED_STRUCTURED_FLAG_INVALID | 422 | no | flag not matching pattern, or > 20 flags |
| PROHIBITED_JURISDICTION_HINT_INVALID | 422 | no | hint not ISO 3166-1 alpha-2 |
| PROHIBITED_RULE_CODE_INVALID | 422 | no | rule_code pattern failure |
| PROHIBITED_RULE_CODE_DUPLICATE | 422 | no | duplicate rule_code in version |
| PROHIBITED_RULE_TERMS_REQUIRED | 422 | no | KEYWORD rule with zero terms |
| PROHIBITED_RULE_TERM_INVALID | 422 | no | term empty, > 64 chars, contains regex syntax or control characters |
| PROHIBITED_RULE_CATEGORY_UNKNOWN | 422 | no | category_code not resolvable |
| PROHIBITED_RULE_SCOPE_INVALID | 422 | no | jurisdiction_scope invalid or mixes `*` with codes |
| PROHIBITED_RULE_LIMIT_EXCEEDED | 422 | no | > 2000 rules, > 200 terms per rule, or > 20000 terms per version |
| PROHIBITED_NOTE_INVALID | 422 | no | reviewer_note > 1000 chars or control characters |
| PROHIBITED_NO_ACTIVE_POLICY | 503 | yes | no ACTIVE version (fail-closed) |
| PROHIBITED_RATE_LIMITED | 429 | yes | rate limit; `details.retry_after_s` set |
| PROHIBITED_TIMEOUT | 504 | yes | server deadline exceeded (failure_recovery_idempotency.md) |
| PROHIBITED_UNAVAILABLE | 503 | yes | dependency or storage unavailable |

## Subject snapshot rules
- PS-146-02.R04: subject_type in {LISTING, OFFER, PROPOSAL, CYCLE_PARTICIPATION}; else `PROHIBITED_SUBJECT_TYPE_INVALID`.
- PS-146-02.R05: subject_id and policy identifiers match ULID pattern `^[0-9A-HJKMNP-TV-Z]{26}$`.
- PS-146-02.R06: subject_revision integer 1..2147483647. If lower than the latest recorded revision for the subject, return `PROHIBITED_SUBJECT_REVISION_STALE` and do not record a decision.
- PS-146-02.R07: title and description are NFKC-normalized before measuring length. Reject (`PROHIBITED_SUBJECT_TEXT_TOO_LONG`) before normalization if raw input exceeds 4x the limit, to bound work.
- PS-146-02.R08: Reject any code point in U+0000..U+001F except U+000A and U+0009, and U+200B..U+200F, U+202A..U+202E, U+2060, U+FEFF (zero-width and bidi controls) with `PROHIBITED_SUBJECT_TEXT_INVALID`.
- PS-146-02.R09: `structured_flags` size and pattern as in domain_schema.md.
- PS-146-02.R10: `jurisdiction_hint` null or `^[A-Z]{2}$`.

## Rule-set rules (checked at approval, see workflow_state_machine.md)
- PS-146-02.R11: rule_code unique within version; pattern `^PRH-[A-Z]{2,4}-[0-9]{3}$`.
- PS-146-02.R12: KEYWORD rules have 1..200 terms; each term 1..64 characters after NFKC casefold; terms containing any of `\ ( ) [ ] { } * + ? | ^ $` are rejected to block regex-style input.
- PS-146-02.R13: Total terms per version at most 20000. Duplicate term across rules is allowed; the most severe default_action applies at match time.
- PS-146-02.R14: category_code must resolve through the mod_goods lookup (A-prohibited-05).
- PS-146-02.R15: jurisdiction_scope is either exactly `["*"]` or 1..50 distinct alpha-2 codes.

## Evaluation semantics (deterministic)
- PS-146-02.R16: Matching input is `NFKC(title) + " " + NFKC(description)`, casefolded, with runs of whitespace collapsed. Tokens are maximal runs of letters or digits.
- PS-146-02.R17: KEYWORD matches when all tokens of a term appear as a contiguous token sequence. Matching uses a precompiled Aho-Corasick automaton per ACTIVE version, built once at activation; per-request cost is O(n + matches) in input length n.
- PS-146-02.R18: GOODS_CATEGORY matches when subject category_code equals the rule's category_code or is a descendant of it (A-prohibited-05).
- PS-146-02.R19: STRUCTURED_FLAG matches when the flag is in structured_flags. MANUAL_ONLY never matches automatically.
- PS-146-02.R20: Jurisdiction filter: a rule applies when scope is `*` or contains jurisdiction_hint. When hint is null, rules with scope other than `*` apply (fail-closed).
- PS-146-02.R21: Outcome: any matched BLOCK rule gives BLOCK; else any matched HOLD gives HOLD; else ALLOW. rule_codes lists all matched enabled rules, sorted.

## Open decisions
- A-prohibited-02 (envelope and timestamp format), A-prohibited-05 (category lookup), A-prohibited-08 (non-regex matching; a stricter or looser term grammar may change R12), A-prohibited-13 (seed content; no effect on structure).
- Confusable-character folding beyond NFKC is deferred; any change requires a new decision (no entry in DECISIONS.md).
