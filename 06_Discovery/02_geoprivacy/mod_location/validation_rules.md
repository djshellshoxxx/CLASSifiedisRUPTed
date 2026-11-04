# PS-048-02 — Validation rules: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-02.R01** Home input is validated to cells at precision 5 or coarser and a public level no finer than L2 before storage.
- **PS-048-02.R02** Share input enforces one counterparty, a TTL of 24 hours or less, a non-blocked recipient and a valid statement signature on receipt.
- **PS-048-02.R03** Incoming statements are accepted only when signed by the claimed sharer and addressed to the local principal; otherwise they are quarantined with a reason.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | home cell has exactly 5 geohash characters and publicLevel is L0, L1 or L2 | DISCOVERY_PRECISION_FORBIDDEN |
| V02 | home changes in the last 24 hours are fewer than 3 | DISCOVERY_HOME_CHANGE_LIMIT |
| V03 | share ttl is 15 minutes, 1 h, 2 h, 8 h or 24 h and never above 86 400 000 ms | DISCOVERY_SHARE_TTL_INVALID |
| V04 | recipient is a single known DID that is not the sharer and not blocked in either direction | BLOCKED_PARTY |
| V05 | fewer than 5 active outgoing shares exist and none is active for the same recipient and context | DISCOVERY_SHARE_LIMIT |
| V06 | incoming statement signature verifies against sharerDid over JCS bytes and recipientDid equals the local principal | DISCOVERY_SHARE_SIGNATURE_INVALID |
| V07 | position has finite lat in -90..90 and lon in -180..180 and is rounded to 5 decimals | DISCOVERY_COORD_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T01 | unit | PS-048-01.R01, PS-048-02.R01 | set home from GPS once with level L1 | stored homeCell5 u4pru, publicCell u4pr, raw coordinates absent from storage |
| TEST-PS-048-09.T02 | unit | PS-048-02.R01, PS-048-02.R02 | 6-character cell, level L3, and 4th change within 24 h | DISCOVERY_PRECISION_FORBIDDEN or DISCOVERY_HOME_CHANGE_LIMIT with nothing stored |
| TEST-PS-048-09.T03 | unit | PS-048-01.R02, PS-048-02.R02, PS-048-03.R01 | grant share ttl 2 h, then ttl 25 h, 20 min, and a blocked recipient | first succeeds; others return DISCOVERY_SHARE_TTL_INVALID or BLOCKED_PARTY |
| TEST-PS-048-09.T07 | abuse | PS-048-02.R03, PS-048-05.R01, PS-048-05.R03 | incoming share with a bad signature, wrong addressee, claimed expiry 5 days ahead | rejected or clamped to receipt time plus 24 h; quarantined with reason |
| TEST-PS-048-09.T12 | a11y | PS-048-01.R01, PS-048-02.R03 | location settings and share sheet with axe-core and keyboard-only map alternative | zero serious or critical violations and list alternative works |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
