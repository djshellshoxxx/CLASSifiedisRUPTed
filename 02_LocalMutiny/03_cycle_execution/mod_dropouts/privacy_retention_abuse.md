# PS-022-07 — Privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-07.R01 | Dropout records hold closed-enum reasons only; no free text, no location, no item descriptions. | MVP |
| PS-022-07.R02 | Party-level reasons visible to the cycle's participants and operators with privileged grant only. | MVP |
| PS-022-07.R03 | Retention: 180 days after resolution for abuse review, then aggregate counts (D07 default, PROVISIONAL). | MVP |
| PS-022-07.R04 | Dropout signals may feed F07.S03 reputation only as a count with a case reference; no automatic penalty. | MVP |
| PS-022-07.R05 | Peer-originated dropout signals from federation are quarantined until CTR-FED-001 verification (FUTURE). | FUTURE |

## Data / schema
Data classes per CTR-PRV-001: `party_id` PSEUDONYMOUS; `reason_code` PSEUDONYMOUS; timestamps visible to participants.

## Commands / queries / events
Events never disclose which party reported another party (reporter identity limited to case record).

## States & transitions
Retention expiry is a background transition, not a state of the case; expired cases become counts.

## Validation & errors
| Code | Retryable | Class | Notes |
|---|---|---|---|
| CYC_DROPOUT.RATE_LIMITED | true | rate_limited / 429 | 10 reports per principal per hour (ASSUMPTION) |

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md). Deletion requests by a party remove that party's own report text (none exists) and anonymize their identifiers in counts.

## Failure, idempotency, concurrency, offline
Retention job idempotent; re-running produces no extra deletions.

## Privacy, retention, abuse
Threats: (1) griefing by repeated withdrawals to stall cycles — mitigated by per-version single withdrawal and reputation signal count; (2) false reports to exclude a rival — mitigated by report cap, no auto penalty, F12 review; (3) timing inference of which party backed out — deadlines hidden until passed; (4) deanonymization across cycles via dropout frequency — counts bucketed (0, 1, 2–4, 5+) in exports.

## Observability & budgets
Logs: envelope IDs and reason codes only; keyed HMAC for `party_id` (ASSUMPTION).

## Tests
- TEST-PS-022-07-01 (privacy): schema has no free-text column.
- TEST-PS-022-07-02 (abuse): 11th report in one hour → rate limited.
- TEST-PS-022-07-03 (retention): case reduced to counts at T+180 days.
- TEST-PS-022-07-04 (privacy): reporter identity absent from participant-visible events.

## Acceptance criteria
1. No free-text or location field in dropout storage.
2. Reporter identity never returned to the reported party.
3. Retention verified on seeded data.

## Assumptions & open decisions
- ASSUMPTION: report cap 10 per hour; count buckets.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): 180 days abuse-review retention.
- [DECISIONS.md](../../../DECISIONS.md) D05 — PROVISIONAL (D05 default, unapproved): no location data in cycle records.
