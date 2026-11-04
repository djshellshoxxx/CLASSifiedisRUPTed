# PS-034-09 — Contract and acceptance tests: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-034-09.R02** Close concurrency is covered by deterministic tests with injectable clock and lease, including extension races, double workers and lease expiry.
- **PS-034-09.R03** Contract tests validate result, report, offer and response statements and the Deal context against schema registries.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H with injectable clock; auction A (EUR, reserve 50.00) with bidders B1 (max 80.00), B2 (max 60.00), B3 (max 55.00); seller S; vaults for S, B1, B2; fixed clock 2026-11-12T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T01 | unit | PS-034-01.R01, PS-034-01.R03, PS-034-02.R01 | close with leader max above reserve but price below it | sale at the reserve price; reserveCheck met; ledger head matches |
| TEST-PS-034-09.T02 | unit | PS-034-02.R02, PS-034-02.R03 | each rule V01–V07 violated | documented code returned and nothing stored |
| TEST-PS-034-09.T03 | property | PS-034-03.R01 | random timer and command sequences | only declared transitions succeed; terminal states never change |
| TEST-PS-034-09.T04 | integration | PS-034-03.R02, PS-034-04.R03 | Deal opened, payment claimed only, then acknowledged | state stays awaiting_payment on claim; completed only on commerce.deal.completed |
| TEST-PS-034-09.T05 | chaos | PS-034-06.R01, PS-034-06.R02, PS-034-09.R03 | two workers close the same auction; extension lands before lease; lease expires mid-close | exactly one result; no close on extension; stale fence refused |
| TEST-PS-034-09.T06 | integration | PS-034-01.R02, PS-034-06.R03 | result delivered twice and late; winner offline for 2 days | one Deal per vault; UI shows result pending until signed statement verified |
| TEST-PS-034-09.T07 | contract | PS-034-04.R01, PS-034-04.R02, PS-034-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas; public projection has no winner key |
| TEST-PS-034-09.T08 | integration | PS-034-03.R03, PS-034-04.R03 | non-payment on day 3 and day 10; second chance accepted, declined and expired | states and Deals follow the machine; at most one second chance |
| TEST-PS-034-09.T09 | abuse | PS-034-05.R01, PS-034-05.R02, PS-034-05.R03 | result signed by wrong host key; report by non-seller; response by non-candidate | quarantined or FORBIDDEN; no state change |
| TEST-PS-034-09.T10 | abuse | PS-034-07.R02, PS-034-07.R03 | non-payment report on day 2; report after payment acknowledged | AUCTIONS_NONPAYMENT_NOT_ALLOWED |
| TEST-PS-034-09.T11 | integration | PS-034-07.R01, PS-034-07.R02 | inspect public projection, bidder views, logs | winner key only in seller and winner envelopes; logs have no keys or prices |
| TEST-PS-034-09.T12 | integration | PS-034-03.R01, PS-034-04.R03 | voided event after Deal opened without acknowledged payment, and after acknowledged payment | Deal closed through port; second case refused as not voidable and flagged |
| TEST-PS-034-09.T13 | load | PS-034-08.R01, PS-034-08.R02, PS-034-08.R03 | 1 000 auctions end in the same minute; 5 000 entry ledger verify | close lag p95 ≤ 2 s, p99 ≤ 5 s; verify ≤ 300 ms |
| TEST-PS-034-09.T14 | unit | PS-034-09.R01 | traceability tool run | every PS-034 requirement maps to a passing test |
| TEST-PS-034-09.T15 | integration | PS-034-10.R01, PS-034-10.R02, PS-034-10.R03 | export, import into fresh vault, restore host backup | results and statements round-trip; host restore keeps unique result per auction |
| TEST-PS-034-09.T16 | e2e | PS-034-01.R02, PS-034-02.R01 | mobile seller and winner in two browsers after close | both show sold with Deal link; non-winner sees alias only; axe zero serious issues |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- Exactly one result exists per auction under any worker race and no late bid can win.
- A winner is never shown as having won, and a sale never as completed, before the host-signed result and the acknowledged or final payment are held.

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
