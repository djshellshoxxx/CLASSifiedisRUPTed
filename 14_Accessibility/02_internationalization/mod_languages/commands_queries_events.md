# PS-113-04 — Commands, queries and events: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-04.R01** The module exposes library functions and no vault or relay commands, queries or events.
- **PS-113-04.R02** Functions return strings or Result values and never throw for bad input.
- **PS-113-04.R03** Relay-rendered text (emails if enabled, push templates) uses the same catalogs through the same functions.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| I18N_CATALOG_KEY_MISSING | 400 | no | CI: a locale lacks a key present in en |
| I18N_CATALOG_PARAM_MISMATCH | 400 | no | CI: parameter sets differ between locales |
| I18N_CATALOG_PLURAL_INCOMPLETE | 400 | no | CI: plural categories missing for the locale |
| I18N_CATALOG_TOO_LARGE | 400 | no | CI: message or catalog exceeds size limits |
| I18N_LOCALE_UNSUPPORTED | 400 | no | locale tag invalid or not shipped; en is used |
| I18N_CSS_PHYSICAL_PROPERTY | 400 | no | CI: physical CSS direction property used |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: negotiateLocale(requested[], supported[]) -> locale; loadCatalog(locale) -> Promise<Catalog>; t(key, params?) -> string; tp(key, count, params?) -> string using Intl.PluralRules; dirOf(locale) -> ltr|rtl; formatDate, formatList, formatNumber(locale, ...). Pseudolocales en-XA and ar-XB are generated from en by a build step.

### Example

```
negotiateLocale(["de-AT", "en-GB"], ["en", "de", "fr", "es"]) // "de"
tp("offers.count", 1, {}) // de: "1 Angebot"
tp("offers.count", 3, {}) // de: "3 Angebote"
t("listing.saved_local") // missing in fr -> returns the en string and warns in development: "i18n missing fr listing.saved_local"
dirOf("ar-XB") // "rtl"
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T03 | property | PS-113-01.R03, PS-113-03.R01, PS-113-04.R02 | for each shipped locale and counts 0..1000000, compare tp() category to Intl.PluralRules | category matches; every category has a string |
| TEST-PS-113-09.T05 | e2e | PS-113-03.R03, PS-113-06.R01, PS-113-04.R03 | switch locale en to de to ar-XB while a form is half filled | text updates; input and focus preserved; lang and dir updated; announcement in the new language |
| TEST-PS-113-09.T06 | unit | PS-113-04.R01, PS-113-04.R02, PS-113-05.R01, PS-113-05.R02 | inspect exports, network calls and authorization calls | pure functions or Result values; no vault or relay command; no network call during t() |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
