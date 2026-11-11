# PS-076-05 — Authorization and capabilities: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-05.R01** Under vault policy (CAP-8) only the unlocked local principal grants, withdraws or reads its own consents.
- **PS-076-05.R02** privacy.consent.check is callable by other modules in the same vault in-process; it never reveals consent state to other principals.
- **PS-076-05.R03** Relays authorize receipt of consent statements under their own relay policy through privacy.consent.relay_register, accept only statements signed by the principal and addressed to themselves, and cannot grant or alter consent.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| privacy.consent.grant | local-principal | vault unlocked; current policy hash supplied |
| privacy.consent.withdraw | local-principal | vault unlocked; consent granted |
| privacy.consent.check | local-principal | in-process call from a module of the unlocked vault |
| privacy.consent.read | local-principal | vault unlocked |
| privacy.consent.relay_register | signed-statement | request and statement signed by a registered, non-revoked device key of the author did; grants limited to 20 per hour per did, withdrawals always accepted |
| privacy.consent.relay_check | relay-system | in-process call from relay federation handlers (F11.S02.M01) on the same relay |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T10 | abuse | PS-076-05.R01, PS-076-05.R02, PS-076-05.R03 | another module of a different vault tries to read; relay tries to alter | no access; statements from non-owner rejected |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M01, F15.S01.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
