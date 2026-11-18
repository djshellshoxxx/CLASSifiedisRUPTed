# PS-045-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (scopes, global limits), CTR-PRV-001 (LOCATION_COARSE disclosure).

**Decision labels:** CTR-CAP-001 grant model PROVISIONAL. Anonymous query scope ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-05.R01 | Public read of PUBLISHED cell buckets only. | MVP |
| PS-045-05.R02 | Registry admin actions require `global` scope grant with purpose and dual approval for K_MIN or cell-set changes (CTR-CAP-001 R06, R07). | MVP |
| PS-045-05.R03 | No actor can read a count below K_MIN, including operators (CTR-CAP-001 R04 `global`). | MVP |
| PS-045-05.R04 | No actor can read which cell a specific `acc_` queried; budget counters are visible to the owner only, as remaining count. | MVP |

## Data / schema
Capabilities: `cell.read`, `cell.update` (registry), `cell.grant` (admin grants), `proximity.read`.

## Commands / queries / events
| Principal | Action | Scope | Outcome |
|---|---|---|---|
| anonymous | proximity.read | public | ALLOW buckets |
| user | proximity.read | self (budget) | ALLOW remaining count only |
| registry admin (`ope`) | cell.update | global | ALLOW only with dual approval (R02) |
| ope single approval | cell.update | global | DENY → SYS.FORBIDDEN (DUAL_APPROVAL_MISSING) |
| mod | any | none | DENY → SYS.FORBIDDEN |

## States & transitions
Grants have expiry ≤ 72 h (CTR-CAP-001 R06).

## Validation & errors
`SYS.FORBIDDEN` for admin paths; no record-existence leak applies (public registry).

## Authorization
Server-side on each query.

## Failure, idempotency, concurrency, offline
Revocation at next decision; registry admin grant revocation immediate.

## Privacy, retention, abuse
Query-level audit: aggregated per day, not per `acc_`, except budget alerts (CR-13) which store pseudonymous ID with decision ID.

## Observability & budgets
`proximity_authz_decisions_total{action,outcome,reason_code}`.

## Tests
- TEST-PS-045-05-01 (unit): matrix rows.
- TEST-PS-045-05-02 (security): single-approved admin change rejected.
- TEST-PS-045-05-03 (security): no endpoint returns sub-K_MIN counts to any principal.
- TEST-PS-045-05-04 (privacy): user cannot read another user's budget.

## Acceptance criteria
1. Matrix uses CTR-CAP-001 vocabulary.
2. Zero sub-K_MIN disclosures to any principal.
3. Dual control on cell changes.

## Assumptions & open decisions
- ASSUMPTION: anonymous read scope.
- PROVISIONAL (CTR-CAP-001, unapproved).
