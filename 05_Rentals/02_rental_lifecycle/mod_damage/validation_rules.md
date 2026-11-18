# PS-041-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-02. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Every command passes one fixed validation pipeline. The first failure returns one typed error code, so a client can explain the failure and retry safely. No partial write happens on any failure.

Exclusions: pricing, fraud scoring, moderation decisions, and the content of evidence (only metadata is validated).

## Requirements
- **PS-041-02.R01** Ordered pipeline. Every command runs the checks in the pipeline below, in order. The first failing check determines the response. No check may be skipped on a retry.
- **PS-041-02.R02** Case coverage. Invalid input returns the field codes in the rule table. Expired input returns DAMAGE_CLAIM_WINDOW_CLOSED or DAMAGE_RESPONSE_WINDOW_CLOSED (or DAMAGE_CLAIM_CLOSED for terminal claims). Duplicate open returns DAMAGE_CLAIM_ALREADY_OPEN with the existing claim_id, and a duplicate command key replays the original result. Concurrent commands return DAMAGE_STALE_REVISION. Offline queued commands are fully revalidated on arrival. Adversarial input returns DAMAGE_CLAIM_NOT_FOUND to non-parties, DAMAGE_PARTICIPANT_BLOCKED to blocked participants and DAMAGE_EVIDENCE_HASH_MISMATCH on digest failures.
- **PS-041-02.R03** Error presentation. Errors carry `code`, `retryable`, `http_status` and a `details` object with machine fields only (for example `current_revision`, `existing_claim_id`, `max_items`). The server never echoes submitted free text. Clients map codes to localized strings and show them as text next to the field, with a polite live-region announcement. Messages must not rely on color alone.

## Validation pipeline
1. Feature flag `damage_claims_enabled` is on. Otherwise DAMAGE_FEATURE_DISABLED.
2. `schema_version` is supported. Otherwise DAMAGE_SCHEMA_VERSION_UNSUPPORTED.
3. Unknown body fields are rejected. Otherwise DAMAGE_UNKNOWN_FIELD.
4. Idempotency key format and replay check (V21).
5. Authenticated actor and rate limit (A-damage-20). Otherwise DAMAGE_RATE_LIMITED.
6. Participant is not blocked. Otherwise DAMAGE_PARTICIPANT_BLOCKED.
7. Claim visibility: the actor is a party or a moderator. Otherwise DAMAGE_CLAIM_NOT_FOUND.
8. Field rules V01–V24.
9. Revision check (V23).
10. Hold check: while `hold_active`, only moderation commands and reads run. Otherwise DAMAGE_CLAIM_LOCKED.
11. State guard: terminal claims return DAMAGE_CLAIM_CLOSED. Wrong non-terminal state returns DAMAGE_INVALID_TRANSITION.
12. Deadline check against server time. Otherwise the window-closed codes.
13. Cross-record checks (rental state, return recorded, currency match, attestation match).

**Assumption A-damage-07:** The pipeline order is fixed as listed. Clients rely on the first code returned. Changing the order is a contract change and requires a schema_version bump.

## Field validation rules
| Rule | Field | Rule | Error code |
|---|---|---|---|
| V01 | category | Exact match to the enum | DAMAGE_CATEGORY_INVALID |
| V02 | description_text | NFC, trimmed length 1–2000; no U+0000–U+0008, U+000B–U+001F, U+007F or bidi controls U+202A–U+202E and U+2066–U+2069 | DAMAGE_DESCRIPTION_INVALID (length); DAMAGE_TEXT_INVALID (characters) |
| V03 | claimed_amount_minor | JSON integer (not string or float), 1 or greater | DAMAGE_AMOUNT_INVALID |
| V04 | claimed_amount_minor | At most 100000000 | DAMAGE_AMOUNT_LIMIT_EXCEEDED |
| V05 | currency_code | Matches `^[A-Z]{3}$` and equals the rental currency | DAMAGE_CURRENCY_MISMATCH |
| V06 | return_ref_id | Return exists and is recorded for rental_ref_id | DAMAGE_RETURN_NOT_RECORDED |
| V07 | rental state | Rental is in a returned state | DAMAGE_RENTAL_STATE_INVALID |
| V08 | opening window | now minus return recorded time is at most 7 days (A-damage-05) | DAMAGE_CLAIM_WINDOW_CLOSED |
| V09 | duplicate | No other non-terminal claim for the same item and return | DAMAGE_CLAIM_ALREADY_OPEN |
| V10 | parties | lender differs from renter; open is issued by the lender | DAMAGE_NOT_PARTY |
| V11 | revise | `lender_revision_count` is below 2 (A-damage-10) | DAMAGE_REVISION_LIMIT_REACHED |
| V12 | counter_amount_minor | Integer 1 to claimed_amount_minor; present if and only if response_kind = counter | DAMAGE_COUNTER_AMOUNT_INVALID |
| V13 | comment_text, caption_text, note_text | NFC; length within the schema limit; character rules as V02 | DAMAGE_TEXT_INVALID |
| V14 | evidence count | At most 10 items per claim (A-damage-06) | DAMAGE_EVIDENCE_LIMIT_EXCEEDED |
| V15 | content_type | In the allowlist (A-damage-06) | DAMAGE_EVIDENCE_TYPE_UNSUPPORTED |
| V16 | byte_size | 1 to 15728640 | DAMAGE_EVIDENCE_TOO_LARGE |
| V17 | sha256_hex | Matches `^[0-9a-f]{64}$`; equals the digest of stored bytes at upload completion | DAMAGE_EVIDENCE_HASH_MISMATCH |
| V18 | image metadata | GPS and device serial fields removed before storage; if removal fails the upload is rejected | DAMAGE_EVIDENCE_METADATA_STRIP_FAILED |
| V19 | evidence actor | Submitter is a party; claim is non-terminal | DAMAGE_CLAIM_CLOSED |
| V20 | external attestation | Amount 0 to 100000000; currency equals claim; the two attestations must match to close | DAMAGE_EXTERNAL_ATTESTATION_MISMATCH |
| V21 | idempotency_key | Matches `^[0-9A-HJKMNP-TV-Z]{26}$` | DAMAGE_IDEMPOTENCY_KEY_INVALID |
| V22 | timestamps | Server generates all timestamps; client-supplied timestamps are rejected | DAMAGE_UNKNOWN_FIELD |
| V23 | expected_revision | Integer 1 or greater, equal to the current `revision` | DAMAGE_STALE_REVISION |
| V24 | identities in body | Any participant ID in the body equals the authenticated actor's role | DAMAGE_NOT_PARTY |

## Error code catalog
Codes use the form `DAMAGE_<CODE>`. Mapping to CTR-ERR-001 is pending; this table is the module's contract until then.

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DAMAGE_FEATURE_DISABLED | 503 | false | Feature flag is off |
| DAMAGE_SCHEMA_VERSION_UNSUPPORTED | 400 | false | Unknown schema_version |
| DAMAGE_UNKNOWN_FIELD | 400 | false | Unknown or client-controlled field |
| DAMAGE_IDEMPOTENCY_KEY_INVALID | 400 | false | Key format wrong |
| DAMAGE_IDEMPOTENCY_KEY_REUSED | 409 | false | Same key, different payload hash |
| DAMAGE_IDEMPOTENCY_KEY_EXPIRED | 409 | false | Key older than 72 hours (A-damage-12) |
| DAMAGE_RATE_LIMITED | 429 | true | Rate limit; `Retry-After` supplied |
| DAMAGE_PARTICIPANT_BLOCKED | 403 | false | Actor is blocked (F07/F12) |
| DAMAGE_CLAIM_NOT_FOUND | 404 | false | Claim missing or actor not allowed to see it |
| DAMAGE_NOT_PARTY | 403 | false | Actor lacks the party role for this action |
| DAMAGE_RETURN_NOT_RECORDED | 422 | false | Return record missing |
| DAMAGE_RENTAL_STATE_INVALID | 422 | false | Rental not in a returned state |
| DAMAGE_CLAIM_WINDOW_CLOSED | 422 | false | Opening window passed |
| DAMAGE_CLAIM_ALREADY_OPEN | 409 | false | Non-terminal claim exists; `existing_claim_id` in details |
| DAMAGE_CATEGORY_INVALID | 422 | false | Category not in enum |
| DAMAGE_DESCRIPTION_INVALID | 422 | false | Description empty or too long |
| DAMAGE_TEXT_INVALID | 422 | false | Disallowed characters or length in a text field |
| DAMAGE_AMOUNT_INVALID | 422 | false | Amount not a positive integer |
| DAMAGE_AMOUNT_LIMIT_EXCEEDED | 422 | false | Amount above cap |
| DAMAGE_CURRENCY_MISMATCH | 422 | false | Currency differs from rental currency |
| DAMAGE_REVISION_LIMIT_REACHED | 409 | false | Lender revision limit reached |
| DAMAGE_COUNTER_AMOUNT_INVALID | 422 | false | Counter missing, zero or above claimed amount |
| DAMAGE_STALE_REVISION | 409 | false | `expected_revision` old; client must refetch and not auto-retry |
| DAMAGE_CLAIM_LOCKED | 409 | true | Moderation hold active; retry after release |
| DAMAGE_CLAIM_CLOSED | 409 | false | Claim is terminal |
| DAMAGE_INVALID_TRANSITION | 409 | false | Command not allowed in current state |
| DAMAGE_RESPONSE_WINDOW_CLOSED | 409 | false | State deadline passed |
| DAMAGE_EVIDENCE_LIMIT_EXCEEDED | 422 | false | More than 10 items on a claim |
| DAMAGE_EVIDENCE_TYPE_UNSUPPORTED | 422 | false | Content type not allowed |
| DAMAGE_EVIDENCE_TOO_LARGE | 413 | false | Item above 15 MiB |
| DAMAGE_EVIDENCE_HASH_MISMATCH | 422 | true | Digest differs; client may re-upload |
| DAMAGE_EVIDENCE_METADATA_STRIP_FAILED | 422 | false | Image metadata could not be removed |
| DAMAGE_EXTERNAL_ATTESTATION_MISMATCH | 409 | false | Attestations differ; both retained |
| DAMAGE_CLAIM_BUSY | 503 | true | Row lock wait exceeded (A-damage-16) |

## Requirement-to-case map
- Invalid: V01–V05, V12–V13, V15–V17.
- Expired: V08, V12 window check, state deadlines.
- Duplicate: V09, V21 with replay rules in PS-041-04.
- Concurrent: V23, DAMAGE_CLAIM_BUSY.
- Offline: queued commands revalidated in full; see PS-041-06.
- Adversarial: V10, V24, DAMAGE_CLAIM_NOT_FOUND masking, V17, V18.

## Open decisions
- A-damage-07 sets the pipeline order. Confirm in Prompt 3 review.
- Error mapping to CTR-ERR-001 is pending; this catalog is provisional until F15 publishes it.
- D08 (offline pending queue) affects revalidation timing; see PS-041-06.
