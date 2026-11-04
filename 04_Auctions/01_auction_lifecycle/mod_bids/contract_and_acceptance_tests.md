# PS-033-09 — Contract and acceptance tests: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-033-09.R02** The proxy algorithm is covered by property tests on random bid sequences with a reference model, and the ledger by replay tests.
- **PS-033-09.R03** Concurrency is covered by deterministic tests with an injected clock and lease, including expiry and fencing.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H with injectable clock and default-v1 increments; auction A (EUR, start 10.00, reserve 50.00, ends 2026-11-12T10:00:00Z); bidders B1, B2, B3 and seller S with separate keys; fixed clock 2026-11-05T12:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T01 | unit | PS-033-01.R01, PS-033-01.R03, PS-033-02.R01, PS-033-02.R03 | place valid bid and read ledger entry | seq 1, hash chain starts with genesis, amount immutable, receipt signature verifies |
| TEST-PS-033-09.T02 | unit | PS-033-02.R02, PS-033-02.R03 | each rule V01–V09 violated in turn | documented code returned, no ledger entry, no maximum echoed |
| TEST-PS-033-09.T03 | property | PS-033-03.R02 | random bid and retraction sequences compared with the reference proxy model | price, leader and aliases equal the model; replaying the ledger reproduces the same result |
| TEST-PS-033-09.T04 | unit | PS-033-03.R03 | leader with max 100 retracts, second bidder has max 60, third max 40 | second becomes winning at 40 plus increment capped at 60; hashes stay chained |
| TEST-PS-033-09.T05 | property | PS-033-03.R01 | random command sequences on one bid | only declared transitions succeed; terminal states never change |
| TEST-PS-033-09.T06 | integration | PS-033-06.R02, PS-033-04.R02 | 20 bids submitted concurrently from 20 vaults to one auction | seq 1..20 without gaps or duplicates, one winning, lease wait metric recorded |
| TEST-PS-033-09.T07 | chaos | PS-033-06.R02, PS-033-06.R03, PS-033-09.R03 | lease expires mid-transaction; process killed before reply | stale fence refused; no half-written entry; receipt fetch by bid cid succeeds |
| TEST-PS-033-09.T08 | contract | PS-033-04.R01, PS-033-04.R03, PS-033-09.R02 | submit, place, retract and queries | statements, events and projections validate against registry schemas; projection has no key and no maximum |
| TEST-PS-033-09.T09 | integration | PS-033-04.R03, PS-033-06.R01 | replay same bid body and replay same nonce with different body | original receipt; IDEMPOTENCY_KEY_REUSED |
| TEST-PS-033-09.T10 | abuse | PS-033-05.R01, PS-033-05.R02, PS-033-05.R03 | bid signed by another key; bid without host acceptance; public query | VALIDATION_FAILED or AUCTIONS_HOST_NOT_ACCEPTED; public data contains aliases only |
| TEST-PS-033-09.T11 | abuse | PS-033-07.R01, PS-033-07.R02, PS-033-07.R03 | 11 bids in a minute; probing pattern of 5 minimum raises against one leader; seller bids | 11th AUCTIONS_BID_LIMIT; probing passed to scoring; seller AUCTIONS_BIDDER_NOT_ELIGIBLE with no detail |
| TEST-PS-033-09.T12 | integration | PS-033-01.R02, PS-033-07.R01 | inspect events, logs, errors, exports of other users | no maximum and no bidder key anywhere outside bidder vault and host |
| TEST-PS-033-09.T13 | load | PS-033-08.R01, PS-033-08.R02, PS-033-08.R03 | 500 auctions at 50 bids per second and one hot auction at 20 per second for 5 minutes | p95 ≤ 150 ms, hot p99 ≤ 400 ms, ledger verify 5 000 entries ≤ 500 ms |
| TEST-PS-033-09.T14 | unit | PS-033-09.R01 | traceability tool run | every PS-033 requirement maps to a passing test |
| TEST-PS-033-09.T15 | integration | PS-033-10.R01, PS-033-10.R02, PS-033-10.R03 | export bidder vault, import into fresh vault, verify ledger against held receipts | receipts round-trip; verify_ledger ok; tampered receipt detected at its seq |
| TEST-PS-033-09.T16 | e2e | PS-033-01.R02 | mobile bidder accepts host, bids with max, is outbid by proxy, retracts a leading bid on another auction | UI statuses correct; axe zero serious issues; offline shows bidding disabled |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- The proxy algorithm matches the reference model on 100 000 random sequences and ledger replay reproduces every price.
- No proxy maximum or bidder key is visible to any party other than the bidder and the host.

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
