# PS-115-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001. This module has no server database entity; all state is device-local.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-01.R01 | Web app manifest: `name` "ClassRup", `short_name` "ClassRup", `start_url` "/", `display` "standalone", `lang` from build default, `theme_color` from design token. | MVP |
| PS-115-01.R02 | Icons: 192 px and 512 px PNG, plus a 512 px maskable icon with safe zone. | MVP |
| PS-115-01.R03 | Install state enum on device: `not_installed`, `install_available`, `installed`, `update_waiting`. | MVP |
| PS-115-01.R04 | Local keys (`localStorage`, try/catch): `install.dismissed_at` only. No other key. | MVP |

## Data / schema
```json
manifest.webmanifest  (static, build-time)
{ "name": "ClassRup", "short_name": "ClassRup", "start_url": "/", "display": "standalone",
  "background_color": "<token>", "theme_color": "<token>",
  "icons": [ { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
             { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" } ] }
```
Manifest fields are fixed at build time. No user input reaches the manifest (anti-spoofing).

Local install state is derived, not stored, except `install.dismissed_at`.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-115-01-01 (contract): manifest validates against the W3C manifest fields used; CI fails on missing icon.
- TEST-PS-115-01-02 (unit): manifest build contains no user-derived value.
- TEST-PS-115-01-03 (unit): `install.dismissed_at` is the only key written by this module.
- TEST-PS-115-01-04 (a11y): maskable icon safe zone check (visual).

## Acceptance criteria
1. Manifest and icons present in build artifacts.
2. Only one localStorage key written (scan).
3. Icons pass safe-zone review.

## Assumptions & open decisions
- ASSUMPTION: product name "ClassRup" is the app name; final branding is out of scope.
- No Dxx applies.
