# PS-113-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-05.R01 | Catalog reads are public; no capability is required. | MVP |
| PS-113-05.R02 | Language preference changes require the owner's `profile.update` capability (F07). | MVP |
| PS-113-05.R03 | No actor other than the owner can see or change a user's language preference through this module. | MVP |
| PS-113-05.R04 | Catalog deployment is restricted to the release pipeline `sys_` principal (purpose `catalog_release`). | MVP |

## Data / schema
| Principal | Capability | Scope | Outcome |
|---|---|---|---|
| anyone | catalog read | public | ALLOW |
| user (owner) | `profile.update` (field language) | self | ALLOW (F07 rule) |
| user (other) | language read | foreign | DENY → SYS.NOT_FOUND |
| sys (release) | `catalog.publish` | global | ALLOW (grant, purpose catalog_release) |
| ope, mod | `profile.update` on language | any | DENY (STATE_FORBIDS) |

## Commands / queries / events
Catalog publish emits an `aud_` record and event `catalog.published` (aggregate catalog, no prefix; PENDING CTR-ID-001 if events needed).

## States & transitions
Grant lifecycle.

## Validation & errors
Standard CTR-CAP-001 denial codes.

## Authorization
Server-side for publish and profile writes.

## Failure, idempotency, concurrency, offline
Revocation effective next publish.

## Privacy, retention, abuse
Language preference is PSEUDONYMOUS; kept with profile (RET-ACC).

## Observability & budgets
Counter of publishes.

## Tests
- TEST-PS-113-05-01 (unit): anonymous catalog read succeeds.
- TEST-PS-113-05-02 (integration): operator write to another user's language denied.
- TEST-PS-113-05-03 (integration): publish without grant denied.
- TEST-PS-113-05-04 (contract): no route exposes language preference of another account.

## Acceptance criteria
1. Matrix matches tests.
2. Publish requires grant.
3. No cross-account language reads.

## Assumptions & open decisions
- ASSUMPTION: release pipeline has a `sys_` principal registered with F16.
- No Dxx applies.
