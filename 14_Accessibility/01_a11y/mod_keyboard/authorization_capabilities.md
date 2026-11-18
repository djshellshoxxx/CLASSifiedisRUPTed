# PS-109-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-05.R01 | Account-scope binding actions are allowed only for the owning `acc_` (scope `self`). | MVP |
| PS-109-05.R02 | Component focus contracts are readable by any principal (PUBLIC). | MVP |
| PS-109-05.R03 | No operator, moderator or system principal may read or write another account's bindings. | MVP |

## Data / schema
Capability IDs: `keyboard_binding.read`, `keyboard_binding.update`, `keyboard_binding.reset`, `keyboard_contract.read`.

## Commands / queries / events
Maps to [PS-109-04](commands_queries_events.md).

## States & transitions
Not applicable.

## Validation & errors
Unauthorized and unreadable records return `SYS.NOT_FOUND` (CTR-ERR-001 R08).

## Authorization
| Actor | Action | Resource | Decision |
|---|---|---|---|
| acc_ (owner) | keyboard_binding.read, update, reset | own kbb_ | ALLOW |
| acc_ (other) | any binding action | kbb_ of another account | DENY (NOT_FOUND) |
| ope_ / mod_ / sys_ | keyboard_binding.* | any account binding | DENY (default deny, CTR-CAP-001 R01) |
| any | keyboard_contract.read | catalog | ALLOW (PUBLIC) |
| any | device-scope binding | local store | no server check |

Field visibility: binding fields are owner-only; contract fields are public.

## Failure, idempotency, concurrency, offline
Authorization is evaluated at commit time, not at enqueue time, for queued account-scope changes ([PS-116](../../../15_Platform/01_pwa/mod_offline/authorization_capabilities.md)).

## Privacy, retention, abuse
No operator read path exists for bindings; support cannot view a user's shortcut set.

## Observability & budgets
Denied decisions counted by reason code; no principal IDs in client logs.

## Tests
- TEST-PS-109-05-01 unit: decision table rows each produce the stated outcome.
- TEST-PS-109-05-02 integration: other-account read returns NOT_FOUND, same body as nonexistent ID.
- TEST-PS-109-05-03 negative: operator token cannot list bindings.

## Acceptance criteria
1. Default deny holds for every principal type not listed as ALLOW.
2. Cross-account access responses are indistinguishable from nonexistent-ID responses.
3. No operator endpoint exposes bindings.

## Assumptions & open decisions
- ASSUMPTION: device-scope bindings are never transmitted; this is enforced by client code and tested, not by server authorization.
- No Dxx decision directly affects authorization.
