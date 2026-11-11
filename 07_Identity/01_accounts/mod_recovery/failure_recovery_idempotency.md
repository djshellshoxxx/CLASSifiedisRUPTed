# PS-053-06 — Failure recovery and idempotency: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-06.R01** Kit creation and each recovery step are single local transactions, so a crash leaves either the old state or the new state.
- **PS-053-06.R02** Statements go through the sync outbox with states local_committed, prepared, transport_acknowledged and peer_accepted, and the UI never claims more than the reached state.
- **PS-053-06.R03** A failed recovery never deletes the old kit and never revokes any key on its own.

## Specification

- **idempotency:** Idempotency-Key per command in the local command log for 24 h; begin is keyed by (kitId, newDevicePublicKey) so a repeated begin returns the same pending record.
- **concurrency:** Partial unique index allows one active or pending kit per account; revision check on complete and cancel; Web Locks serialize tabs.
- **retries:** Outbox retries follow base 500 ms, cap 30 s, full jitter, max 6 attempts per window; derivation errors are never retried automatically.
- **offline:** Create, verify, begin and complete all work offline because they need only the kit and local keys; notices are queued and the UI shows that existing devices have not yet been told.
- **partial failure:** If registering the new device key succeeds but the notice statement fails to queue, the transaction rolls back; if the notice is queued but not delivered, the revocation window still counts from begin and the UI shows 'not yet delivered'.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T08 | integration | PS-053-04.R03, PS-053-06.R02 | begin registers a new device key through F07.S01.M01 | identity.device_key.added emitted by M01 once; revocations emitted on complete |
| TEST-PS-053-09.T10 | chaos | PS-053-06.R01, PS-053-06.R02, PS-053-06.R03 | crash during begin, queue failure, replay of begin | no partial state; old kit intact; one pending record |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
