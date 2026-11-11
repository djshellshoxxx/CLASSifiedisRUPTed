# PS-066-06 — Failure recovery and idempotency: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-06.R01** Publish is idempotent on (curatorDid, venueKey, version) and retirement is idempotent on spotId.
- **PS-066-06.R02** Cache refresh failures leave the previous cache in place and are retried with backoff.
- **PS-066-06.R03** Suggestions are computed locally from the cache and are available offline.

## Specification

- **idempotency:** Relay commands require Idempotency-Key with 24 h replay window and are naturally idempotent on (curatorDid, venueKey, version), reports on (spotId, reporter key) and curator-list updates on expectedVersion; suggest is a pure local computation.
- **concurrency:** Relay applies publish with expectedRevision on the spot row and curator-list updates with expectedVersion; two curators publishing the same venueKey result in the higher version winning only within one curator's chain, otherwise both are kept and deduplicated at display time by newest valid statement.
- **retries:** Vault refresh retries with CTR-IDM-001 IDM-4 backoff (base 500 ms, cap 30 s, full jitter, 6 attempts per cycle); curators retry publish on network errors only.
- **offline:** Suggest, checklist and trust settings work offline from the cache and bundled starter set; drafting and signing work offline in the curator vault; publish requires a relay connection.
- **partial failure:** If a refresh page fails midway, statements already verified are stored and the cursor advances only past verified pages; if the curator list cannot be fetched the cached list is used and relay-delegated spots are marked unconfirmed; if the starter set and cache are both empty the app shows the checklist only.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T07 | integration | PS-066-06.R01, PS-066-06.R02, PS-066-06.R03 | replay publish, interrupt refresh after page 2, run offline | idempotent result, cursor resumes, cached suggestions still work |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
