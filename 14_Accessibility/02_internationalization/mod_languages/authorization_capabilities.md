# PS-113-05 — Authorization and capabilities: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-05.R01** The library performs no authorization and has no roles; any user may change their own locale.
- **PS-113-05.R02** Catalogs contain no secrets and are public static files shipped in the app bundle.
- **PS-113-05.R03** Locale choice is F15.S04.M03 LocalSettings.defaultLocale, changed only by the unlocked local principal through the vault-local command platform.local_settings.update.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T06 | unit | PS-113-04.R01, PS-113-04.R02, PS-113-05.R01, PS-113-05.R02, PS-113-03.R03 | inspect exports, network calls, storage and authorization calls | pure functions or Result values; no vault or relay command; no network call during t(); no persisted state of its own |
| TEST-PS-113-09.T10 | abuse | PS-113-07.R01, PS-113-07.R03, PS-113-05.R03 | capture all network traffic during locale switch, catalog loads, push alert rendering, diagnostics export and the email opt-in with and without notify_email consent | no request carries the chosen locale except the F13.S01.M02 notify.email.add registration, which after consent carries exactly the chosen locale to that one user-selected relay; without consent it is not sent; catalog loads come from the precache; diagnostics leave only in the user-initiated export; the locale change is written only through platform.local_settings.update |

## Dependencies

Module depends on: F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
