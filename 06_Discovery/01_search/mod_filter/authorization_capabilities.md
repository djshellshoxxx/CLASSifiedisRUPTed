# PS-044-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001.

**Decision labels:** CTR-CAP-001 grant model PROVISIONAL. Anonymous evaluation scope ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-05.R01 | Saved searches readable and writable by owner only (`self`). | MVP |
| PS-044-05.R02 | Evaluation returns only PUBLIC listings to unauthenticated callers; participant-visible listings require an `acc_` session. | MVP |
| PS-044-05.R03 | Other owners' saved searches → `SYS.NOT_FOUND`. | MVP |
| PS-044-05.R04 | Operators have no read access to saved searches; `ope` and `global` scopes denied (PRIVATE_PERSONAL). | MVP |

## Data / schema
Capabilities: `saved_search.create`, `saved_search.update`, `saved_search.withdraw`, `saved_search.read`, `listing.read` (for evaluation scope).

## Commands / queries / events
| Principal | Action | Scope | Outcome |
|---|---|---|---|
| anonymous | listing.read (evaluate) | public | ALLOW, PUBLIC items only |
| user (owner) | saved_search.create / update / withdraw / read | self | ALLOW |
| user (other) | saved_search.read | none | DENY → SYS.NOT_FOUND |
| ope | saved_search.read | global | DENY → SYS.FORBIDDEN |
| sys (digest job) | saved_search.read | scope digest only | ALLOW, no content in logs |

## States & transitions
Ownership is a stored relation on the saved search; no grants needed.

## Validation & errors
`SYS.NOT_FOUND` for other owners' records.

## Authorization
Server-side per request. Filter `acc_` identity taken from session, not body.

## Failure, idempotency, concurrency, offline
Revocation of an account removes saved searches within retention rules (PS-044-07).

## Privacy, retention, abuse
Digest sys principal writes no saved-search content to logs (CTR-PRV-001 R09).

## Observability & budgets
`filter_authz_decisions_total{action,outcome}`.

## Tests
- TEST-PS-044-05-01 (unit): matrix rows.
- TEST-PS-044-05-02 (security): anonymous evaluate never returns non-PUBLIC items.
- TEST-PS-044-05-03 (security): other user's saved search returns identical response to missing one.
- TEST-PS-044-05-04 (security): `ope` read denied.

## Acceptance criteria
1. Matrix matches CTR-CAP-001 vocabulary.
2. Zero non-PUBLIC items in anonymous results.
3. Zero operator reads.

## Assumptions & open decisions
- ASSUMPTION: anonymous evaluation scope.
- PROVISIONAL (CTR-CAP-001 grant model, unapproved).
