# PS-034-02 — Validation rules: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-02.R01** Close preconditions are checked under the lease - auction is open, host time is at or after currentEndsAt, lease token is current.
- **PS-034-02.R02** Inbound results, reports and offers are validated for signature, signer role and referenced ids before any local state changes.
- **PS-034-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | auction status is open and host time is at or after currentEndsAt read under the lease | AUCTIONS_NOT_CLOSABLE |
| V02 | close lease token equals the current fencing token | PRECONDITION_FAILED |
| V03 | result statement signature verifies against the host key in the auction terms | AUCTIONS_RESULT_INVALID |
| V04 | non-payment report comes from the seller after at least 3 days and before day 30, while state is awaiting_payment | AUCTIONS_NONPAYMENT_NOT_ALLOWED |
| V05 | second-chance candidate is the highest remaining non-retracted bidder with a last visible bid at or above the reserve, not blocked by the seller, and no earlier second chance exists | AUCTIONS_SECOND_CHANCE_NOT_ALLOWED |
| V06 | second-chance response arrives within 48 hours plus 5 minutes by the seller clock | EXPIRED |
| V07 | the signer of a second-chance response is the nominated candidate key | AUCTIONS_RESULT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T01 | unit | PS-034-01.R01, PS-034-01.R03, PS-034-02.R01 | close with leader max above reserve but price below it | sale at the reserve price; reserveCheck met; ledger head matches |
| TEST-PS-034-09.T02 | unit | PS-034-02.R02, PS-034-02.R03 | each rule V01–V07 violated | documented code returned and nothing stored |
| TEST-PS-034-09.T16 | e2e | PS-034-01.R02, PS-034-02.R01 | mobile seller and winner in two browsers after close | both show sold with Deal link; non-winner sees alias only; axe zero serious issues |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
