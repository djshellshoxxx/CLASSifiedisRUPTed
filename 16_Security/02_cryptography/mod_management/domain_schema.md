# PS-129-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ID-001, CTR-EVT-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-01.R01 | Persist one `crypto_policy` record per policy version. Records are immutable after `active`; changes create a new version. | MVP |
| PS-129-01.R02 | `allowed_suites` holds 1–8 `suite_id` values, each present in the suite registry with status `active`. | MVP |
| PS-129-01.R03 | `rotation_days` per key class is an integer 30–730. Default for `signing` = 365 (PROVISIONAL, D10). | MVP |
| PS-129-01.R04 | Every policy record stores two distinct approver IDs (`ope_`) and the proposer ID. Proposer is never an approver. | MVP |
| PS-129-01.R05 | All policy fields are class PUBLIC. No key bytes, secrets or personal data may appear in this schema. | MVP |
| PS-129-01.R06 | Suite registry entries are versioned and immutable; status may only move forward (`active` → `deprecated` → `retired`). | MVP |

## Data / schema
```json
{
  "policy_id": "pol_<26 Crockford base32>",
  "policy_version": "1.0.0",
  "key_class": "signing | device_enrollment | backup_wrap",
  "status": "draft | proposed | scheduled | active | deprecated | retired | cancelled",
  "allowed_suites": ["suite.<id>"],
  "min_security_bits": 128,
  "rotation_days": 365,
  "effective_from": "RFC 3339 UTC",
  "effective_until": "RFC 3339 UTC | null",
  "supersedes": "pol_... | null",
  "proposed_by": "ope_...",
  "approved_by": ["ope_...", "ope_..."],
  "created_at": "RFC 3339 UTC",
  "revision": "integer >= 0",
  "data_class": "PUBLIC"
}
```
- `policy_id` prefix `pol` is PENDING CTR-ID-001 registration (proposed class `ulid`, owner F16). No code may mint it before registration.
- Schema registry: `schema_id` = `crypto_policy`, format `json-schema-2020-12`, owner F16 (CTR-SCH-001 R01).
- Suite registry entry: `suite_id`, `primitives` (library-reviewed names only), `status`, `introduced_on`, `deprecated_on`. Primitive selection is ASSUMPTION; no custom primitives.

## Commands / queries / events
Defined in [commands_queries_events.md](commands_queries_events.md). Schema changes follow CTR-SCH-001 change classes; adding a `key_class` value is MINOR only if the registry marks the enum open.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Field visibility is `public` for all fields (CTR-CAP-001 R10). Writes are governed by [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Revision is per policy record (CTR-EVT-001 R02). Offline clients hold read-only cached copies; they never create policy records.

## Privacy, retention, abuse
Class PUBLIC. Retention: policy history retained for the life of the platform as governance records (ASSUMPTION; D07 default). Approver IDs are pseudonymous `ope_` IDs.

## Observability & budgets
Gauge `crypto_policy_active_total{key_class}` must equal 1 per key class (see [observability_performance.md](observability_performance.md)).

## Tests
- TEST-PS-129-01-01: unit, registry lint accepts valid entry and rejects `SECRET` class field.
- TEST-PS-129-01-02: contract, schema digest stored and matches published bytes (CTR-SCH-001 R02).

## Acceptance criteria
1. Schema validates 100% of golden fixtures and rejects every fixture with an unknown field.
2. Two approvers, distinct from proposer, are persisted before `scheduled`.
3. No field is classed above PUBLIC.

## Assumptions & open decisions
- ASSUMPTION: `pol` prefix and ULID body class.
- D10 (user-controlled keys, rotation): default 365-day signing rotation. PROVISIONAL (D10 default, unapproved).
- D07 (retention): PROVISIONAL (D07 default, unapproved).
