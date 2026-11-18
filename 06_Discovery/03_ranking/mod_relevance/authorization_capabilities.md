# PS-047-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001 (R02 ordering: no sensitive inputs).

**Decision labels:** CTR-CAP-001 grant model PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-05.R01 | Model draft and activation need `global` scope with purpose; activation needs two approvers. | MVP |
| PS-047-05.R02 | Ranking service reads model config; no end user reads model weights beyond public summary. | MVP |
| PS-047-05.R03 | No actor may add a PRIVATE_PERSONAL or LOCATION_PRECISE feature (PS-047-02 R02) — no grant overrides this. | MVP |
| PS-047-05.R04 | Operators cannot read per-user ranking logs; aggregated metrics only. | MVP |

## Data / schema
Capabilities: `ranking_model.create`, `ranking_model.consent`, `ranking_model.withdraw`, `ranking_model.read`, `search.rank` (service scope).

## Commands / queries / events
| Principal | Action | Scope | Outcome |
|---|---|---|---|
| F06 operator (`ope`) | ranking_model.create | global, purpose | ALLOW |
| second operator | ranking_model.consent | global | ALLOW if distinct |
| drafter | ranking_model.consent own draft | global | DENY → CAP.SELF_APPROVAL_FORBIDDEN |
| search service (`sys`) | search.rank | service scope | ALLOW |
| end user | ranking_model.read | none | DENY except public summary |
| any actor | feature with PRIVATE_PERSONAL class | any | DENY → RELEV.FEATURE_FORBIDDEN (no grant applies) |

## States & transitions
Grants ≤ 72 h expiry (CTR-CAP-001 R06).

## Validation & errors
`SYS.FORBIDDEN` for operator attempts at forbidden features; `SYS.NOT_FOUND` for user access to non-public model fields.

## Authorization
Server-side at each call.

## Failure, idempotency, concurrency, offline
Revocation applies at next decision.

## Privacy, retention, abuse
Operator access to per-user logs is denied entirely (R04); exceptions only via case scope under CTR-PRV-001 dual control (not applicable to ranking logs by default).

## Observability & budgets
`relevance_authz_decisions_total{action,outcome,reason_code}`.

## Tests
- TEST-PS-047-05-01 (unit): matrix rows.
- TEST-PS-047-05-02 (security): self-consent blocked.
- TEST-PS-047-05-03 (privacy): grant does not enable forbidden feature.
- TEST-PS-047-05-04 (security): operator cannot read per-user ranking logs.

## Acceptance criteria
1. Matrix uses CTR-CAP-001 vocabulary.
2. Zero forbidden features accepted under any grant.
3. Zero per-user log reads by operators.

## Assumptions & open decisions
- PROVISIONAL (CTR-CAP-001, unapproved).
