# PS-121-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-05.R01 | Default deny. Ingest is limited to `sys` emitters registered per module. | MVP |
| PS-121-05.R02 | Aggregate dashboards are readable by `ope` with the platform operations role. | MVP |
| PS-121-05.R03 | Record-level telemetry is readable only with case scope and purpose (CTR-CAP-001 R06). | MVP |
| PS-121-05.R04 | Changing an alert rule or silencing a critical alert requires two distinct `ope` approvers for rules tagged critical. | MVP |
| PS-121-05.R05 | No user (`acc_`) principal can read telemetry about their own account except through owner export of audit records (CTR-PRV-001 R11). | MVP |

## Data / schema
| Capability | Actor | Resource | Verb |
|---|---|---|---|
| `telemetry_ingest` (write-only) | sys | telemetry, scope global | create |
| `telemetry_aggregate.read` | ope | telemetry, scope global | read |
| `telemetry_record.read` | mod or ope | telemetry, scope case | read (case + purpose) |
| `alert.administer` | ope | alert | administer |
| `alert_rule.administer` | ope (dual control for critical) | alert_rule | administer |

## Commands / queries / events
Decisions emit `dec_` records; no record content is stored in decisions (CTR-CAP-001 R13).

## States & transitions
Not applicable.

## Validation & errors
`SYS.FORBIDDEN` and `SYS.NOT_FOUND` per CTR-CAP-001.

## Authorization
Capability names follow CTR-CAP-001 R03 vocabulary. `telemetry_ingest` uses verb `create`.

## Failure, idempotency, concurrency, offline
Decision cache zero for record-level reads.

## Privacy, retention, abuse
Repeated denied record-level reads raise an alert (CTR-CAP-001 abuse rule).

## Observability & budgets
Metric: `telemetry_authz_denied_total{capability}`.

## Tests
- TEST-PS-121-05-01 (matrix): each row yields the stated outcome.
- TEST-PS-121-05-02 (negative): a user principal cannot read telemetry about own account.
- TEST-PS-121-05-03 (privileged): critical rule change with one approver refused.
- TEST-PS-121-05-04 (audit): record-level read emits `aud_` record without content.

## Acceptance criteria
1. Default deny holds for all capabilities (TEST-01).
2. TEST-PS-121-05-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 72 h maximum for case-scoped grants.
- OPEN (F16): purpose registry values for telemetry.
