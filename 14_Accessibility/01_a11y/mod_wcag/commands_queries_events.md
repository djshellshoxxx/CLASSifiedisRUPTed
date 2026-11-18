# PS-111-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-04.R01 | `wcag.record.submit` is idempotent on (screen_id, app_version, evidence set digest). | MVP |
| PS-111-04.R02 | `wcag.finding.transition` requires `expected_revision`. | MVP |
| PS-111-04.R03 | Events validate against v1.0.0 registry entries. | MVP |

## Data / schema
Command `wcag.record.submit` v1.0.0: `{idempotency_key, screen_id, app_version, criteria[50]}`.
Command `wcag.finding.transition` v1.0.0: `{idempotency_key, finding_id, to_status, expected_revision, accepted_until?}`.
Query `wcag.gate.get` v1.0.0: `{app_version}` → `{blockers_open, majors_open, accepted_risk_count, passes: bool}`.

## Commands / queries / events
Events: `conformance_record.submitted` `{record_id, screen_id, app_version}`; `accessibility_finding.transitioned` `{finding_id, from, to, revision}`.

## States & transitions
Per [PS-111-03](workflow_state_machine.md).

## Validation & errors
Per [PS-111-02](validation_rules.md).

## Authorization
Per [PS-111-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope per CTR-EVT-001 R03. CI retries use the same key.

## Privacy, retention, abuse
Payloads contain criteria IDs, digests and status only.

## Observability & budgets
Gate query p95 ≤ 200 ms.

## Tests
- TEST-PS-111-04-01 contract: payloads validate.
- TEST-PS-111-04-02 integration: duplicate submit returns original record.
- TEST-PS-111-04-03 integration: stale revision transition refused.

## Acceptance criteria
1. Duplicate submissions produce one record.
2. Gate query reflects open blockers within one submit cycle.

## Assumptions & open decisions
- ASSUMPTION: gate query is computed on read.
- No Dxx decision directly affects the interface.
