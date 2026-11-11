# PS-117-07 — Privacy, retention and abuse: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-07.R01** Problem responses expose only type, title, status, code, retryable, messageKey, params, fields, correlationId and retryAfterMs; never stack traces, SQL, internal messages or another user's data.
- **PS-117-07.R02** IdempotencyRecord rows are scoped to (tenantId, actor, command, key), may hold P2 response bodies, never leave the vault or relay that stored them and are purged after 24 h.
- **PS-117-07.R03** The HTTP adapter enforces 256 KiB JSON bodies, sends Cache-Control no-store, X-Content-Type-Options nosniff and a deny-all CSP on every bus response (the public media route GET /media/v1/*, served by F15.S02.M01 before the bus with Cache-Control public, max-age=31536000, immutable, is exempt from no-store), and never logs the Authorization header, tokens or request bodies.

## Specification

**Data classification**
- IdempotencyRecord: P2 at most (copies a handler response that may contain participant data); local to one vault or relay.
- Relay access token: stored only as SHA-256 of the token with principal, relay roles and timestamps (P1 on that relay).
- Audit entries: actor, capability, resource reference and decision only (RET-AUDIT, owned by F16).

**Retention**
- IdempotencyRecord: RET-SHORT, effective validity 24 h, purged by maintenance.
- Login nonces: RET-EPHEMERAL (120 s); access tokens: until revoked, 7 days idle or 30 days absolute.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Replay of a captured command to repeat its effect | idempotency record with request hash; expectedRevision on mutating commands; replay returns the original result |
| T02 | Enumeration of vault-only or hidden resources through the relay API | vault definitions return NOT_FOUND remotely; hideForbidden maps FORBIDDEN to NOT_FOUND |
| T03 | Error responses leaking internals | problem+json allowlist; INTERNAL carries only code and correlationId; details go to redacted logs |
| T04 | Oversized or non-JSON bodies exhausting the relay | 256 KiB limit checked from Content-Length and while streaming; JSON-only media type |
| T05 | Stolen relay access token reuse | opaque 256-bit token stored hashed, idle and absolute expiry, revoke command, never placed in URLs or logs |
| T06 | Login replay with an observed signature | nonce single use with 120 s TTL; the signed message binds relayId and nonce |
| T07 | Activity timing inferred from millisecond UUIDv7 IDs in public projections | hour-floored generator for public-projection IDs and the publicId validator (ID-8); ordering inside an hour comes from the envelope seq, never from the ID |

**Abuse controls**
- RateLimitPort runs before validation for every command and query, so floods of invalid requests are throttled too.
- Audit records every deny, which feeds relay abuse review (F12.S03) without payload content.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T13 | integration | PS-117-01.R03, PS-117-07.R02, PS-117-10.R01 | replay at 24 h - 1 ms and at 24 h, then purge | replay before expiry, execution after; purge removes one row |
| TEST-PS-117-09.T18 | unit | PS-117-07.R01, PS-117-10.R02 | render problem JSON and snapshot the common code table | exact RFC 9457 fields; no stack; table equals CTR-ERR-001 plus ID_TIMESTAMP_SKEW; defineErrors rules |
| TEST-PS-117-09.T19 | integration | PS-117-04.R04, PS-117-07.R03, PS-117-10.R03 | sample relay over node:http with replay, reuse, 300 KiB body, form body, GET, bad JSON, bad token, vault command, /api/v2 | 201, Idempotent-Replay, problem+json 422, 413, 415, 405, 422, 401, 404, 404; security headers; logs carry truncated IP only |
| TEST-PS-117-09.T29 | integration | PS-117-07.R03 | GET /media/v1/sha256-X through the relay server with the F15.S02.M01 media route registered, then a bus command and a bus problem response | media response Cache-Control public, max-age=31536000, immutable and no no-store; every bus response Cache-Control no-store with nosniff and deny-all CSP |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
