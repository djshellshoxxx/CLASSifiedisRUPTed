# PS-113-06 — Failure recovery and idempotency: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-06.R01** Locale negotiation and catalog lookup are pure and idempotent; switching to the active locale does nothing.
- **PS-113-06.R02** If a catalog fails to load or parse, the app keeps the last good catalog or en and shows a retry control.
- **PS-113-06.R03** Interpolation never fails; a missing param renders as an empty value with a development warning, not an exception.

## Specification

- **idempotency:** negotiateLocale and t are pure; setLocale to the current locale is a no-op.
- **concurrency:** Catalog loads for the same locale share one in-flight promise; a later request for another locale cancels the earlier one, so the last request wins.
- **retries:** Catalog load retries once after 1 s; afterwards the retry control is shown.
- **offline:** All catalogs are precached by the service worker after first load; en ships in the main bundle so the app works fully offline.
- **partial failure:** A corrupt non-en catalog is ignored with a local diagnostic entry and the UI continues in en.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T02 | unit | PS-113-01.R03, PS-113-02.R02, PS-113-06.R01 | negotiateLocale for de-AT, pt-BR, xx-YY, malformed, empty list | de, en, en, en, en with no exception |
| TEST-PS-113-09.T04 | unit | PS-113-03.R01, PS-113-03.R02, PS-113-06.R02, PS-113-06.R03 | remove a key from fr at runtime; corrupt the de catalog JSON | en string returned, dev warning, local diagnostic entry; UI continues in en; never raw key or blank |
| TEST-PS-113-09.T05 | e2e | PS-113-03.R03, PS-113-06.R01, PS-113-04.R03 | switch locale en to de to ar-XB while a form is half filled | text updates; input and focus preserved; lang and dir updated; announcement in the new language |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
