# PS-033-02 — Validation rules: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-02.R01** Bids are validated by the host in a fixed order - schema, signature, host acceptance, replay nonce, auction state and host time, minimum, eligibility, rate limits - and the first failure decides the error.
- **PS-033-02.R02** The bidder vault performs the same checks it can (schema, host acceptance, minimum from the last known state) before sending, but only the host decision counts.
- **PS-033-02.R03** Every violation maps to one stable error code; eligibility failures never reveal the linkage that caused them.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | bid contains hostAck naming this auction termsCid and the host key | AUCTIONS_HOST_NOT_ACCEPTED |
| V02 | bid signature verifies against bidderId and clientNonce was not seen for this bidder and auction | VALIDATION_FAILED |
| V03 | auction status is open and host time is before currentEndsAt | AUCTIONS_NOT_OPEN |
| V04 | amount is at least startPrice when no bid exists, otherwise currentPrice plus the increment of the tier containing currentPrice | AUCTIONS_BID_TOO_LOW |
| V05 | maxAmount, when present, is at least amount, in the auction currency and within limits | VALIDATION_FAILED |
| V06 | a new maxAmount for a bidder who already has a maximum is not lower than it | AUCTIONS_MAX_DECREASE |
| V07 | F04.S02.M01 check returns allow for the bidder | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V08 | bidder has at most 10 bids per minute and 200 bids on this auction, and the auction has at most 5 000 entries | AUCTIONS_BID_LIMIT |
| V09 | retraction is requested more than 12 hours before currentEndsAt, is the bidder's first retraction on this auction, and targets the bidder's winning bid | AUCTIONS_RETRACT_NOT_ALLOWED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T01 | unit | PS-033-01.R01, PS-033-01.R03, PS-033-02.R01, PS-033-02.R03 | place valid bid and read ledger entry | seq 1, hash chain starts with genesis, amount immutable, receipt signature verifies |
| TEST-PS-033-09.T02 | unit | PS-033-02.R02, PS-033-02.R03 | each rule V01–V09 violated in turn | documented code returned, no ledger entry, no maximum echoed |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
