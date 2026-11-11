# PS-091-09 — Contract and acceptance tests: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-091-09.R02** Security tests cover SSRF, key substitution, health-based suspension and opt-in on both sides.
- **PS-091-09.R03** Contract tests validate commands, statements, events and the Peer record against registry schemas.

## Specification

See the module test table below (all processes).

**Fixtures:** Relays A and B with fixed key seeds, vault V with selected relay A, fake clock 2026-11-04T10:00:00Z, DNS stub returning public and private addresses.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T01 | integration | PS-091-01.R01, PS-091-01.R02, PS-091-04.R02 | A proposes to B; B accepts with fingerprint confirmed | both Peer rows active with both opt-in flags; federation.peer.added emitted |
| TEST-PS-091-09.T02 | unit | PS-091-02.R01, PS-091-02.R03 | each rule V01–V07 violated | documented error code and no Peer created or changed |
| TEST-PS-091-09.T03 | abuse | PS-091-02.R01, PS-091-07.R03 | base URL with private IP, http scheme, redirect and DNS rebinding after creation | FEDERATION_PEER_URL_INVALID on each request |
| TEST-PS-091-09.T04 | abuse | PS-091-02.R02, PS-091-07.R03 | peer presents different key with and without rotation statement | mismatch refused and suspended; valid rotation accepted for 7 day overlap |
| TEST-PS-091-09.T05 | property | PS-091-03.R01, PS-091-03.R02, PS-091-03.R03 | random command sequences on one Peer | only declared transitions succeed; removed and expired never change; active requires both opt-ins |
| TEST-PS-091-09.T06 | integration | PS-091-03.R01, PS-091-06.R02 | proposal not accepted for 14 days | status expired by sweep |
| TEST-PS-091-09.T07 | integration | PS-091-04.R03, PS-091-07.R01 | 6 invalid-signature rejections, then a fork event | health drops by 25 cap then 20; suspension below 40 and federation.peer.suspended emitted |
| TEST-PS-091-09.T08 | contract | PS-091-04.R01, PS-091-04.R02, PS-091-09.R03 | each command, query and event | validate against registry schemas; statements validate against classrup.federation.peer_offer/v1 and peer_accept/v1 |
| TEST-PS-091-09.T09 | abuse | PS-091-05.R01, PS-091-05.R02, PS-091-05.R03 | non-operator manages peers on relay; external call to resolve_key; other vault reads relay list | FORBIDDEN or FEDERATION_PEER_NOT_ALLOWED or NOT_FOUND; operator change logged |
| TEST-PS-091-09.T10 | integration | PS-091-06.R01, PS-091-06.R03 | replay propose and accept with same Idempotency-Key; identity fetch ok but delivery fails | original responses replayed; Peer remains proposed |
| TEST-PS-091-09.T11 | chaos | PS-091-06.R02, PS-091-06.R03 | kill process between quota counter update and record acceptance; peer store unavailable | counter and acceptance commit together; DEPENDENCY_UNAVAILABLE fail closed |
| TEST-PS-091-09.T12 | abuse | PS-091-07.R01, PS-091-07.R02 | inspect peer rows, logs and relay chooser UI | no user data in peer rows; chooser states IP and did:key visibility |
| TEST-PS-091-09.T13 | abuse | PS-091-07.R03, PS-091-07.R01 | 11 proposals in an hour; quota breach 10 times | rate limit on the 11th; health reduced by 2 per 10 breaches |
| TEST-PS-091-09.T14 | load | PS-091-08.R01, PS-091-08.R02, PS-091-08.R03 | 500 health events per second and 10 000 resolve_key calls | resolve_key p95 ≤ 2 ms, gauges exported |
| TEST-PS-091-09.T15 | a11y | PS-091-01.R03, PS-091-03.R02 | operate relay chooser by keyboard and screen reader | fingerprint read in groups, targets ≥ 44 px, status announced |
| TEST-PS-091-09.T16 | unit | PS-091-09.R01, PS-091-09.R02 | traceability tool run and flag-off scenario | every PS-091 requirement maps to a passing test; flag off freezes health and keeps selected relays working |
| TEST-PS-091-09.T17 | integration | PS-091-10.R01, PS-091-10.R02, PS-091-10.R03 | export peers, import into fresh relay, restore backup | peers import as proposed or suspended and require re-confirmation; no active peer is created by import |

## Acceptance criteria

- All tests T01–T17 pass in CI.
- No peer becomes active without both sides' signed opt-in and a recorded fingerprint confirmation.
- SSRF and key substitution tests pass.

## Dependencies

Module depends on: F11.S01.M03, F15.S04.M02, F07.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
