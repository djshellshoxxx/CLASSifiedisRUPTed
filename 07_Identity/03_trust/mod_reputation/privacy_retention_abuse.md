# PS-058-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (PSEUDONYMOUS; RET-ACC, RET-OPS, RET-AUD, RET-LEGAL), CTR-CAP-001, CTR-FED-001 (no federation of scores in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-07.R01 | Reputation data is PSEUDONYMOUS; no legal identity, location or contact data is an input. | MVP |
| PS-058-07.R02 | Counterparty `prf_` pairs stored only for the 365-day diversity window; then only the count remains. | MVP |
| PS-058-07.R03 | Public band suppressed when fewer than 5 distinct counterparties exist (no "1 of 1" leakage). | MVP |
| PS-058-07.R04 | Diversity rule: at most 1 counted exchange per counterparty pair per 30 days. | MVP |
| PS-058-07.R05 | Counters of a retired `prf_` purged 30 days after retirement; band hidden at 30 days (PS-058-03 R04). | MVP |
| PS-058-07.R06 | Reputation is never federated or exported to third parties in MVP. | MVP |
| PS-058-07.R07 | Reputation shown as an input to ranking. | Future (requires mod_relevance decision) |

## Data / schema
| Record | Class | Retention |
|---|---|---|
| counters, band | PSEUDONYMOUS | RET-ACC, purged at retirement + 30 days |
| counterparty pairs (diversity window) | PSEUDONYMOUS | 365 days, then count only |
| applied-input table | internal | 400 days |
| audit of case reads | internal | RET-AUD (12 months) |

## Commands / queries / events
No counterparty identifiers in events (PS-058-04 R04).

## States & transitions
Purge clock starts at `pseudonym.retired` per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Self-dealing and duplicate patterns recorded as codes only.

## Authorization
Counters visible to subject only (PS-058-05).

## Failure, idempotency, concurrency, offline
Purge job idempotent; legal hold (RET-LEGAL) suspends purge.

## Privacy, retention, abuse
- **Reputation farming:** diversity rule (R04), weights favour confirmed final exchanges over self-attested ones, and distinct-counterparty threshold.
- **Sybil rings:** clustering over counterparty pairs is run by F12 signals (mod_signals); this module applies the result only as a `under_review` trigger.
- **Deanonymization:** no score exported; band suppression (R03); no cross-pseudonym aggregates.
- **Doxxing via score history:** no history of band changes is exposed; only current band.
- **Limit:** counters can still reveal activity level of a `prf_`; this is accepted for MVP and listed for PS-058-08 review.

## Observability & budgets
Aggregate band distribution only; no per-`prf_` metric labels.

## Tests
- TEST-PS-058-07-01 (privacy): band suppressed below five counterparties.
- TEST-PS-058-07-02 (retention): pair records removed at 365 days; counters purged at retirement + 30 days.
- TEST-PS-058-07-03 (abuse): repeated same-pair exchanges counted once per 30 days.
- TEST-PS-058-07-04 (privacy scan): no counterparty identifiers in any response or event.

## Acceptance criteria
1. Band suppression rule enforced.
2. Diversity rule enforced.
3. Retention timers verified.
4. No federation path exists.

## Assumptions & open decisions
- ASSUMPTION: 365-day pair window; 30-day diversity window per pair; 5 counterparties minimum.
- PROVISIONAL (D07 default, unapproved): minimal retention.
