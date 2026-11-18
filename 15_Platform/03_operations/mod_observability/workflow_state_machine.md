# PS-121-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-03.R01 | Alert instances follow the states below; `resolved` is set only when the condition is false for the rule's recovery window. | MVP |
| PS-121-03.R02 | Firing requires the condition to hold for the rule's `for` duration (default 2 min, ASSUMPTION). | MVP |
| PS-121-03.R03 | `acknowledged` does not stop notification escalation for critical rules. | MVP |
| PS-121-03.R04 | Silence windows are time-boxed (maximum 24 h) and require a reason code. | MVP |

## Data / schema
`alert_instance.state` field (PS-121-01). Events: `alert.fired`, `alert.resolved`, `alert.acknowledged` as CTR-EVT-001 envelopes with aggregate `alert` (aggregate IDs PENDING registration under CTR-ID-001).

## Commands / queries / events
`alert.acknowledge`, `alert.silence`, `alert_rule.create`, `alert_rule.retire` (PS-121-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | condition_true | R02 duration reached | firing | page per severity; emit `alert.fired` |
| (none) | condition_true | duration not reached | pending | none |
| pending | condition_false | — | (none) | discard |
| firing | acknowledge | authorized `ope` | acknowledged | emit `alert.acknowledged` |
| firing or acknowledged | condition_false | recovery window passed | resolved | emit `alert.resolved` |
| firing | silence | R04 | silenced | suppress pages only |
| silenced | silence_expired | — | firing or resolved | re-evaluate |

## Validation & errors
Illegal transitions return `SYS.CONFLICT` (409) and are logged.

## Authorization
Acknowledge and silence require `alert.administer` for `ope` (PS-121-05).

## Failure, idempotency, concurrency, offline
Evaluation is idempotent per (rule_version, window). Duplicate pages suppressed within 5 min.

## Privacy, retention, abuse
Alert text is generated from codes and metric names only.

## Observability & budgets
Metric: `alert_pages_total{severity}`. Budget: fire within 60 s of condition holding (ASSUMPTION).

## Tests
- TEST-PS-121-03-01 (unit): every transition row; illegal transitions rejected.
- TEST-PS-121-03-02 (integration): flapping condition does not fire until `for` duration passes.
- TEST-PS-121-03-03 (integration): silence beyond 24 h refused.
- TEST-PS-121-03-04 (e2e): induced `CTR-PRV-001` precise-location detection fires critical alert within 60 s.

## Acceptance criteria
1. Alert table is the only path to `resolved`.
2. TEST-PS-121-03-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 2-minute `for` default; 24-hour silence maximum.
