# PS-039-09 — Contract and acceptance tests: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-039-09.R02** The interval logic is covered by property tests against a brute-force minute-by-minute reference model for quantities 1 to 20.
- **PS-039-09.R03** Cross-vault flows are covered by two-vault tests with a hostile in-memory relay and by a forked-owner-device test.

## Specification

See the module test table below (all processes).

**Fixtures:** Owner vault O and renter vaults R1, R2 with hostile in-memory relay; offering tent (quantity 1, daily EUR 20.00, buffers 120 minutes after, zone Europe/Berlin); fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T01 | unit | PS-039-01.R01, PS-039-01.R03, PS-039-02.R03 | compute rent for 25 h on day unit, 90 min on hour unit, and JPY and BHD currencies | ceiling units, integer minor units, no rounding of minor units |
| TEST-PS-039-09.T02 | unit | PS-039-02.R01, PS-039-02.R03 | each rule V01–V09 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-039-09.T03 | property | PS-039-02.R02, PS-039-01.R02 | random reservations for quantities 1 to 20 against brute-force reference | accept/refuse decisions identical; never more than quantity units at any minute |
| TEST-PS-039-09.T04 | unit | PS-039-02.R02, PS-039-03.R01 | boundary cases - touching intervals with zero buffers, one minute inside the buffer, DST change inside the rental | half-open rule respected; elapsed-time durations; blackout by local date |
| TEST-PS-039-09.T05 | property | PS-039-03.R01 | random command and event sequences | only declared transitions succeed; closed and cancelled never change |
| TEST-PS-039-09.T06 | integration | PS-039-03.R02, PS-039-06.R02 | confirm with Deal creation failing; crash between check and write | reservation stays requested, no signature, no partial state |
| TEST-PS-039-09.T07 | integration | PS-039-03.R03, PS-039-06.R03, PS-039-07.R02 | two owner devices sign overlapping confirmations and then merge | both reservations frozen; renegotiation required; no last-writer-wins |
| TEST-PS-039-09.T08 | integration | PS-039-04.R02, PS-039-06.R01, PS-039-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on confirmed with identical cids; duplicates skipped |
| TEST-PS-039-09.T09 | contract | PS-039-04.R01, PS-039-04.R03, PS-039-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-039-09.T10 | abuse | PS-039-05.R01, PS-039-05.R02, PS-039-05.R03, PS-039-07.R01 | confirmation signed by renter; request signed by third key; relay alters ciphertext | quarantined with RENTALS_STATEMENT_INVALID; no state change; busy summary has no identities |
| TEST-PS-039-09.T11 | integration | PS-039-04.R03, PS-039-03.R01 | handoff, overdue, return and closed events delivered twice and out of order | reservation follows the machine; early return frees tail after buffer; overdue extends blocking |
| TEST-PS-039-09.T12 | abuse | PS-039-07.R03 | 21 inbound requests in a day from one sender; 6th open request by one renter | 21st dropped and counted; 6th RENTALS_REQUEST_LIMIT |
| TEST-PS-039-09.T13 | load | PS-039-08.R01, PS-039-08.R02, PS-039-08.R03 | 5 000 reservations, quantity 20, throttled mobile profile | check p95 ≤ 100 ms, busy summary p95 ≤ 150 ms, no telemetry request |
| TEST-PS-039-09.T14 | unit | PS-039-09.R01 | traceability tool run | every PS-039 requirement maps to a passing test |
| TEST-PS-039-09.T15 | integration | PS-039-10.R01, PS-039-10.R02, PS-039-10.R03 | export, import into fresh vault, restore | records round-trip; in-flight requests re-enter outbox; open requests import as expired |
| TEST-PS-039-09.T16 | e2e | PS-039-01.R01, PS-039-02.R01 | mobile renter requests, owner confirms in second browser | both show confirmed; busy blocks update; axe zero serious issues |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No renter is ever shown a confirmed reservation without the owner's verified signed confirmation held in the vault.
- In the owner vault no instant ever exceeds the offering quantity, verified against the brute-force model.

## Dependencies

Module depends on: F01.S01.M01, F09.S01.M01, F09.S03.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
