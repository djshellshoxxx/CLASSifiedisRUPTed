# PS-020-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R09), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-03.R01 | Cycle is `proposed` on creation; `consented` only when all three slots consent to the same version. | MVP |
| PS-020-03.R02 | Any single decline moves the cycle to `declined` and releases all three slots in the same commit. | MVP |
| PS-020-03.R03 | No partial lock: lock starts only from `consented` and fails back to `proposed` with consents cleared. | MVP |
| PS-020-03.R04 | Proposals expire 48 h after creation if not consented (ASSUMPTION). | MVP |

## Data / schema
State in `status`; consent in `slots[].consent`.

## Commands / queries / events
PS-020-04.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | cycle.propose_three | PS-020-02 passes | proposed (v1) | emit cycle.proposed |
| proposed | consent (slot k) | version matches | proposed | emit cycle.slot_consented |
| proposed | consent (third slot) | all three consented | consented | emit cycle.consented; hand to mod_lock |
| proposed | content change | any slot | proposed (v+1) | clear consents; emit cycle.version_superseded |
| proposed | decline (any slot) | — | declined | release all slots; emit cycle.declined |
| proposed | 48 h elapsed | — | expired | emit cycle.expired |
| consented | lock fails | — | proposed | clear consents; emit cycle.version_superseded |

## Validation & errors
Invalid transitions return SYS.UNPROCESSABLE_STATE.

## Authorization
Consent and decline: slot participant (PS-020-05).

## Failure, idempotency, concurrency, offline
Transitions serialised on version; no offline consent without pending-ack (D08).

## Privacy, retention, abuse
Declined and expired cycles: RET-OPS 30 days, pseudonyms only.

## Observability & budgets
Counts per state.

## Tests
- TEST-PS-020-03-01 (unit): every table row.
- TEST-PS-020-03-02 (property): no path to lock with fewer than three consents.
- TEST-PS-020-03-03 (integration): lock failure returns cycle to proposed.

## Acceptance criteria
1. A three-party cycle reaches `consented` only with three consents on one version.
2. One decline releases all slots in 100% of runs.
3. Zero partial locks.

## Assumptions & open decisions
- ASSUMPTION: 48 h window.
- PROVISIONAL (D04 default, unapproved): explicit per-party consent.
