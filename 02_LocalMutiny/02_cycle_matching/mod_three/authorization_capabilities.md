# PS-020-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R06, R10), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-05.R01 | Consent and decline require `cyc.consent` (participant scope on the slot). | MVP |
| PS-020-05.R02 | Viewing requires `cyc.read` (participant scope). | MVP |
| PS-020-05.R03 | Proposing requires a sys_ matcher grant (`cyc.propose`). | MVP |
| PS-020-05.R04 | Other slots show only pseudonym and offer; wants text of other slots is omitted (CTR-CAP-001 R10). | MVP |

## Data / schema
Grants `grt_` for matcher; decisions `dec_` with reason codes.

## Commands / queries / events
As in PS-020-04.

## States & transitions
Not applicable.

## Validation & errors
Non-participant gets SYS.NOT_FOUND on invisible cycles.

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| slot participant | cyc.consent | own slot, current version | ALLOW |
| slot participant | cyc.consent | stale version | DENY SYS.CONFLICT |
| non-participant | cyc.read | cyc_ | DENY SYS.NOT_FOUND |
| sys_ matcher (grant) | cyc.propose | ccd_ | ALLOW |
| user | cyc.propose | ccd_ | DENY SYS.FORBIDDEN |

## Failure, idempotency, concurrency, offline
Revocation at next decision.

## Privacy, retention, abuse
No wants text in decision records.

## Observability & budgets
Denials by reason, no IDs.

## Tests
- TEST-PS-020-05-01 (unit): each row.
- TEST-PS-020-05-02 (negative): non-participant read denied.
- TEST-PS-020-05-03 (integration): revoked matcher grant blocks proposals.

## Acceptance criteria
1. All rows covered.
2. Only slot participants consent, in 100% of fixtures.
3. Field omission verified for other slots' wants.

## Assumptions & open decisions
- ASSUMPTION: matcher runs as sys_ with purpose constraint (CTR-CAP-001 R06).
