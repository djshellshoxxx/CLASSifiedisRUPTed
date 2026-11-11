# PS-034-05 — Authorization and capabilities: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-05.R01** Relay policy - only the host's close scheduler holding the close lease may determine a result, and no host operator or moderator can call determine; record_non_payment and nominate act only on a non-payment report signed by the auction's sellerId key.
- **PS-034-05.R02** Vault policy - only the local principal who is the seller reports non-payment and offers second chance; only the nominated candidate key responds; incoming results and disclosures are accepted only when signed by the host key in the auction terms, and other statements only from their registered signer role.
- **PS-034-05.R03** Public result projection exposes no winner key; seller and winner receive it inside the end-to-end encrypted disclosure.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| auctions.result.determine | system | host close scheduler only, holding the close lease with a current fence token; host time at or after currentEndsAt; no operator or moderator grant |
| auctions.result.nominate | system | host only, after record_non_payment stored a report signed by the auction's sellerId key for this result; once per result |
| auctions.result.record_non_payment | system | relay command authorized by a non-payment report signed by the auction's sellerId key |
| auctions.result.receive | principal | any envelope; acceptance depends on the host key from the terms and the registered signer role of each statement type |
| auctions.result.report_non_payment | principal | local principal is the seller of the auction; state awaiting_payment; day 3 to day 30 |
| auctions.result.offer_second_chance | principal | local principal is the seller; state non_payment; host-signed candidate list present; candidate not blocked either way |
| auctions.result.respond_second_chance | principal | local principal key equals the nominated candidate; seller not blocked either way |
| auctions.result.read_public | anonymous, principal | public projection |
| auctions.result.read_own | principal | local principal is seller, winner, candidate or a bidder of the auction |
| auctions.result.freeze | system | relay restore hook only (AuctionHostPort registered with the relay process, called by F15.S03.M03); not routable over HTTP |
| auctions.result.readopt | principal, system | any participant vault returning a result; accepted only when the host's own key in the terms signed it and the auction is frozen on this host (V11) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T09 | abuse | PS-034-05.R01, PS-034-05.R02, PS-034-05.R03 | result signed by wrong host key; report by non-seller; response by non-candidate; host operator calls determine; nominate without a recorded seller-signed report | quarantined or FORBIDDEN; no state change |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
