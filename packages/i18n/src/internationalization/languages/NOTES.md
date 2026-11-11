# F14.S02.M01 Languages (PS-113)

Headless library (ADR-0016: runs in the vault, no network, no telemetry). No commands, queries, events, capabilities or statement handlers.

## Implemented (index.ts, validate.ts, catalogs.ts)
- `negotiateLocale`, `resolveLocaleSetting` (import of `i18n.locale`: valid tag kept, effective locale negotiated), `dirOf`, `formatNumber/formatDate/formatList`.
- `createI18n(options)`: `t`, `tp`, `loadCatalog`, `setLocale` (negotiate, load, lang/dir, announce; same-locale no-op; last request wins; shared in-flight load; 5 s timeout, one retry after 1 s; failed load keeps previous locale), runtime fallback to en, local diagnostics, dev warnings, single-pass interpolation with bidi stripping and FSI/PDI isolation.
- CI helpers: `validateCatalog` (V01 to V04 message length, allowances from missing-allowed.json data), `validateCatalogSize` (V04 gzip via CompressionStream), `checkLogicalCss` (V06), `generatePseudolocale` (en-XA, ar-XB), `languageErrors` (the six I18N_ codes).
- `catalogs.ts`: seed en/de/fr/es catalogs with the keys both i18n modules need (language.*, listing.saved_local, offers.count, money.approx, money.approx_old, money.approx_unavailable).

## Ports the composition root must supply (`I18nOptions`)
- `loadCatalog(locale: string): Promise<unknown>` (fetch of the bundled JSON; service worker precache).
- `diagnostics?(entry: Diagnostic): void` (local P3 diagnostics store), `warn?`, `dev?`, `applyDocument?(lang, dir)`, `announce?(text, locale)` (polite live region), `languageName?(locale)`.

## Deviations
- The JSON catalogs `packages/i18n/messages/<locale>.json`, the build step that writes pseudolocale files, the CI script that prints the V-codes and the missing-allowed.json file are outside this lane's code directory (rule 1). The library functions they need exist; the seed catalogs are TypeScript objects.
- A key absent from en as well returns the key itself (the alternative is a blank). This is a catalog bug that V01 plus review catch; ADR-0016 has no say here.
- `t()` returns plain strings; HTML escaping is the renderer's job (React text rendering, spec T01 threat).
- A plural entry that lacks a locale-required category is kept at runtime and falls back to `other` (spec edge case); entries with a parameter mismatch, over-long message or no `other` form are dropped so en is used.

## Test rows not covered
- T05, T08, T11 (e2e/a11y need the PWA), T12 (catalog load on 4G and bundle size are not measurable here; a t() speed check exists without the row id), T13 (traceability tool run).

## Open questions
- Where the diagnostics sink lives (F10 settings / local diagnostics) and who purges after 30 days (RET-SHORT).
