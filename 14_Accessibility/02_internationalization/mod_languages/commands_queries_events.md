# PS-113-04 — Commands, queries and events: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-04.R01** The module exposes library functions and no vault or relay commands, queries or events.
- **PS-113-04.R02** Functions return strings or Result values and never throw for bad input.
- **PS-113-04.R03** Push alert text is rendered on the device by the service worker from the tpl key with t(); relays never render push text. Only the generic email templates of F13.S01.M02 (no user content, no amounts) may be rendered by the user-selected email relay.

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
| I18N_CATALOG_PARAM_MISSING | 400 | no | CI: a call site omits a parameter declared by the en message |
| I18N_CATALOG_SYNTAX_INVALID | 400 | no | CI: message uses syntax other than {name} placeholders |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: initLocale({ navigatorLanguages }) reads LocalSettings.defaultLocale through the F15.S04.M03 vault-local query platform.local_settings.get once the vault is unlocked; negotiateLocale(requested[], supported[]) -> locale; setLocale(locale) -> Promise<{ locale, dir }> and dispatches localechange { detail: { locale, previous, dir } } on document after re-render (no event when the locale is unchanged); loadCatalog(locale) -> Promise<Catalog> served from the precache; t(key, params?) -> string; tp(key, count, params?) -> string using Intl.PluralRules; dirOf(locale) -> ltr|rtl; formatDate, formatList, formatNumber(locale, ...). String parameters are wrapped in U+2068…U+2069 and stripped of unpaired U+202A–U+202E and U+2066–U+2069 and of every U+202D/U+202E override. Pseudolocales en-XA and ar-XB are generated from en by a build step for CI and development builds.

### Example

```
negotiateLocale(["de-AT", "en-GB"], ["en", "de", "fr", "es"]) // "de"
tp("offers.count", 1, {}) // de: "1 Angebot"
tp("offers.count", 3, {}) // de: "3 Angebote"
t("listing.saved_local") // missing in fr -> returns the en string and warns in development: "i18n missing fr listing.saved_local"
t("listing.title_by", { title: "Bike‮gnp.exe", seller: "Ana" }) // title becomes "⁨Bikegnp.exe⁩" (override removed, isolated)
t("offer.price", {}) // en declares {price}: renders "Price …" and warns in development; CI fails with I18N_CATALOG_PARAM_MISSING
dirOf("ar-XB") // "rtl"
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T03 | property | PS-113-09.R02, PS-113-04.R02 | for each shipped locale and counts 0..1000000, compare tp() category to Intl.PluralRules | category matches; every category has a string; no exception |
| TEST-PS-113-09.T06 | unit | PS-113-04.R01, PS-113-04.R02, PS-113-05.R01, PS-113-05.R02, PS-113-03.R03 | inspect exports, network calls, storage and authorization calls | pure functions or Result values; no vault or relay command; no network call during t(); no persisted state of its own |
| TEST-PS-113-09.T15 | contract | PS-113-04.R03 | service worker receives the push payload {v, ref, tpl: notify.tpl.offers.made, ck, urg} with the vault in de; render every F13.S01.M02 email template with the relay build of the catalogs | alert text rendered on the device by t(tpl) in German; payload carries no text; no relay code path renders push text; email templates declare no parameter carrying user content or Money |

## Dependencies

Module depends on: F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
