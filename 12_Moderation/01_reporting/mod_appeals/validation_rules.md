# PS-092-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-02.R01 | `target_type` and `target_id` must match; `target_id` prefix must be `enf_`, `spm_` or `rpt_`. Mismatch → `APPEALS.TARGET_NOT_APPEALABLE`. | MVP |
| PS-092-02.R02 | Submission inside `window_ends_at` (30 days after the target notice, ASSUMPTION). Later → `APPEALS.WINDOW_EXPIRED`. | MVP |
| PS-092-02.R03 | `body` 1–2 000 characters after Unicode NFC normalization; empty or longer → `APPEALS.BODY_LENGTH`. | MVP |
| PS-092-02.R04 | `evidence_refs` ≤ 5 items, each an `evd_` ID owned by the appellant's case. | MVP |
| PS-092-02.R05 | `decision_code` ∈ {UPHELD, MODIFIED, REVERSED}; `MODIFIED` requires a `modified_action` from the registry in mod_enforcement. | MVP |
| PS-092-02.R06 | A reviewer must differ from the original decider and from any reporter on the target case. | MVP |

## Data / schema
Error registry for this module (CTR-ERR-001). Module prefix `APPEALS` (7 characters).

| Code | Category | HTTP | Retryable | `details.rule` |
|---|---|---|---|---|
| `APPEALS.TARGET_NOT_APPEALABLE` | unprocessable_state | 422 | false | `target_id` |
| `APPEALS.WINDOW_EXPIRED` | unprocessable_state | 422 | false | `window_ends_at` |
| `APPEALS.BODY_LENGTH` | validation | 400 | false | `body` |
| `APPEALS.EVIDENCE_INVALID` | validation | 400 | false | `evidence_refs` |
| `APPEALS.DUPLICATE_OPEN` | conflict | 409 | false | `target_id` |
| `APPEALS.REVIEWER_CONFLICT` | forbidden | 403 | false | `reviewer_ref` |
| `APPEALS.DECISION_CODE_UNKNOWN` | validation | 400 | false | `decision_code` |

`APPEALS.DUPLICATE_OPEN` returns the existing `apl_` ID in `details` only when the caller is the appellant. Otherwise it returns `SYS.NOT_FOUND` (CTR-ERR-001 R08).

## Commands / queries / events
Validation order: auth, target existence, window, duplicate, body, evidence, decision code, reviewer conflict.

## States & transitions
Validation failures never write `apl_event`.

## Validation & errors
Input values are never echoed (CTR-ERR-001 R07). `body` text is not returned in errors or logs.

## Authorization
Reviewer conflict check uses the case participant list from F12.S01.M01 (`rpt_`) and the decider on `enf_`.

## Failure, idempotency, concurrency, offline
Duplicate check is re-run inside the write transaction (partial unique index is the final guard).

## Privacy, retention, abuse
Validation logs record rule names only, never body length categories smaller than 200-character buckets (ASSUMPTION, to limit fingerprinting).

## Observability & budgets
Counter `appeals_validation_error_total{code}`.

## Tests
- `TEST-PS-092-02-01` unit: each registry code triggers on exact condition only.
- `TEST-PS-092-02-02` negative: appeal at day 30 + 1 second → `APPEALS.WINDOW_EXPIRED`.
- `TEST-PS-092-02-03` negative: reviewer equal to original decider → `APPEALS.REVIEWER_CONFLICT`.
- `TEST-PS-092-02-04` property: NFC normalization makes visually identical bodies equal in length counts.

## Acceptance criteria
1. No invalid appeal writes a row.
2. Error responses contain no body text and no reporter identifiers.
3. All codes are present in CTR-ERR-001 registry format.

## Assumptions & open decisions
- ASSUMPTION: 30-day appeal window and 5-evidence limit are defaults for Trust&Safety review.
- D07 (retention), PROVISIONAL default governs retention of rejected appeal records (unapproved).
