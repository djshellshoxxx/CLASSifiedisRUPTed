# PS-076-09 — Contract and acceptance tests: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-09.R01** Every requirement is covered by at least one automated test.
- **PS-076-09.R02** Contract tests validate command outputs, statements and event payloads against the schema registry.
- **PS-076-09.R03** Default-off behavior is covered by a test that enumerates every purpose on a fresh vault.

## Specification

See the module test table below (all processes).

**Fixtures:** Fresh vault; bundled policies for five purposes with fixed hashes; relay double; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T01 | unit | PS-076-01.R01, PS-076-01.R03, PS-076-02.R01 | grant federation_publish for a relay with the current hash | row stored granted, statement signed with policy hash |
| TEST-PS-076-09.T02 | unit | PS-076-01.R02, PS-076-03.R01 | grant, regrant with new version, withdraw | history keeps three rows with statuses superseded, then withdrawn; none edited |
| TEST-PS-076-09.T03 | unit | PS-076-02.R02, PS-076-02.R03 | rules V01 to V07 violated in turn | documented error code and nothing stored |
| TEST-PS-076-09.T04 | unit | PS-076-02.R03, PS-076-07.R01 | fresh vault, check every purpose | all return granted false |
| TEST-PS-076-09.T05 | property | PS-076-03.R01, PS-076-03.R02 | random grant and withdraw sequences | at most one granted row per purpose and relay; withdrawn rows never return to granted |
| TEST-PS-076-09.T06 | integration | PS-076-03.R03 | change policy hash with materialChange | consent lapses at unlock, privacy.consent.withdrawn emitted with reason policy_changed, check returns false |
| TEST-PS-076-09.T07 | contract | PS-076-04.R01, PS-076-04.R02, PS-076-09.R02 | execute each command and query | outputs, statements and events validate against registry schemas |
| TEST-PS-076-09.T08 | integration | PS-076-04.R03, PS-076-02.R03 | consumer without consent tries processing; error injected into check | processing blocked in both cases |
| TEST-PS-076-09.T09 | integration | PS-076-04.R03, PS-076-03.R01 | notify.channel.opted_out and privacy.deletion.requested delivered | matching consents withdrawn with the right source; replay is a no-op |
| TEST-PS-076-09.T10 | abuse | PS-076-05.R01, PS-076-05.R02, PS-076-05.R03 | another module of a different vault tries to read; relay tries to alter | no access; statements from non-owner rejected |
| TEST-PS-076-09.T11 | integration | PS-076-06.R01, PS-076-06.R02, PS-076-06.R03 | replay command ID; relay offline during withdrawal | original result; local processing stops at once; UI shows prepared |
| TEST-PS-076-09.T12 | abuse | PS-076-07.R02, PS-076-07.R03 | 31 grants in an hour; UI inspection of the grant sheet | 31st RATE_LIMITED; no pre-ticked control; limits of withdrawal stated |
| TEST-PS-076-09.T13 | load | PS-076-08.R01, PS-076-08.R02, PS-076-08.R03 | 10 000 checks and 100 changes | check p99 ≤ 2 ms, propagation ≤ 1 s, no telemetry sent |
| TEST-PS-076-09.T14 | a11y | PS-076-07.R02, PS-076-01.R03 | privacy settings and grant sheet | axe zero serious issues; keyboard-only completion; switches announced |
| TEST-PS-076-09.T15 | unit | PS-076-09.R01, PS-076-09.R03 | traceability tool run | every PS-076 requirement maps to a passing test |
| TEST-PS-076-09.T16 | integration | PS-076-10.R01, PS-076-10.R02, PS-076-10.R03 | export, import with unknown policy hash, roll back one release | history round-trips; unknown hash imports as lapsed |

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- On a fresh vault every purpose reports not granted and no consumer processes for any purpose.
- Withdrawal stops in-vault processing within 1 second and the UI states that copies cannot be recalled.

## Dependencies

Module depends on: F07.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
