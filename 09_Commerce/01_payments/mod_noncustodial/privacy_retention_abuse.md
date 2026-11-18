# PS-069-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R03, R06, R08, R09, R11), CTR-FED-001 (R03), CTR-COM-001 (R01). **Decisions:** D05 (PROVISIONAL default, unapproved), D07 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-07.R01 | `contact_hint` is PRIVATE_PERSONAL; purged 30 days after trx reaches a terminal state, or on owner request, whichever is first (ASSUMPTION). | MVP |
| PS-069-07.R02 | Route rows: RET-EVD (24 months after final state; personal fields redacted at 12 months, CTR-PRV-001 table). | MVP |
| PS-069-07.R03 | No route data is federated, exported to a third party, sent in push previews or written to analytics (CTR-PRV-001 disclosure matrix). | MVP |
| PS-069-07.R04 | Max 20 `route.declare` per `acc_` per hour (ASSUMPTION) to limit address enumeration. | MVP |
| PS-069-07.R05 | Logs carry `route_id` only. `destination`, `destination_hash` and `contact_hint` are never logged. | MVP |

## Data / schema
Data classes per field are in PS-069-01. Retention table entries are referenced by class name (RET-EVD, RET-PRIV, RET-OPS), not redefined.

## Commands / queries / events
No additional commands. Deletion request on `contact_hint` emits `route.hint_purged` (payload: `route_id`, `purged_at`).

## States & transitions
Hint purge does not change route `status`.

## Validation & errors
Rate-limit breach returns `SYS.RATE_LIMITED` (retryable true, `retry_after` header).

## Authorization
Owner may purge own hint at any time; counterparty may not.

## Failure, idempotency, concurrency, offline
Purge job is idempotent on `route_id`. Backups expire by their own schedule; restore replays hint purges (CTR-PRV-001 R06).

## Privacy, retention, abuse
Threats and controls:

| Threat | Control |
|---|---|
| Address enumeration across users | Rate limit R04; destination is visible only to trx participants |
| Graph deanonymization (on-chain address reuse linked to `acc_`) | Advice to use one destination per trx; warning shown; ASSUMPTION: no enforcement in MVP |
| Off-platform handle leakage | PRIVATE_PERSONAL class; no logging; encrypted at rest |
| Fake route to divert payment | Route visible to both parties; counterparty attestation in PS-071 |
| Scraping `route.read` | PS-069-05 denied-access alert |

Pseudonyms do not guarantee anonymity: a stable `acc_` plus a public on-chain destination links activity.

## Observability & budgets
Count of purges per day; rate-limit hits per 1000 requests (alert > 5 per 1000).

## Tests
- TEST-PS-069-07-01 (integration): hint purge at trx terminal state plus 30 days.
- TEST-PS-069-07-02 (negative): log scan for canary destination and hint strings returns zero matches.
- TEST-PS-069-07-03 (negative): federation export of a route is refused (`FED.DATA_CLASS_NOT_ALLOWED`).
- TEST-PS-069-07-04 (abuse): 21st declare within an hour is rate limited.

## Acceptance criteria
1. Canary strings never appear in logs, analytics or push payloads (automated scan on staging).
2. Retention jobs remove `contact_hint` within 30 days in 100% of fixtures.
3. Federation export of route records is impossible in MVP (tested).

## Assumptions & open decisions
- ASSUMPTION: 30-day hint retention after trx terminal state.
- ASSUMPTION: 20 declares per hour per account.
- D07 (PROVISIONAL default, unapproved): minimal per-category retention with legal-hold exceptions (CTR-PRV-001 R07).
- D05 (PROVISIONAL default, unapproved): destinations are never coarse-location; no geoprivacy surface here.
