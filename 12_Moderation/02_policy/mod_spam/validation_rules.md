# PS-097-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-SCH-001, CTR-FED-001 (R04, R10).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-02.R01 | `subject_type` ∈ {lst, srv, msg, fed_item}; the `subject_ref` prefix must match. Else `SPAM.SUBJECT_UNSUPPORTED`. | MVP |
| PS-097-02.R02 | Text input ≤ 16 KiB after NFC normalization (listings, services). Larger → `SPAM.INPUT_TOO_LARGE`. | MVP |
| PS-097-02.R03 | `fed_item` evaluation requires a prior successful signature check (CTR-FED-001 verification order). Otherwise `SPAM.SIGNATURE_NOT_VERIFIED`. | MVP |
| PS-097-02.R04 | `reason_code` ∈ {DUPLICATE_TEXT, LINK_PATTERN, PRICE_ANOMALY, IMAGE_REUSE, SEND_RATE, NEW_RECIPIENT_BURST, BLOCKED_PATTERN, MODEL_UNCERTAIN}. | MVP |
| PS-097-02.R05 | `model_version` must be a registered, non-retired version. Else `SPAM.MODEL_VERSION_UNKNOWN`. | MVP |
| PS-097-02.R06 | A reviewer release or reject requires `expected_revision` and a case or review reference. | MVP |

## Data / schema
Module prefix `SPAM`.

| Code | Category | HTTP | Retryable | `details.rule` |
|---|---|---|---|---|
| `SPAM.SUBJECT_UNSUPPORTED` | validation | 400 | false | `subject_type` |
| `SPAM.INPUT_TOO_LARGE` | payload_too_large | 413 | false | `text` |
| `SPAM.SIGNATURE_NOT_VERIFIED` | unprocessable_state | 422 | false | `signature` |
| `SPAM.MODEL_VERSION_UNKNOWN` | validation | 400 | false | `model_version` |
| `SPAM.SCORE_UNAVAILABLE` | unavailable | 503 | true | — |
| `SPAM.TRANSITION_NOT_ALLOWED` | unprocessable_state | 422 | false | `state` |
| `SPAM.EXPORT_TOO_LARGE` | validation | 400 | false | `cursor` (> 1 000 subjects, PS-097-10) |
| `EVT.REVISION_CONFLICT` | conflict | 409 | false | `expected_revision` |

## Commands / queries / events
Order: subject type, input size, signature (federated only), model version, state guard.

## States & transitions
Validation failures write no `spm_event`. `SPAM.SCORE_UNAVAILABLE` leaves the subject in `pending_evaluation` (PS-097-06).

## Validation & errors
No input values in responses. Error details never reveal the classifier feature that triggered a decision (prevents evasion).

## Authorization
Evaluation is a `sys_` call; reviewer decisions follow PS-097-05.

## Failure, idempotency, concurrency, offline
Concurrent evaluations of the same subject and model version are deduplicated by unique key.

## Privacy, retention, abuse
Validation logs record rule names and sizes in 4 KiB buckets, never content.

## Observability & budgets
Counter `spam_validation_error_total{code}`.

## Tests
- `TEST-PS-097-02-01` unit: each code on exact condition only.
- `TEST-PS-097-02-02` negative: 16 KiB + 1 byte → `SPAM.INPUT_TOO_LARGE`.
- `TEST-PS-097-02-03` negative: unverified `fed_item` → `SPAM.SIGNATURE_NOT_VERIFIED`, no feature extraction run.
- `TEST-PS-097-02-04` error-leak: error bodies do not reveal reason detail beyond the registry code.

## Acceptance criteria
1. No unverified federated item is scored.
2. Error bodies contain no content and no classifier feature names.
3. Size limits enforced before feature extraction.

## Assumptions & open decisions
- ASSUMPTION: 16 KiB text limit matches listing description limits in F01 (to confirm).
- D01 (federated protocol), PROVISIONAL default: verification before scoring (unapproved).
