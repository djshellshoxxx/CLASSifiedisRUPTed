# PS-020-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R12), CTR-FED-001 (R03), CTR-EVT-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-07.R01 | Slots are PSEUDONYMOUS; no names, contact data or precise location in any cycle payload. | MVP |
| PS-020-07.R02 | Declined and expired cycles retained 30 days (RET-OPS); locked cycles follow evidence rules. | MVP |
| PS-020-07.R03 | Relevance (F06) may reorder but is never a condition for eligibility (PS-020-02.R05). | MVP |
| PS-020-07.R04 | Proposal flood: ≤ 20 proposals per account per hour (ASSUMPTION); exceeding returns SYS.RATE_LIMITED. | MVP |
| PS-020-07.R05 | Three-party cycles not federated in MVP. | MVP |

## Data / schema
Classes: pseudonyms PSEUDONYMOUS; value fields FINANCIAL_EVIDENCE when non-zero.

## Commands / queries / events
Max class per payload.

## States & transitions
Terminal states start retention.

## Validation & errors
Rate limit with retry_after_ms.

## Authorization
Participant-only view.

## Failure, idempotency, concurrency, offline
Account deletion leaves a redacted slot marker; completion record counts only.

## Privacy, retention, abuse
- Threats: deanonymisation via three-party structure; ranking manipulation to favour Sybil accounts; repeated proposals to pressure users.
- Controls: relevance restricted to ordering; rate cap; Sybil signal to F12.

## Observability & budgets
No pseudonyms in metrics.

## Tests
- TEST-PS-020-07-01 (privacy): payload lint.
- TEST-PS-020-07-02 (abuse): 21st proposal per hour rate-limited.
- TEST-PS-020-07-03 (property): relevance perturbation leaves eligible set unchanged.

## Acceptance criteria
1. Lint passes.
2. Rate cap enforced in 100% of fixtures.
3. Eligible set invariant under relevance changes in 100% of runs.

## Assumptions & open decisions
- ASSUMPTION: 20 proposals per account per hour.
- PROVISIONAL (D07 default, unapproved).
