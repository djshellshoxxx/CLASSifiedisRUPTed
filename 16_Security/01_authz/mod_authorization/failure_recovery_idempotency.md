# PS-126-06 — Failure recovery and idempotency: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-06.R01** authorize is pure and deterministic, so retries and replays give the same decision for the same inputs and clock.
- **PS-126-06.R02** Role commands are idempotent per CTR-IDM-001 and mutating commands carry expectedRevision.
- **PS-126-06.R03** The audit append and the command's state change commit in one transaction, and a failed append aborts the command for state-changing capabilities.

## Specification

- **idempotency:** Idempotency-Key required on assign and revoke; replay returns the stored response for 24 h; audit entries for a replay are not duplicated because the correlation ID is unique per entry.
- **concurrency:** Audit seq is assigned inside BEGIN IMMEDIATE (relay) or a single IndexedDB readwrite transaction (vault); role changes use expectedRevision; the last-admin check runs inside the revoke transaction.
- **retries:** Callers retry DEPENDENCY_UNAVAILABLE only; Deny decisions are never retried.
- **offline:** Vault authorization and quarantine work fully offline; relay role statements are cached by vaults with their fetch time and signature.
- **partial failure:** If audit append fails for a state-changing command the command fails closed with DEPENDENCY_UNAVAILABLE; for read-only allows the entry is queued and appended within 5 seconds, and if the queue is lost the gap is detectable by chain verification.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T03 | property | PS-126-02.R02, PS-126-06.R01 | generated actors, capabilities, resources and malformed inputs | authorize never throws, is deterministic, and every unlisted combination denies |
| TEST-PS-126-09.T10 | integration | PS-126-06.R02, PS-126-06.R03 | audit store failure during a state-changing command | command fails closed with DEPENDENCY_UNAVAILABLE and no state change |
| TEST-PS-126-09.T11 | integration | PS-126-06.R01 | same Idempotency-Key replayed on assign | original response; one audit entry |

## Dependencies

Module depends on: CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
