# PS-090-05 — Authorization and capabilities: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-05.R01** Only the unlocked local principal can prepare, copy, announce or cancel an own move, and only with a device key listed in its portable document.
- **PS-090-05.R02** Any registered device key of the principal other than the signer may veto during the window.
- **PS-090-05.R03** The redirect lookup is public, and observed moves are accepted by any vault or relay only after verification.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| federation.migration.prepare | local principal, operator | vault policy: unlocked vault owner for account moves; relay policy: operator of this relay for relay moves |
| federation.migration.copy | local principal | vault policy: migration belongs to the vault |
| federation.migration.announce | local principal, operator | vault policy: signer is a registered device key; relay policy: operator holding the relay key |
| federation.migration.cancel | local principal, operator | vault policy: any registered device key before effectiveAt |
| federation.migration.receive | local principal, system | vault or relay verifies the statement; no caller authority is assumed |
| federation.migration.read | local principal, operator | own vault or own relay |
| federation.migration.read_public | anonymous, local principal | relay public redirect lookup; rate limited to 60 requests/minute per IP prefix |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T08 | abuse | PS-090-05.R01, PS-090-05.R02, PS-090-05.R03 | non-owner announces; veto by the signing key itself; anonymous reads redirect | FORBIDDEN or FEDERATION_MOVE_VETO_INVALID; redirect read allowed |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S03.M01, F07.S02.M01, F10.S01.M04, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
