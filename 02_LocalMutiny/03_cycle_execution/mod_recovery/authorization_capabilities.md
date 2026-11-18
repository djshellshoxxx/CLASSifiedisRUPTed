# PS-024-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R06, R07, R12), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-05.R01 | Attest requires `cyc.attest` with participant scope on the slot. | MVP |
| PS-024-05.R02 | Viewing requires `cyc.read` (participant) or `cyc.moderate` in an open `cas_` case. | MVP |
| PS-024-05.R03 | Recovery cannot grant access to listing contents, messages or payment evidence beyond the attestations (CTR-CAP-001 R12). | MVP |
| PS-024-05.R04 | Operator access to attestations requires dual control (CTR-CAP-001 R07). | MVP |

## Data / schema
Grants for case-scoped moderator access; decision records hold outcome and reason only.

## Commands / queries / events
Attest: participant. Compensate, escalate: system. Get: participant or case moderator.

## States & transitions
Not applicable.

## Validation & errors
Unauthorised reads return SYS.NOT_FOUND.

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| slot participant | cyc.attest | own slot, open recovery | ALLOW |
| counterparty | cyc.attest | another slot | DENY SYS.FORBIDDEN |
| non-participant | cyc.read | recovery | DENY SYS.NOT_FOUND |
| mod_ (case grant) | cyc.moderate | cas_ scope | ALLOW read of attestations |
| ope_ (single) | cyc.read | attestations | DENY (dual control required) |

## Failure, idempotency, concurrency, offline
Revocations apply at next decision.

## Privacy, retention, abuse
Moderator access logged as aud_ with purpose.

## Observability & budgets
Access counts without IDs.

## Tests
- TEST-PS-024-05-01 (unit): each row.
- TEST-PS-024-05-02 (negative): moderator without case grant denied.
- TEST-PS-024-05-03 (integration): single operator read denied.

## Acceptance criteria
1. Every row covered.
2. No recovery path grants wider access than case scope.
3. Dual control enforced in 100% of operator attempts.

## Assumptions & open decisions
- ASSUMPTION: case-scoped moderator grant with purpose and expiry (CTR-CAP-001 R06).
