# PS-035-09 — Contract and acceptance tests: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-035-09.R02** Contract tests validate terms, host acceptance, events and the public projection against the schema registry, including that the reserve never appears.
- **PS-035-09.R03** Two-party integration tests run a seller vault and an in-memory host relay with an injectable clock.

## Specification

See the module test table below (all processes).

**Fixtures:** Seller vault S, host relay H with injectable clock, bidder vault B, auction listing L (EUR), default increment table default-v1; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T01 | unit | PS-035-01.R01, PS-035-01.R03, PS-035-02.R01 | create auctions in EUR, JPY (exponent 0) and BHD (exponent 3) | increments are ceiling-converted to at least 1 minor unit; tiers strictly increasing |
| TEST-PS-035-09.T02 | unit | PS-035-02.R01, PS-035-02.R02, PS-035-02.R03 | each rule V01–V08 violated in turn on vault and on host | documented code returned and nothing stored; reserve never echoed |
| TEST-PS-035-09.T03 | property | PS-035-03.R01 | random command and timer sequences | only declared transitions succeed; closed and cancelled never change |
| TEST-PS-035-09.T04 | integration | PS-035-03.R02, PS-035-02.R02 | schedule with no host, with host refusing, and with host silent for 24 h | AUCTIONS_HOST_REQUIRED; cancelled host_refused; cancelled host_unreachable; never scheduled |
| TEST-PS-035-09.T05 | integration | PS-035-03.R03, PS-035-06.R02 | advance host clock past startsAt; run open twice and adjust_end with stale lease token | opened once; stale token refused |
| TEST-PS-035-09.T06 | contract | PS-035-04.R01, PS-035-04.R02, PS-035-09.R02 | each command, statement, event and public projection | payloads and signatures validate; projection and events contain no reserve value |
| TEST-PS-035-09.T07 | integration | PS-035-04.R03 | listing unpublished with and without bids | scheduled or zero-bid auction cancelled; auction with bids stays open |
| TEST-PS-035-09.T08 | abuse | PS-035-05.R01, PS-035-05.R02, PS-035-05.R03 | non-seller cancels; terms signed by wrong key; non-moderator cancels on host | FORBIDDEN or rejected; no state change |
| TEST-PS-035-09.T09 | integration | PS-035-06.R01, PS-035-06.R03 | replay schedule; crash after signing terms before recording | same termsCid and acceptance; host dedupes |
| TEST-PS-035-09.T10 | integration | PS-035-07.R01, PS-035-07.R02, PS-035-07.R03 | inspect host log, public projection, events, errors, bidder view | reserve absent everywhere except seller view and host; host trust panel shown before first bid |
| TEST-PS-035-09.T11 | abuse | PS-035-07.R03 | seller schedules a 21st live auction on one host | AUCTIONS_SELLER_LIMIT |
| TEST-PS-035-09.T12 | load | PS-035-08.R01, PS-035-08.R02, PS-035-08.R03 | 1 000 due auctions and 20 accept_hosting req/s for 5 minutes | opens within 10 s, p95 ≤ 300 ms, metrics exported |
| TEST-PS-035-09.T13 | unit | PS-035-09.R01 | traceability tool run | every PS-035 requirement maps to a passing test |
| TEST-PS-035-09.T14 | integration | PS-035-10.R01, PS-035-10.R02, PS-035-10.R03 | export, import into fresh vault, restore host from backup | auctions round-trip; reserve stays out of other exports; host restore keeps scheduled auctions |
| TEST-PS-035-09.T15 | e2e | PS-035-01.R02, PS-035-03.R02, PS-035-09.R03 | mobile seller schedules with a host, bidder views host panel and auction page | host named, reserve status shown, no host means feature disabled; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- An auction cannot be scheduled or opened without a verified host countersignature and the UI always names the host.
- The reserve value never appears in any payload visible to bidders, in logs, or in errors.

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
