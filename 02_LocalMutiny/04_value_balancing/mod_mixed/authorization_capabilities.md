# PS-026-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-05.R01 | Only the proposer of a slot may declare or withdraw a leg where `from_par` is that slot. Action `cyc.propose`, scope `participant`. | MVP |
| PS-026-05.R02 | Only the receiving party of a leg may attest it. Action `cyc.attest`, scope `participant`. Payer cannot attest own leg (`SYS.FORBIDDEN`). | MVP |
| PS-026-05.R03 | All active participants of a revision may read every leg of that revision (informed consent). Non-participants receive `SYS.NOT_FOUND`. | MVP |
| PS-026-05.R04 | Operators and moderators read leg content only through a `case:` scope with dual control (CTR-CAP-001 R06, R07). | MVP |
| PS-026-05.R05 | `in_kind_compensation` description is visible to participants of the revision only (field visibility `participant`). | MVP |

## Data / schema
Action matrix (principal × action × resource → outcome):

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user, from_par owner | `cyc.propose` | own slot's legs | ALLOW (participant) |
| user, to_par owner | `cyc.propose` | those legs | DENY → `SYS.FORBIDDEN` |
| user, to_par owner | `cyc.attest` | claim on leg | ALLOW after `CLAIMED` |
| user, from_par owner | `cyc.attest` | own leg | DENY → `SYS.FORBIDDEN` |
| user, non-participant | `cyc.read` | revision | DENY → `SYS.NOT_FOUND` |
| mod, case scope | `cyc.read` | legs in `cas_` | ALLOW (grant, purpose required) |
| ope, single approval | `cyc.read` | legs | DENY (dual control) |
| sys (timer) | `cyc.execute` | legs | ALLOW (scope `global`, no content read) |

## Commands / queries / events
Each command in PS-026-04 maps to one action above. Decision records (`dec_`) store outcome and reason code only (CTR-CAP-001 R13).

## States & transitions
Authorization is re-evaluated at each transition. Relation rules derive from revision participation at decision time (CTR-CAP-001 R05); a participant removed by a new revision loses read access to later revisions.

## Validation & errors
Unauthorized writes return `SYS.FORBIDDEN`; unauthorized reads of hidden revisions return `SYS.NOT_FOUND` (CTR-ERR-001 R08).

## Authorization
Capability IDs: `cyc.propose`, `cyc.consent`, `cyc.attest`, `cyc.withdraw`, `cyc.read`, `cyc.execute`. Module declares no additional verbs.

## Failure, idempotency, concurrency, offline
Decision cache TTL is zero for writes and for any read of FINANCIAL_EVIDENCE (CTR-CAP-001 R09). Revoked grants take effect at the next decision.

## Privacy, retention, abuse
Pseudonyms (`prf_`) are views of `acc_`; authorization uses `acc_` only (CTR-CAP-001 R02). Moderator access to leg content creates an `aud_` record with purpose and decision ID, no content.

## Observability & budgets
Metric: `mixed_authz_denials_total{action,code}`. Alert on a burst of `SYS.NOT_FOUND` from one principal (enumeration signal).

## Tests
- TEST-PS-026-05-01 (negative): each row of the matrix returns the stated outcome.
- TEST-PS-026-05-02 (integration): removed participant cannot read the next revision.
- TEST-PS-026-05-03 (negative): payer attempting `cyc.attest` on own leg returns `SYS.FORBIDDEN`.
- TEST-PS-026-05-04 (negative): operator without second approver cannot read legs.

## Acceptance criteria
1. Every action used by this module appears in CTR-CAP-001 R03 verb list.
2. Matrix tests pass in CI with zero unlisted outcomes.
3. No leg content is returned to a non-participant, including in error bodies.

## Assumptions & open decisions
- ASSUMPTION: 72 h grant maximum for moderator case access (CTR-CAP-001 R06).
- OPEN: whether a counterparty outside the revision may see the in-kind description after a dispute. See [DECISIONS.md](../../../DECISIONS.md) D04.
