# PS-086-09 — Contract and acceptance tests: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-086-09.R02** A two-vault and two-relay harness reproduces fork, prev mismatch and commitment conflicts.
- **PS-086-09.R03** Contract tests validate commands, events and ConflictRecord against the registry schemas.

## Specification

See the module test table below (all processes).

**Fixtures:** Author X with chain seq 1..6; two seq-7 envelopes E7a and E7b; two consents C1 and C2 on proposal digest D; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T01 | unit | PS-086-01.R01, PS-086-01.R02, PS-086-02.R02 | detect with E7a and E7b | one open ConflictRecord with 2 candidates, claimed and receipt times stored separately |
| TEST-PS-086-09.T02 | unit | PS-086-02.R01, PS-086-02.R03 | detect with an unsigned or role-less candidate; with 1 candidate | FED_SIGNATURE_INVALID or VALIDATION_FAILED; nothing opened |
| TEST-PS-086-09.T03 | property | PS-086-03.R01, PS-086-03.R03 | random command sequences on one conflict | only declared transitions succeed; terminal states never change; candidates never altered |
| TEST-PS-086-09.T04 | integration | PS-086-03.R02, PS-086-04.R03, PS-086-07.R02 | public conflict untouched for 7 days with a bound origin | auto_resolved origin_wins keeps the first-received-from-origin cid; event emitted |
| TEST-PS-086-09.T05 | integration | PS-086-03.R02, PS-086-01.R03 | commitment conflict C1 vs C2 for 30 days | still open; freezeScope contains the proposal; resolve with origin_wins returns FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE |
| TEST-PS-086-09.T06 | integration | PS-086-03.R03, PS-086-04.R01 | author publishes E8 with ext.supersedes naming both cids | conflict superseded with supersededByCid; resolved event emitted |
| TEST-PS-086-09.T07 | contract | PS-086-04.R01, PS-086-04.R02, PS-086-09.R02 | detect and resolve | outputs and events validate against registry schemas |
| TEST-PS-086-09.T08 | integration | PS-086-04.R03 | account moved event for the author while a conflict is open | origin binding recomputed before the 7-day decision |
| TEST-PS-086-09.T09 | abuse | PS-086-05.R01, PS-086-05.R02, PS-086-05.R03, PS-086-07.R03 | non-operator resolves on relay; external request calls detect; third party reads conflict | FORBIDDEN or NOT_FOUND; operator resolution logged with decidedBy |
| TEST-PS-086-09.T10 | abuse | PS-086-07.R01, PS-086-07.R03 | attacker signs a statement as a non-participant for a victim's proposal | quarantined, no conflict opened, trade not frozen |
| TEST-PS-086-09.T11 | integration | PS-086-06.R01, PS-086-06.R02, PS-086-02.R02 | replay detect with same candidates; two concurrent resolves | same conflictId; one success and one CONFLICT_REVISION |
| TEST-PS-086-09.T12 | chaos | PS-086-06.R03, PS-086-08.R03 | kill process between conflict write and event; consumer unavailable for 90 s | freeze event delivered after restart; UI warning shown above 60 s lag |
| TEST-PS-086-09.T13 | integration | PS-086-07.R02, PS-086-03.R03 | relay with ciphertext commitment statements | relay stores no plaintext and refuses to resolve commitment conflicts |
| TEST-PS-086-09.T14 | load | PS-086-08.R01, PS-086-08.R02 | 1000 conflicts detected and resolved in a minute | p95 ≤ 300 ms and gauges exported |
| TEST-PS-086-09.T15 | e2e | PS-086-01.R03, PS-086-03.R02 | two vaults receive conflicting acceptances; user opens review screen | trade paused banner visible, labels claim vs evidence, axe zero serious issues |
| TEST-PS-086-09.T16 | unit | PS-086-09.R01, PS-086-09.R03 | traceability tool run | every PS-086 requirement maps to a passing test |
| TEST-PS-086-09.T17 | integration | PS-086-10.R01, PS-086-10.R02, PS-086-10.R03 | export, import to fresh vault and relay restore | conflicts round trip with open ones still freezing; imported candidates re-verified |

## Acceptance criteria

- All tests T01–T17 pass in CI.
- No commitment (consent, money, inventory) conflict is ever resolved by last-writer-wins or by timeout.
- Forged role-less statements cannot freeze a trade (abuse test).

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
