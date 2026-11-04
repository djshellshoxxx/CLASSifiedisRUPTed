# PS-037-06 — Failure recovery and idempotency: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-06.R01** Review commands are idempotent per review and expectedRevision; a repeated confirm returns the stored void statement.
- **PS-037-06.R02** Confirm, the void statement, the event, and the call that moves the result to voided commit in one host transaction; a failure leaves the review in void_proposed.
- **PS-037-06.R03** Delivery of the void statement to participants is at least once through mailboxes and idempotent by cid in vaults.

## Specification

- **idempotency:** Unique open review per auction and trigger kind; command ids stored 24 h on the host; confirm repeated with the same expectedRevision returns the same voidCid; vault dedup by void cid.
- **concurrency:** expectedRevision on every command; confirm runs under the auction lease (IDM-8) so no payment or second-chance event interleaves; two moderators confirming at once are serialized and the second gets CONFLICT_REVISION.
- **retries:** Void delivery retries 1 s, 2 s, 4 s, 8 s up to 8 attempts then hourly for 30 days; host triggers are consumed with EVT-6 retries.
- **offline:** Moderator commands need the host and are not queued; participant vaults show the last known state and the void arrives when the vault next connects.
- **partial failure:** If F04.S01.M03 refuses the void because a payment was acknowledged meanwhile, the confirm fails with AUCTIONS_RESULT_NOT_VOIDABLE and the review returns to in_review with a note; no partial void exists.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T04 | integration | PS-037-03.R03, PS-037-04.R02, PS-037-06.R02 | confirm void while a payment is acknowledged concurrently | one wins by lease order; void refused AUCTIONS_RESULT_NOT_VOIDABLE if payment first; no partial void |
| TEST-PS-037-09.T07 | integration | PS-037-04.R02, PS-037-06.R01 | open auction cancel_auction then dismiss | auction cancelled with host_policy, bids void, review closed once |
| TEST-PS-037-09.T09 | integration | PS-037-06.R03, PS-037-09.R03 | void delivery dropped, duplicated and reordered by hostile relay | vaults converge on voided; duplicates skipped; second-chance offer withdrawn |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
