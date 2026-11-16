# PS-004-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (envelope, `SYS.*`), CTR-ID-001 (`ID.*`), CTR-EVT-001 (`EVT.REVISION_CONFLICT`, `EVT.IDEMPOTENCY_KEY_REUSED`), CTR-CAP-001 (`SYS.FORBIDDEN`, `SYS.NOT_FOUND`), CTR-PRV-001 (PII classes). **Pending:** PENDING CTR-REG-001 (region registry), PENDING CTR-LST-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-02.R01 | Checks run in the order V0–V11. First failure returns; no state or event is written. | MVP |
| PS-004-02.R02 | Required to publish: `title`, `listing_kind`, `region_cell`, `duration_days` (default 30), `price` (required for sell and wanted; must be null for giveaway). | MVP |
| PS-004-02.R03 | Title and description are scanned for email, phone and street-address patterns before commit. A match sets `hold.reason_code = personal_data_suspected`. It is not an error. Matched text is never stored, logged or echoed. | MVP |
| PS-004-02.R04 | Publish is accepted only when `media_status` ∈ {`none`, `clean`}. | MVP |
| PS-004-02.R05 | V0–V11 add ≤ 5 ms p95 (ASSUMPTION), excluding the PII scan and the risk call. | MVP |
| PS-004-02.R06 | `details[].field` is a JSON pointer (`/price`, `/title`). `details[].rule` is from the PUB rule enum below. Input values are never echoed (CTR-ERR-001 R07). | MVP |

## Validation order
| Step | Check | Failure code |
|---|---|---|
| V0 | Body ≤ 64 KiB, depth ≤ 8 (before parse) | SYS.PAYLOAD_TOO_LARGE |
| V0b | Idempotency lookup on (actor, `lst.publish`, key). Same digest → return original result. Different digest → reject. | EVT.IDEMPOTENCY_KEY_REUSED |
| V0c | Rate limit: ≤ 30 `lst.publish` per `acc_` per 24 h (ASSUMPTION). Replays under V0b do not consume quota. | SYS.RATE_LIMITED |
| V1 | `listing_id` parses as `lst_` (CTR-ID-001 R01, R03, R09) | ID.MALFORMED, ID.PREFIX_MISMATCH |
| V2 | Listing readable by actor. Unreadable or absent → identical body. | SYS.NOT_FOUND |
| V3 | Actor is owner (`lst.update`, owner rule) | SYS.FORBIDDEN |
| V4 | Account not restricted (F07 and F12 state) | PUB.ACCOUNT_RESTRICTED |
| V5 | State gate: `held_review` → PUB.HOLD_ACTIVE; `published`, `archived`, `expired` → PUB.INVALID_STATE | PUB.HOLD_ACTIVE / PUB.INVALID_STATE |
| V6 | `expected_revision` equals current revision | EVT.REVISION_CONFLICT |
| V7 | Required fields present (R02). Details rules: `title_required`, `kind_required`, `region_cell_required`, `price_required`, `price_must_be_null` | PUB.LISTING_INCOMPLETE |
| V8 | `region_cell` in registry (PENDING CTR-REG-001). Rule: `region_unregistered` | PUB.REGION_NOT_REGISTERED |
| V9 | `duration_days` ∈ {7, 14, 30, 60, 90}. Rule: `duration_not_allowed` | PUB.DURATION_INVALID |
| V10 | `media_status`: `pending` → retryable; `rejected` → terminal | PUB.MEDIA_SCAN_PENDING / PUB.MEDIA_REJECTED |

After V10, the PII scan and risk verdict choose T1 (publish) or T2 (hold). Neither is an error (see PS-004-03).

## Error registry (PUB)
| Code | Retryable | Category / HTTP | message_key |
|---|---|---|---|
| PUB.INVALID_STATE | false | unprocessable_state / 422 | err.pub.invalid_state |
| PUB.HOLD_ACTIVE | false | unprocessable_state / 422 | err.pub.hold_active |
| PUB.LISTING_INCOMPLETE | false | unprocessable_state / 422 | err.pub.listing_incomplete |
| PUB.REGION_NOT_REGISTERED | false | validation / 400 | err.pub.region_not_registered |
| PUB.DURATION_INVALID | false | validation / 400 | err.pub.duration_invalid |
| PUB.MEDIA_SCAN_PENDING | true | precondition_failed / 412 | err.pub.media_scan_pending |
| PUB.MEDIA_REJECTED | false | unprocessable_state / 422 | err.pub.media_rejected |
| PUB.ACCOUNT_RESTRICTED | false | unprocessable_state / 422 | err.pub.account_restricted |

`PUB` is the module slug for CTR-ERR-001 R02. Codes are never renamed or reused.

## Assumptions & open decisions
- ASSUMPTION: rate limit 30 per 24 h; V0–V11 latency budget.
- PROVISIONAL (D05 default, unapproved): region cells come from the registry; publish fails closed on unknown cells.
- Related: PS-004-07 (PII scan semantics), PS-004-05 (owner and state gates).

## Tests
- TEST-PS-004-02-01 (matrix): one fixture per step V0–V10 produces the listed code, retryable flag and HTTP status.
- TEST-PS-004-02-02 (lint): every PUB code has a message_key derivable from the code and a category-to-HTTP match (CTR-ERR-001 TEST-03).
- TEST-PS-004-02-03 (privacy): fixture with invalid `region_cell` containing a street string returns a body without that string.
- TEST-PS-004-02-04 (order): hidden draft with missing fields returns SYS.NOT_FOUND, not PUB.LISTING_INCOMPLETE (V2 before V7).

## Acceptance criteria
1. All eight PUB codes pass TEST-PS-004-02-01 and -02.
2. Visibility checks (V2) run before any field-level check (V7–V10); no leak of draft contents.
3. PII matches never produce an error body and never appear in any stored or logged field.
