# PS-086-09 — Contract and acceptance tests: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-086-09.R02** A two-vault and two-relay harness reproduces fork, prev mismatch and commitment conflicts.
- **PS-086-09.R03** Contract tests validate commands, events and ConflictRecord against the registry schemas.

## Specification

See the module test table below (all processes).

**Fixtures:** Author X with chain seq 1..6 on (k1, pub); two seq-7 envelopes E7a (received from relay R listed in X's portable document) and E7b (from unlisted relay U); two consents C1 and C2 by signer S on proposal digest D with required signers S and T; reservations, deal and move pairs for every registry predicate; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T01 | unit | PS-086-01.R01, PS-086-01.R03, PS-086-02.R02 | detect with E7a and E7b | one open ConflictRecord with 2 candidates, claimed and receipt times stored separately |
| TEST-PS-086-09.T02 | unit | PS-086-02.R01, PS-086-02.R03 | detect with an unsigned or role-less candidate; with 1 candidate | FED_SIGNATURE_INVALID or VALIDATION_FAILED; nothing opened |
| TEST-PS-086-09.T03 | property | PS-086-03.R01, PS-086-03.R03 | random command sequences on one conflict | only declared transitions succeed; terminal states never change; candidates never altered |
| TEST-PS-086-09.T04 | integration | PS-086-03.R02, PS-086-04.R03 | public conflict untouched for 7 days with E7a from listed relay R and E7b from unlisted U; second case with neither from a listed relay | auto_resolved origin_wins keeps E7a; second case resolves drop_all; events emitted |
| TEST-PS-086-09.T05 | integration | PS-086-03.R02, PS-086-02.R04 | commitment conflict C1 vs C2 for 30 days, then resolve keep C1 | still open after 30 days; freezeScope contains the proposal; keep returns FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE |
| TEST-PS-086-09.T06 | integration | PS-086-03.R03, PS-086-04.R01 | author publishes E8 with ext.supersedes naming both cids | conflict superseded with supersededByCid; resolved event emitted |
| TEST-PS-086-09.T07 | contract | PS-086-04.R01, PS-086-04.R02, PS-086-09.R02 | detect, resolve and is_frozen | outputs and events validate against registry schemas; resolved carries candidateCids, statementClass and freezeScope |
| TEST-PS-086-09.T08 | integration | PS-086-04.R03 | account moved event and a new portable document for the author while a public conflict is open | listed relays recomputed before the 7-day decision |
| TEST-PS-086-09.T09 | abuse | PS-086-05.R01, PS-086-05.R02, PS-086-05.R03 | non-operator resolves on relay; external request calls detect; third party reads conflict | FORBIDDEN or NOT_FOUND; operator resolution logged with decidedBy |
| TEST-PS-086-09.T10 | abuse | PS-086-07.R03, PS-086-01.R04 | attacker signs a statement as a non-participant for a victim's proposal | quarantined by F11.S01.M02 V14, no conflict opened, trade not frozen |
| TEST-PS-086-09.T11 | integration | PS-086-06.R01, PS-086-06.R02, PS-086-02.R02 | replay detect with same candidates; two concurrent resolves | same conflictId; one success and one CONFLICT_REVISION |
| TEST-PS-086-09.T12 | chaos | PS-086-06.R03, PS-086-04.R04 | kill process between conflict write and event; consumer unavailable for 90 s; domain module tries to act during that window | freeze and candidate quarantine committed with the detection; the domain action is refused through is_frozen; event delivered after restart; UI warning shown above 60 s lag |
| TEST-PS-086-09.T13 | integration | PS-086-07.R02, PS-086-02.R05 | relay harness: operator calls resolve on a public conflict and on a commitment conflict id injected into the relay store; inspect relay storage | first succeeds with audit; second FORBIDDEN; relay holds no commitment record and no plaintext |
| TEST-PS-086-09.T14 | load | PS-086-08.R01, PS-086-08.R02 | 1000 conflicts detected and resolved in a minute | p95 ≤ 300 ms and gauges exported |
| TEST-PS-086-09.T15 | e2e | PS-086-01.R02, PS-086-03.R02 | two vaults receive conflicting acceptances; user opens review screen | trade paused banner visible, labels claim vs evidence, only the owner sees the record, axe zero serious issues |
| TEST-PS-086-09.T16 | unit | PS-086-09.R01, PS-086-09.R03 | traceability tool run | every PS-086 requirement maps to a passing test |
| TEST-PS-086-09.T17 | integration | PS-086-10.R01, PS-086-10.R02, PS-086-10.R03 | export, import to fresh vault and relay restore | conflicts round trip with open ones still freezing; imported candidates re-verified |
| TEST-PS-086-09.T18 | unit | PS-086-02.R04 | commitment conflict on D: supersede with a renegotiated statement signed only by S; then signed by S and T; separately drop_all | first FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE; second superseded; drop_all resolved and the freeze released locally only |
| TEST-PS-086-09.T19 | unit | PS-086-01.R04, PS-086-04.R04 | each registry predicate: consents on one subject with different digests, overlapping reservations to different holders, two deal obligation digests, two moves with different toRelay, plus non-conflicting pairs | detect is called exactly for the conflicting pairs and freezeScope names the subject |
| TEST-PS-086-09.T20 | integration | PS-086-03.R04 | a domain module calls is_frozen while the conflict store is unavailable | DEPENDENCY_UNAVAILABLE and the domain action is refused (fail closed) |
| TEST-PS-086-09.T21 | integration | PS-086-08.R03 | relay with one public conflict open 8 days and 1 minute, then 51 open conflicts | both alerts fire |
| TEST-PS-086-09.T22 | abuse | PS-086-07.R05 | malicious author forks 21 times, each fork delivered through two honest relays | the 21st returns FEDERATION_CONFLICT_AUTHOR_LIMIT and quarantines the author's later envelopes; detected events carry no peer blame and no peer health changes |
| TEST-PS-086-09.T23 | unit | PS-086-07.R04, PS-086-07.R01, PS-086-04.R03 | export, deletion and retention ports called by F10 (plan, execute in step order, pseudonymize with a given pseudonym, twice); privacy.deletion.completed delivered alone; log capture for a commitment conflict | sections and plans returned; the pseudonymize step replaces the author DID in retained records with exactly that pseudonym and a second run changes nothing; the purge step deletes the principal's open commitment records; privacy.deletion.completed changes no record; logs hold IDs only |
| TEST-PS-086-09.T24 | integration | PS-086-01.R05, PS-086-02.R02 | F11.S01.M02 re-marks a consent signed during a claimed compromise and calls detect kind key_compromise with that one envelope; detect key_compromise with 2 envelopes; resolve keep; resolve with a consent re-signed by every required signer with current keys | record open with 1 candidate and freezeScope naming the proposal, is_frozen true; 2 envelopes VALIDATION_FAILED; keep FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE; the re-signed consent supersedes it |

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No commitment (consent, money, inventory, identity) conflict is ever resolved by keep, last-writer-wins, timeout or a unilateral supersede.
- Forged role-less statements cannot freeze a trade, and is_frozen fails closed (abuse and integration tests).

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
