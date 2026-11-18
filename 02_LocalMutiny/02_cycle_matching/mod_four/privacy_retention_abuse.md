# PS-017-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, R12), CTR-FED-001 (R03), CTR-EVT-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-07.R01 | Slots reveal pseudonymous refs and one offer each; no other participant's identity or precise location (LOCATION_PRECISE never enters cycle records). | MVP |
| PS-017-07.R02 | Cycle records are RET-OPS (30 days) after terminal state; value fields follow evidence rules (RET-EVD) when non-zero. | MVP |
| PS-017-07.R03 | Proposal flood: ≤ 20 proposals per account per hour touching that account (ASSUMPTION); exceeding returns SYS.RATE_LIMITED. | MVP |
| PS-017-07.R04 | Cycles involving a fake-account cluster raise a signal to F12 (Sybil pattern). | MVP |
| PS-017-07.R05 | Four-party cycles are never federated in MVP (contain PSEUDONYMOUS slot refs; CTR-FED-001 R02). | MVP |

## Data / schema
Classes: `participant_ref` PSEUDONYMOUS; `value_gap_minor` FINANCIAL_EVIDENCE when non-zero.

## Commands / queries / events
Events carry max class of payload (CTR-EVT-001 R11).

## States & transitions
Terminal states start the retention clock.

## Validation & errors
Rate limit returns SYS.RATE_LIMITED with retry_after_ms.

## Authorization
Participant-only view (PS-017-05).

## Failure, idempotency, concurrency, offline
Deletion of a participant account removes their slot's pseudonym link; the cycle keeps a redacted slot (CTR-PRV-001 R12 completion record).

## Privacy, retention, abuse
- Threats: deanonymisation by cycle shape; consent pressure by fake accounts; replay of old consents.
- Controls: version binding, rate caps, Sybil signal, participant-only reads.

## Observability & budgets
No pseudonym IDs in metrics.

## Tests
- TEST-PS-017-07-01 (privacy): payload lint shows no location or name fields.
- TEST-PS-017-07-02 (abuse): 21st proposal in an hour is rate limited.
- TEST-PS-017-07-03 (integration): account deletion redacts slot pseudonym link.

## Acceptance criteria
1. No PRECISE location or name in any cycle payload.
2. Rate cap enforced in 100% of fixtures.
3. Redaction completion record contains counts only.

## Assumptions & open decisions
- ASSUMPTION: 20 proposals per account per hour.
- PROVISIONAL (D07 default, unapproved): per-category retention with legal-hold exceptions.
