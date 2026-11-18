# PS-100-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-COM-001 (R-claims), CTR-PRV-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-02.R01 | `subject_type` ∈ {acc, lst, srv, rnt, auc, cyc}; `subject_ref` prefix must match. Else `RISK.SUBJECT_UNSUPPORTED`. | MVP |
| PS-100-02.R02 | Every signal reference must resolve to a `sig_` owned by `mod_signals` and be ≤ 24 h old for tier-raising use; older signals may only lower confidence. Unresolved → `RISK.SIGNAL_UNRESOLVED`. | MVP |
| PS-100-02.R03 | Feature set must not include precise location, contact lists, or proxies flagged by the fairness review list (F14/F10). Enforced by a feature allow-list. Attempt → `RISK.FEATURE_NOT_ALLOWED` at build time. | MVP |
| PS-100-02.R04 | Payment claim inputs are read as claimed status only (CTR-COM-001). A claim status other than `claimed` for confirmed evidence is not accepted as input. | MVP |
| PS-100-02.R05 | `reason_codes` ∈ {ACCOUNT_NEW, SIGNAL_BURST, LIMIT_HITS, FLAG_CLUSTER, PAYMENT_CLAIM_MISMATCH, COUNTERPARTY_DISPUTE, PATTERN_MATCH, MODEL_UNCERTAIN}. | MVP |

## Data / schema
Module prefix `RISK`.

| Code | Category | HTTP | Retryable | `details.rule` |
|---|---|---|---|---|
| `RISK.SUBJECT_UNSUPPORTED` | validation | 400 | false | `subject_type` |
| `RISK.SIGNAL_UNRESOLVED` | validation | 400 | false | `signal_refs` |
| `RISK.FEATURE_NOT_ALLOWED` | internal | 500 | false | — (build-time, never returned to users) |
| `RISK.MODEL_VERSION_UNKNOWN` | validation | 400 | false | `model_version` |
| `RISK.SCORE_UNAVAILABLE` | unavailable | 503 | true | — |
| `RISK.TRANSITION_NOT_ALLOWED` | unprocessable_state | 422 | false | `state` |
| `RISK.EXPORT_TOO_LARGE` | validation | 400 | false | `cursor` (> 100 items, PS-100-10) |
| `EVT.REVISION_CONFLICT` | conflict | 409 | false | `expected_revision` |

## Commands / queries / events
Order: subject type, signal resolution and age, feature allow-list (build time), model version, state guard.

## States & transitions
Validation failures write no `rsk_event`.

## Validation & errors
Responses never reveal which signal or feature drove a tier (prevents gaming). Subjects receive only generic state.

## Authorization
`RISK.TRANSITION_NOT_ALLOWED` and not-found responses follow CTR-ERR-001 R08.

## Failure, idempotency, concurrency, offline
Concurrent assessments on one subject and trigger are deduplicated by (subject_ref, trigger correlation_id).

## Privacy, retention, abuse
Logs record rule names and counts only.

## Observability & budgets
`risk_validation_error_total{code}`.

## Tests
- `TEST-PS-100-02-01` unit: each code on exact condition only.
- `TEST-PS-100-02-02` negative: signal older than 24 h cannot raise tier (lowers confidence only).
- `TEST-PS-100-02-03` build-time: a feature named `postcode` fails the allow-list check.
- `TEST-PS-100-02-04` negative: payment claim with confirmed evidence status is rejected as input (claimed-only rule).

## Acceptance criteria
1. Feature allow-list enforced at build and runtime.
2. No error reveals driving signal or feature.
3. Claimed-only rule for payment inputs verified.

## Assumptions & open decisions
- ASSUMPTION: the feature allow-list and proxy review list are maintained by F10 and F14 with this module.
- D06 (receipts), PROVISIONAL default: signed statements only, verification separate (unapproved).
