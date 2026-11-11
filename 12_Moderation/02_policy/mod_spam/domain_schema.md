# PS-097-01 — Domain schema: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-01.R01** The module owns no persistent entities; all inputs are signed projections or local records and results are events carrying the evidence values.
- **PS-097-01.R02** The derived fingerprint index stores only hashes and counters, never text, and expires entries after 30 days.
- **PS-097-01.R03** Every result records the heuristic set version and thresholds used so decisions can be reproduced.
- **PS-097-01.R04** Fingerprint and key-observation rows key the subject by a store-salted hash; the subject did:key appears only in the query input and in the store-local P2 event, never in an index row or a log.

## Specification

**Note:** Owns no catalog entities. Derived per-store indexes, never exported and rebuilt from the relay index or the vault: fingerprints (tenant, subject key hash, normalized sha256, simhash64, targetCid, receivedAt, claimedCreatedAt?) kept 30 days (RET-SHORT), and key observations (tenant, subject key hash, firstSeenAt, lastSeenAt) kept 30 days after lastSeenAt (RET-SHORT). The key hash is HMAC-SHA-256 with a store-local salt, so indexes of two stores cannot be joined.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T03 | property | PS-097-01.R01, PS-097-01.R03, PS-097-02.R03, PS-097-03.R01, PS-097-06.R01 | random and hostile texts evaluated twice with the same index snapshot | identical output including rulesVersion and thresholds; no exceptions; score within 0..100; bounded runtime |
| TEST-PS-097-09.T18 | unit | PS-097-01.R02, PS-097-01.R04, PS-097-07.R02 | inspect index rows after evaluations on relays X and Y; injected clock 31 days later | only hashes and counters; key hashes differ between X and Y; entries expired |

## Dependencies

Module depends on: F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
