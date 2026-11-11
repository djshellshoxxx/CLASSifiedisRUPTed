# PS-109-04 — Commands, queries and events: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-04.R01** The module exposes component APIs and CSS tokens, not vault or relay commands or queries.
- **PS-109-04.R02** Components emit DOM events only (for example close and reorder) and no domain events.
- **PS-109-04.R03** Errors are developer-facing lint and test failures with stable codes and never reach end users.

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
| I18N_A11Y_TABINDEX_POSITIVE | 400 | no | build failure for tabindex greater than 0 |
| I18N_A11Y_NON_INTERACTIVE_HANDLER | 400 | no | build failure for handlers on non-interactive elements |
| I18N_A11Y_TARGET_SIZE | 400 | no | interactive element smaller than 44 by 44 CSS px |
| I18N_A11Y_NO_DRAG_ALTERNATIVE | 400 | no | drag interaction without a single-pointer alternative |
| I18N_A11Y_KEYBOARD_TRAP | 400 | no | focus cannot leave a component by keyboard |
| I18N_A11Y_FOCUS_OBSCURED | 400 | no | focused element is hidden behind a sticky element |
| I18N_A11Y_SINGLE_KEY_SHORTCUT | 400 | no | single-character shortcut without off switch |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: <SkipLink/>, useRouteFocus(), openDialog(options) -> Promise<result>, createRovingList(), createReorderList({ items, onMove }) with move-up and move-down buttons, createSlider() with arrow keys and numeric input, tokens in css/a11y-tokens.css.

### Example

```
const result = await openDialog({ title: t("listing.delete.title"), confirmLabel: t("common.delete"), destructive: true });
// focus moves to the dialog heading, Tab cycles inside, Escape resolves { confirmed: false }, focus returns to the trigger button
createReorderList({ items: photos, onMove: (from, to) => reorder(from, to) }); // renders "Move earlier" and "Move later" buttons beside every drag handle
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T08 | unit | PS-109-04.R01, PS-109-04.R02, PS-109-04.R03, PS-109-05.R01, PS-109-05.R02, PS-109-05.R03 | inspect module exports, DOM events and network calls | no domain events, no vault or network access, errors are lint codes |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
