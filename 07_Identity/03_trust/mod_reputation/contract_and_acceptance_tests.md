# PS-058-09 — Contract and acceptance tests: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-09.R01** Every requirement is covered by at least one automated test with fixed key pairs and an injected clock.
- **PS-058-09.R02** Golden vectors pin the dampening formula and Bayesian average.
- **PS-058-09.R03** Privacy and abuse tests simulate sybil rings and fabricated completions.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P, counterparties Q and R, cycle of four DIDs A,B,C,D with legs A to B, B to C, C to D, D to A, signed completion statements, sybil ring of 5 new DIDs, golden review set of 100 reviews with known weights, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T01 | integration | PS-058-01.R02, PS-058-04.R03 | completion events for a deal, cycle, booking and rental | one ReviewWindow per context with the documented pairs and closesAt = opensAt plus 30 days |
| TEST-PS-058-09.T02 | unit | PS-058-01.R01, PS-058-02.R01, PS-058-02.R02 | post a valid review | statement signed, stored posted, immutable fields unchanged, cid computed |
| TEST-PS-058-09.T03 | unit | PS-058-02.R02, PS-058-02.R03 | bad signature, proof with one signature, non-adjacent cycle pair, duplicate, 40 days late, rating 6 | the documented error or quarantine reason each time |
| TEST-PS-058-09.T04 | property | PS-058-03.R01, PS-058-03.R02, PS-058-03.R03 | random sequences of receive, hide, unhide, withdraw, window expiry | only declared transitions succeed; withdrawn is final; quarantined can re-verify |
| TEST-PS-058-09.T05 | unit | PS-058-01.R03, PS-058-09.R02 | golden review set | reviewCount raw, effectiveWeight and bayesianAvg equal golden values within 1e-9; recompute twice gives identical results |
| TEST-PS-058-09.T06 | abuse | PS-058-07.R01, PS-058-07.R02 | ring of 5 new DIDs posting 30 five-star reviews about one subject | effective weight is under 15 percent of raw, dampeningNotice is island or many_new_authors, raw count still displayed |
| TEST-PS-058-09.T07 | abuse | PS-058-07.R03, PS-058-02.R03 | collusion pair posts 6 reviews on fabricated completions | repeat and reciprocity weights reduce them; all but the first per context refused as duplicates |
| TEST-PS-058-09.T08 | contract | PS-058-04.R01, PS-058-04.R02, PS-058-09.R03 | commands, queries, events run | outputs, statements and payloads validate against registry schemas; tombstone verifies |
| TEST-PS-058-09.T09 | abuse | PS-058-05.R01, PS-058-05.R02, PS-058-05.R03 | locked vault posts; non-author withdraws; relay edits a stored review | FORBIDDEN; NOT_FOUND or FORBIDDEN; edit breaks the signature and is rejected |
| TEST-PS-058-09.T10 | chaos | PS-058-06.R01, PS-058-06.R02, PS-058-06.R03 | duplicate delivery, crash during recompute, offline post then reconnect | one review, summary rebuilt, outbox states honest |
| TEST-PS-058-09.T11 | abuse | PS-058-07.R01, PS-058-07.R02, PS-058-07.R03 | 31 reviews in 24 hours by one author; 201 received per hour from one source | RATE_LIMITED for the 31st and excess quarantined; no subject-only review readable without the key |
| TEST-PS-058-09.T12 | load | PS-058-08.R01, PS-058-08.R02, PS-058-08.R03 | verify 1 000 reviews and recompute a 500 review subject on emulated Moto G | verify p95 <= 15 ms, recompute p95 <= 20 ms |
| TEST-PS-058-09.T13 | a11y | PS-058-01.R01, PS-058-04.R01 | review sheet and reputation card with axe-core and keyboard only | zero serious or critical issues; star group labelled; notices announced |
| TEST-PS-058-09.T14 | unit | PS-058-09.R01 | traceability run over PS-058 | every requirement maps to a passing test |
| TEST-PS-058-09.T15 | integration | PS-058-10.R01, PS-058-10.R02, PS-058-10.R03 | export, import to a fresh vault, tombstone after import | reviews re-verified and round-trip; summary rebuilt; withdrawn review removed from the summary |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Golden dampening vectors are stable and a sybil ring cannot raise the effective weight of its reviews above 15 percent of raw in the ring test.
- The UI always shows raw counts, source count and the dampening notice, and never claims verified identity of persons.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
