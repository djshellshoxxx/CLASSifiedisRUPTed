# PS-112-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-02. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); subject consumers are LocalBazaar listings and LocalMutiny proposals and cycles.

## Purpose and scope
Defines every validation rule applied before a currencies write or read decision, the typed error codes returned, and the retry semantics clients may rely on. Validation is server-side and authoritative; client-side checks are advisory. Rules apply to the record types in [domain_schema.md](domain_schema.md). No rule here moves funds or asserts that any external settlement occurred.

## Requirements
- PS-112-02.R01: Every rule has an ID (V01..V23), a trigger command, a deterministic outcome and exactly one error code on failure. Actors: operator, FX importer, subject-owning service, participant. Exclusions: payment validity, identity verification and subject-level consent are validated by their owning modules.
- PS-112-02.R02: Invalid, expired, duplicate, concurrent and adversarial inputs are rejected before any row write. Offline inputs never reach validation because offline writes stay pending on the client (D08) until the server acknowledges them.
- PS-112-02.R03: Messages are never raw text. Each error carries `code`, `localization_key` (`currencies.error.<code lower>`) and an optional `field` path. Clients render text through mod_languages. Validation latency budget: 10 ms p95 per command excluding storage reads.
- PS-112-02.R04: Amount grammar, rate grammar and rounding rules are fixed as in V08, V14, V18 and A-currencies-05 and A-currencies-13.
- PS-112-02.R05: Outlier guard (V13) prevents a single operator or importer error from moving a pair rate more than 20% in one publication.
- PS-112-02.R06: Unknown fields, missing required fields and unsupported `schema_version` are rejected with CURRENCIES_INVALID_REQUEST or CURRENCIES_SCHEMA_VERSION_UNSUPPORTED.

## Validation rules
| ID | Rule | Applies to | Error code on failure |
|---|---|---|---|
| V01 | `code` matches `^[A-Z]{3}$` or `^LU[A-Z]$` | all commands taking a code | CURRENCIES_INVALID_CODE |
| V02 | `code` exists in catalog | publish, pin, convert, preference, reads | CURRENCIES_UNKNOWN_CODE |
| V03 | Status ACTIVE for new quotes, new pins, conversions and preferences; DEPRECATED allowed for reads of existing evidence | as stated | CURRENCIES_CODE_INACTIVE |
| V04 | `code` unique in catalog | register | CURRENCIES_DUPLICATE_CODE |
| V05 | `numeric_code` absent or `^[0-9]{3}$`; unique when present | register | CURRENCIES_INVALID_CODE |
| V06 | `minor_unit_exponent` integer in 0..4 | register | CURRENCIES_INVALID_EXPONENT |
| V07 | `kind = LOCAL_UNIT` iff code matches `^LU[A-Z]$`; LOCAL_UNIT has null `numeric_code` | register | CURRENCIES_INVALID_KIND |
| V08 | `rate` matches `^(0\|[1-9][0-9]{0,11})(\.[0-9]{1,12})?$`, is > 0, and lies in [1e-12, 1e12] | publish | CURRENCIES_INVALID_RATE |
| V09 | `base_code` differs from `quote_code` | publish | CURRENCIES_INVALID_PAIR |
| V10 | `source_id` is in the operator allowlist and enabled | publish, import | CURRENCIES_QUOTE_SOURCE_NOT_ALLOWED |
| V11 | `0 <= captured_at - as_of <= 24 h` and `as_of <= captured_at` | publish, import | CURRENCIES_QUOTE_STALE_SOURCE |
| V12 | `expires_at - captured_at` in [5 min, 24 h]; default 60 min (A-currencies-04) | publish, import | CURRENCIES_INVALID_TTL |
| V13 | Outlier guard: `abs(rate / prev_rate - 1) <= 0.20`, where `prev_rate` is the newest ACTIVE quote for the same pair read under a pair lock. Above the band, publish requires `override_reason_code` and a second approver whose `actor_ref` differs from the publisher (A-currencies-17) | publish, import | CURRENCIES_QUOTE_OUTLIER |
| V14 | Amount grammar `^-?(0\|[1-9][0-9]{0,17})$` (at most 18 digits). Magnitude check on conversion result: `abs(output) <= 999999999999999999` | convert, pin-linked reads | CURRENCIES_AMOUNT_FORMAT (grammar), CURRENCIES_AMOUNT_OUT_OF_RANGE (result) |
| V15 | Pin preconditions: quote ACTIVE and unexpired; pair ACTIVE; subject open (answered by subject module); caller holds `currencies.valuation.pin` on the subject; PINNED count for `subject_ref` < 16 | pin | CURRENCIES_QUOTE_NOT_FOUND, CURRENCIES_QUOTE_EXPIRED, CURRENCIES_QUOTE_WITHDRAWN, CURRENCIES_CODE_INACTIVE, CURRENCIES_SUBJECT_CLOSED, CURRENCIES_PERMISSION_DENIED, CURRENCIES_PIN_LIMIT_EXCEEDED |
| V16 | A PINNED row already exists for (`subject_ref`, `quote_id`) | pin | Not an error: returns the existing pin with HTTP 200 |
| V17 | Pin is PINNED, `valid_until > now`, and its quote is still ACTIVE | convert | CURRENCIES_PIN_INVALID (not PINNED), CURRENCIES_PIN_EXPIRED (time), CURRENCIES_QUOTE_WITHDRAWN (quote) |
| V18 | `rounding_policy` in {HALF_EVEN, HALF_UP, FLOOR, CEILING}; default HALF_EVEN | convert | CURRENCIES_ROUNDING_POLICY_UNKNOWN |
| V19 | `display_code` null or ACTIVE catalog code | preference set | CURRENCIES_UNKNOWN_CODE, CURRENCIES_CODE_INACTIVE |
| V20 | `schema_version` equals 1 | all commands | CURRENCIES_SCHEMA_VERSION_UNSUPPORTED |
| V21 | `Idempotency-Key` matches `^[A-Za-z0-9_-]{1,64}$` and is present on every state-changing command | all writes | CURRENCIES_IDEMPOTENCY_KEY_INVALID |
| V22 | `If-Match` revision equals stored revision where required | catalog status, preference set, quote withdraw | CURRENCIES_REVISION_CONFLICT |
| V23 | No unknown fields; all required fields present; field types match the schema | all commands | CURRENCIES_INVALID_REQUEST |

## Error catalog
Retryable means the same request may be repeated, with the same Idempotency-Key for writes.

| Code | HTTP | Retryable | Meaning | Client action |
|---|---|---|---|---|
| CURRENCIES_INVALID_REQUEST | 400 | no | Malformed body, unknown or missing field | Fix request |
| CURRENCIES_SCHEMA_VERSION_UNSUPPORTED | 400 | no | `schema_version` not 1 | Upgrade client |
| CURRENCIES_IDEMPOTENCY_KEY_INVALID | 400 | no | Key missing or malformed | Send valid key |
| CURRENCIES_INVALID_CODE | 400 | no | Code or numeric code format | Fix code |
| CURRENCIES_AMOUNT_FORMAT | 400 | no | Amount string grammar | Send integer string |
| CURRENCIES_UNAUTHENTICATED | 401 | no | No or invalid credentials | Re-authenticate |
| CURRENCIES_PERMISSION_DENIED | 403 | no | Missing capability, or subject unknown or not visible (same response for both) | None |
| CURRENCIES_QUOTE_NOT_FOUND | 404 | no | No ACTIVE quote for the pair | Wait for publication |
| CURRENCIES_UNKNOWN_CODE | 422 | no | Code not in catalog | Fix code |
| CURRENCIES_INVALID_KIND | 422 | no | Kind and code pattern disagree | Fix definition |
| CURRENCIES_INVALID_EXPONENT | 422 | no | Exponent outside 0..4 | Fix definition |
| CURRENCIES_INVALID_RATE | 422 | no | Rate grammar or bounds | Fix rate |
| CURRENCIES_INVALID_PAIR | 422 | no | Base equals quote | Fix pair |
| CURRENCIES_INVALID_TTL | 422 | no | Expiry window outside 5 min..24 h | Fix TTL |
| CURRENCIES_QUOTE_STALE_SOURCE | 422 | no | `as_of` too old or in the future | Re-fetch source |
| CURRENCIES_QUOTE_SOURCE_NOT_ALLOWED | 422 | no | Source not allowlisted | Use allowlisted source |
| CURRENCIES_QUOTE_OUTLIER | 422 | no | Outlier guard tripped without override | Provide override and second approver |
| CURRENCIES_ROUNDING_POLICY_UNKNOWN | 422 | no | Unknown rounding policy | Use listed policy |
| CURRENCIES_PIN_LIMIT_EXCEEDED | 422 | no | 16 PINNED rows reached for subject | Release unused pins |
| CURRENCIES_AMOUNT_OUT_OF_RANGE | 422 | no | Conversion result beyond bound | Split value |
| CURRENCIES_IMPORT_INVALID | 422 | no | Batch failed validation; report lists rows | Fix file, re-run |
| CURRENCIES_DUPLICATE_CODE | 409 | no | Catalog code exists | Use update path |
| CURRENCIES_CODE_INACTIVE | 409 | no | Code DEPRECATED or DISABLED for this operation | Choose ACTIVE code |
| CURRENCIES_QUOTE_EXPIRED | 409 | no | Quote past `expires_at` | Obtain current quote |
| CURRENCIES_QUOTE_WITHDRAWN | 409 | no | Quote withdrawn | Obtain current quote |
| CURRENCIES_PIN_INVALID | 409 | no | Pin not PINNED (released, invalidated or expired) | Re-pin via subject |
| CURRENCIES_PIN_EXPIRED | 409 | no | Pin `valid_until` passed | Re-pin via subject |
| CURRENCIES_SUBJECT_CLOSED | 409 | no | Subject no longer open for pins | None |
| CURRENCIES_REVISION_CONFLICT | 409 | no | `If-Match` mismatch | Re-read, merge, retry |
| CURRENCIES_IDEMPOTENCY_KEY_REUSED | 409 | no | Same key, different request hash | Use new key |
| CURRENCIES_IMPORT_TOO_LARGE | 413 | no | File over 1 MiB or over row limits | Split file |
| CURRENCIES_RATE_LIMITED | 429 | yes, after `Retry-After` | Abuse limit (see privacy_retention_abuse.md) | Back off |
| CURRENCIES_INTERNAL | 500 | yes, backoff | Unexpected server fault; no detail leaked | Retry with same key |
| CURRENCIES_UNAVAILABLE | 503 | yes, backoff | Storage or subject-module dependency unavailable; fail closed | Retry with same key |

Error envelope (CTR-ERR-001 provisional):
```json
{"error":{"code":"CURRENCIES_RATE_LIMITED","retryable":true,"localization_key":"currencies.error.currencies_rate_limited","retry_after_s":30,"request_id":"req_01J9G3"}}
```

## Edge cases
- Client sends `rate` `"1.0000000000001"` (13 fractional digits): V08 rejects before any write; no row, no event.
- Operator publishes `EUR/USD` at 1.40 after a prior ACTIVE 1.085 (29% move): V13 rejects unless override and second approver are present.
- Subject-owning service retries pin with same key after timeout: V16 returns existing pin; no duplicate.
- Convert arrives after `valid_until`: V17 returns CURRENCIES_PIN_EXPIRED; no conversion row.

## Open decisions
- A-currencies-05: Default rounding is HALF_EVEN; the policy is recorded on every conversion so a verifier can recompute. Related: D03.
- A-currencies-13: Amounts are signed decimal strings in minor units, at most 18 digits. Decimal strings avoid JavaScript precision loss above 2^53.
- A-currencies-14: LOCAL_UNIT codes (`LU` + one letter, 26 possible codes) are operator-defined, not ISO, and can be quoted only by an operator-published quote.
- A-currencies-17: Outlier band is 20% against the newest ACTIVE quote for the same pair; override requires a second approver. Related: D03, D10.
