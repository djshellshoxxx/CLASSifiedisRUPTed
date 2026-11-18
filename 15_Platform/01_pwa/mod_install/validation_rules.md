# PS-115-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-02.R01 | Build fails if the manifest misses any field in PS-115-01.R01 or an icon file is missing or has the wrong pixel size. | MVP |
| PS-115-02.R02 | Build fails if any manifest string contains an environment variable or user-supplied value. | MVP |
| PS-115-02.R03 | Install prompt is shown only when the browser has supplied a deferred prompt event and the user activated the install control. | MVP |
| PS-115-02.R04 | Install control is shown only in states `install_available` or, on iOS Safari, `not_installed` (instructions view). | MVP |

## Data / schema
| Check | Rule | Error code | Retryable | message_key |
|---|---|---|---|---|
| manifest field | R01 | INSTALL.MANIFEST_INVALID (build) | false | n/a (build failure) |
| icon size | R01 | INSTALL.ICON_INVALID (build) | false | n/a (build failure) |
| manifest content | R02 | INSTALL.MANIFEST_DYNAMIC_VALUE (build) | false | n/a (build failure) |
| prompt availability | R03 | INSTALL.PROMPT_UNAVAILABLE | true | err.install.prompt_unavailable |
| control state | R04 | INSTALL.NOT_SUPPORTED | false | err.install.not_supported |

## Commands / queries / events
Build checks run in CI. Runtime codes are local.

## States & transitions
See workflow_state_machine.

## Validation & errors
Runtime errors are shown as plain text with a next step (for example, use the browser menu).

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
Checks deterministic; offline behavior is unaffected.

## Privacy, retention, abuse
None sent to server.

## Observability & budgets
CI report lists each check result.

## Tests
- TEST-PS-115-02-01 (unit): build with missing `short_name` fails.
- TEST-PS-115-02-02 (unit): 191 px icon fails.
- TEST-PS-115-02-03 (integration): install control absent when no prompt and not iOS.
- TEST-PS-115-02-04 (unit): manifest with `${ENV}` placeholder fails build.

## Acceptance criteria
1. Each rule has failing fixture.
2. Build gate in CI blocks release on failure.
3. No runtime manifest mutation.

## Assumptions & open decisions
- ASSUMPTION: iOS detection uses user-agent feature checks (no fingerprinting; see R05 of privacy file).
