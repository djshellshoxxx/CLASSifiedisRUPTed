# PS-086-06 — Failure recovery and idempotency: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-06.R01** Detect is idempotent per (author, chain key, seq) or subject so repeated arrivals append at most new candidates and never open duplicates.
- **PS-086-06.R02** Resolve requires expectedRevision and is idempotent on identical replay.
- **PS-086-06.R03** A crash between opening a conflict and writing the event cannot lose the freeze because both are in one local transaction with the quarantine of the candidates.

## Specification

- **idempotency:** Detect replay with the same candidates returns the existing conflictId; resolve replay with the same Idempotency-Key and body returns the stored response for 24 h.
- **concurrency:** Unique partial indexes enforce one open conflict per chain position or subject; resolve uses expectedRevision; two concurrent resolves produce one success and one CONFLICT_REVISION.
- **retries:** Callers retry only on DEPENDENCY_UNAVAILABLE; resolution is never auto-retried with a different decision.
- **offline:** Fully offline in the vault; later signed statements of the counterparties arrive through normal sync, and the UI shows the freeze as local committed state.
- **partial failure:** If the freeze event cannot be delivered to a domain consumer it is retried from the outbox (CTR-EVT-001 EVT-6); safety does not depend on the event, because domain modules call is_frozen synchronously before acting and refuse with DEPENDENCY_UNAVAILABLE when the store cannot be read; the UI shows a warning when the outbox lag exceeds 60 s.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T11 | integration | PS-086-06.R01, PS-086-06.R02, PS-086-02.R02 | replay detect with same candidates; two concurrent resolves | same conflictId; one success and one CONFLICT_REVISION |
| TEST-PS-086-09.T12 | chaos | PS-086-06.R03, PS-086-04.R04 | kill process between conflict write and event; consumer unavailable for 90 s; domain module tries to act during that window | freeze and candidate quarantine committed with the detection; the domain action is refused through is_frozen; event delivered after restart; UI warning shown above 60 s lag |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
