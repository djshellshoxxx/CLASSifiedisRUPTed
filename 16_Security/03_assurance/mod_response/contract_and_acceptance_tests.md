# PS-132-09 — Contract and acceptance tests: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-09.R01** Every requirement of this module is covered by at least one automated test or a recorded drill.
- **PS-132-09.R02** Switch contracts are covered by integration tests against the relay with fixture modules.
- **PS-132-09.R03** The linter has fixtures for each error code.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay fixture with command bus stub, flag store, outbox with 1 000 queued statements, runbook fixtures (valid and one per error), fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T01 | unit | PS-132-01.R01, PS-132-01.R02, PS-132-02.R01, PS-132-04.R01, PS-132-04.R03, PS-132-09.R02 | lint the seven runbooks and each broken fixture | valid passes; each broken fixture yields its SECURITY_RUNBOOK_* code with runbook ID |
| TEST-PS-132-09.T02 | unit | PS-132-01.R03, PS-132-02.R02, PS-132-02.R03 | switch command with empty reason, short reason, wrong role | VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN |
| TEST-PS-132-09.T03 | integration | PS-132-03.R04, PS-132-04.R02 | set read-only; submit listing publish, offer make, session revoke, key revoke, incident open | non-exempt return SECURITY_READ_ONLY_MODE within 5 s with retryAfterMs 300000; exempt succeed |
| TEST-PS-132-09.T04 | integration | PS-132-03.R05, PS-132-06.R01 | set federation flag off then on twice | inbound inbox returns FEATURE_DISABLED within 60 s; outbound stops; repeated toggles are no-ops with audit notes |
| TEST-PS-132-09.T05 | chaos | PS-132-06.R03 | database down while applying read-only; flag store down for federation kill | sentinel works without database; reverse-proxy fallback documented and verified |
| TEST-PS-132-09.T06 | integration | PS-132-03.R01 | simulate relay key compromise with RB-01 steps in a staging relay | new keys active, old key revoked, role and policy statements re-signed, notice verifies with new key, durations within targets |
| TEST-PS-132-09.T07 | manual | PS-132-03.R02, PS-132-03.R03, PS-132-03.R06, PS-132-03.R07 | tabletop drill of RB-02, RB-03, RB-06 and RB-07 with two maintainers before each release | drill record with date, participants, gaps and action items; last drill date updated |
| TEST-PS-132-09.T08 | abuse | PS-132-05.R01, PS-132-05.R02, PS-132-05.R03, PS-132-07.R01 | member invokes containment; admin toggles 11 times in an hour; single admin grants admin to self | FORBIDDEN or no route; 11th rate limited; SECURITY_APPROVAL_REQUIRED |
| TEST-PS-132-09.T09 | abuse | PS-132-07.R02, PS-132-07.R03 | notice text claiming no data was accessed without evidence reference; document with 'externally audited' | rejected by template validation; SECURITY_RUNBOOK_FORBIDDEN_CLAIM |
| TEST-PS-132-09.T10 | integration | PS-132-06.R01, PS-132-06.R02 | outbox of 1 000 statements during read-only then lift | statements stay prepared; drained at 50 per second per key; none lost or duplicated |
| TEST-PS-132-09.T11 | load | PS-132-08.R01, PS-132-08.R02, PS-132-08.R03 | 1 000 requests per second during toggle on a staging relay | propagation ≤ 5 s; overhead ≤ 0.1 ms; gauges correct |
| TEST-PS-132-09.T12 | unit | PS-132-09.R01, PS-132-09.R03 | traceability tool run | every PS-132 requirement maps to a passing test or a recorded drill |
| TEST-PS-132-09.T13 | integration | PS-132-10.R01, PS-132-10.R02, PS-132-10.R03 | export runbooks and templates, import into fork, schema bump | linter results identical; old version parsed for 180 days |
| TEST-PS-132-09.T14 | unit | PS-132-02.R03, PS-132-08.R03 | drill record dated 7 months ago | SECURITY_RUNBOOK_DRILL_STALE and gate failed |

## Acceptance criteria

- All automated tests pass in CI and a drill record dated within 6 months exists for the release.
- Read-only mode takes effect within 5 seconds and federation kill within 60 seconds in the staging test.
- Runbooks contain no dangling references and no claim of audit or certification.

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F15.S04.M02, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
