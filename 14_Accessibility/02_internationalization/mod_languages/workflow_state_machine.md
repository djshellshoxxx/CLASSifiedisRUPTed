# PS-113-03 — Workflow state machine: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-03.R01** Locale switching is a deterministic sequence of negotiate, load catalog, set lang and dir, re-render, announce.
- **PS-113-03.R02** A failed catalog load keeps the previous locale and shows the app in English if none was loaded, so the UI is never blank.
- **PS-113-03.R03** There is no persisted lifecycle, so no entity state machine is declared.

## Specification

**Note:** Stateless library; the locale switch sequence is implemented in code and covered by tests, not stored as an entity lifecycle.

### Timeouts and scheduled transitions

- Catalog load timeout 5 s; on timeout the previous or en catalog stays active and a retry is offered.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T03 | property | PS-113-01.R03, PS-113-03.R01, PS-113-04.R02 | for each shipped locale and counts 0..1000000, compare tp() category to Intl.PluralRules | category matches; every category has a string |
| TEST-PS-113-09.T04 | unit | PS-113-03.R01, PS-113-03.R02, PS-113-06.R02, PS-113-06.R03 | remove a key from fr at runtime; corrupt the de catalog JSON | en string returned, dev warning, local diagnostic entry; UI continues in en; never raw key or blank |
| TEST-PS-113-09.T05 | e2e | PS-113-03.R03, PS-113-06.R01, PS-113-04.R03 | switch locale en to de to ar-XB while a form is half filled | text updates; input and focus preserved; lang and dir updated; announcement in the new language |
| TEST-PS-113-09.T11 | a11y | PS-113-07.R03, PS-113-03.R03 | axe in each shipped locale and pseudolocale | zero serious or critical findings; lang attributes correct on inline foreign text |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
