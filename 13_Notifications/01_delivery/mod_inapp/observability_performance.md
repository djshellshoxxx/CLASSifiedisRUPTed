# PS-103-08 — local diagnostics and performance budgets

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-08 (R01–R03). **Owner:** [module](SPEC.md). **Implementation:** none.

## PS-103-08.R01 — observability boundary

This module has no hosted service, telemetry collector, remote crash reporting or global delivery metric. Default diagnostics are off. If F15's opt-in local diagnostic ring is later enabled, record only aggregate counters and typed error codes, never notice text, event payload/IDs, principal/vault IDs, target IDs, correlation IDs, locale text, or preference values. F15 owns diagnostic storage and its 1,000-entry/7-day cap.

## PS-103-08.R02 — proposed local budgets

On a declared reference device with an unlocked vault and available local store, proposed targets are: p95 event-to-row transaction <=100 ms for an individual event; p95 query/render <=200 ms for 100 rows; virtualized scrolling remains responsive at 1,000 rows; catch-up processes <=100 source events per transaction before yielding. These are engineering targets, not service SLOs or measured claims. Data set, browser/version, device profile, storage mode and measurement harness must accompany future results.

No timing target applies when the browser is closed, storage is denied/evicted, vault is locked, or optional preference/persistence dependencies are unavailable. UI must distinguish `local_pending`, `locally recorded`, `suppressed by preference`, `session only`, `pending retry`, and `inbox full`; none may be rendered as remote delivery or read receipt.

## PS-103-08.R03 — accessibility and operating states

Use a semantic inbox list, a named `Mark read` action, visible status text and a polite live region for a generic newly-created notice. Do not rely on color, animation, sound or timing alone. Respect reduced motion, zoom/reflow, keyboard operation and screen-reader naming. Quiet hours suppress live-region interruptions; an enabled inbox remains navigable. Localization uses fixed keys with plural/RTL support; no formatted money/date conversion changes the underlying record.

## Acceptance mapping

- `TEST-PS-103-08`: benchmark the named data set/device/browser; verify yield and virtualization; ensure diagnostics are off by default and redact IDs/content; keyboard/screen-reader/reduced-motion/contrast/RTL review; verify states are text-labelled. These targets are unmeasured and tests unexecuted.
