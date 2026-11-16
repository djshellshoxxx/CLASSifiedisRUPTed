# PS-012-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (envelope, codes), CTR-EVT-001 (revision, idempotency), CTR-COM-001 (amounts, quotes), CTR-CAP-001 (not-found rule).

**Decision label:** Limits (5 revisions, 7-day default expiry, 30-day maximum) are ASSUMPTION. Quote rules follow D03 PROVISIONAL (D03 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-02.R01 | Every rejected command returns a CTR-ERR-001 envelope. Module code `CTROFFER` (8 letters, within CTR-ERR-001.R02). | MVP |
| PS-012-02.R02 | Validation runs in a fixed order: identity, state, revision, terms, value, rate. First failure returns; no partial write. | MVP |
| PS-012-02.R03 | `details[].rule` uses only the enum listed below. Input values are never echoed (CTR-ERR-001.R07). | MVP |
| PS-012-02.R04 | Non-participants receive `SYS.NOT_FOUND`, identical to a missing `cyc_` (CTR-ERR-001.R08). | MVP |
| PS-012-02.R05 | Counter `expires_at` ≤ `created_at` + 30 days; default 7 days. | MVP |

## Validation rules
| Check | Failure code | Category | Retryable | `details[].rule` |
|---|---|---|---|---|
| Caller is a `slot_terms` holder | `SYS.NOT_FOUND` | not_found | false | — |
| Caller is not the latest proposer | `CTROFFER.ROLE_NOT_PERMITTED` | forbidden | false | `not_latest_proposer` |
| `cyc_` status is OPEN | `CTROFFER.TARGET_NOT_OPEN` | unprocessable_state | false | `cyc_closed` |
| `target_revision` = current revision | `EVT.REVISION_CONFLICT` | conflict | false | — |
| Revision ≤ 5 | `CTROFFER.DEPTH_LIMIT` | unprocessable_state | false | `revision_cap` |
| `content_hash` differs from current revision | `CTROFFER.TERMS_INVALID` | validation | false | `no_change` |
| Each `listing_id` ACTIVE and held by a slot holder | `CTROFFER.ITEM_UNAVAILABLE` | unprocessable_state | false | `item_not_active` |
| Both holders ACTIVE (not dropped out) | `CTROFFER.PARTY_INACTIVE` | unprocessable_state | false | `holder_inactive` |
| `qty` integer 1–100; array sizes ≤ 20 | `CTROFFER.TERMS_INVALID` | validation | false | `range` |
| `amount_minor` matches `^(0\|[1-9][0-9]{0,38})$` | `CTROFFER.TERMS_INVALID` | validation | false | `money_format` |
| Cross-currency: `quote_id` valid, unexpired | `COM.QUOTE_EXPIRED` | unprocessable_state | false | — |
| Creates by actor on `cyc_` ≤ 10 per 24 h | `SYS.RATE_LIMITED` | rate_limited | true | — |

Accept/reject/withdraw on a non-OPEN counter: `CTROFFER.COUNTER_NOT_OPEN` (422, not retryable). Specific reasons use `CTROFFER.COUNTER_EXPIRED`, `CTROFFER.COUNTER_SUPERSEDED`, `CTROFFER.COUNTER_INVALIDATED` (`details[].rule` = `ITEM_GONE` | `PARTY_INACTIVE` | `TARGET_CHANGED` | `OFFER_WITHDRAWN`). All 422, not retryable.

`message_key` = `err.ctroffer.<code lowercased>` (CTR-ERR-001.R05).

## Assumptions & open decisions
- ASSUMPTION: 10 creates per actor per `cyc_` per 24 h; tune after abuse review (F16).
- D03 PROVISIONAL (D03 default, unapproved): quote expiry ≤ 15 min, `HALF_EVEN` rounding.
- PENDING: `SYS.RATE_LIMITED` retry_after_ms values per CTR-ERR-001 registry.
