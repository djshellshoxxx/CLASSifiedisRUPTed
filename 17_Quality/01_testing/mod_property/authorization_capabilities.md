# PS-136-05 — Authorization and capabilities: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-05.R01** The module needs no capabilities and runs without relay sessions.
- **PS-136-05.R02** Properties for authorization (CTR-CAP-001 CAP-2) call the pure authorize() function with generated actor and resource combinations and assert default deny.
- **PS-136-05.R03** Property code cannot import secrets or network clients; the dependency rule from F17.S01.M01 applies.

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T08 | unit | PS-136-05.R01, PS-136-05.R02, PS-136-05.R03 | authorize() property with generated actors and capabilities | default deny holds for all 200 runs; import of secrets or network clients rejected |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F17.S01.M01, F09.S03.M03, F02.S02.M03, F06.S02.M01, F15.S02.M02, F11.S01.M01, F11.S01.M03, F11.S02.M03, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
