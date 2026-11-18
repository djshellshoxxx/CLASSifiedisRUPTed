# PS-133-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-03.R01 | Each Threat has exactly one status: identified, assessed, mitigated, accepted, retired | MVP |
| PS-133-03.R02 | Only transitions in the table are allowed; others return THREATS.ILLEGAL_TRANSITION | MVP |
| PS-133-03.R03 | A threat reaches `mitigated` only when every linked control has a verified_by TEST-ID | MVP |
| PS-133-03.R04 | `accepted` expires after at most 180 days and returns to `assessed` on expiry | MVP |
| PS-133-03.R05 | `retired` is terminal; a re-identified risk gets a new THR-ID | MVP |

## Data / schema
Uses `Threat.status` and `revision`. Transition record: `{threat_id, from, to, revision, actor_role, at, reason_code}`.

## Commands / queries / events
Transitions driven by commands in PS-133-04 and the scheduled expiry job.

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| identified | AssessThreat | likelihood and impact set | assessed | emit ThreatAssessed |
| assessed | VerifyControl (all controls) | every control has TEST-ID | mitigated | emit ControlVerified |
| assessed | AcceptResidual | two distinct roles, expiry <= 180 d | accepted | emit ResidualAccepted |
| accepted | expiry | no renewal | assessed | emit ResidualExpired; review task |
| mitigated | ReviewDue (no change) | review_due passed | assessed | emit ReviewOverdue |
| any non-retired | RetireThreat | reason recorded | retired | keep row |

## Validation & errors
THREATS.ILLEGAL_TRANSITION (non-retryable). Guard failures return codes in PS-133-02.

## Authorization
AcceptResidual requires Security Lead plus Privacy Lead for LINDDUN threats (PS-133-05).

## Failure, idempotency, concurrency, offline
Compare-and-set on `revision`. Expiry job idempotent per threat_id and expiry date.

## Privacy, retention, abuse
Transition log stores roles and IDs, not rationale text beyond reason_code.

## Observability & budgets
Gauge per status; count of accepted threats past 150 days (early warning). Target 0 expired-but-unreviewed.

## Tests
- TEST-PS-133-03-01 (unit): every table row as a test case.
- TEST-PS-133-03-02 (property): no sequence reaches `retired` then any other status for the same THR-ID.
- TEST-PS-133-03-03 (integration): mitigated blocked when one control lacks TEST-ID.

## Acceptance criteria
1. Illegal transitions rejected in 100% of tested combinations.
2. Accepted threat with expiry passed is back in assessed after job run.
3. Retired THR-IDs never reused.

## Assumptions & open decisions
- ASSUMPTION: a control is "verified" when a named test in mod_unit or mod_e2e passes; manual verification is not accepted in MVP.
- D04 PROVISIONAL (D04 default, unapproved): physical handover threats remain in `accepted` only with explicit per-party evidence noted in rationale.
