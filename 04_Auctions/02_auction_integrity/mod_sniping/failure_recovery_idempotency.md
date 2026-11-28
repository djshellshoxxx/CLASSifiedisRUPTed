# PS-038-06 — Failure recovery and idempotency: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-06.R01** Apply is idempotent per auction and triggering bid sequence, so a repeated call returns the existing extension and never adds a second.
- **PS-038-06.R02** Extension row, adjust_end and the bid ledger entry commit in the same SQLite transaction; a crash leaves none of them.
- **PS-038-06.R03** Concurrent apply attempts are impossible inside the lease and are additionally prevented by the unique (auction, seq) index and the compare-and-set on extensionCount.

## Specification

- **idempotency:** Unique (tenant, auction, triggerBidSeq) via the unique seq index plus a stored triggerBidSeq lookup; repeated apply returns the stored result; vault receive dedupes on statement cid.
- **concurrency:** Runs only under the per-auction lease with BEGIN IMMEDIATE on the host (IDM-8); adjust_end uses compare-and-set on extensionCount and the fence token; a stale fencing token is refused by the bid path before apply is reached.
- **retries:** No retries inside the transaction; if the bid transaction fails, the bid is retried by the bidder with the same nonce before its notAfter and the extension is decided again from scratch.
- **offline:** Not applicable on the host; vaults show the last verified end time and mark it as last known when the host is unreachable.
- **partial failure:** If apply fails the whole bid transaction fails with DEPENDENCY_UNAVAILABLE, so a bid is never accepted without its extension decision.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T05 | integration | PS-038-03.R03, PS-038-06.R01 | extension commits before close lease; close worker started earlier | close re-reads end under lease and releases without closing |
| TEST-PS-038-09.T06 | chaos | PS-038-06.R02, PS-038-06.R03 | crash between extension insert and adjust_end; fail adjust_end | whole bid transaction rolls back; no extension row; bid not accepted |
| TEST-PS-038-09.T07 | integration | PS-038-02.R03, PS-038-06.R03, PS-038-04.R01 | first bid with 30 ms remaining and a second 50 ms later; first bid with 60 000 ms remaining and a second 50 ms later | two extensions, the second at 119 980 ms remaining counted from the moved end; one extension, the second bid at 179 950 ms remaining does not extend; unique seq holds |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
