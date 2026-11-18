# PS-137-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (capability names PENDING CTR-CAP-001 approval).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-05.R01 | Every command checks actor role and capability before any write; denied calls write nothing and log one denial event | MVP |
| PS-137-05.R02 | Quarantine approver is never the requester (enforced by server check, not UI only) | MVP |
| PS-137-05.R03 | CI service identity can write coverage and manifest rows only; cannot approve quarantine | MVP |
| PS-137-05.R04 | Capability changes take effect within one CI run (no cached grants beyond run) | MVP |

## Data / schema
Capability grants: `{actor_id, role, capability, granted_by, granted_at}`. Proposed capability names (PENDING CTR-CAP-001): `qa.manifest.write`, `qa.quarantine.approve`, `qa.coverage.write`, `qa.manifest.read`.

## Commands / queries / events
Authorization applies to every command in PS-137-04. Queries require `qa.manifest.read`, which every engineering role holds.

## States & transitions
Not applicable.

## Validation & errors
`UNIT.UNAUTHORIZED` (non-retryable, message key `unit.unauthorized`). Diagnostic: capability name and role only.

## Authorization
| Actor | MapTest | RecordCoverage | Quarantine request | Quarantine approve | Retire |
|---|---|---|---|---|---|
| Module developer (own module) | yes | no | yes | no | request only |
| QA Lead | yes | no | yes | yes | yes |
| CI service identity | yes | yes | no | no | no |
| Auditor (read-only) | no | no | no | no | no |

## Failure, idempotency, concurrency, offline
Grant revocation mid-run: command rejected at next call, no partial write. Authorization is server-side in the CI check tool; no offline mode.

## Privacy, retention, abuse
Denial logs keep actor reference and capability, not request body. Abuse case: developer self-approves quarantine via second account; mitigated by reviewer role separation and audit log review each sprint (ASSUMPTION).

## Observability & budgets
Count of UNAUTHORIZED per week; any non-zero count for CI identity triggers review.

## Tests
- TEST-PS-137-05-01 (unit): requester == approver rejected with UNIT.UNAUTHORIZED.
- TEST-PS-137-05-02 (unit): CI identity calling ApproveQuarantine denied.
- TEST-PS-137-05-03 (integration): revoked grant blocks next MapTest in same fixture run.

## Acceptance criteria
1. Permission matrix above enforced by tests, one test per cell that is "no".
2. No write occurs on denied call (row count check).
3. Capability names confirmed against CTR-CAP-001 before status leaves SPEC-DRAFT-COMPLETE.

## Assumptions & open decisions
- ASSUMPTION: QA Lead role is held by one or more named people; named owner is not yet assigned.
- D10 PROVISIONAL (D10 default, unapproved): actor identity and key handling for CI identity follow user-controlled key rules where applicable; not applicable to repository-held tests.
