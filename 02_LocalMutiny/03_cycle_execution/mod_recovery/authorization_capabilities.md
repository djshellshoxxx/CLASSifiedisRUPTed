# PS-024-05 — Authorization and capabilities: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-05.R01** Vault policy lets only the unlocked local principal sign attestations and recovery actions, and only for legs and cases where the principal has the required role in the signed revision.
- **PS-024-05.R02** Incoming statements are accepted only when signed by a registered, non-revoked device key of the participant whose role the statement claims; otherwise they are quarantined.
- **PS-024-05.R03** Relays, moderators and mediators cannot attest, resolve or alter cases; a mediator acts only through F09.S02.M02 after a participant escalates.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.attestation.attest | principal | principal has the role required for the kind on the leg; cycle committed or executing, or an accepted return option exists |
| mutiny.attestation.ingest | principal | envelope signer has the claimed role on the leg with a non-revoked device key |
| mutiny.attestation.read | principal | cycle stored in this vault |
| mutiny.recovery.propose_option | principal | principal is a participant of the cycle; case open |
| mutiny.recovery.respond | principal | principal is the counterparty named in the option; option proposed |
| mutiny.recovery.escalate | principal | principal is a participant; case open |
| mutiny.recovery.ingest | principal | envelope signer is a participant of the cycle with a non-revoked device key |
| mutiny.recovery.read | principal | case stored in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T11 | abuse | PS-024-05.R01, PS-024-05.R02, PS-024-05.R03, PS-024-07.R03 | forged attestation, wrong-role signer, replay on another leg, relay attempts to mark received | quarantined or FORBIDDEN; relay cannot alter any state |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
