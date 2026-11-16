# PS-113-05 — Authorization and capabilities: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-05.R01** The library performs no authorization and has no roles; any user may change their own locale.
- **PS-113-05.R02** Catalogs contain no secrets and are public static files shipped in the app bundle.
- **PS-113-05.R03** Locale choice is a vault setting changed by the local principal only.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T06 | unit | PS-113-04.R01, PS-113-04.R02, PS-113-05.R01, PS-113-05.R02 | inspect exports, network calls and authorization calls | pure functions or Result values; no vault or relay command; no network call during t() |
| TEST-PS-113-09.T10 | abuse | PS-113-07.R01, PS-113-07.R03, PS-113-05.R03 | capture network traffic during locale switch and diagnostics export | locale not transmitted by the app; diagnostics only in user-initiated export |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
