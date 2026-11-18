# PS-063-07 — privacy retention abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (FINANCIAL_EVIDENCE, RET-EVD, disclosure matrix), CTR-FED-001 (no financial federation), CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-07.R01 | Offer amounts, currencies and compensation lines are FINANCIAL_EVIDENCE. Never in logs, analytics, push previews, events or federation. | MVP |
| PS-063-07.R02 | Push previews: "New offer" only. | MVP |
| PS-063-07.R03 | Retention RET-EVD: 24 months after final state; personal fields redacted after 12 months, digests kept (CTR-PRV-001). | MVP |
| PS-063-07.R04 | Abuse: ≤ 20 offers created per account per hour; ≤ 5 offers to the same recipient per 24 h without response (ASSUMPTION). | MVP |
| PS-063-07.R05 | Lowball or spam offers are not auto-blocked; only rate-limited and reportable (F12). | MVP |
| PS-063-07.R06 | Offers cannot be used to probe another user's availability: `ofr.create` against an unknown target returns generic `SYS.NOT_FOUND`. | MVP |

## Data / schema
Classes: `terms.*` FINANCIAL_EVIDENCE; `offerer`, `recipient`, `target` PSEUDONYMOUS; `terms_digest` PSEUDONYMOUS.

## Commands / queries / events
`offer.*` payloads: IDs, state, version, digest only. Report creation delegated to F12 (`rpt_`).

## States & transitions
Retention: `active` → `final` → `redacted_personal` (12 months) → `expired` (24 months). `legal_hold` overrides.

## Validation & errors
`OFFERS.RATE_LIMITED` (rate_limited / 429, retryable, `retry_after_ms`).

## Authorization
[PS-063-05](authorization_capabilities.md). Export gives each party their own offers.

## Failure, idempotency, concurrency, offline
Redaction job idempotent.

## Privacy, retention, abuse
Threats: (1) amount leakage to observers via timing or counts (aggregates only with K_MIN, CTR-PRV-001 R04); (2) lowball spam; (3) probing listing owners' willingness to sell (R06); (4) disclosure of offer to third party through notifications (R02). Federation of offers is not permitted in MVP.

## Observability & budgets
Aggregates only; `offers_created_total{currency_kind}`.

## Tests
- TEST-PS-063-07-01 (privacy): push and log fixtures contain no amount or currency.
- TEST-PS-063-07-02 (abuse): 21st offer in an hour → `OFFERS.RATE_LIMITED`.
- TEST-PS-063-07-03 (probe): unknown target and forbidden target responses identical.
- TEST-PS-063-07-04 (retention): at 12 months personal fields redacted, digests intact.

## Acceptance criteria
1. Zero amounts in logs, events, pushes (TEST-PS-063-07-01).
2. Probe responses indistinguishable (TEST-PS-063-07-03).

## Assumptions & open decisions
- D07 (retention): PROVISIONAL (D07 default, unapproved).
- ASSUMPTION: rate limits pending F12 review.
- OPEN: whether offer history is portable (default: yes, own records only).
