# PS-115-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-04.R01 | No server command or event. The module uses browser events only: `beforeinstallprompt`, `appinstalled`, service worker `waiting`. | MVP |
| PS-115-04.R02 | Local operations: `install.show_prompt` (user-initiated), `install.show_instructions`, `update.apply` (user-initiated), `data.clear` (confirmed). | MVP |
| PS-115-04.R03 | Each local operation is idempotent. | MVP |
| PS-115-04.R04 | No install or update event leaves the device. | MVP |

## Data / schema
| Operation | Trigger | Idempotent | Errors |
|---|---|---|---|
| `install.show_prompt` | user activates control | yes | INSTALL.PROMPT_UNAVAILABLE |
| `install.show_instructions` | iOS Safari, control activated | yes | none |
| `update.apply` | user accepts reload | yes | INSTALL.DRAFT_PRESENT (guard) |
| `data.clear` | user confirms | yes | INSTALL.CLEAR_BLOCKED_PENDING_WRITES |

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Local; no server authorization.

## Failure, idempotency, concurrency, offline
Operations work offline. Prompt availability is browser-determined.

## Privacy, retention, abuse
No data leaves device.

## Observability & budgets
Local timing only. Operation latency ≤ 100 ms to show UI.

## Tests
- TEST-PS-115-04-01 (contract): network trace shows zero requests from install operations.
- TEST-PS-115-04-02 (unit): `install.show_prompt` twice shows prompt once.
- TEST-PS-115-04-03 (integration): `data.clear` with pending items returns guard error.
- TEST-PS-115-04-04 (unit): `update.apply` with draft present does not reload.

## Acceptance criteria
1. Zero network calls from install module.
2. Guards verified.
3. Idempotent operations verified.

## Assumptions & open decisions
- ASSUMPTION: no install analytics in MVP.
- No Dxx applies.
