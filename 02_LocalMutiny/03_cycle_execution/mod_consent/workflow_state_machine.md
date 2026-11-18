# PS-021-03 — Workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-03.R01 | Per-party consent state for one cycle version: `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `EXPIRED`. | MVP |
| PS-021-03.R02 | Cycle-level consent state is `CONSENTING` until all parties are ACCEPTED (→ `CONSENTED`) or any party is REJECTED/EXPIRED (→ `NOT_CONSENTED`). | MVP |
| PS-021-03.R03 | `CONSENTED` is the only input to mod_lock. No other module may move a cycle past consent. | MVP |
| PS-021-03.R04 | Revising the proposal creates `proposal_version + 1`; all prior per-party consents become `EXPIRED` in the same transaction. | MVP |
| PS-021-03.R05 | Withdrawal is allowed until `CONSENTED`; after lock, withdrawal is handled only by mod_dropouts. | MVP |
| PS-021-03.R06 | Transition effects are recorded as CTR-EVT-001 events with `revision` increments. | MVP |

## Data / schema
States stored in `cycle_consent.decision` ([domain_schema.md](domain_schema.md)) and in a cycle-level projection `cycle_consent_state` (`cyc_`, `proposal_version`, `state`, `revision`). The projection is derived; event log is authoritative.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md) for signatures; events emitted per transition below.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `cycle.proposed` (new version) | snapshot valid, 2–8 parties | CONSENTING (all PENDING) | notify parties |
| PENDING | `cycle.consent_recorded` (ACCEPTED) | validation_rules R01–R07 pass | ACCEPTED | record `consent_record_ref` |
| PENDING | `cycle.consent_recorded` (REJECTED) | same | REJECTED | cycle → NOT_CONSENTED |
| ACCEPTED | `cycle.consent_withdrawn` | state < CONSENTED | WITHDRAWN | cycle → NOT_CONSENTED |
| PENDING, ACCEPTED | `cycle.consent_expired` (timer) | now ≥ expires_at | EXPIRED | cycle → NOT_CONSENTED |
| ACCEPTED (all) | `cycle.consented` | all parties ACCEPTED | cycle CONSENTED | emit to mod_lock |
| any | `cycle.proposal_revised` | new version | EXPIRED (prior) | new CONSENTING set |
| REJECTED, WITHDRAWN, EXPIRED | any consent command | — | unchanged | error CYC_CONSENT.CYCLE_NOT_OPEN |

Terminal for a version: NOT_CONSENTED or CONSENTED. Consent can not be re-entered for the same version.

## Validation & errors
Guards reference [validation_rules.md](validation_rules.md). Invalid transitions return `SYS.UNPROCESSABLE_STATE`.

## Authorization
Transitions require capability `cyc.consent` (participant) or system scope for timers.

## Failure, idempotency, concurrency, offline
Timer-driven EXPIRED is idempotent: repeated fires produce one event. Concurrent ACCEPT and revision race: the revision check on the cycle row decides; the loser receives `SYS.CONFLICT`. Details in [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Transition events carry no item descriptions (CTR-EVT-001 `max_data_class` = PSEUDONYMOUS).

## Observability & budgets
Gauge: cycles per state. Alert: CONSENTING older than TTL + 1 h (should not occur).

## Tests
- TEST-PS-021-03-01 (unit): every row of the transition table.
- TEST-PS-021-03-02 (property): no path reaches CONSENTED without all ACCEPTED.
- TEST-PS-021-03-03 (integration): revision during consent invalidates prior ACCEPTED.

## Acceptance criteria
1. All transitions above implemented and tested.
2. CONSENTED is reachable only through `cycle.consented`.
3. Revision race yields exactly one winner in 1000 concurrent trials.

## Assumptions & open decisions
- ASSUMPTION: event names `cycle.consent_recorded` etc. are registered under CTR-EVT-001 naming (verb past tense).
- [DECISIONS.md](../../../DECISIONS.md) D04 — partial execution. PROVISIONAL (D04 default, unapproved): consent is per-party and does not imply execution.
