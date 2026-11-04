# PS-021-05 — Authorization and capabilities: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-05.R01** Vault policy lets only the unlocked local principal propose, consent or decline, and only as a participant of the cycle; a consent signed by anyone else is never created locally.
- **PS-021-05.R02** Incoming statements count only when signed by a registered, non-revoked device key of a participant DID for the role they claim; otherwise they are quarantined.
- **PS-021-05.R03** Relays and moderators have no capability over cycles; relay roles govern only what that relay hosts.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.cycle.propose | principal | vault unlocked; principal is in the verified suggestion; participation limit not exceeded |
| mutiny.cycle.consent | principal | principal is a participant; cycle proposed; principal has not consented to the head hash |
| mutiny.cycle.decline | principal | principal is a participant; cycle proposed or committed-before-handover is handled by F02.S03.M03 |
| mutiny.cycle.ingest | principal | envelope signer is a participant with a non-revoked device key |
| mutiny.cycle.read | principal | cycle stored in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T07 | integration | PS-021-02.R02, PS-021-05.R02 | consent signed by revoked key, wrong subject, wrong hash, wrong signer | quarantined with MUTINY_CONSENT_STATEMENT_INVALID or STALE; not counted |
| TEST-PS-021-09.T11 | abuse | PS-021-05.R01, PS-021-05.R02, PS-021-05.R03 | other principal consents; forged statements; relay tries to inject committed | FORBIDDEN or quarantine; verdict unaffected |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
