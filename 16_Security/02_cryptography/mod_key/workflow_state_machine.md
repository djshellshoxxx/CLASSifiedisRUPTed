# PS-128-03 — Workflow state machine: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-03.R01** The in-memory lock state moves locked to unlocked only after successful AEAD verification, and unlocked to locked on idle timeout, explicit lock, tab hide for 5 minutes or browser discard.
- **PS-128-03.R02** Device rotation proceeds generate, possession-sign, root-signed device link through F07.S01.M01 identity.device_key.add, overlap, then identity.device_key.revoke of the old key with reason superseded and a new portable identity document, with one overlap bound of 0 to 7 days (default 7) unless the user marks the old key compromised, in which case the revocation is immediate.
- **PS-128-03.R03** After 3 consecutive failed unlocks the library enforces a local delay of 1 s, doubling per failure, capped at 60 s, and resets after one success.
- **PS-128-03.R04** The account root key is never rotated in MVP; a lost or compromised root key is handled by recovery (F07.S01.M03), and rotation applies only to device keys.

## Specification

**Note:** Library state is a runtime lock state of the in-memory keys (locked, unlocked), not a persisted catalog entity. Persisted device-rotation progress is described in requirements.

### Timeouts and scheduled transitions

- Idle auto-lock default 15 minutes (range 1 to 60); hidden-tab lock after 5 minutes.
- Device rotation overlap default 7 days, range 0 to 7 days (0 when the old key is marked compromised).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T06 | integration | PS-128-03.R01, PS-128-03.R03, PS-128-05.R03, PS-128-06.R02 | idle timer, tab hidden, 3 wrong unlocks | auto-lock at 15 min, hidden lock at 5 min, delays 1 s then 2 s then 4 s capped at 60 s, no wipe |
| TEST-PS-128-09.T07 | integration | PS-128-03.R02, PS-128-04.R03, PS-128-06.R03 | rotate a device key with overlap 7 days, interrupt after generation, resume | new key used only after the root-signed device link is recorded; old key revoked with reason superseded after 7 days; new portable identity document queued; all statements delivered through the outbox |
| TEST-PS-128-09.T08 | unit | PS-128-02.R03, PS-128-03.R02 | rotation with a missing possession signature; device link not signed by the root handle; overlap of 10 days; old key marked compromised | SECURITY_ROTATION_INVALID three times; immediate revocation with overlap 0 and reason compromised |
| TEST-PS-128-09.T18 | integration | PS-128-03.R04, PS-128-07.R04 | 23 months after a rotation, verify an exported consent signed by the old device key; look for a root rotation entry point | old key, its device link and superseded revocation are retained and the consent verifies through the chain; no root rotation API exists |

## Dependencies

Module depends on: F16.S02.M02, F16.S02.M03, F15.S01.M01, F07.S01.M01, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
