# PS-109-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-08.R01 | Metrics emitted for conflicts, resets, focus-trap escapes and stale responses. | MVP |
| PS-109-08.R02 | Keydown-to-action latency p95 ≤ 50 ms on reference mid-range device (ASSUMPTION). | MVP |
| PS-109-08.R03 | Logs redact chord values and any element text. | MVP |

## Data / schema
Metric names: `kbd_binding_conflict_total{code}`, `kbd_binding_reset_total`, `kbd_focus_trap_escape_total`, `kbd_stale_response_total`, `kbd_shortcut_latency_ms` (histogram).

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Metric labels limited to error codes from CTR-ERR-001.

## Authorization
Metrics readable by Accessibility Lead and QA Lead roles only.

## Failure, idempotency, concurrency, offline
Metrics buffered locally when offline; flushed after reconnect; dropped after 24 h.

## Privacy, retention, abuse
No account ID in client metrics; server metrics carry pseudonymous `acc_` only where needed for debugging, retained 14 days (ASSUMPTION).

## Observability & budgets
| Budget | Target |
|---|---|
| Keydown to action p95 | ≤ 50 ms |
| Focus restore after dialog close p95 | ≤ 100 ms |
| `kbd.binding.list` server p95 | ≤ 200 ms |
| Client bundle added for keyboard module | ≤ 10 KiB gzip (ASSUMPTION) |

## Tests
- TEST-PS-109-08-01 performance: synthetic keydown benchmark on reference device.
- TEST-PS-109-08-02 static: log lines in test run contain no chord values.

## Acceptance criteria
1. All five metrics present in staging dashboards.
2. Latency budgets met in the performance test run; failures block release.
3. No chord or element text appears in captured logs.

## Assumptions & open decisions
- ASSUMPTION: reference device is defined at implementation time.
- No Dxx decision directly affects observability.
