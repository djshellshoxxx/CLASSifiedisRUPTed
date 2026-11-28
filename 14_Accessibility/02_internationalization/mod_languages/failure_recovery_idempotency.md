# PS-113-06 — Failure recovery and idempotency: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-06.R01** Locale negotiation and catalog lookup are pure and idempotent; switching to the active locale does nothing.
- **PS-113-06.R02** If a catalog fails to load or parse, the app keeps the last good catalog or en and shows a retry control.
- **PS-113-06.R03** Interpolation never fails; a missing param renders as the visible ellipsis marker '…' with a development warning, never as an empty value or an exception, and CI fails when a call site omits a parameter declared in en (V07).

## Specification

- **idempotency:** negotiateLocale and t are pure; setLocale to the current locale is a no-op and dispatches no localechange event.
- **concurrency:** Catalog loads for the same locale share one in-flight promise; a later request for another locale cancels the earlier one, so the last request wins.
- **retries:** Catalog load retries once after 1 s; afterwards the retry control is shown.
- **offline:** All production catalogs are precached together by the service worker at install (F15.S01.M02), so a locale switch never needs the network; en also ships in the main bundle, so the app works fully offline from the first start.
- **partial failure:** A corrupt non-en catalog is ignored with a P0 diagnostic entry in the F15.S03.M01 ring buffer and the UI continues in en.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T02 | unit | PS-113-01.R01, PS-113-02.R02, PS-113-06.R01 | negotiate with LocalSettings.defaultLocale de-AT; with pt-BR stored and browser en-GB; with xx-YY, malformed and empty lists; before unlock; with a selected relay whose Tenant.defaultLocale is fr | de, en via the browser, en, en, en; navigator.languages only before unlock; LocalSettings read only through platform.local_settings.get; Tenant.defaultLocale never consulted; no exception |
| TEST-PS-113-09.T04 | unit | PS-113-03.R02, PS-113-06.R02, PS-113-06.R03, PS-113-07.R03 | remove a key from fr at runtime; corrupt the de catalog JSON; call t() without a declared parameter; reload the page | en string returned with dev warning and a P0 {key, locale} entry in the F15.S03.M01 ring buffer; UI continues in en; missing parameter shown as '…' with dev warning; never raw key or blank; ring buffer empty after reload |
| TEST-PS-113-09.T05 | e2e | PS-113-03.R01, PS-113-06.R01 | switch locale en to de to ar-XB while a form is half filled, with a step recorder; then switch to the active locale | steps run in the order negotiate, load catalog, set lang and dir, re-render, dispatch localechange; setLocale resolves after the event; input and focus preserved; switching to the active locale dispatches nothing |
| TEST-PS-113-09.T09 | unit | PS-113-02.R03, PS-113-06.R03 | lint fixtures with margin-left, padding-right and text-align right; a call site t('offer.price', {}) where en declares {price} | I18N_CSS_PHYSICAL_PROPERTY and I18N_CATALOG_PARAM_MISSING raised with stable codes; logical equivalents and complete call sites pass |

## Dependencies

Module depends on: F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
