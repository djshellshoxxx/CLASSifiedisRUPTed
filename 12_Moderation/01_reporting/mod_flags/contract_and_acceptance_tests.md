# PS-094-09 — Contract and acceptance tests: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-094-09.R02** Contract tests check command input, output, statements and event payloads against the schema registry.
- **PS-094-09.R03** Reporter non-disclosure and statement verification are verified by dedicated abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault of reporter R holding signed listing L (cid sha256-aa…, revision 3) from author S, relay X with moderator M, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T01 | unit | PS-094-01.R01, PS-094-01.R03, PS-094-02.R01 | file a valid scam report in the vault | Report stored with syncState local_committed, snapshot reference set, details unchanged |
| TEST-PS-094-09.T02 | unit | PS-094-02.R02, PS-094-02.R03 | each rule V02–V07 violated in turn | the documented error code is returned and nothing is stored |
| TEST-PS-094-09.T03 | property | PS-094-03.R01, PS-094-03.R02 | random sequences of receipts, outcomes and withdrawals on one report | only declared transitions succeed and sync state never skips a step |
| TEST-PS-094-09.T04 | integration | PS-094-03.R03 | withdraw while linked | withdrawal statement queued, local record kept, relay case continues |
| TEST-PS-094-09.T05 | contract | PS-094-04.R01, PS-094-04.R02, PS-094-09.R02 | each command, statement and query executes | outputs, signed statements and filed event validate against registry schemas |
| TEST-PS-094-09.T06 | integration | PS-094-04.R03 | case.opened then case.closed receipts delivered twice each | report linked then resolved once |
| TEST-PS-094-09.T07 | abuse | PS-094-05.R01, PS-094-05.R03, PS-094-07.R01, PS-094-09.R03 | outcome signed by a different key; non-moderator queries relay reports | outcome quarantined; NOT_FOUND and no reporter key in any response or event to the author |
| TEST-PS-094-09.T08 | abuse | PS-094-05.R02 | unsigned and malformed relay report requests; blocked key | rejected with FORBIDDEN; no case created |
| TEST-PS-094-09.T09 | integration | PS-094-06.R01, PS-094-06.R02, PS-094-06.R03 | duplicate relay delivery with same report id; receipt lost then retried | one case; original signed receipt replayed |
| TEST-PS-094-09.T10 | integration | PS-094-03.R02, PS-094-06.R03 | relay offline for 8 days then back | UI shows not delivered after 7 days; manual resend reaches transport_acknowledged |
| TEST-PS-094-09.T11 | abuse | PS-094-07.R03 | 21 reports by one key in a day; key with five dismissed reports files a 4th | 21st and 4th return RATE_LIMITED; minor_safety exempt |
| TEST-PS-094-09.T12 | unit | PS-094-01.R04, PS-094-04.R01 | subscribe to advisory feed then revoke publisher key | labels applied, then dropped after verified revocation; no local record deleted |
| TEST-PS-094-09.T13 | load | PS-094-08.R01, PS-094-08.R03 | 50 report receives per second for 5 minutes on relay | p95 ≤ 300 ms, intake lag p95 ≤ 5 s, no reporter key in logs |
| TEST-PS-094-09.T14 | unit | PS-094-08.R02, PS-094-09.R01 | vault file with 256 KiB snapshot on Moto G profile; traceability tool run | p95 ≤ 150 ms; every PS-094 requirement maps to a passing test |
| TEST-PS-094-09.T15 | integration | PS-094-07.R01, PS-094-07.R02, PS-094-10.R01, PS-094-10.R02, PS-094-10.R03 | export, restore into fresh vault, import imported open report | own reports round-trip; imported open reports become withdrawn; details stay sealed |
| TEST-PS-094-09.T16 | e2e | PS-094-01.R02, PS-094-04.R01 | mobile reporter files a report offline then reconnects | single report, delivery status progresses honestly, axe zero serious issues |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No response, event, notification or export visible to the reported party contains the reporter key (privacy suite).
- The UI never shows delivered or acknowledged before the matching sync state is reached.

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
