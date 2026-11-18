# PS-134-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-01.R01 | Every E2EScenario maps to exactly one `flow` from the twelve-value enum and one TEST-ID | MVP |
| PS-134-01.R02 | Every E2ERun references one scenario, one commit and one environment; no orphan runs | MVP |
| PS-134-01.R03 | FixtureSet contains only synthetic personas (pseudonym, region code, no contact data) | MVP |
| PS-134-01.R04 | Run record stores step index of first failure, not screenshots or page bodies | MVP |

## Data / schema
```
E2EScenario {
  test_id: string          // TEST-PS-134-<nn>-<mm>
  flow: enum(paid_listing|local_sale|barter_2|cycle_3|cycle_4|cycle_n|mixed_value|cancel_dispute|fraud_moderation|private_messages|payments|federation_io)
  fixture_set_id: string
  steps: [{index: int, action: text<=200, expected: text<=200, a11y_check: bool}]  // index 1..n contiguous
  devices: enum[](desktop|phone_360)
  max_duration_s: int      // default 120
  status: enum(active|quarantined|retired)
  owner_role: string
}
E2ERun {
  run_id: id               // CTR-ID-001 (format OPEN)
  test_id: string
  commit: char(40)
  environment: enum(ephemeral|staging)
  device: enum(desktop|phone_360)
  result: enum(passed|failed|errored|skipped)
  first_failed_step: int|null
  duration_ms: int
  artifact_refs: id[]      // trace and redacted screenshot IDs
  started_at, finished_at: timestamptz UTC
}
FixtureSet { fixture_set_id, version semver, personas: [{pseudonym, region_code}], listings_count, created_at, content_hash }
```
Region codes use coarse public regions only (D05 default).

## Commands / queries / events
Signatures in PS-134-04. Schema version `v1`.

## States & transitions
Scenario status and run result per PS-134-03.

## Validation & errors
Rules in PS-134-02. Schema violations return `E2E.SCHEMA_INVALID`.

## Authorization
Fixture sets and scenarios writable by QA Lead; run records written by CI identity only.

## Failure, idempotency, concurrency, offline
Not applicable to client offline. Run records immutable after `finished_at`.

## Privacy, retention, abuse
Personas are fictional; region_code is coarse (no address, no coordinates). Retention in PS-134-07.

## Observability & budgets
Row counts per flow per day. Insert p95 <= 100 ms (ASSUMPTION).

## Tests
- TEST-PS-134-01-01 (unit): flow enum rejects values outside the twelve.
- TEST-PS-134-01-02 (unit): steps with a gap in index rejected.
- TEST-PS-134-01-03 (unit): persona containing an email-shaped pseudonym rejected.

## Acceptance criteria
1. Schema covers all twelve flows.
2. Immutability after finish enforced in storage.
3. No persona field accepts contact data.

## Assumptions & open decisions
- ASSUMPTION: scenario steps stored as text in the registry, not as code.
- D05 PROVISIONAL (D05 default, unapproved): coarse region_code only.
