# PS-095-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-03.R01 | Finding transitions are only those in the table. | MVP |
| PS-095-03.R02 | No finding changes the visibility of content. Only enforcement (PS-096) can. | MVP |
| PS-095-03.R03 | Reporter restriction has a maximum duration of 14 days without second approval. | MVP |

## States & transitions — findings
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | finding.recorded | rule active; new (source, rule, version) | open | queue; severity 4 → priority |
| open | finding.confirmed | reviewer ≠ subject; version active | confirmed | proposal to PS-096 (not automatic action) |
| open | finding.dismissed | reviewer ≠ subject | dismissed | precision counter +1 negative |
| open | finding.expired | 7 days without review | expired | counts as no-signal |
| confirmed, dismissed | retention.elapsed | class limit | purged | digest removed |

## States & transitions — reporter misuse
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | misuse.monitored | ≥ 20 reports in 30 days | monitored | counters only |
| monitored | misuse.recommended | ≥ 80% of reports closed_invalid, weighted | recommended | reviewer queue |
| recommended | account.reporting_restricted | reviewer approves; second approver if > 7 days | restricted | `account.reporting_restricted`; FLG.REPORTING_RESTRICTED |
| restricted | restriction.elapsed | duration reached | monitored | `account.reporting_restored` |

## Validation & errors
Illegal transitions → `SYS.UNPROCESSABLE_STATE`; double review → `ABU.FINDING_NOT_OPEN`.

## Authorization
Confirm and dismiss by reviewer with case or triage grant; restriction by `mod` plus second approver for longer durations.

## Failure, idempotency, concurrency, offline
Transitions keyed by (finding_id, revision). Expiry job idempotent.

## Privacy, retention, abuse
Subjects are never told which rule fired. Restriction notices state the category only.

## Observability & budgets
`abuse_transitions_total{from,to}`; precision per rule computed daily.

## Tests
- TEST-PS-095-03-01 (property): random review sequences keep finding states valid.
- TEST-PS-095-03-02 (negative): self-review rejected.
- TEST-PS-095-03-03 (restriction): 14-day auto-expiry restores reporting.

## Acceptance criteria
1. Confirmed findings produce proposals only; no direct visibility change (TEST-02).
2. Restriction never exceeds 14 days without second approval.

## Assumptions & open decisions
- ASSUMPTION: misuse threshold 80% weighted invalid closures over ≥ 20 reports.
- PROVISIONAL (D07 default, unapproved): dismissed-finding purge 90 days.
