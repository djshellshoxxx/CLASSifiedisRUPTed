# PS-006-09 — Contract and acceptance tests: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-09.R01** Every requirement is covered by at least one automated test.
- **PS-006-09.R02** Contract tests validate the command, event and Money format against the registry.
- **PS-006-09.R03** Honesty tests assert that no checkout or payment-held wording or field exists.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with draft sell listing L and published sell listing P (EUR 50.00); currency registry with EUR, JPY, USD, BTC, ETH, USDC; clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T01 | unit | PS-006-01.R01, PS-006-02.R01, PS-006-02.R02 | define valid terms; send amount 49.99 as float; unknown currency | stored with integer string; float and unknown currency rejected with documented codes |
| TEST-PS-006-09.T02 | unit | PS-006-02.R03 | violate each rule V01-V11 | documented error code returned and nothing stored |
| TEST-PS-006-09.T03 | property | PS-006-03.R01, PS-006-03.R02, PS-006-03.R03 | random define sequences across listing statuses | revision increments by 1 per accepted change; closed or archived listing refuses changes |
| TEST-PS-006-09.T04 | contract | PS-006-04.R01, PS-006-04.R03, PS-006-09.R02 | define and get run | outputs and bazaar.sell_terms.set payload validate; minOffer absent from event |
| TEST-PS-006-09.T05 | integration | PS-006-04.R02, PS-006-06.R03 | define on published P with price change | event emitted once; revision recorded as material; draft L emits no event |
| TEST-PS-006-09.T06 | abuse | PS-006-05.R01, PS-006-05.R02, PS-006-05.R03 | other principal calls define; internal caller reads minOffer | FORBIDDEN or NOT_FOUND; offers module allowed on owner's behalf |
| TEST-PS-006-09.T07 | integration | PS-006-06.R01, PS-006-06.R02 | replay define; stale expectedRevision | original result; CONFLICT_REVISION with currentRevision |
| TEST-PS-006-09.T08 | chaos | PS-006-06.R03 | revision record fails inside define | terms write rolled back |
| TEST-PS-006-09.T09 | integration | PS-006-06.R03 | edit offline then send projection | state unsent, then prepared, then transport_acknowledged only after the verified relay receipt, never peer_accepted |
| TEST-PS-006-09.T10 | abuse | PS-006-01.R02, PS-006-01.R03, PS-006-07.R01, PS-006-07.R02 | scan projection, events and logs; note with IBAN; schema search for payment instruction fields | no minOffer or drafts leave device; projected subset only after publish; note rejected; no payment instruction field exists |
| TEST-PS-006-09.T11 | abuse | PS-006-02.R03 | 11 price changes within 24 h | 11th returns RATE_LIMITED with retryAfterMs |
| TEST-PS-006-09.T12 | load | PS-006-08.R01, PS-006-08.R02, PS-006-08.R03 | 1 000 define calls on Moto G profile | p95 <= 60 ms, counters present, no network |
| TEST-PS-006-09.T13 | unit | PS-006-09.R01, PS-006-09.R03 | traceability tool and wording test | every PS-006 requirement maps to a passing test; no UI string implies platform-held funds |
| TEST-PS-006-09.T14 | integration | PS-006-10.R01, PS-006-10.R02, PS-006-10.R03 | export, import to fresh vault, import terms for listing of another owner | round-trip identical; foreign terms rejected |
| TEST-PS-006-09.T15 | integration | PS-006-07.R03 | delete listing P and advance the clock 29, 30 and 181 days | terms present on day 29, purged on day 30, tombstone present until day 180 and gone on day 181 |
| TEST-PS-006-09.T16 | property | PS-006-02.R04 | for every registry currency, amounts at maxAmount(currency) and maxAmount(currency) + 1, including ETH 0.5 and JPY 10^10 | at the cap accepted, above refused with VALIDATION_FAILED; the same helper result is used by WantSpec, Variant and Offer validation |
| TEST-PS-006-09.T17 | contract | PS-006-01.R04 | define with barterAcceptable true on published P | bazaar.sell_terms.set carries barterAcceptable true and the projection preview of F01.S01.M03 exposes it; minOffer still absent |
| TEST-PS-006-09.T18 | integration | PS-006-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.sell_terms present with field classes, minOffer marked P3; deletion plan purges own terms |

## Acceptance criteria

- All tests T01-T18 pass in CI.
- No money is ever represented as a floating-point number, every currency has a cap derived from its decimals, and minOffer never appears outside the owner's vault.
- No screen or string suggests the platform holds, escrows or processes payment.

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
