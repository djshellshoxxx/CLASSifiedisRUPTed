# PS-117-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R09), CTR-ERR-001 (R06, R08, R10), CTR-CAP-001 (R10), CTR-ID-001 (R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-07.R01 | Request and response bodies are never logged. | MVP |
| PS-117-07.R02 | Client IP is keyed-hashed (HMAC, key rotated every 30 days, ASSUMPTION) before any storage or rate-limit key use. | MVP |
| PS-117-07.R03 | Anonymous rate limit 60 requests/min per IP-hash; authenticated 300 requests/min per `acc_` (ASSUMPTION). Exceed → `SYS.RATE_LIMITED` (429, `retry_after_ms`). | MVP |
| PS-117-07.R04 | Enumeration defense: unreadable and nonexistent objects return identical 404 bodies (CTR-ERR-001 R08). | MVP |
| PS-117-07.R05 | Request body size, depth and field count limits (PS-117-02) are enforced before handler dispatch. | MVP |

## Data / schema
Access log record (retained 14 days, ASSUMPTION): `request_id`, `route_template`, `status`, `code`, `latency_ms`, `ip_hash`, `actor_ref` (pseudonymous), `schema_version`. No query strings, no bodies, no headers except allow-listed `User-Agent` class.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
`SYS.RATE_LIMITED` (category rate_limited, 429, retryable true). Diagnostics include limit window only.

## Authorization
Log access restricted to `ope_` with `observability.read` (cross-reference F15.S03.M01 observability); no end-user access.

## Failure, idempotency, concurrency, offline
Rate-limit counters are approximate under node failure; fail-open is forbidden for authentication routes (fail-closed, returns 503).

## Privacy, retention, abuse
| Threat | Control |
|---|---|
| Replay of signed or bearer session | short-lived session (F07), idempotency keys (PS-117-06) |
| IDOR via guessed IDs | IDs are not authorization (CTR-ID-001 R07); CTR-CAP-001 decides |
| Mass assignment | strict unknown-field rejection (PS-117-02 R03) |
| Credential stuffing on login routes | owned by F07; api applies stricter per-IP limit |
| Scraping location data | region query budget owned by CTR-PRV-001 R05; api enforces only the quota |

Retention: access logs 14 days; idempotency 24 h; dead letters 7 days.

## Observability & budgets
No log line may contain a value matching PII detectors (CI scan on fixtures). Redaction failure counter must be zero in release tests.

## Tests
- TEST-PS-117-07-01 (security): request with body containing a canary string never appears in logs.
- TEST-PS-117-07-02 (integration): 61st anonymous request in 60 s is rejected with 429.
- TEST-PS-117-07-03 (integration): nonexistent and unreadable IDs produce identical bodies.

## Acceptance criteria
1. Canary test passes in CI for all routes.
2. Raw IP addresses absent from storage (schema scan).
3. Rate-limit thresholds configurable without deployment and recorded in `aud_` on change.

## Assumptions & open decisions
- ASSUMPTION: rate-limit and retention values above.
- D07 (PROVISIONAL default: minimal per-category retention with legal-hold exceptions; unapproved): values above are the api category defaults.
