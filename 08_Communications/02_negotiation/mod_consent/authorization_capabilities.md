# PS-062-05 — authorization capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (`cns.give`, `cns.withdraw`, `participant` scope), CTR-ID-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-05.R01 | Only the party bound to the slot may give, decline or withdraw consent for that slot. | MVP |
| PS-062-05.R02 | Proposal owners and co-participants may read that a slot is `given` or not, never the terms digest of another slot. | MVP |
| PS-062-05.R03 | No `sys_` or `ope_` principal may create a `given` record. Operators may only read records under a `cas_` grant. | MVP |
| PS-062-05.R04 | Non-party access returns `SYS.NOT_FOUND`. | MVP |
| PS-062-05.R05 | Action vocabulary: `cns.consent`, `cns.withdraw`, `cns.read`. | MVP |

## Data / schema
Relation rule input: slot assignment on the proposal aggregate (`cyc_` slot, `ofr_` recipient). Derived at decision time (CTR-CAP-001 R05).

## Commands / queries / events
Decision records for denials of `cns.consent` and `cns.withdraw`.

## States & transitions
A slot reassignment after `given` supersedes the record (see [PS-062-03](workflow_state_machine.md)).

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| user (slot party) | cns.consent | own slot, current version | ALLOW (rule: participant) |
| user (slot party) | cns.consent | own slot, stale version | DENY → CONSENT.STALE_VERSION |
| user (other party) | cns.consent | slot not theirs | DENY → SYS.NOT_FOUND |
| user (slot party) | cns.withdraw | own record, before lock | ALLOW |
| user (slot party) | cns.withdraw | own record, after lock | DENY → CONSENT.EXECUTION_LOCKED |
| user (proposal owner) | cns.read | slot status | ALLOW (field: state only) |
| ope_ (single) | cns.read | any | DENY (dual control, CTR-CAP R07) |
| mod_ (case grant) | cns.read | records in `cas_` | ALLOW (grant) |

## Validation & errors
Codes per [PS-062-02](validation_rules.md).

## Failure, idempotency, concurrency, offline
Authorization is re-evaluated at commit for queued offline consent. Revocation of a slot assignment before commit causes rejection.

## Privacy, retention, abuse
Field visibility: `terms_digest` = party only; `state` = proposal participants; `quote_id` = party only.

## Observability & budgets
`consent_authz_denied_total{action,reason_code}`.

## Tests
- TEST-PS-062-05-01 (matrix): every row above produces its outcome.
- TEST-PS-062-05-02 (negative): guessed `cns_` IDs from another slot return `SYS.NOT_FOUND`.
- TEST-PS-062-05-03 (negative): operator without dual control cannot read a `given` record.

## Acceptance criteria
1. Matrix passes (TEST-PS-062-05-01).
2. No principal other than the slot party can create a `given` record (TEST-PS-062-05-02 plus write-path assertion).

## Assumptions & open decisions
- ASSUMPTION: slot-to-party binding is taken from F02.S02/F02.S03 aggregate, referenced by `par_` ID.
- Related: CTR-CAP-001 R07 dual control applies to operator reads of consent records only if they reveal FINANCIAL_EVIDENCE.
