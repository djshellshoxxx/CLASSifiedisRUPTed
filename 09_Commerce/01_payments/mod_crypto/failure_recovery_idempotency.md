# PS-068-06 — Failure recovery and idempotency: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-06.R01** Commands are idempotent per CTR-IDM-001 and observation updates are idempotent by (claimId, txid).
- **PS-068-06.R02** Endpoint failures never change claim status; the observation keeps its last good state and shows when it was last checked.
- **PS-068-06.R03** Conflicting data from two endpoints or an inconsistent single endpoint freezes progress and warns the user instead of picking a winner.

## Specification

- **idempotency:** Vault command ID recorded for 24 h; observation upserts keyed by (vault, claim, txid); consumed events deduplicated in the inbox; request statements deduplicated by cid in the ingest handler.
- **concurrency:** expectedRevision on cancel; partial unique indexes allow one open or claimed request per obligation and one per address; observation loop holds a Web Lock commerce-chain per vault so two tabs share one tip poll and one budget.
- **retries:** Endpoint calls: 3 attempts per poll with 1 s, 2 s, 4 s backoff and 8 s timeout, each attempt counted against the hourly budget; poll backoff doubles to 10 min; refresh failures return DEPENDENCY_UNAVAILABLE (retryable).
- **offline:** Requests and cancellations commit locally and queue statements. Observation pauses offline; on reconnect it catches up from the chain, so a missed 3-day window is verified at open. A crypto claim made offline with a verifier configured stays held until the txid lookup succeeds.
- **partial failure:** A failure after the verifier answered but before commit discards the answer; the next poll repeats it. A partially applied reorg cannot happen because status, confirmations and event outbox row commit in one IndexedDB transaction.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T09 | integration | PS-068-04.R03, PS-068-06.R01 | consumed events delivered twice; same command ID replayed | one request and one observation; original result returned |
| TEST-PS-068-09.T11 | chaos | PS-068-06.R02, PS-068-06.R03 | endpoint timeouts, two endpoints disagreeing, endpoint returning lower height | claim status unchanged, disagreement flagged, no progress applied |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
