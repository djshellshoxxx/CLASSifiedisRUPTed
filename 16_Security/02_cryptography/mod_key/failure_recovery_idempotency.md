# PS-128-06 — Failure recovery and idempotency: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-06.R01** createVault is atomic, so the wrapped blobs and public metadata are written in one IndexedDB transaction or nothing is written.
- **PS-128-06.R02** Unlock is repeatable and has no side effects besides in-memory state; failed attempts only advance the local backoff counter.
- **PS-128-06.R03** Rotation is resumable from persisted progress and never leaves the vault without a usable key.

## Specification

- **idempotency:** createVault refuses when a vault exists (reported as CONFLICT_STATE); rotation steps record the new key ID, the device link cid and the revocation cid so repeating a step is a no-op.
- **concurrency:** Web Lock classrup-vault-unlock serializes unlock and rotation across tabs; BroadcastChannel propagates lock events; IndexedDB readwrite transactions guard blob updates.
- **retries:** Device link, revocation and portable document delivery goes through the F15.S01.M01 sync outbox with CTR-IDM-001 backoff; unlock is retried only by the user.
- **offline:** All operations work offline; only delivery of rotation statements and the new identity document needs a network, and linked devices need the root device to sign the link.
- **partial failure:** If rotation stops after generation, the new key stays wrapped but unused until the root-signed device link is recorded, the old key stays active, the UI shows rotation pending, and nothing is revoked until the overlap ends or the user marks the old key compromised.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T06 | integration | PS-128-03.R01, PS-128-03.R03, PS-128-05.R03, PS-128-06.R02 | idle timer, tab hidden, 3 wrong unlocks | auto-lock at 15 min, hidden lock at 5 min, delays 1 s then 2 s then 4 s capped at 60 s, no wipe |
| TEST-PS-128-09.T07 | integration | PS-128-03.R02, PS-128-04.R03, PS-128-06.R03 | rotate a device key with overlap 7 days, interrupt after generation, resume | new key used only after the root-signed device link is recorded; old key revoked with reason superseded after 7 days; new portable identity document queued; all statements delivered through the outbox |
| TEST-PS-128-09.T11 | chaos | PS-128-06.R01, PS-128-06.R03 | IndexedDB write fails during createVault; storage cleared after creation | nothing half-written; clear message about backup and recovery kit |

## Dependencies

Module depends on: F16.S02.M02, F16.S02.M03, F15.S01.M01, F07.S01.M01, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
