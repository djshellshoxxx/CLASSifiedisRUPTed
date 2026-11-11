# PS-109-07 — Privacy, retention and abuse: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-07.R01** The module collects nothing; keyboard events are handled locally and never logged with key values (to avoid capturing typed secrets).
- **PS-109-07.R02** Developer warnings contain element selectors only, never field values.
- **PS-109-07.R03** The PWA sends no telemetry (OBS-7), so accessibility problems found by users are reported by the user through the project issue tracker, optionally attaching the file written by the F15.S03.M01 'Export diagnostics' action; nothing is reported automatically.
- **PS-109-07.R04** Received content cannot move focus, because user-supplied markup is rendered as text, any rich content is sanitised so autofocus, tabindex and on* attributes are removed before it reaches the DOM, and the PWA CSP script-src 'self' without 'unsafe-inline' blocks injected script; the primitives themselves move focus only on user action, route change or dialog open.

## Specification

**Data classification**
- No data stored or transmitted; preference values passed in by the shell are held in memory only.

**Retention**
- None; in-memory focus history and the motion value are discarded on page unload.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Keystroke capture through global key handlers | handlers are scoped to components, never log key values and are covered by a code review lint rule |
| T02 | Focus stealing by received or injected content | user-supplied markup is rendered as text; rich content is sanitised so autofocus, tabindex and on* attributes are removed; CSP script-src 'self' without 'unsafe-inline' blocks injected script; primitives move focus only on user action, route change or dialog open |
| T03 | Clickjacking-like overlays that hide the focused element | V06 check in end-to-end tests and CSP frame-ancestors none |

**Abuse controls**
- Toasts and dialogs are limited to one modal at a time and at most 3 stacked toasts, so content cannot flood the focus order.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T10 | abuse | PS-109-07.R01, PS-109-07.R02, PS-109-07.R03, PS-109-07.R04 | log and network capture while typing a password; render a received listing description containing '<input autofocus>' and an inline script calling focus() | key values never logged; no request leaves the page; markup shown as text; no autofocus, tabindex or on* attribute in the DOM; focus does not move; a securitypolicyviolation event shows the script blocked by CSP |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
