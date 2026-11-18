# PS-017-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R09), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-03.R01 | A cycle is `proposed` on creation and moves to `consented` only when all four slots are consented to the same version. | MVP |
| PS-017-03.R02 | A version change returns the cycle to `proposed` with all consents cleared (`superseded` applies to the old version). | MVP |
| PS-017-03.R03 | Any decline moves the cycle to `declined`; declined is terminal. | MVP |
| PS-017-03.R04 | Proposals expire 48 h after creation if not consented (ASSUMPTION). | MVP |
| PS-017-03.R05 | Each transition emits one event in the same commit and carries the cycle `correlation_id` (CTR-EVT-001 R09). | MVP |

## Data / schema
State in `status`; slot consent in `slots[].consent`.

## Commands / queries / events
Transitions via PS-017-04 commands.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | cycle.propose_four | PS-017-02 passes | proposed (v1) | emit cycle.proposed |
| proposed | cycle.consent (slot i) | version matches; slot pending | proposed | emit cycle.slot_consented |
| proposed | cycle.consent (last slot) | all four consented | consented | emit cycle.consented; hand to mod_lock |
| proposed | version change | any slot content change | proposed (v+1) | consents cleared; emit cycle.version_superseded |
| proposed | cycle.decline | any slot | declined | emit cycle.declined; notify others by pseudonym |
| proposed | 48 h elapsed | — | expired | emit cycle.expired |
| consented | mod_lock fails | — | proposed | consents cleared; emit cycle.version_superseded |

## Validation & errors
Invalid transitions return SYS.UNPROCESSABLE_STATE or CYCFOUR.STALE_VERDICT.

## Authorization
Only the slot's participant may consent or decline (PS-017-05).

## Failure, idempotency, concurrency, offline
Transitions serialised on `version`. Consent cannot be queued offline as an unconditional action (D08 pending-ack only).

## Privacy, retention, abuse
Expired and declined cycles keep verdict links for 30 days (RET-OPS), slot pseudonyms only.

## Observability & budgets
Funnel counts per state (PS-017-08).

## Tests
- TEST-PS-017-03-01 (unit): every table row.
- TEST-PS-017-03-02 (property): consent from old version never counts.
- TEST-PS-017-03-03 (integration): lock failure returns cycle to proposed with cleared consents.

## Acceptance criteria
1. A cycle reaches `consented` only with four consents on one version.
2. Old-version consents never advance a newer version.
3. Expiry occurs at 48 h ± 1 min in fixtures.

## Assumptions & open decisions
- ASSUMPTION: 48 h consent window.
- PROVISIONAL (D04 default, unapproved): explicit per-party consent; no atomic real-world guarantee.
