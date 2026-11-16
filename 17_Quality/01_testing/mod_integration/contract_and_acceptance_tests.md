# PS-135-09 — Contract and acceptance tests: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-135-09.R02** Each of the 12 flows has at least one dedicated test row and the flow list is asserted against the reference list in this spec.
- **PS-135-09.R03** Contract tests are generated from the schema registry so a new registered command or event is covered automatically.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults for Alice, Bob, Carol, Dave, Erin (one memory vault each, seeded Ed25519 keys), optional in-process relay, DirectTransport, FakeClock 2026-11-04T10:00:00Z, FakeChainVerifierPort script (confirm at 12 blocks, reorg depth 2), EUR and BTC test amounts.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T01 | integration | PS-135-01.R01, PS-135-03.R03 | boot harness and tear down 20 times | each database is isolated and removed; outbox drained assertion runs |
| TEST-PS-135-09.T02 | integration | PS-135-01.R02, PS-135-01.R03, PS-135-07.R01 | run flows and inspect reports | no row writes by fixtures in flow files; report holds only step names, types, IDs |
| TEST-PS-135-09.T03 | integration | PS-135-02.R01, PS-135-04.R02 | list flows from the harness | exactly the 12 documented flow names exist and each asserts state, ordered events and no unexpected events |
| TEST-PS-135-09.T04 | integration | PS-135-02.R02, PS-135-07.R03 | flow attempts fetch to a public URL and Date.now | QUALITY_IT_ISOLATION raised, exit 3 |
| TEST-PS-135-09.T05 | contract | PS-135-02.R03, PS-135-09.R03 | validate every registered command, event and error | all validate; a mutated schema produces QUALITY_IT_CONTRACT_MISMATCH |
| TEST-PS-135-09.T06 | integration | PS-135-03.R01, PS-135-03.R02, PS-135-04.R01 | run barter_two, cycle_three, cycle_four, cycle_n, barter_mixed to completion and to expiry | terminal states reached or expired exactly once |
| TEST-PS-135-09.T07 | integration | PS-135-04.R03, PS-135-06.R03 | run with scripted consumer crash and redelivery | single net effect and outbox drained |
| TEST-PS-135-09.T08 | integration | PS-135-05.R01, PS-135-05.R02 | each flow performs a wrong-actor step | FORBIDDEN or NOT_FOUND per ERR-4 |
| TEST-PS-135-09.T09 | abuse | PS-135-05.R03, PS-135-07.R02 | import fake port from production code and scan logs for P3 canary | import rejected; canary absent from logs, exports and P0 payloads |
| TEST-PS-135-09.T10 | integration | PS-135-06.R01 | replay first mutating command in each flow | identical response and zero new events |
| TEST-PS-135-09.T11 | integration | PS-135-06.R02 | two concurrent offer acceptances with the deterministic scheduler | same interleaving every run; exactly one accepted |
| TEST-PS-135-09.T12 | integration | PS-135-08.R01, PS-135-08.R02 | run full suite with timing report | each flow at most 5 s, whole suite at most 120 s, report lists durations |
| TEST-PS-135-09.T13 | integration | PS-135-08.R03 | boot relay harness 50 times | startup at most 2 s each |
| TEST-PS-135-09.T14 | integration | PS-135-09.R01, PS-135-09.R02 | assert the flow list equals the reference list and every spec requirement maps to a test | no missing flow or uncovered requirement |
| TEST-PS-135-09.T15 | integration | PS-135-10.R01, PS-135-10.R02 | federation_io: export from relay A, import to relay B | entities round trip identical; conflicting IDs rejected; report contains no user data |
| TEST-PS-135-09.T16 | integration | PS-135-10.R03 | revert harness commit in a branch | production tests unaffected |
| TEST-PS-135-09.T17 | integration | PS-135-03.R03 | payments_claims: cash claim then crypto claim with reorg depth 2 via FakeChainVerifierPort | crypto claim returns to pending after reorg and completes after reconfirmation; platform never holds funds |
| TEST-PS-135-09.T18 | integration | PS-135-02.R01 | fraud_moderation and messages_private flows | moderation action recorded with audit entry; message payloads absent from public views |
| TEST-PS-135-09.T19 | integration | PS-135-02.R04, PS-135-06.R04 | run all flows with --mode relay and --mode direct | same final vault state in both modes except declared relay-only flows; QUALITY_IT_MODE_DIVERGENCE otherwise |
| TEST-PS-135-09.T20 | integration | PS-135-02.R04 | relay_down_midflow: stop relay between prepared and transport_acknowledged | local records intact; status prepared; completes via direct exchange |
| TEST-PS-135-09.T21 | integration | PS-135-02.R04 | forked_vault: two signed conflicting reservations delivered in both orders | fork detected and coordination frozen in both vaults; no last-writer-wins |
| TEST-PS-135-09.T22 | integration | PS-135-02.R04 | revocation_lag: statement signed by a revoked key before and after the revocation arrives | accepted before, quarantined after; lag window reported |
| TEST-PS-135-09.T23 | abuse | PS-135-02.R04 | relay_tamper: relay flips one byte of an envelope | signature_invalid, statement quarantined with provenance, no state change |

## Acceptance criteria

- All 12 reference flows pass with outbox drained and zero unexpected events.
- Contract tests validate every registered command, event and error against the schema registry.
- The crypto claim flow demonstrates a simulated reorg returning the claim to pending.
- The full integration suite finishes within 120 s on 2 vCPU.

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
