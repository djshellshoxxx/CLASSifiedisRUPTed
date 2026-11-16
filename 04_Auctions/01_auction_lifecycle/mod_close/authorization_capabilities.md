# PS-034-05 — Authorization and capabilities: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-05.R01** Relay policy - only the host's close scheduler holding the close lease may determine a result; nominate requires a seller-signed non-payment report for that result.
- **PS-034-05.R02** Vault policy - only the local principal who is the seller reports non-payment and offers second chance; only the nominated candidate key responds; incoming results are accepted only when signed by the host key in the auction terms.
- **PS-034-05.R03** Public result projection exposes no winner key; seller and winner receive it inside end-to-end encrypted envelopes.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| auctions.result.determine | system, host-operator | holds the close lease; host time at or after currentEndsAt; or valid seller-signed report for nominate |
| auctions.result.receive | principal | any envelope; acceptance depends on host signature and key from the terms |
| auctions.result.report_non_payment | principal | local principal is the seller of the auction; state awaiting_payment |
| auctions.result.offer_second_chance | principal | local principal is the seller; state non_payment; host-signed candidate present |
| auctions.result.respond_second_chance | principal | local principal key equals the nominated candidate |
| auctions.result.read_public | anonymous, principal | public projection |
| auctions.result.read_own | principal | local principal is seller, winner or a bidder of the auction |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T09 | abuse | PS-034-05.R01, PS-034-05.R02, PS-034-05.R03 | result signed by wrong host key; report by non-seller; response by non-candidate | quarantined or FORBIDDEN; no state change |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
