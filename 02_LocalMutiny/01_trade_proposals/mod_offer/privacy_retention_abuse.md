# PS-013-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-07.R01 | Record data class is PSEUDONYMOUS; no field of class LOCATION_* or PRIVATE_PERSONAL exists in this module. | MVP |
| PS-013-07.R02 | `note` is never published, federated or included in analytics (CTR-PRV-001 disclosure matrix). | MVP |
| PS-013-07.R03 | A party may create ≤ 20 new offer revisions per 24 h and hold ≤ 5 open offers per `lst_` (ASSUMPTION). | MVP |
| PS-013-07.R04 | When a give `lst_` changes price, title or availability after submit, the offer is flagged for re-validation before lock. | MVP |

## Data / schema
Retention classes: active offer revisions kept while the cycle is open plus 90 days after `closed` (D07 PROVISIONAL); drafts purged after 30 days; `note` purged with its revision. Legal hold per CTR-PRV-001 R07.

## Commands / queries / events
Deletion emits an event carrying IDs and counts only (CTR-PRV-001 R12). No event carries `note`.

## States & transitions
Expiry or closure starts the retention clock. Deletion of `acc_` (account closure) withdraws open offers first, then deletes notes.

## Validation & errors
Contact-channel scan per PS-013-02 R03. Scan hits never stored in logs.

## Authorization
Owner export and deletion per CTR-PRV-001 R11. Counterparty visibility ends on removal from the cycle.

## Failure, idempotency, concurrency, offline
Retention sweep is idempotent per `ofr_id`; re-run after failure removes nothing new.

## Privacy, retention, abuse
Abuse controls: rate limits (R03), flood detection by `acc_` (alert, then throttle), offers used to probe others' holdings are limited because line visibility is participant-scoped. Reports go to F12 by `rpt_` ID; this module does not decide moderation outcomes.

## Observability & budgets
Retention sweep lag ≤ 24 h (CTR-PRV-001 R06). Rate-limit hits counted per rule, never per content.

## Tests
- TEST-PS-013-07-01 (unit): PSEUDONYMOUS-only schema check passes.
- TEST-PS-013-07-02 (abuse): 21st revision in 24 h is refused.
- TEST-PS-013-07-03 (integration): account closure removes notes within 24 h and leaves IDs and counts.

## Acceptance criteria
1. Zero `note` text in analytics, federation and log fixtures.
2. Retention purge matches the class table for 100% of fixture records.

## Assumptions & open decisions
- ASSUMPTION: rate limits in R03 are initial values, tuned after pilot.
- D07 PROVISIONAL (Dxx default, unapproved): minimal per-category retention with legal-hold exceptions.
