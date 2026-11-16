# PS-126-09 — Contract and acceptance tests: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-126-09.R02** Default deny and purity are covered by property tests over generated capability and role matrices.
- **PS-126-09.R03** Audit integrity is covered by tamper tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X with admins A1 and A2, moderator M, member U; registry of 60 capabilities from fixture modules; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T01 | unit | PS-126-01.R01, PS-126-01.R02, PS-126-01.R03, PS-126-02.R01 | assign moderator for 90 days | assignment stored, statement signed, expiry set |
| TEST-PS-126-09.T02 | unit | PS-126-02.R02, PS-126-02.R03 | each rule V02–V07 violated | documented error code and nothing stored |
| TEST-PS-126-09.T03 | property | PS-126-02.R02, PS-126-06.R01 | generated actors, capabilities, resources and malformed inputs | authorize never throws, is deterministic, and every unlisted combination denies |
| TEST-PS-126-09.T04 | integration | PS-126-03.R01, PS-126-03.R02, PS-126-03.R03 | expiry sweep missed; role revoked mid-request | request-time check denies; handler re-check denies; audit entries written |
| TEST-PS-126-09.T05 | contract | PS-126-04.R01, PS-126-04.R02, PS-126-09.R02 | commands, queries and events | validate against registry schemas; role statements verify with the relay key |
| TEST-PS-126-09.T06 | integration | PS-126-04.R03 | session.revoked and action.applied events | caches flushed; next request uses fresh facts |
| TEST-PS-126-09.T07 | abuse | PS-126-05.R01, PS-126-05.R02, PS-126-05.R03, PS-126-07.R03 | member assigns role; moderator reads audit; self-grant; sole admin revokes self | FORBIDDEN, FORBIDDEN, FORBIDDEN, SECURITY_LAST_ADMIN |
| TEST-PS-126-09.T08 | abuse | PS-126-05.R01, PS-126-07.R03 | statement signed by non-author accepting an offer; revoked signer; unknown signer | quarantined with reasons unauthorized_role, signer_revoked, unknown_signer |
| TEST-PS-126-09.T09 | abuse | PS-126-07.R01, PS-126-07.R02, PS-126-07.R03 | UPDATE and DELETE audit rows; remove middle entry; truncate tail | trigger aborts; verify_chain reports first broken seq; anchor mismatch detected |
| TEST-PS-126-09.T10 | integration | PS-126-06.R02, PS-126-06.R03 | audit store failure during a state-changing command | command fails closed with DEPENDENCY_UNAVAILABLE and no state change |
| TEST-PS-126-09.T11 | integration | PS-126-06.R01 | same Idempotency-Key replayed on assign | original response; one audit entry |
| TEST-PS-126-09.T12 | abuse | PS-126-07.R03 | 1 000 identical denials from one key in 60 seconds | one coalesced entry with count 1 000 |
| TEST-PS-126-09.T13 | load | PS-126-08.R01, PS-126-08.R02, PS-126-08.R03 | 5 000 authorize calls per second for 5 minutes; verify 100 000 entries | p95 targets met; verification ≤ 10 s |
| TEST-PS-126-09.T14 | unit | PS-126-09.R01, PS-126-09.R03 | traceability tool run | every PS-126 requirement maps to a passing test |
| TEST-PS-126-09.T15 | integration | PS-126-10.R01, PS-126-10.R02, PS-126-10.R03 | export audit and roles, import into fresh relay, restore backup | chain verifies after round trip; imported roles inactive until re-signed by the new relay |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- authorize is pure and every unlisted capability and role combination denies (property tests).
- The audit chain detects any edit, deletion or truncation in tamper tests.

## Dependencies

Module depends on: CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
