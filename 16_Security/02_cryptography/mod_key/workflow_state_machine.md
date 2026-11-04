# PS-128-03 — Workflow state machine: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-03.R01** The in-memory lock state moves locked to unlocked only after successful AEAD verification, and unlocked to locked on idle timeout, explicit lock, tab hide for 5 minutes or browser discard.
- **PS-128-03.R02** Rotation proceeds generate, sign, deliver and finalize, with the old key kept valid for an overlap of at most 7 days unless the user marks it compromised, in which case revocation is immediate.
- **PS-128-03.R03** After 3 consecutive failed unlocks the library enforces a local delay of 1 s, doubling per failure, capped at 60 s, and resets after one success.

## Specification

**Note:** Library state is a runtime lock state of the in-memory key (locked, unlocked), not a persisted catalog entity. Persisted rotation progress is described in requirements.

### Timeouts and scheduled transitions

- Idle auto-lock default 15 minutes (range 1 to 60); hidden-tab lock after 5 minutes.
- Rotation overlap default 7 days, range 0 to 30.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T06 | integration | PS-128-03.R01, PS-128-03.R03 | idle timer, tab hidden, 3 wrong unlocks | auto-lock at 15 min, hidden lock at 5 min, delays 1 s then 2 s then 4 s capped at 60 s, no wipe |
| TEST-PS-128-09.T07 | integration | PS-128-03.R02, PS-128-04.R03, PS-128-06.R03 | rotate key, interrupt after generation, resume | both keys valid, rotation pending shown, statement delivered later, old key revoked after overlap |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
