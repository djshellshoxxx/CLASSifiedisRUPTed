# PS-112-05 — Authorization and capabilities: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-05.R01** The library performs no authorization and has no roles; it runs in the browser under the unlocked local principal.
- **PS-112-05.R02** It reads no vault data itself; callers pass in the Money, the F09.S03.M01 CurrencyDef, the QuoteLabel and the display preference.
- **PS-112-05.R03** Formatted strings are derived from data the viewer is already allowed to see and add no new disclosure.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T07 | unit | PS-112-04.R01, PS-112-04.R02, PS-112-04.R03, PS-112-05.R01, PS-112-05.R02, PS-112-05.R03 | inspect exports, calls to vault, relay or network, and authorization hooks | pure typed functions returning Result; no events or commands; no I/O |

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
