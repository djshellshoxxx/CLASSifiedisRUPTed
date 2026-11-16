# PS-109-07 — Privacy, retention and abuse: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-07.R01** The module collects nothing; keyboard events are handled locally and never logged with key values (to avoid capturing typed secrets).
- **PS-109-07.R02** Developer warnings contain element selectors only, never field values.
- **PS-109-07.R03** The PWA sends no telemetry (OBS-7), so accessibility problems found by users are reported by the user through the normal feedback form, not automatically.

## Specification

**Data classification**
- No data stored or transmitted.

**Retention**
- None; in-memory focus history is discarded on page unload.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Keystroke capture through global key handlers | handlers are scoped to components, never log key values and are covered by a code review lint rule |
| T02 | Focus stealing by third-party or injected content | focus moves only on user action or route change; no autofocus except in dialogs and the first field of a form the user opened |
| T03 | Clickjacking-like overlays that hide the focused element | V06 check in end-to-end tests and CSP frame-ancestors none |

**Abuse controls**
- Toasts and dialogs are limited to one modal at a time and at most 3 stacked toasts, so content cannot flood the focus order.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T10 | abuse | PS-109-07.R01, PS-109-07.R02, PS-109-07.R03 | log capture while typing a password and injecting content that calls focus() | key values never logged; injected focus calls do not move focus without user action |
| TEST-PS-109-09.T11 | a11y | PS-109-01.R03, PS-109-07.R03 | axe on pages using each primitive in light, dark and forced colors | zero serious or critical findings |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
