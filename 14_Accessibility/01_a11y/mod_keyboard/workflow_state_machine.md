# PS-109-03 — Workflow state machine: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-03.R01** Focus management is a deterministic function of navigation events and dialog open and close events.
- **PS-109-03.R02** The dialog helper keeps a stack so closing a dialog always restores focus to the element that opened it, or to the nearest focusable ancestor if that element was removed.
- **PS-109-03.R03** There is no persisted lifecycle, so no entity state machine is declared.

## Specification

**Note:** Stateless UI primitives; the dialog stack and focus history exist only in memory for the current page.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T02 | e2e | PS-109-01.R03, PS-109-03.R01 | keyboard-only: tab through the listing form, open and close dialogs, change route | all controls reachable, focus order logical, focus on heading after route change within 100 ms |
| TEST-PS-109-09.T03 | e2e | PS-109-01.R03, PS-109-03.R02, PS-109-06.R03 | nested dialogs close in sequence; trigger removed while dialog open | focus restored to triggers in order; fallback to nearest focusable ancestor |
| TEST-PS-109-09.T07 | unit | PS-109-03.R01, PS-109-03.R02, PS-109-03.R03 | open and close dialogs rapidly in random order (property test, 200 runs) | stack consistent; inert state cleared; focus restored |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
