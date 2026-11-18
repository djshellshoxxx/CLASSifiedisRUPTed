# PS-109-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-109-02. **Owner:** [14_Accessibility/01_a11y/mod_keyboard](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_keyboard. **Consumers:** F07 (caller identity), F10 (export/import validation), F15 (typed error envelope, schema registry), F16 (capability denial); client form validation in PS-109-03.

## Purpose and scope
Define every validation rule applied to keyboard preference writes and reads, the order in which they run, the exact error codes, and the effective-map rule that detects shortcut conflicts. Field definitions come from [domain_schema.md](domain_schema.md); this file does not redefine them.

**Business outcome:** an invalid or dangerous shortcut is rejected before it is stored, with a stable error code the client can explain to the user.

**Exclusions:** semantic validation of feature content (listings, trades); moderation of profile content (none is free text); localization of messages (message text is resolved by the client from `localization_key`).

## Requirements
- **PS-109-02.R01** — Outcome: each rejected write returns exactly one error code from the table in R05 and changes no stored state.
- **PS-109-02.R02** — Cases: normal (valid patch accepted); invalid (each code in R05); expired (not applicable to validation itself; expiry is PS-109-06); duplicate (same idempotency key with same payload returns the stored result, not re-validation); concurrent (stale `expected_revision`, see PS-109-06); offline (validation runs on replay with the same rules, not a relaxed set); adversarial (oversized body, non-canonical combo text such as `alt+s`, reserved combos, prototype-pollution keys such as `__proto__`, deeply nested input).
- **PS-109-02.R03** — Budgets: validation adds at most 5 ms p95 to a write (PS-109-08). Errors are returned as keyboard-operable focus targets in the client: the first invalid field receives focus (PS-109-03).
- **PS-109-02.R04** — Validation order (first failure wins): (1) request body size; (2) authentication; (3) capability (`kbd.profile.write`, PS-109-05); (4) idempotency key format; (5) idempotency replay lookup; (6) patch shape (`PATCH_EMPTY`, `PATCH_UNKNOWN_FIELD`, `FIELD_TYPE_INVALID`); (7) enum fields; (8) bindings field-by-field in array order; (9) cross-field rules (duplicate action, effective-map conflicts, limit); (10) `expected_revision` check; (11) commit.
- **PS-109-02.R05** — Error code table (all codes prefixed `KEYBOARD_`; HTTP status is the transport mapping, retryability per CTR-ERR-001):

| Code | HTTP | Retryable | Trigger |
|---|---|---|---|
| KEYBOARD_PAYLOAD_TOO_LARGE | 413 | no | body over 8 KiB (A-KBD-14) |
| KEYBOARD_UNAUTHENTICATED | 401 | no | no valid session or token |
| KEYBOARD_FORBIDDEN | 403 | no | caller lacks capability, or targets another account's profile |
| KEYBOARD_IDEMPOTENCY_KEY_INVALID | 400 | no | key missing, not a ULID, or length not 26 |
| KEYBOARD_IDEMPOTENCY_KEY_REUSED | 422 | no | same key with different payload hash within 24 h |
| KEYBOARD_PATCH_EMPTY | 400 | no | patch has no recognized field |
| KEYBOARD_PATCH_UNKNOWN_FIELD | 400 | no | field name not in schema |
| KEYBOARD_FIELD_TYPE_INVALID | 400 | no | wrong JSON type for a field |
| KEYBOARD_PROFILE_SCHEMA_UNSUPPORTED | 400 | no | `schema_version` other than `keyboard.profile/1` |
| KEYBOARD_CATALOG_VERSION_UNSUPPORTED | 400 | no | `catalog_version` not known to server |
| KEYBOARD_FOCUS_INDICATOR_INVALID | 400 | no | value not in enum |
| KEYBOARD_SHORTCUT_HINTS_INVALID | 400 | no | value not in enum |
| KEYBOARD_BINDING_UNKNOWN_ACTION | 400 | no | `action_id` not in catalog |
| KEYBOARD_BINDING_DUPLICATE_ACTION | 400 | no | same `action_id` twice in one patch |
| KEYBOARD_BINDING_COMBO_MALFORMED | 400 | no | not canonical `Alt+<key>` (R08) |
| KEYBOARD_BINDING_KEY_NOT_ALLOWED | 400 | no | `<key>` outside allowlist |
| KEYBOARD_BINDING_RESERVED_COMBO | 400 | no | combo in reserved list |
| KEYBOARD_BINDING_DUPLICATE_COMBO | 400 | no | two enabled actions with overlapping scope share a combo in effective map (R07) |
| KEYBOARD_BINDING_LIMIT_EXCEEDED | 400 | no | more than 32 bindings |
| KEYBOARD_PROFILE_NOT_FOUND | 404 | no | profile id unknown or not owned (same response for both, prevents enumeration) |
| KEYBOARD_PROFILE_DELETED | 410 | no | profile tombstoned |
| KEYBOARD_REVISION_CONFLICT | 409 | yes, after refetch | `expected_revision` differs from stored revision |
| KEYBOARD_RATE_LIMITED | 429 | yes, after `retry_after_ms` | A-KBD-15 exceeded |
| KEYBOARD_TIMEOUT | 504 | yes | server did not finish within budget (PS-109-06) |
| KEYBOARD_BACKEND_UNAVAILABLE | 503 | yes | relay or storage unavailable |
| KEYBOARD_INTERNAL | 500 | yes, max 1 retry | unhandled error; logged with request_id only |

- **PS-109-02.R06** — Key allowlist for `<key>`: `A`–`Z`, `0`–`9`, `ArrowUp`, `ArrowDown`, `Enter`, `Backspace` (A-KBD-04). Clients map letters and digits from `KeyboardEvent.code` (`KeyA`…`KeyZ`, `Digit0`…`Digit9`), not from `key`, so non-US layouts and macOS Option behave consistently (A-KBD-05).
- **PS-109-02.R07** — Effective map: start from catalog defaults; a binding with `enabled: true` replaces that action's default; `enabled: false` removes it. The effective map must be unique within each scope overlap set. Overlap: `global` overlaps all scopes; `list_view` overlaps `list_view`; `dialog` overlaps `dialog`. Conflicts report `KEYBOARD_BINDING_DUPLICATE_COMBO` and name the `action_id` pair in privacy-safe diagnostics only.
- **PS-109-02.R08** — Canonical form: `Alt+` followed by exactly one allowed key, case-sensitive, no spaces, no other modifiers. Non-canonical text (`alt+s`, `Alt + S`, `Ctrl+Alt+S`) is rejected, not normalized, so stored text equals what the client displays. Reserved combos (v1): `Alt+D`, `Alt+E`, `Alt+F`, `Alt+H` (browser menu and address-bar access on Windows and Linux; A-KBD-04). The reserved list is a shipped constant; PS-109-09 checks it per supported browser.
- **PS-109-02.R09** — Error envelope: every error carries `code`, `retryable`, `localization_key` (`kbd.error.<code in lowercase>`), `request_id`, and for conflicts `current_revision`. No free-text message, no echoed combo, no action pair, no account_id (CTR-ERR-001 privacy-safe diagnostics).

## Example: rejected write
Request patch `{"shortcut_bindings":[{"action_id":"focus_search","key_combo":"alt+s","enabled":true}]}` returns HTTP 400 with `{"code":"KEYBOARD_BINDING_COMBO_MALFORMED","retryable":false,"localization_key":"kbd.error.keyboard_binding_combo_malformed","request_id":"req_EXAMPLE_0001"}`.

## Open decisions
- A-KBD-04 (combo grammar, reserved list), A-KBD-05 (KeyboardEvent.code mapping), A-KBD-14 (payload budget), A-KBD-15 (rate limit values). Reserved list may change after browser matrix testing; any change is a catalog version bump.

## Acceptance criteria
- Every code in R05 has one test case in PS-109-09 with a fixed input and expected code.
- The validation order in R04 is covered by a test where two failures occur and the earlier one wins.
- No validation rule accepts input that the client UI cannot produce, and no code is returned that is absent from R05.
