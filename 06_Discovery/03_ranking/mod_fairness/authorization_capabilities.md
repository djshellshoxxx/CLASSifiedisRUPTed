# PS-046-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (global scope limits, dual control), CTR-PRV-001.

**Decision labels:** CTR-CAP-001 grant model PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-05.R01 | Policy draft and activation need `global` scope grant with purpose; activation needs two approvers. | MVP |
| PS-046-05.R02 | Audit reads are aggregated; no principal reads per-page seller buckets except the system. | MVP |
| PS-046-05.R03 | Forbidden ranking features list: any PRIVATE_PERSONAL or LOCATION_PRECISE field, identity documents, precise location, raw reputation scores (only F07 bands). | MVP |
| PS-046-05.R04 | Sellers cannot read ranking inputs or audit rows about themselves. | MVP |

## Data / schema
Capabilities: `rank_policy.create`, `rank_policy.consent` (approve), `rank_policy.withdraw` (retire), `rank_policy.read`, `exposure.read` (aggregate).

## Commands / queries / events
| Principal | Action | Scope | Outcome |
|---|---|---|---|
| F06 operator (`ope`) | rank_policy.create | global, purpose | ALLOW |
| second approver (`ope`) | rank_policy.consent | global | ALLOW if distinct from drafter |
| same person | rank_policy.consent on own draft | global | DENY → CAP.SELF_APPROVAL_FORBIDDEN |
| operator | exposure.read | global | ALLOW aggregate only; per-bucket DENY → SYS.FORBIDDEN |
| seller | rank_policy.read | none | DENY → SYS.NOT_FOUND for audits; policy summary public |
| sys (relevance service) | fairness.apply | scope apply | ALLOW |

## States & transitions
Grants expire ≤ 72 h (CTR-CAP-001 R06).

## Validation & errors
Per action.

## Authorization
Server-side. Policy summary (caps and label) public.

## Failure, idempotency, concurrency, offline
Revocation at next decision.

## Privacy, retention, abuse
Operator reads of aggregate audit write `aud_` records.

## Observability & budgets
`fairness_authz_decisions_total{action,outcome,reason_code}`.

## Tests
- TEST-PS-046-05-01 (unit): matrix rows.
- TEST-PS-046-05-02 (security): drafter cannot consent own policy.
- TEST-PS-046-05-03 (privacy): forbidden feature in ranking config rejected.
- TEST-PS-046-05-04 (security): seller cannot read audit rows.

## Acceptance criteria
1. Matrix uses CTR-CAP-001 vocabulary.
2. Zero self-approved policies.
3. Zero seller-readable audit rows.

## Assumptions & open decisions
- PROVISIONAL (CTR-CAP-001, unapproved).
