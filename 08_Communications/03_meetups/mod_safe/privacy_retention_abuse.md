# PS-066-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01–R06, R08, R09; RET-PRIV), CTR-FED-001 (R03), CTR-ERR-001 (R06). **Decisions:** D05, D07 (PROVISIONAL, unapproved). Privacy Lead review required (F10).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-07.R01 | Plan record purged 7 days after terminal state (shorter than RET-PRIV 365 days; ASSUMPTION; F10 to approve). Legal hold per CTR-PRV-001 R07 overrides. | MVP |
| PS-066-07.R02 | Trusted-contact hash deleted immediately on revocation, on plan purge, or when the party deletes the account. | MVP |
| PS-066-07.R03 | Logs and metrics carry no venue_ref, window, handle, code or IP address. | MVP |
| PS-066-07.R04 | No plan data is federated, pushed in previews, or used for analytics beyond aggregate counts. | MVP |
| PS-066-07.R05 | A party may create at most 5 new plans per 24 h and at most 3 safe exits per 24 h (ASSUMPTION). | MVP |
| PS-066-07.R06 | Report snapshot to F12 contains status, codes and timestamps rounded to the hour; venue and window require the reporting party's explicit consent. | MVP |

## Data / schema
Data classes: plan IDs PSEUDONYMOUS; venue, window, status, trusted-contact hash PRIVATE_PERSONAL; code hashes SECRET. Retention class: a new `RET-SAFE` class (7 days after terminal state; PROVISIONAL D07).

## Commands / queries / events
Purge is a `sys_` timer that emits `meetup_plan.purged` with ID and reason only.

## States & transitions
Retention lifecycle: `active` → `terminal` → `purged`. Purge is irreversible; backups follow CTR-PRV-001 R06.

## Validation & errors
Rate-limit breaches return `SYS.RATE_LIMITED`; no reason is given to the other party.

## Authorization
Trusted contact is a third party with no account in ClassRup. Its handle is never shown to the counterparty beyond the hash match result.

## Failure, idempotency, concurrency, offline
Purge job is idempotent; deletion propagates to replicas and caches within 24 h (CTR-PRV-001 R06).

## Privacy, retention, abuse
- Stalking: plan frequency and repeat-counterparty limits (R05); repeated cancellations by one party raise a review alert.
- Coercion: no visible indicator that a check-in was made under duress; no special UI.
- Harassment via safe exit: rate limit R05; reports via F12.
- Pseudonyms do not guarantee anonymity; the UI states this at plan creation.
- The platform cannot guarantee safety at the venue; this is disclosed in the UI.

## Observability & budgets
Aggregate-only abuse metrics. Venue-level aggregates are suppressed below K_MIN = 5 (CTR-PRV-001 R04).

## Tests
- TEST-PS-066-07-01 (integration): plan purged at 7 days plus scheduler tolerance; search index and cache cleared within 24 h.
- TEST-PS-066-07-02 (unit): log lint finds no venue, handle or code in a full plan lifecycle.
- TEST-PS-066-07-03 (abuse): 6th plan in 24 h rejected with `SYS.RATE_LIMITED`.
- TEST-PS-066-07-04 (integration): report snapshot contains no venue unless consent flag is set.

## Acceptance criteria
1. Retention job removes all plan data within the stated window (test).
2. No federation path includes `meetup_plan` (contract test).
3. Abuse controls have negative tests in CI.

## Assumptions & open decisions
- ASSUMPTION: 7-day purge; rate limits R05; K_MIN = 5.
- D07 (PROVISIONAL default, unapproved): minimal per-category retention with legal-hold exceptions.
- D05 (PROVISIONAL default, unapproved): coarse venue reference; no precise location.
