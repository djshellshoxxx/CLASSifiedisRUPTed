# PS-113-09 — Contract and acceptance tests: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-113-09.R02** Property tests cover plural selection for every shipped locale against CLDR data via Intl.PluralRules.
- **PS-113-09.R03** Pseudolocale end-to-end runs prove no clipping with expansion and correct mirroring in RTL.

## Specification

See the module test table below (all processes).

**Fixtures:** Catalogs en, de, fr, es plus generated en-XA and ar-XB; a broken fixture catalog set (missing key, parameter mismatch, missing plural, 501-character message); lint fixtures with left and right CSS.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T01 | unit | PS-113-01.R01, PS-113-01.R02, PS-113-02.R01 | validate the shipped catalogs and the broken fixtures | shipped pass; each broken fixture fails with V01, V02, V03 or V04 |
| TEST-PS-113-09.T02 | unit | PS-113-01.R03, PS-113-02.R02, PS-113-06.R01 | negotiateLocale for de-AT, pt-BR, xx-YY, malformed, empty list | de, en, en, en, en with no exception |
| TEST-PS-113-09.T03 | property | PS-113-01.R03, PS-113-03.R01, PS-113-04.R02 | for each shipped locale and counts 0..1000000, compare tp() category to Intl.PluralRules | category matches; every category has a string |
| TEST-PS-113-09.T04 | unit | PS-113-03.R01, PS-113-03.R02, PS-113-06.R02, PS-113-06.R03 | remove a key from fr at runtime; corrupt the de catalog JSON | en string returned, dev warning, local diagnostic entry; UI continues in en; never raw key or blank |
| TEST-PS-113-09.T05 | e2e | PS-113-03.R03, PS-113-06.R01, PS-113-04.R03 | switch locale en to de to ar-XB while a form is half filled | text updates; input and focus preserved; lang and dir updated; announcement in the new language |
| TEST-PS-113-09.T06 | unit | PS-113-04.R01, PS-113-04.R02, PS-113-05.R01, PS-113-05.R02 | inspect exports, network calls and authorization calls | pure functions or Result values; no vault or relay command; no network call during t() |
| TEST-PS-113-09.T07 | abuse | PS-113-07.R02, PS-113-07.R01 | params with <script>, {name} and bidi override characters | rendered as inert text; parameters not re-evaluated; bidi isolated |
| TEST-PS-113-09.T08 | e2e | PS-113-01.R03, PS-113-02.R03, PS-113-07.R01 | run all routes in en-XA (40 percent expansion) and ar-XB at 320 px | no clipping, overlap or horizontal scroll; layout mirrored; V06 passes |
| TEST-PS-113-09.T09 | unit | PS-113-02.R03, PS-113-01.R03 | lint fixtures with margin-left, padding-right and text-align right | I18N_CSS_PHYSICAL_PROPERTY raised; logical equivalents pass |
| TEST-PS-113-09.T10 | abuse | PS-113-07.R01, PS-113-07.R03, PS-113-05.R03 | capture network traffic during locale switch and diagnostics export | locale not transmitted by the app; diagnostics only in user-initiated export |
| TEST-PS-113-09.T11 | a11y | PS-113-07.R03, PS-113-03.R03 | axe in each shipped locale and pseudolocale | zero serious or critical findings; lang attributes correct on inline foreign text |
| TEST-PS-113-09.T12 | load | PS-113-08.R01, PS-113-08.R02, PS-113-08.R03 | 100 000 t() calls; catalog load on 4G profile; bundle size check | p95 ≤ 0.05 ms, switch ≤ 300 ms, load ≤ 1 s, catalogs ≤ 30 KiB gzip |
| TEST-PS-113-09.T13 | unit | PS-113-09.R01, PS-113-09.R03 | traceability tool run | every PS-113 requirement maps to a passing test |
| TEST-PS-113-09.T14 | unit | PS-113-09.R02, PS-113-10.R01, PS-113-10.R02, PS-113-10.R03 | add a key and a locale; roll back a release | new keys fall back to en until translated; export and import of i18n.locale works; rollback keeps users on a shipped locale |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- No user ever sees a raw key or an empty string for a missing translation.
- Pseudolocale runs show no clipping at 40 percent expansion and correct RTL mirroring on every route.

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
