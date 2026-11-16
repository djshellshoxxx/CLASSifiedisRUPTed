# PS-075-06 — Failure recovery and idempotency: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-06.R01** Quote requests are idempotent per CTR-IDM-001 in the vault; a replay returns the same quote ID and relay calls carry the same Idempotency-Key.
- **PS-075-06.R02** Provider and relay fetch failures use bounded retries and then fall back to local manual quotes or fail visibly.
- **PS-075-06.R03** The rate cache is a read-through cache; losing it only costs a provider call.

## Specification

- **idempotency:** Vault commands carry a command ID recorded in the vault inbox for 24 h; replay returns the original quote. relay_issue requires Idempotency-Key and replays for 24 h.
- **concurrency:** Quotes are append-only; revoke uses expectedRevision. Fetches for the same pair are single-flighted per tab via a Web Lock so one HTTP call serves concurrent requests. No distributed lock is used (IDM-8).
- **retries:** Provider calls: 3 attempts with backoff 1 s, 2 s, 4 s and 5 s timeout each; then DEPENDENCY_UNAVAILABLE (retryable).
- **offline:** Offline the vault can issue manual quotes locally and display expired quotes labelled expired; it cannot fetch provider or relay quotes. Revocation statements queue in the sync outbox (prepared, transport_acknowledged, peer_accepted).
- **partial failure:** If persisting the quote fails after fetching, nothing is returned; the cached provider rate is kept for the next request.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T07 | integration | PS-075-04.R03, PS-075-06.R01 | replayed request with same key | same quote ID returned; no second event |
| TEST-PS-075-09.T09 | chaos | PS-075-06.R02, PS-075-06.R03 | provider times out three times | DEPENDENCY_UNAVAILABLE, falls back to live manual quote if present, cache intact |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
