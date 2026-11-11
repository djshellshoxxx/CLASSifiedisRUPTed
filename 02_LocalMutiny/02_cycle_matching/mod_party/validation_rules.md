# PS-019-02 — Validation rules: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-02.R01** Profile input is validated strictly against the schema and unknown fields are rejected with VALIDATION_FAILED.
- **PS-019-02.R02** Opt-in preconditions (disclosure, region, relay selection) are checked before any projection is signed.
- **PS-019-02.R03** Incoming peer projections are verified before they influence matching; failures quarantine the record with a reason code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | maxCycleLength is an integer in 2..8 | VALIDATION_FAILED |
| V02 | maxDistanceBucket is an integer 0..4 of the ordinal mapping defined here | VALIDATION_FAILED |
| V03 | optedIn true requires optInVersion equal to the current disclosure key and an explicit confirmation flag | MUTINY_OPTIN_REQUIRED |
| V04 | optedIn true requires regionL1 from F06.S02.M02 (manual entry allowed) | MUTINY_PROFILE_REGION_REQUIRED |
| V05 | excludedActorIds has ≤ 200 unique DIDs and does not contain the principal | MUTINY_EXCLUSION_LIMIT |
| V06 | pausedUntil is in the future and ≤ now + 90 d | VALIDATION_FAILED |
| V07 | peer projection signature verifies (Ed25519 over JCS), author DID matches signer, seq greater than stored and prev equals stored projectionCid | MUTINY_PROJECTION_INVALID |
| V08 | peer projection createdAt is not more than 5 minutes after the local clock (claims from the future are quarantined) | MUTINY_PROJECTION_INVALID |
| V09 | regionL1 passes F06.S02.M01 assertPublicCell and has exactly 4 characters before any projection is signed (N8) | DISCOVERY_PRECISION_FORBIDDEN |
| V10 | privacy.consent.check(purpose federation_publish, relayId) returns granted for a relay before a projection is sent to it; tombstones are always sent | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T01 | unit | PS-019-01.R01, PS-019-02.R01, PS-019-02.R02 | update with each of V01..V06 violated (V07..V10 in T03 and T20) in turn | documented error code and nothing stored |
| TEST-PS-019-09.T03 | unit | PS-019-01.R03, PS-019-02.R03, PS-019-04.R04 | ingest valid, bad signature, lower seq, broken prev, future createdAt, and a projection of a DID the principal blocked | accepted once, other four quarantined or ignored with reasons, blocked DID dropped silently; signer role matches the F11.S01.M01 registry entry |
| TEST-PS-019-09.T19 | unit | PS-019-02.R01 | update with an unknown field and maxDistanceBucket 5 or '10_25' | VALIDATION_FAILED and nothing stored |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M01, F06.S02.M02, F16.S02.M03, F12.S03.M04, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
