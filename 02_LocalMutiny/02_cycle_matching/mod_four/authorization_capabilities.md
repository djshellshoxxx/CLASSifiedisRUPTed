# PS-017-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R05, R10), CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-05.R01 | Consent and decline require `cyc.consent` with scope `participant` on the slot's `participant_ref`. | MVP |
| PS-017-05.R02 | Viewing a cycle requires `cyc.read` with scope `participant`. Non-slot users see nothing. | MVP |
| PS-017-05.R03 | Proposal creation is a `sys_` matcher action with grant; no user can create a cycle directly. | MVP |
| PS-017-05.R04 | Field visibility: other slots show `participant_ref` and `offer_ref` only, not the other parties' wants text (CTR-CAP-001 R10). | MVP |

## Data / schema
Grant `grt_` for the matcher `sys_`. Decisions `dec_` store outcome and reason code.

## Commands / queries / events
Propose: sys_ matcher. Consent, decline: participant. Get: participant.

## States & transitions
Not applicable.

## Validation & errors
Non-participant consent returns SYS.FORBIDDEN if the cycle is visible, SYS.NOT_FOUND otherwise.

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| slot participant | cyc.consent | cyc_ slot i | ALLOW (current version) |
| slot participant | cyc.consent | cyc_ stale version | DENY SYS.CONFLICT |
| non-slot user | cyc.read | cyc_ | DENY SYS.NOT_FOUND |
| sys_ matcher (grant) | cyc.propose | ccd_ | ALLOW |
| user | cyc.propose | ccd_ | DENY SYS.FORBIDDEN |

## Failure, idempotency, concurrency, offline
Revocation at next decision; consent decisions are not cached (CTR-CAP-001 R09).

## Privacy, retention, abuse
Decision records hold no wants text.

## Observability & budgets
Denials counted by reason, no actor IDs.

## Tests
- TEST-PS-017-05-01 (unit): each table row.
- TEST-PS-017-05-02 (negative): non-slot participant cannot read.
- TEST-PS-017-05-03 (integration): revoked matcher grant blocks proposals.

## Acceptance criteria
1. Every row covered by tests.
2. Only slot participants can consent, in 100% of fixtures.
3. Field omission verified for other slots' wants text.

## Assumptions & open decisions
- ASSUMPTION: matcher runs as sys_ with purpose constraint (CTR-CAP-001 R06).
