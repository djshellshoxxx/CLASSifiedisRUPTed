# PS-128-06 — Failure recovery and idempotency: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-06.R01** createVault is atomic, so the wrapped blob and public metadata are written in one IndexedDB transaction or nothing is written.
- **PS-128-06.R02** Unlock is repeatable and has no side effects besides in-memory state; failed attempts only advance the local backoff counter.
- **PS-128-06.R03** Rotation is resumable from persisted progress and never leaves the vault without a usable key.

## Specification

- **idempotency:** createVault refuses when a vault exists (SECURITY_VAULT_EXISTS is reported as CONFLICT_STATE); rotation steps record the new key ID so repeating a step is a no-op.
- **concurrency:** Web Lock classrup-vault-unlock serializes unlock and rotation across tabs; BroadcastChannel propagates lock events; IndexedDB readwrite transactions guard blob updates.
- **retries:** Rotation statement delivery goes through the sync outbox with CTR-IDM-001 backoff; unlock is retried only by the user.
- **offline:** All operations work offline; only delivery of rotation statements and registry updates need a network.
- **partial failure:** If rotation fails after generation, both keys stay wrapped and valid, the UI shows rotation pending, and nothing is revoked until the statement is delivered or the user chooses immediate revocation.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T03 | property | PS-128-01.R02, PS-128-06.R01 | random keys and passphrases wrapped and unwrapped; random bit flips in blob | round trip exact; any flip fails with SECURITY_UNLOCK_FAILED |
| TEST-PS-128-09.T07 | integration | PS-128-03.R02, PS-128-04.R03, PS-128-06.R03 | rotate key, interrupt after generation, resume | both keys valid, rotation pending shown, statement delivered later, old key revoked after overlap |
| TEST-PS-128-09.T10 | integration | PS-128-05.R03, PS-128-06.R02 | two tabs unlock concurrently; lock in one tab | one unlock proceeds at a time; other tab locks via BroadcastChannel |
| TEST-PS-128-09.T11 | chaos | PS-128-06.R01, PS-128-06.R03 | IndexedDB write fails during createVault; storage cleared after creation | nothing half-written; clear message about backup and recovery kit |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
