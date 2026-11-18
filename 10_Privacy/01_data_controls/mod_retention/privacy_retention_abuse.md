# PS-079-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (retention classes, legal hold R07–R08, disclosure), CTR-COM-001 (RET-EVD, dispute window R16), CTR-FED-001 (RET-FED tombstones and dedupe).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-07.R01 | Default maxima per class follow CTR-PRV-001: RET-EPH 24 h, RET-OPS 30 d (idempotency 7 d), RET-AUD 12 mo, RET-PRIV 365 d after last access or deletion (ASSUMPTION), RET-LOC 30 d after transaction end or 7 d after last use (ASSUMPTION). | MVP |
| PS-079-07.R02 | RET-EVD: 24 months after final state (ASSUMPTION); personal fields redacted after 12 months while hashes remain (CTR-PRV-001). Commerce evidence is not deleted here. | MVP |
| PS-079-07.R03 | RET-FED tombstones and dedupe state kept ≥ 90 days beyond the maximum envelope expiry (ASSUMPTION), so late copies are still rejected. | MVP |
| PS-079-07.R04 | A hold may not extend any class beyond its `ends_at`; hold reasons are coded and free of personal data. | MVP |
| PS-079-07.R05 | Retention periods are config values with F10 approval; no period is hard-coded in code paths. | MVP |

## Data / schema
Policy values stored in `retention_policy`; jurisdiction tags are PENDING R07 review.

## Commands / queries / events
No additional commands.

## States & transitions
Holds and expiry per PS-079-03.

## Validation & errors
See PS-079-02.

## Authorization
See PS-079-05.

## Failure, idempotency, concurrency, offline
Offline clients purge local caches on their own expiry (RET-EPH for pending queues; cached profile data cleared on logout, CTR-PRV-001).

## Privacy, retention, abuse
Abuse path: a party uses a hold request to block deletion of its own records or to delay another party's deletion. Mitigation: holds require case scope and two approvers; selector must match records under the case; holds on a single subject's data are reviewed by F12.

## Observability & budgets
`retention_holds_active` gauge with age histogram; alert on any hold older than 300 days (ASSUMPTION).

## Tests
- TEST-PS-079-07-01 (retention): each class expires at maximum in replica, cache and search index within 24 h (CTR-PRV-001 TEST-06).
- TEST-PS-079-07-02 (abuse): hold selector matching nothing under case is rejected.

## Acceptance criteria
1. Each default maximum is configured and tested.
2. Tombstone dedupe window retained as specified (TEST-PS-079-07-01 variant).
3. No hard-coded retention literal outside policy config (static check).

## Assumptions & open decisions
- PROVISIONAL (D07 default): minimal per-category retention with legal-hold exceptions.
- ASSUMPTION: values in R01–R03.
- OPEN (R07): jurisdiction review for RET-EVD and legal holds.
