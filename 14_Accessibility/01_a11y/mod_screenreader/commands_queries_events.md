# PS-110-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-04.R01 | `scr.template.publish` requires `idempotency_key` and `expected_revision`. | MVP |
| PS-110-04.R02 | Template query returns the published revision in ≤ 100 ms p95 from the bundled catalog or CDN. | MVP |
| PS-110-04.R03 | Events validate against v1.0.0 schemas in CTR-SCH-001. | MVP |

## Data / schema
Command `scr.template.publish` v1.0.0 input: `{idempotency_key, template_id, expected_revision}`.
Response `200`: `{"template_id":"ann_01...","revision":2,"status":"published"}`.
Query `scr.template.list` v1.0.0: `{event_key?}` returns published templates (max 500).

## Commands / queries / events
Event `announcement_template.published` (aggregate `ann`, data class PUBLIC): `{template_id, revision, event_key}`.
Event `announcement_template.deprecated`: `{template_id, revision}`.
Errors per [PS-110-02](validation_rules.md); `SYS.NOT_FOUND` for unknown IDs.

## States & transitions
Event emission per [PS-110-03](workflow_state_machine.md).

## Validation & errors
Validation before idempotency lookup.

## Authorization
Actors and capabilities per [PS-110-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope (actor, command, key) per CTR-EVT-001 R03. Stale `expected_revision` returns `SYS.CONFLICT`-class error via CTR-ERR-001 registry (code PENDING registration).

## Privacy, retention, abuse
Payloads contain template IDs and keys only.

## Observability & budgets
Per-command counters and latency. See [PS-110-08](observability_performance.md).

## Tests
- TEST-PS-110-04-01 contract: request and response validate against v1.0.0.
- TEST-PS-110-04-02 integration: duplicate publish with same key yields one event.
- TEST-PS-110-04-03 contract: `announcement_template.published` validates against registry.

## Acceptance criteria
1. Every command has schema, error list and idempotency scope.
2. Duplicate publish produces one event.
3. Query meets the latency budget in the test run.

## Assumptions & open decisions
- ASSUMPTION: template catalog is small (≤ 500 entries) and bundled in the app build.
- No Dxx decision directly affects the interface.
