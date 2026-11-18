# PS-082-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-ID-001 (new prefix PENDING CTR-ID-001: `tht_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-01.R01 | A threat record has a stable `threat_id` (`THR-` + 4 digits, unique) and cites at least one boundary or flow ID from `10_Privacy/02_security_boundaries/mod_model`. | MVP |
| PS-082-01.R02 | Each threat has one category from the set: `spoofing`, `tampering`, `repudiation`, `disclosure`, `denial`, `elevation`, `abuse`, `fraud`. | MVP |
| PS-082-01.R03 | Each threat carries `likelihood` and `impact` on a 1–5 scale and a computed `risk` = likelihood × impact. | MVP |
| PS-082-01.R04 | Mitigations reference requirement IDs (`PS-*.Rnn`, `CTR-*.Rnn`) and test IDs (`TEST-*`). Free text alone is not a mitigation. | MVP |

## Data / schema
| Field | Type | Constraint |
|---|---|---|
| `threat_id` | string | `THR-\d{4}`, unique |
| `title` | string | ≤ 120 chars, no user data |
| `category` | enum | R02 set |
| `flow_refs` | string[] | model IDs (PENDING `flw_`) |
| `likelihood`, `impact` | integer | 1–5 |
| `mitigations` | object[] | `{req_id, test_id, status}` |
| `residual_risk` | integer | 1–25 |
| `owner_role` | string | role name, not a person |
| `next_review_on` | date | ≤ 180 days from last review (ASSUMPTION) |
| `schema_version` | const | `1.0.0` |

Canonical threats seeded from PROJECT_SPEC risks: metadata leakage, forged evidence, replay, fraud, abuse, relay failure, stale federated records, pseudonym linkage.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Read: Privacy, Security, QA leads. Write: Privacy and Security leads. Exploit detail fields visible to `global` reviewers only; field visibility `never` for public and end users.

## Failure, idempotency, concurrency, offline
Updates use `expected_revision`. No offline writes.

## Privacy, retention, abuse
Register contains no user data but reveals attack surface; treated as restricted. Retention in file 07.

## Observability & budgets
Counts per category and per state in file 08.

## Tests
- TEST-PS-082-01-01 (schema): threat without flow reference fails.
- TEST-PS-082-01-02 (range): likelihood 6 rejected.
- TEST-PS-082-01-03 (privacy): register export contains no `acc_` value.

## Acceptance criteria
1. Schema validates for all seeded threats.
2. Risk computed deterministically.
3. Every seeded threat has at least one flow reference.

## Assumptions & open decisions
- ASSUMPTION: 1–5 scales; review interval 180 days.
- PROVISIONAL (D07 default, unapproved): restricted-register retention.
