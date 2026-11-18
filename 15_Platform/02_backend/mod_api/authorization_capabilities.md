# PS-117-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001 (R07), CTR-ERR-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-05.R01 | Every route except the public allow-list requires an authenticated principal (F07 `ses_`). Missing or invalid → 401. | MVP |
| PS-117-05.R02 | The public allow-list is a versioned file reviewed by Security Lead (F16). Initial list: `GET /v1/version` and read-only public listing routes. | MVP |
| PS-117-05.R03 | api never grants capability. Handlers call CTR-CAP-001 decisions; api only checks that the route's declared action exists. | MVP |
| PS-117-05.R04 | Operator routes require `ope_` principal with dual control for version sunset (ASSUMPTION). | MVP |

## Data / schema
Route-to-action map (stored as configuration, validated at startup):

| Route | Action (CTR-CAP-001 R03) | Scope |
|---|---|---|
| POST /v1/commands/* | declared per command by owning module | owner, participant, case |
| GET /v1/{resource}/{id} | `<resource>.read` | per owning module |
| `api_version` admin | `api_version.administer` | global |

## Commands / queries / events
Admin commands: `api_version.deprecate`, `api_version.sunset`. Both require `api_version.administer` on `global` scope.

## States & transitions
Not applicable.

## Validation & errors
Unauthenticated → `SYS.UNAUTHENTICATED` (401). Denied visible object → `SYS.FORBIDDEN` (403). Unreadable object → `SYS.NOT_FOUND` (404) per CTR-ERR-001 R08.

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| anonymous | GET /v1/version | global | allow |
| anonymous | any command | — | deny 401 |
| user (`acc_`) | command declared by owning module | per CTR-CAP-001 | owning module decides |
| `ope_` with administer | version sunset | global | allow with dual control |
| `sys_` (api) | write `api_idempotency` | internal | allow |
| `mod_` | version admin | global | deny |

## Failure, idempotency, concurrency, offline
Authorization decisions are not cached across requests in api (CTR-CAP-001 R09: zero cache for writes). Revocation takes effect at the next request.

## Privacy, retention, abuse
Authorization logs record decision reason codes and `dec_` IDs, never object content (CTR-CAP-001 R13).

## Observability & budgets
Counter `api_authz_denied_total{route_template,code}`. Alert on sudden 10× increase in 401 from one route (ASSUMPTION).

## Tests
- TEST-PS-117-05-01 (unit): each route in the map requires its declared action.
- TEST-PS-117-05-02 (integration): revoked session returns 401 on next request.
- TEST-PS-117-05-03 (security): `mod_` cannot call version admin routes.

## Acceptance criteria
1. No route is reachable without authentication unless listed in the allow-list file.
2. Allow-list diff requires Security Lead approval in CI.
3. Denied and not-found responses for the same object are byte-identical except `request_id`.

## Assumptions & open decisions
- ASSUMPTION: dual control for version sunset.
- D10 (PROVISIONAL default: user-controlled keys with documented recovery; unapproved): api does not hold user keys; signed-request mode is deferred to Future scope.
