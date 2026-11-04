# PS-106-02 — Validation rules: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-02.R01** Matrix changes are validated for category, lock rules and size before they are stored.
- **PS-106-02.R02** Relay mirror statements are validated for signature, schema and sequence.
- **PS-106-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | each cell names a known category and boolean flags only; at most 21 cells per request | VALIDATION_FAILED |
| V02 | security inApp is not set to false | NOTIFY_PREF_LOCKED |
| V03 | reset requires confirmation flag true | VALIDATION_FAILED |
| V04 | mirror statement signature verifies against a device key of userDid and the relay holds a granted channel consent for that user | PRECONDITION_FAILED |
| V05 | mirror seq is greater than the stored seq, otherwise the statement is acknowledged without change | CONFLICT_STATE |
| V06 | a user changes preferences at most 60 times per hour | RATE_LIMITED |
| V07 | expectedRevision equals the stored cell revision | CONFLICT_REVISION |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T01 | unit | PS-106-01.R01, PS-106-01.R03, PS-106-02.R01 | create a new vault and read the matrix | 7 records equal the golden default table; security inApp true and locked |
| TEST-PS-106-09.T02 | unit | PS-106-01.R02, PS-106-02.R02, PS-106-02.R03 | each rule V01 to V07 violated in turn including security in-app off | documented error code returned and nothing changed |
| TEST-PS-106-09.T10 | abuse | PS-106-07.R03, PS-106-02.R03 | 61st edit in an hour | RATE_LIMITED |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
