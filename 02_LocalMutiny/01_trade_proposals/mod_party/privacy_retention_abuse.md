# PS-014-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-07.R01 | `acc_id` is PRIVATE_PERSONAL and never leaves the owner/system boundary. | MVP |
| PS-014-07.R02 | Counterparties see `prf_ref` and `region_cell_id` only, and only while the cycle is open (CTR-PRV-001 disclosure conditions). | MVP |
| PS-014-07.R03 | A party may hold ≤ 20 open slots across all cycles (Sybil and block-spam limit, ASSUMPTION). | MVP |
| PS-014-07.R04 | Invitations per `acc_`: ≤ 10 per 24 h (ASSUMPTION). | MVP |

## Data / schema
Retention: slots kept while cycle open plus 90 days after close (D07 PROVISIONAL). `region_cell_id` removed from counterparties on close (CTR-PRV-001 R06).

## Commands / queries / events
Deletion events carry IDs and counts only (CTR-PRV-001 R12).

## States & transitions
Closure of the cycle ends counterparty visibility; the slot itself is retained for audit under the retention class.

## Validation & errors
Rate-limit responses use `PARTY.RATE_LIMITED` (retryable after window). Diagnostics contain no counts per identity.

## Authorization
Owner export includes own slots; counterparty slots redacted to `prf_ref` and status (CTR-PRV-001 R11).

## Failure, idempotency, concurrency, offline
Retention sweep idempotent per `par_id`.

## Privacy, retention, abuse
Sybil controls: cap on open slots (R03), invitation rate (R04), and removal path via F12 case. Coarse region only: no inference from slot timing is stored. Block lists are F12 concerns; this module enforces the outcome.

## Observability & budgets
Rate-limit hit counts per rule. No per-identity labels.

## Tests
- TEST-PS-014-07-01 (abuse): 21st open slot refused.
- TEST-PS-014-07-02 (privacy): closed cycle hides `region_cell_id` from counterparties.
- TEST-PS-014-07-03 (integration): account closure removes owner-visible slots' `acc_id` link after retention.

## Acceptance criteria
1. Zero `acc_id` in federation, analytics and log fixtures.
2. Retention purge matches class table for 100% of fixtures.

## Assumptions & open decisions
- ASSUMPTION: 20 open slots and 10 invites per day are initial values.
- D05 PROVISIONAL (Dxx default, unapproved): coarse regions only; per-meetup precision is out of scope.
- D07 PROVISIONAL (Dxx default, unapproved): minimal per-category retention.
