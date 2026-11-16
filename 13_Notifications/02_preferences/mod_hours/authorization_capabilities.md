# PS-105-05 — Authorization and capabilities: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-05.R01** Vault policy lets only the local principal save its schedule; evaluation is a pure function usable by any local module.
- **PS-105-05.R02** Relay policy lets a registered device key mirror its owner's schedule only where the relay holds a granted channel consent; the relay-side evaluate function is available to the dispatch gate.
- **PS-105-05.R03** Other users and relay operators cannot edit a schedule; operators can read the mirrored copy of consenting users as part of operating the relay, which is disclosed.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.quiet_hours.set | local principal | vault policy; owner of the schedule |
| notify.quiet_hours.read_own | local principal | owner of the schedule |
| notify.quiet_hours.mirror | registered relay device | relay policy; statement signed by a device key of the user; granted channel consent exists at this relay |
| notify.quiet_hours.evaluate | local principal, relay service | pure function with no side effects; no personal data beyond the supplied schedule |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T09 | abuse | PS-105-05.R01, PS-105-05.R02, PS-105-05.R03 | forged mirror; mirror without consent; another user edit | rejected in each case |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
