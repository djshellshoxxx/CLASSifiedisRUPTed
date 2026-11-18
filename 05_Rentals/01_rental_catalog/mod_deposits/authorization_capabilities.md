# PS-040-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (model, scopes, dual control), CTR-PRV-001 (FINANCIAL_EVIDENCE rules), CTR-COM-001 (party and dispute rights).

**Decision labels:** Grant model PROVISIONAL (CTR-CAP-001). D09 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-05.R01 | Default deny on every deposit action (CTR-CAP-001 R01). | MVP |
| PS-040-05.R02 | Participant status is derived from the rental at decision time, not stored as a grant (CTR-CAP-001 R05). | MVP |
| PS-040-05.R03 | Non-participants receive `SYS.NOT_FOUND` for any `dep_` (no existence leak). | MVP |
| PS-040-05.R04 | `global` scope never grants access to FINANCIAL_EVIDENCE (CTR-CAP-001 R04). | MVP |
| PS-040-05.R05 | `ope` access to deposit content requires case scope and dual control (CTR-CAP-001 R07). | MVP |
| PS-040-05.R06 | Dispute raise uses verb `reject` (closest in CTR-CAP-001 R03 vocabulary; ASSUMPTION). Vocabulary addition is MINOR. | MVP |

## Data / schema
Capability IDs: `deposit.propose`, `deposit.consent`, `deposit.attest`, `deposit.withdraw`, `deposit.read`, `deposit.reject` (dispute), `deposit.moderate` (case resolution). Decision records `dec_` store outcome and reason code only.

## Commands / queries / events
| Principal | Action | Scope | Outcome |
|---|---|---|---|
| renter or owner | deposit.propose | participant | ALLOW (rule: participant) |
| other party | deposit.consent | participant | ALLOW; stale hash → SYS.CONFLICT |
| renter | deposit.attest (record_given) | participant | ALLOW |
| owner | deposit.attest (received, release) | participant | ALLOW |
| either party | deposit.withdraw | participant | ALLOW before HELD |
| either party | deposit.reject (dispute) | participant | ALLOW inside window |
| participant | deposit.read | participant | ALLOW; fields per matrix below |
| non-participant | any | none | DENY → SYS.NOT_FOUND |
| mod | deposit.moderate | case, with purpose | ALLOW if case grant active |
| ope | deposit.read | global | DENY → SYS.FORBIDDEN (SCOPE_MISMATCH) |
| sys (adapter) | any deposit action | none | DENY; claim adapters are scoped to claims only |

Field visibility (CTR-CAP-001 R10): amounts, method, status, terms hash, claim IDs: participant. Notes: participant. Counterparty fields after close: participant read-only.

## States & transitions
Grant lifecycle not used for participants. Case grants follow CTR-CAP-001 grant states.

## Validation & errors
`SYS.FORBIDDEN` (403) only where the actor already knows the record (`global` or case). Otherwise `SYS.NOT_FOUND` (404).

## Authorization
Server-side on every read and write (CTR-CAP-001 R11). Request-body party IDs are ignored.

## Failure, idempotency, concurrency, offline
Revocation applies at next decision (CTR-CAP-001 R09). Writes and FINANCIAL_EVIDENCE reads use zero decision-cache TTL.

## Privacy, retention, abuse
Each privileged read by `mod` or `ope` emits an `aud_` record with resource ID, purpose and decision ID, no content (CTR-CAP-001 R08).

## Observability & budgets
`deposit_authz_decisions_total{action,outcome,reason_code}`. Alert on any `ope` ALLOW for FINANCIAL_EVIDENCE without a second approver (must be 0).

## Tests
- TEST-PS-040-05-01 (unit): each matrix row returns its outcome and reason code.
- TEST-PS-040-05-02 (security): non-participant gets identical response for existing and missing `dep_`.
- TEST-PS-040-05-03 (negative): `ope` single approval cannot read FINANCIAL_EVIDENCE (CTR-CAP-001 R07).
- TEST-PS-040-05-04 (integration): participant removed by a rental change loses read access on the next call.

## Acceptance criteria
1. Matrix rows match the CTR-CAP-001 vocabulary; no undeclared verb is used.
2. Zero cross-party reads in TEST-PS-040-05-02.
3. Dual control enforced for every `ope` access to deposit content.

## Assumptions & open decisions
- ASSUMPTION: `reject` as the dispute verb pending CTR-CAP-001 vocabulary MINOR change.
- PROVISIONAL (CTR-CAP-001 grant model, unapproved).
- OPEN (F16, F07): named owners for CTR-CAP-001 are unassigned (S3-11).
