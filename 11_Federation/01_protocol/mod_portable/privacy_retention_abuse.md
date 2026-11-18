# PS-083-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R02, R03, R08), CTR-PRV-001 (R03, R06, R11), CTR-EVT-001 (R13).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-07.R01 | Bundles never contain PRIVATE_PERSONAL, FINANCIAL_EVIDENCE, LOCATION_PRECISE or SECRET data (PS-083-02.R01). | MVP |
| PS-083-07.R02 | Per-audience pseudonym replaces `actor_ref` (keyed HMAC, ASSUMPTION) so two audiences cannot correlate the owner. | MVP |
| PS-083-07.R03 | Bundle file deleted 7 days after delivery acknowledgement (ASSUMPTION); manifest audit record kept per RET-AUD. | MVP |
| PS-083-07.R04 | Abuse: peer exceeding 10 MiB/h or 600 events/min is rate-limited (CTR-FED-001 R11). | MVP |

## Data / schema
Manifest class PSEUDONYMOUS. Item classes as per items.

## Commands / queries / events
None beyond [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Deletion of bundle file is a transition in [workflow_state_machine.md](workflow_state_machine.md) (`delivered` → `purged`, to add to table, ASSUMPTION).

## Validation & errors
`FED.RATE_LIMITED` (429, retryable).

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Purge job idempotent per bundle.

## Privacy, retention, abuse
Retention: bundle file 7 days after ack; audit 12 months (RET-AUD, ASSUMPTION). Export obligations for portability: owner's own data at its classes (CTR-PRV-001 R11).

## Observability & budgets
Alert on bundles with re-identification signal (same pseudonym across two audiences). Logs carry no pseudonyms.

## Tests
- TEST-PS-083-07-01 (privacy): bundle built from mixed items excludes restricted items.
- TEST-PS-083-07-02 (correlation): same owner yields different pseudonyms for two audiences.
- TEST-PS-083-07-03 (retention): file purged at 7 days in fixture clock.

## Acceptance criteria
1. No restricted class in any bundle fixture.
2. Pseudonym per audience verified.
3. Purge test passes.

## Assumptions & open decisions
- ASSUMPTION: keyed HMAC per audience; 7-day purge.
- PROVISIONAL (D07 default, unapproved): minimal retention with legal-hold exceptions.
