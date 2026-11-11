# PS-034-02 — Validation rules: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-02.R01** Close preconditions are checked under the lease - auction is open, host time is at or after currentEndsAt, lease token is current.
- **PS-034-02.R02** Inbound results, disclosures, reports, offers and responses are validated for signature, signer role and referenced ids before any local state changes.
- **PS-034-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-034-02.R04** Block checks (F07.S02.M02 isBlockedEither) run in the vaults - on result receipt in the seller and winner vaults and before a second-chance offer or response - because only a vault knows its principal's blocks; the host never filters by blocks.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | auction status is open and host time is at or after currentEndsAt read under the lease | AUCTIONS_NOT_CLOSABLE |
| V02 | close lease token equals the current fencing token | PRECONDITION_FAILED |
| V03 | result, disclosure and candidate statements, and the void and rescission statements ingested by F04.S02.M03, verify against the host key in the auction terms and bind termsCid; a disclosure verifies only when sha256(winnerId‖salt) equals the result's winnerCommitment | AUCTIONS_RESULT_INVALID |
| V04 | non-payment report comes from the seller between day 3 and day 30 after closedAtHost, while state is awaiting_payment and the local Deal has no acknowledged or final PaymentClaim | AUCTIONS_NONPAYMENT_NOT_ALLOWED |
| V05 | host nomination - the result is won and not voided, a seller-signed non-payment report for it was stored by record_non_payment, and no earlier nomination exists; candidates are the top 3 remaining non-retracted bidders other than the winner whose last visible bid is at or above the reserve | AUCTIONS_SECOND_CHANCE_NOT_ALLOWED |
| V06 | second-chance response arrives within 48 hours plus 5 minutes by the seller clock | EXPIRED |
| V07 | signer roles - non-payment report and second-chance offer signed by the seller key in the terms; second-chance response signed by the nominated candidate key | AUCTIONS_RESULT_INVALID |
| V08 | seller vault offer - the candidate is the first entry of the host-signed list that F07.S02.M02 isBlockedEither does not block, no earlier offer exists, and no claim on the original Deal is claimed, acknowledged or final | AUCTIONS_SECOND_CHANCE_NOT_ALLOWED |
| V09 | seller and winner vaults on result receipt - when seller and winner are blocked either way no Deal is opened and the result becomes failed with reason blocked; a candidate vault drops an offer from a seller it blocks | BLOCKED_PARTY |
| V10 | record_non_payment on the host - the report is signed by the auction's sellerId key, names this result cid, and host time is between day 3 and day 30 after closedAtHost | AUCTIONS_NONPAYMENT_NOT_ALLOWED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T02 | unit | PS-034-02.R01, PS-034-02.R02, PS-034-02.R03 | each rule V01–V10 violated | documented code returned and nothing stored |
| TEST-PS-034-09.T19 | integration | PS-034-02.R04, PS-034-07.R04 | seller blocked the first candidate; winner blocked by the seller at result time | candidate list filtered locally and the offer goes to the second; with the winner blocked the result shows, no Deal is opened, state failed with reason blocked, report refused |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
