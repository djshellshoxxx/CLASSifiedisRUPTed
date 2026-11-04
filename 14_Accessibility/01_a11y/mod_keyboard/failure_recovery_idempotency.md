# PS-109-06 — Failure recovery and idempotency: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-06.R01** Focus helpers are idempotent, so calling the route-focus handler twice leaves focus on the same element.
- **PS-109-06.R02** If the intended focus target is missing, the helper falls back in order to the view heading, the main landmark, then the document body and logs a development warning.
- **PS-109-06.R03** Dialog helpers never leave the page inert; unmounting a dialog always removes the inert and aria-hidden state it applied.

## Specification

- **idempotency:** Calling useRouteFocus() or closing an already closed dialog has no further effect.
- **concurrency:** Single-threaded UI; the dialog stack serializes open and close, and rapid double activation opens one dialog.
- **retries:** Not applicable; no network or storage operations.
- **offline:** Fully offline; all code ships in the app shell.
- **partial failure:** If a dialog fails to render, the inert state is cleared and focus is restored to the trigger so the page stays usable.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T03 | e2e | PS-109-01.R03, PS-109-03.R02, PS-109-06.R03 | nested dialogs close in sequence; trigger removed while dialog open | focus restored to triggers in order; fallback to nearest focusable ancestor |
| TEST-PS-109-09.T09 | unit | PS-109-06.R01, PS-109-06.R02, PS-109-06.R03 | call route focus twice; missing target; dialog render error | idempotent; fallback order followed; page not left inert |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
