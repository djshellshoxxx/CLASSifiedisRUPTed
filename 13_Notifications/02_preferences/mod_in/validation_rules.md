# PS-106-02 — Validation rules: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-02.R01** Matrix changes are validated for category, lock rules and size before they are stored.
- **PS-106-02.R02** Relay mirror statements are validated for signer key status, audience, channel consent, chain position, forks and schema.
- **PS-106-02.R03** Every violation maps to one stable error code.
- **PS-106-02.R04** Flags for a channel without consent are stored and shown inactive, never silently enabled, and are mirrored only after that channel is consented at a relay.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | each cell names one of the 8 known categories and boolean flags only, at most 24 cells per request; unknown categories are accepted only by import and app-update merge into the other bucket | VALIDATION_FAILED |
| V02 | security inApp is not set to false and activity inApp is not set to true | NOTIFY_PREF_LOCKED |
| V03 | reset requires confirmation flag true | VALIDATION_FAILED |
| V04 | the mirror statement signature verifies with a device key of userDid active per F16.S02.M02 at receipt time, payload relayId equals this relay, and a granted consent of the user for the statement's channel is registered here | PRECONDITION_FAILED |
| V05 | a mirror at or below the head of its device chain with the same cid is acknowledged as stale without change; an equal seq with another cid, or a prev that is not the head cid, is a fork refused with params.currentCid | CONFLICT_STATE |
| V06 | RateLimitPort.consume (F12.S03.M03) allows at most 60 preference changes per hour per vault and 30 mirror calls per hour per user at a relay | RATE_LIMITED |
| V07 | expectedRevision equals the stored cell revision (tabs of one vault) | CONFLICT_REVISION |
| V08 | a statement covers exactly one channel, lists exactly the 8 known categories with one boolean each and carries no in-app flag | VALIDATION_FAILED |
| V09 | mirror requests are signed (classrup/relay-request/v1) by an active device key of userDid | UNAUTHENTICATED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T01 | unit | PS-106-01.R01, PS-106-01.R03, PS-106-02.R01, PS-106-01.R04 | create a new vault and read the matrix | 8 records equal the golden default table version 2; security inApp true and locked; activity inApp false and locked |
| TEST-PS-106-09.T02 | unit | PS-106-01.R02, PS-106-02.R02, PS-106-02.R03 | each rule V01 to V09 violated in turn including security in-app off and activity in-app on | documented error code returned and nothing changed |
| TEST-PS-106-09.T06 | integration | PS-106-04.R03, PS-106-02.R04 | vault-local opted_in and opted_out; push flag set before push consent | channel shown active or inactive; flag stored inactive and not mirrored until consent; column mirrored after the registration on opt-in |
| TEST-PS-106-09.T10 | abuse | PS-106-07.R03, PS-106-02.R03 | relay-local opted_out for the last push consent at R; fake clock advanced 24 h; 61st edit in an hour | R's push rows deleted at once and absent after 24 h; RATE_LIMITED |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
