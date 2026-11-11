# PS-113-09 — Contract and acceptance tests: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-113-09.R02** Property tests cover plural selection for every shipped locale against CLDR data via Intl.PluralRules.
- **PS-113-09.R03** Pseudolocale end-to-end runs prove no clipping with expansion and correct mirroring in RTL.

## Specification

See the module test table below (all processes).

**Fixtures:** Catalogs en, de, fr, es plus generated en-XA and ar-XB; a broken fixture catalog set (missing key, parameter mismatch, missing plural, 501-character message, nested braces, ICU select syntax); lint fixtures with left and right CSS and a call site missing a declared parameter; LocalSettings fixtures with defaultLocale de, de-AT and pt-BR; a received listing title containing U+202E; three F13.S01.M01 push payloads - a sealed payload {v, urg, s} whose box opens on the device to {v, tpl: notify.tpl.offers.made, ref, ck}, a relay-hook payload {v, urg, tpl: notify.tpl.activity.wake} from the mailbox hook and a digest payload {v, urg, tpl: notify.tpl.system.digest, n: 7}.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T01 | unit | PS-113-01.R02, PS-113-01.R03, PS-113-02.R01 | validate the shipped catalogs, the broken fixtures and a parser fixture set with {name}, nested braces, ICU plural and select syntax and HTML markup | shipped pass; each broken fixture fails with V01, V02, V03, V04 or V08; only {name} placeholders accepted |
| TEST-PS-113-09.T02 | unit | PS-113-01.R01, PS-113-02.R02, PS-113-06.R01 | negotiate with LocalSettings.defaultLocale de-AT; with pt-BR stored and browser en-GB; with xx-YY, malformed and empty lists; before unlock; with a selected relay whose Tenant.defaultLocale is fr | de, en via the browser, en, en, en; navigator.languages only before unlock; LocalSettings read only through platform.local_settings.get; Tenant.defaultLocale never consulted; no exception |
| TEST-PS-113-09.T03 | property | PS-113-09.R02, PS-113-04.R02 | for each shipped locale and counts 0..1000000, compare tp() category to Intl.PluralRules | category matches; every category has a string; no exception |
| TEST-PS-113-09.T04 | unit | PS-113-03.R02, PS-113-06.R02, PS-113-06.R03, PS-113-07.R03 | remove a key from fr at runtime; corrupt the de catalog JSON; call t() without a declared parameter; reload the page | en string returned with dev warning and a P0 {key, locale} entry in the F15.S03.M01 ring buffer; UI continues in en; missing parameter shown as '…' with dev warning; never raw key or blank; ring buffer empty after reload |
| TEST-PS-113-09.T05 | e2e | PS-113-03.R01, PS-113-06.R01 | switch locale en to de to ar-XB while a form is half filled, with a step recorder; then switch to the active locale | steps run in the order negotiate, load catalog, set lang and dir, re-render, dispatch localechange; setLocale resolves after the event; input and focus preserved; switching to the active locale dispatches nothing |
| TEST-PS-113-09.T06 | unit | PS-113-04.R01, PS-113-04.R02, PS-113-05.R01, PS-113-05.R02, PS-113-03.R03 | inspect exports, network calls, storage and authorization calls | pure functions or Result values; no vault or relay command; no network call during t(); no persisted state of its own |
| TEST-PS-113-09.T07 | abuse | PS-113-07.R02, PS-113-07.R04 | params with <script>, {name} and bidi override characters; a received listing title containing U+202E displayed inside the catalog message listing.title_by | rendered as inert text; parameters not re-evaluated; every string parameter wrapped in U+2068…U+2069; unpaired U+202E removed; surrounding message text keeps its logical order |
| TEST-PS-113-09.T08 | e2e | PS-113-09.R03 | run all routes in en-XA (40 percent expansion) and ar-XB at 320 px | no clipping, overlap or horizontal scroll; layout mirrored; V06 passes |
| TEST-PS-113-09.T09 | unit | PS-113-02.R03, PS-113-06.R03 | lint fixtures with margin-left, padding-right and text-align right; a call site t('offer.price', {}) where en declares {price} | I18N_CSS_PHYSICAL_PROPERTY and I18N_CATALOG_PARAM_MISSING raised with stable codes; logical equivalents and complete call sites pass |
| TEST-PS-113-09.T10 | abuse | PS-113-07.R01, PS-113-07.R03, PS-113-05.R03 | capture all network traffic during locale switch, catalog loads, push alert rendering, diagnostics export and the email opt-in with and without notify_email consent | no request carries the chosen locale except the F13.S01.M02 notify.email.add registration, which after consent carries exactly the chosen locale to that one user-selected relay; without consent it is not sent; catalog loads come from the precache; diagnostics leave only in the user-initiated export; the locale change is written only through platform.local_settings.update |
| TEST-PS-113-09.T11 | a11y | PS-113-03.R01 | axe in each shipped locale and pseudolocale | zero serious or critical findings; lang and dir correct on the html element; lang attributes correct on inline foreign text |
| TEST-PS-113-09.T12 | load | PS-113-08.R01, PS-113-08.R02, PS-113-08.R03 | 100 000 t() calls; catalog load on 4G profile; bundle size check | p95 ≤ 0.05 ms, switch ≤ 300 ms, load ≤ 1 s, catalogs ≤ 30 KiB gzip |
| TEST-PS-113-09.T13 | unit | PS-113-09.R01 | traceability tool run | every PS-113 requirement maps to a passing test |
| TEST-PS-113-09.T14 | integration | PS-113-10.R01, PS-113-10.R02, PS-113-10.R03 | add a key and a locale; export and import F15.S04.M03 LocalSettings with defaultLocale de and with pt-BR; roll back a release | new keys fall back to en until translated; de restored after import; pt-BR kept while the browser language or en is used; this module adds no export section; rollback keeps users on a shipped locale |
| TEST-PS-113-09.T15 | contract | PS-113-04.R03 | with the vault in de the service worker receives each of the three F13.S01.M01 push payload forms - a sealed payload {v, urg, s} that opens on the device to {v, tpl: notify.tpl.offers.made, ref, ck}, a relay-hook payload {v, urg, tpl: notify.tpl.activity.wake} from the mailbox hook and a digest payload {v, urg, tpl: notify.tpl.system.digest, n: 7}; render every F13.S01.M02 email template with the relay build of the catalogs | sealed alert text rendered on the device by t(tpl) from the opened box in German; hook alert text rendered by t(tpl) in German; digest rendered by tp(notify.tpl.system.digest, 7) with the de plural form; no form carries text; no relay code path renders push text; email templates declare no parameter carrying user content or Money |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No user ever sees a raw key or an empty string for a missing translation or a missing parameter.
- Pseudolocale runs show no clipping at 40 percent expansion and correct RTL mirroring on every route.

## Dependencies

Module depends on: F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
