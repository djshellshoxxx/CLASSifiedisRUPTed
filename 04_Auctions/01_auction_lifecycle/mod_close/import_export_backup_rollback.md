# PS-034-10 — Import, export, backup and rollback: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-10.R01** The participant's vault export contains results, signed statements and Deal references so the outcome can be reconstructed without the host.
- **PS-034-10.R02** Import verifies the host signature and ledger head; unverifiable results are kept as read-only history with a warning.
- **PS-034-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section auctions.results in classrup-export/v1; one line per AuctionResult with the signed result, report, offer and response envelopes.
- **import:** Terminal results import as history; awaiting_payment results import as is and resume timers from the stored closedAtHost; second_chance_offered offers whose expiry has passed import as failed.
- **backup:** The vault export is the primary backup (IOX-6); the host uses relay SQLite backup (IOX-3, IOX-7) and after restore re-checks the one-result-per-auction constraint.
- **migration rollback:** Additive optional fields only in v1; the signed result payload is frozen per version so rollback never invalidates signatures.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T15 | integration | PS-034-10.R01, PS-034-10.R02, PS-034-10.R03 | export, import into fresh vault, restore host backup | results and statements round-trip; host restore keeps unique result per auction |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
