# PS-034-06 — Failure recovery and idempotency: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-06.R01** Close is idempotent by the unique result per auction; repeated or concurrent close attempts produce exactly one result.
- **PS-034-06.R02** The result, the mark_closed call and the outbox event are one host SQLite transaction under the lease and fence token.
- **PS-034-06.R03** Result delivery is at least once via mailboxes and idempotent by result cid in the vaults.
- **PS-034-06.R04** Applying a void is a local decision in each vault on its own Deal state; no lock spans vaults, and a payment acknowledged after the void was applied completes the Deal as F09 records it while the result stays voided.

## Specification

- **idempotency:** Host: unique (tenant, auction) result row; determine on a closed auction returns the stored result; record_non_payment and nominate dedupe on report cid. Vault: result, disclosure and statement cid dedup in the inbox; Deal opening keyed by contextRef (auction_result, resultId), and the second-chance Deal by contextRef (auction_result, uuid of offerCid), so one Deal per vault per buyer.
- **concurrency:** Close lease TTL 30 s with fencing token, BEGIN IMMEDIATE, shared with the bid lease on the host only (IDM-8), so a bid and the close are strictly ordered; the worker re-reads currentEndsAt after taking the lease and releases without closing if an extension moved it. Vault decisions (void application, offer, report) run in one IndexedDB transaction that reads the local Deal and claim state; no lock spans vaults.
- **retries:** Host close tick retries every 1 s until the result commits; mailbox delivery retries 1 s, 2 s, 4 s, 8 s up to 8 attempts then hourly for 30 days; F09 Deal open retries 10 s, 60 s, 10 minutes then shows needs attention.
- **offline:** Participants see result pending from the host until the signed statements are held; the seller's report and offer work offline and enter the sync outbox as prepared; a candidate's response expires by the seller clock regardless.
- **partial failure:** If the Deal port fails on receipt, the result is stored in pending_deal and the Deal opening retries; if the host cannot reach a participant mailbox the public projection still shows the outcome while the disclosure waits for delivery. When a payment acknowledgement and a void race in one vault, the local transaction that commits first decides - void first gives voided with the Deal kept, acknowledgement first gives void_after_payment.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T05 | chaos | PS-034-06.R01, PS-034-06.R02, PS-034-09.R03 | two workers close the same auction; extension lands before lease; lease expires mid-close | exactly one result; no close on extension; stale fence refused |
| TEST-PS-034-09.T06 | integration | PS-034-01.R02, PS-034-06.R03 | result delivered twice and late; winner offline for 2 days | one Deal per vault; UI shows result pending until the signed statements are verified |
| TEST-PS-034-09.T12 | integration | PS-034-03.R04, PS-034-06.R04 | voided statement after the Deal opened without acknowledged payment, and after acknowledged payment, in seller and winner vaults | first - result voided, Deal kept, Cancel Deal offered and commerce.deal.cancel needs both signatures; second - state unchanged, hostVoid void_after_payment, dispute link shown |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
