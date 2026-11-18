# PS-133-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-09.R01 | Consumers mod_incident and mod_response resolve every THR-ID they reference (0 dangling) in CI | MVP |
| PS-133-09.R02 | Event payloads validate against CTR-EVT-001 envelope in CI | MVP |
| PS-133-09.R03 | THREATS.* error codes registered in CTR-ERR-001 registry | MVP |
| PS-133-09.R04 | Seeded threat areas (eight IDs in TODO) each have a passing acceptance test before status changes | MVP |

## Data / schema
Contract fixture: list of THR-IDs and control paths referenced by consumers, generated from consumer specs.

## Commands / queries / events
Contract tests exercise RecordThreat, PublishModel and the event set in PS-133-04.

## States & transitions
Not applicable.

## Validation & errors
Mismatch returns THREATS.CONTRACT_MISMATCH with schema path only (non-retryable).

## Authorization
Contract suite runs as CI identity with read-only access to the register fixture.

## Failure, idempotency, concurrency, offline
Upstream drift (consumer references removed threat) is reported to the consumer owner, not patched in this module.

## Privacy, retention, abuse
Fixtures use synthetic THR-IDs and generic areas only.

## Observability & budgets
Contract suite <= 3 min (ASSUMPTION); failures counted per consumer.

## Tests
- TEST-PS-133-09-01 (contract): mod_incident references resolve to published THR-IDs.
- TEST-PS-133-09-02 (contract): ControlVerified and ResidualAccepted validate against CTR-EVT-001.
- TEST-PS-133-09-03 (acceptance): each seeded THR area record present with owner_role and rating.

## Acceptance criteria
1. Contract tests green on main branch.
2. Eight seeded THR records present with all required fields (no TBD).
3. Acceptance checklist reviewed by Security Lead.

## Assumptions & open decisions
- PENDING CTR-EVT-001 and CTR-ERR-001 approval before these tests are binding.
- ASSUMPTION: mod_incident and mod_response reference THR-IDs in MVP; if not, test becomes no-op with recorded decision.
