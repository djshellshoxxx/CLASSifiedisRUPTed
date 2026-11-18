# PS-013-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-02.R01 | Every submit runs all rules below before any write; first failing rule returns one error envelope (CTR-ERR-001 R01). | MVP |
| PS-013-02.R02 | Ownership of every `give` `lst_` is checked at submit and again at lock (PS-013-03). | MVP |
| PS-013-02.R03 | Notes are scanned for contact channels (email, phone, URL, handle) and rejected, not redacted. | MVP |
| PS-013-02.R04 | Expiry must satisfy 0 < expires_at − submitted_at ≤ 14 days. | MVP |

## Data / schema
Input fields as in PS-013-01. Error `code` = `OFFER.<CODE>`; `message_key` = `err.offer.<code>`; `details[].field` uses JSON pointer (e.g. `/give_lines/2`).

## Commands / queries / events
Applies to `offer.submit` and `offer.draft.create` (PS-013-04).

## States & transitions
Validation only; no state change. Rules run in state `draft` only, except R02 re-check during `cycle.locked`.

## Validation & errors
| Code | Retryable | Rule |
|---|---|---|
| OFFER.LINE_COUNT | false | 1–8 lines per side |
| OFFER.DUPLICATE_LINE | false | duplicate `line_key` or `lst_id` on one side |
| OFFER.LISTING_NOT_OWNED | false | give `lst_` not owned by slot `acc_` |
| OFFER.LISTING_UNAVAILABLE | false | give/want `lst_` inactive, paused or sold (F01.S03.M01) |
| OFFER.EXPIRY_RANGE | false | R04 violated |
| OFFER.NOTE_CONTACT | false | R03 pattern hit; no echo of matched text |
| OFFER.QUOTE_STALE | true | `qte_id` past expiry; re-fetch quote |
| OFFER.REVISION_CONFLICT | true | `expected_revision` mismatch (CTR-EVT-001 R02) |
| OFFER.DISABLED | false | `offer.enabled` off (PS-013-10 R03) |

## Authorization
Only the slot's `acc_` may submit; rule order: authorization first, then validation (CTR-ERR-001 R08 hides existence).

## Failure, idempotency, concurrency, offline
Validation is deterministic for a given snapshot. Retryable codes may succeed unchanged after refresh; others need client change.

## Privacy, retention, abuse
Diagnostics never echo input values or matched note text (CTR-ERR-001 R06–R07). Scanner is a rule list, not a classifier, in MVP (ASSUMPTION).

## Observability & budgets
Count per `code` only; no input values in logs. Budget: validation ≤ 20 ms p95 excluding listing lookup.

## Tests
- TEST-PS-013-02-01 (unit): each code triggers on its minimal fixture and on no other.
- TEST-PS-013-02-02 (abuse): contact patterns in 30 variants (spacing, unicode, obfuscated "at"/"dot") rejected.
- TEST-PS-013-02-03 (integration): ownership re-check fails when listing transferred between submit and lock.

## Acceptance criteria
1. Every code in the table has a fixture and a registered message key.
2. No error response contains note text or listing titles.

## Assumptions & open decisions
- ASSUMPTION: contact-pattern rule list is MVP; ML classification is future scope.
- D07 PROVISIONAL (Dxx default, unapproved): note retention in PS-013-07.
