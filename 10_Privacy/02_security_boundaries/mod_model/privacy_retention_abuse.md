# PS-081-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R03), CTR-FED-001 (R03), CTR-EVT-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-07.R01 | Model contains no personal data, sample values or real hostnames of users. | MVP |
| PS-081-07.R02 | Model versions are retained indefinitely for audit (ASSUMPTION). | MVP |
| PS-081-07.R03 | The model is the input to privacy review; no flow may bypass it in release notes. | MVP |
| PS-081-07.R04 | Abuse: tampering with approved versions is detected by digest mismatch within 1 CI run. | MVP |

## Data / schema
Only classes, zone names, IDs and digests.

## Commands / queries / events
None beyond [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Retirement of a flow does not delete history.

## Validation & errors
Sample-data rule in PS-081-02.R05.

## Authorization
Model read restricted per PS-081-05.

## Failure, idempotency, concurrency, offline
Not applicable beyond PS-081-06.

## Privacy, retention, abuse
Data class PUBLIC for model structure (internal), PSEUDONYMOUS for asset owner references. Retention: indefinite version history (ASSUMPTION). Abuse controls: digest verification (R04), separation of duties (PS-081-03).

## Observability & budgets
Alert on digest mismatch. Metric of flows with class PRIVATE_PERSONAL or higher (CTR-PRV-001 ordering).

## Tests
- TEST-PS-081-07-01 (privacy): scan of fixtures finds no email, phone or coordinate.
- TEST-PS-081-07-02 (abuse): modified approved version fails digest check.
- TEST-PS-081-07-03 (retirement): retired flow remains in history.

## Acceptance criteria
1. Privacy scan passes in CI.
2. Digest tamper detected.
3. Retirement keeps history.

## Assumptions & open decisions
- ASSUMPTION: indefinite version retention.
- PROVISIONAL (D07 default, unapproved): per-category retention with legal-hold exceptions.
