# PS-111-04 — Commands, queries and events: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-04.R01** The module exposes command-line tasks and no vault or relay commands, queries or events.
- **PS-111-04.R02** Tasks return exit codes and write machine-readable reports for the release process.
- **PS-111-04.R03** Failures use stable codes so dashboards and triage can group them.

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
| I18N_A11Y_AXE_VIOLATION | 400 | no | serious or critical axe violation without waiver |
| I18N_A11Y_ROUTE_UNCOVERED | 400 | no | route or applicable state lacks an a11y test, or a state exclusion lacks reason or reviewer |
| I18N_A11Y_CONTRAST | 400 | no | colour token pair below required contrast |
| I18N_A11Y_WAIVER_INVALID | 400 | no | waiver missing fields, not exactly one target, expired or longer than 90 days |
| I18N_A11Y_CHECKLIST_INCOMPLETE | 400 | no | manual checklist incomplete for the release |
| I18N_A11Y_REFLOW | 400 | no | content scrolls horizontally or clips at 320 px or with text spacing overrides |
| I18N_A11Y_AUTH_ASSIST | 400 | no | authentication screen blocks paste or autofill, lacks autocomplete or show/hide, or offers transcription only |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** CLI tasks: pnpm a11y:axe --matrix pr|full (Playwright with @axe-core/playwright 4.14.0), pnpm a11y:contrast, pnpm a11y:routes, pnpm a11y:auth, pnpm a11y:waivers, pnpm a11y:report, pnpm a11y:checklist --release <tag>.

### Example

```
$ pnpm a11y:axe --matrix pr
route /listings/:id  state offline-pending  theme dark  viewport 320x640  locale ar-XB
FAIL I18N_A11Y_AXE_VIOLATION color-contrast (serious) wcag2aa 1.4.3 selector .chip--local  -> 2.9:1, needs 4.5:1
$ pnpm a11y:auth
FAIL I18N_A11Y_AUTH_ASSIST route /unlock selector #passphrase  paste event cancelled by handler
$ pnpm a11y:report   # writes tests/a11y/report.json (validated against report.schema.json) and report.html; exit code 1 while any V01..V07 fails
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T07 | integration | PS-111-04.R01, PS-111-04.R02, PS-111-04.R03, PS-111-01.R02 | run each CLI task and validate report.json against tests/a11y/report.schema.json | exit codes and stable error codes present; every finding has route, state, theme, viewport, locale, rule id, impact, selector and WCAG success criterion; a report missing any of the nine fields fails schema validation; no app commands or events |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, F16.S02.M01, F07.S01.M03, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
