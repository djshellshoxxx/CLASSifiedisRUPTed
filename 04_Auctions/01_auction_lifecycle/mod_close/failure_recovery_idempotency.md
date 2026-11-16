# PS-034-06 — Failure recovery and idempotency: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-06.R01** Close is idempotent by the unique result per auction; repeated or concurrent close attempts produce exactly one result.
- **PS-034-06.R02** The result, the mark_closed call and the outbox event are one host SQLite transaction under the lease and fence token.
- **PS-034-06.R03** Result delivery is at least once via mailboxes and idempotent by result cid in the vaults.

## Specification

- **idempotency:** Host: unique (tenant, auction) result row; determine on a closed auction returns the stored result. Vault: result cid dedup in the inbox; Deal opening keyed by contextRef (auction_result, resultId) so one Deal per vault per result.
- **concurrency:** Close lease TTL 30 s with fencing token, BEGIN IMMEDIATE, shared with the bid lease so a bid and the close are strictly ordered; the worker re-reads currentEndsAt after taking the lease and releases without closing if an extension moved it.
- **retries:** Host close tick retries every 1 s until the result commits; mailbox delivery retries 1 s, 2 s, 4 s, 8 s up to 8 attempts then hourly for 30 days; F09 Deal open retries 10 s, 60 s, 10 minutes then shows needs attention.
- **offline:** Participants see result pending from the host until the signed statement is held; the seller's report and offer work offline and enter the sync outbox as prepared; a candidate's response expires by the seller clock regardless.
- **partial failure:** If the Deal port fails on receipt, the result is stored in pending_deal and the Deal opening retries; if the host cannot reach a participant mailbox the public projection still shows the outcome while the private winner key waits for delivery.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T05 | chaos | PS-034-06.R01, PS-034-06.R02, PS-034-09.R03 | two workers close the same auction; extension lands before lease; lease expires mid-close | exactly one result; no close on extension; stale fence refused |
| TEST-PS-034-09.T06 | integration | PS-034-01.R02, PS-034-06.R03 | result delivered twice and late; winner offline for 2 days | one Deal per vault; UI shows result pending until signed statement verified |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
