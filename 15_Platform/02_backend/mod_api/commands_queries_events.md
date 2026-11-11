# PS-117-04 — Commands, queries and events: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-04.R01** Commands and queries are declared with defineCommand and defineQuery (name, module, capability, strict zod input, idempotent flag, surface vault, relay or both, deliveryEligible, handler) and registered once; duplicates are rejected at startup.
- **PS-117-04.R02** The dispatch pipeline runs flag, read-only (relay), authn, tenant (TenantPort), rate limit, validation, authorize, idempotency, handler in one transaction, outbox, idempotent response and audit in that order, and each stage short-circuits with its AppError - a CTR-ERR-001 common code, or the unchanged code of the port owner that registered it with defineErrors (PLATFORM_TENANT_SUSPENDED of F15.S04.M03, SECURITY_READ_ONLY_MODE of F16.S03.M03).
- **PS-117-04.R03** Events are CTR-EVT-001 envelopes built from defineEvent(type, version, privacy, payload schema); payloads are validated strictly, written to the local outbox in the handler transaction and published to the EventSink only after commit.
- **PS-117-04.R04** The bus runs in-process in the vault without any network, and the Node HTTP adapter exposes only relay-surface definitions at POST /api/v1/cmd/<name> and POST /api/v1/query/<name> with problem+json errors.
- **PS-117-04.R05** The module provides three relay commands for access tokens; none of them is a vault command and none produces a signed statement.
- **PS-117-04.R06** The read-only stage runs on the relay only - while the ContainmentPort that the relay composition registers reports the sentinel <RELAY_DATA_DIR>/containment/read_only as present (read at most once per second without the database), every command whose exact name is not on the F16.S03.M03 exemption list returns SECURITY_READ_ONLY_MODE (503, retryable, retryAfterMs 300000 rendered as Retry-After 300) before authentication and its handler, queries are never blocked, and a relay composition without a ContainmentPort fails at startup.
- **PS-117-04.R07** The tenant stage runs after authentication and calls the TenantPort that F15.S04.M03 registers by inverted registration, which returns PLATFORM_TENANT_SUSPENDED for writes to a suspended or archived relay tenant; in the vault the composition builds every dispatch context with tenantId = LocalSettings.vaultId read through that port, and a vault dispatch context with another tenantId is refused as a programmer error (INTERNAL).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.access_token.challenge` | platform.access_token.challenge | {} — relay command, public; returns a 32-byte nonce valid 120 s | { nonce, message: classrup-login:v1:<relayId>:<nonce>, expiresAt } | RATE_LIMITED, VALIDATION_FAILED |  | no |
| `platform.access_token.login` | platform.access_token.login | { principal: did:key, nonce, signature over the message by a registered device key } — relay command, public, nonce single use | { token: opaque 256-bit base64url, expiresAt } | UNAUTHENTICATED, VALIDATION_FAILED, RATE_LIMITED |  | no |
| `platform.access_token.revoke` | platform.access_token.revoke | { token } — relay command; possession of the token is the proof | { revoked: true } | VALIDATION_FAILED |  | yes (Idempotency-Key) |

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_BUS_UNSUPPORTED_MEDIA_TYPE | 415 | no | relay HTTP request body is not application/json |
| PLATFORM_BUS_METHOD_NOT_ALLOWED | 405 | no | HTTP method not allowed for the path; the Allow header lists the method |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module: feature modules declare their own vault commands, signed-statement commands and relay commands with defineCommand; the bus only adds the access-token relay commands above. Statements are queued into the F15.S01.M01 sync outbox (OutboxEntry records written inside the command's F15.S02.M03 transaction) only by definitions flagged deliveryEligible. PLATFORM_TENANT_SUSPENDED (F15.S04.M03) and SECURITY_READ_ONLY_MODE (F16.S03.M03) are defined by their owners and returned unchanged through TenantPort and ContainmentPort; the bus lists no depends_on edge to either owner because both depend on this module.

### Example

```
In the vault (no network; vaultId = LocalSettings.vaultId through TenantPort):
  bus.dispatch({ actor: localPrincipal, tenantId: vaultId }, 'bazaar.offer.make', input, { idempotencyKey })
  → ok { status: 201, replayed: false, value: { offerId, revision: 1 }, events: [bazaar.offer.made] }
On a relay:
  POST /api/v1/cmd/platform.access_token.challenge  {}            → 200 { nonce, message, expiresAt }
  POST /api/v1/cmd/platform.access_token.login  { principal, nonce, signature } → 200 { token, expiresAt }
  POST /api/v1/cmd/discovery.projection.publish  Authorization: Bearer <token>  Idempotency-Key: <uuidv7>
  → 201 { … }; the same request again → 201 with Idempotent-Replay: true
  → 422 application/problem+json { type: urn:classrup:error:IDEMPOTENCY_KEY_REUSED, correlationId } on a changed body
Relay in read-only mode (sentinel present):
  POST /api/v1/cmd/bazaar.listing.publish → 503 Retry-After: 300 { code: SECURITY_READ_ONLY_MODE, retryable: true, retryAfterMs: 300000 }
  POST /api/v1/cmd/identity.session.revoke → 200 (exempt); POST /api/v1/query/discovery.search.query → 200
Suspended tenant: member POST /api/v1/cmd/discovery.projection.publish → 403 { code: PLATFORM_TENANT_SUSPENDED }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T06 | unit | PS-117-04.R03, PS-117-10.R02 | defineEvent with bad names and an envelope with an extra payload key | definitions rejected; envelope has exactly the CTR-EVT-001 keys; bad payload throws |
| TEST-PS-117-09.T09 | integration | PS-117-04.R01, PS-117-04.R02 | every stage failing at once (flag off, read-only sentinel on, no token, suspended tenant, limit exceeded, bad input, denied), then fixed one by one | FEATURE_DISABLED, SECURITY_READ_ONLY_MODE, UNAUTHENTICATED, PLATFORM_TENANT_SUSPENDED, RATE_LIMITED, VALIDATION_FAILED, FORBIDDEN in order with port codes unchanged; handler runs only at the end; duplicate registration throws |
| TEST-PS-117-09.T19 | integration | PS-117-04.R04, PS-117-07.R03, PS-117-10.R03 | sample relay over node:http with replay, reuse, 300 KiB body, form body, GET, bad JSON, bad token, vault command, /api/v2 | 201, Idempotent-Replay, problem+json 422, 413, 415, 405, 422, 401, 404, 404; security headers; logs carry truncated IP only |
| TEST-PS-117-09.T25 | integration | PS-117-04.R03 | command emits an event, then a deliveryEligible and a non-eligible definition enqueue through a stub F15.S01.M01 OutboxPort | event in outbox and sink after commit only; eligible OutboxEntry record committed with the command; non-eligible INTERNAL |
| TEST-PS-117-09.T26 | integration | PS-117-04.R05, PS-117-05.R04 | challenge, forged signature, login, nonce replay, expired nonce, idle expiry, revoke, and the same through the relay commands | tokens issued and stored hashed; all bad proofs UNAUTHENTICATED; revoked token rejected |
| TEST-PS-117-09.T27 | integration | PS-117-04.R06 | ContainmentPort stub reports read-only; over node:http dispatch bazaar.listing.publish, platform.access_token.login, identity.session.revoke, security.containment.set and a query; then the sentinel goes off; then start a relay composition without ContainmentPort and a vault dispatch | non-exempt commands 503 SECURITY_READ_ONLY_MODE with Retry-After 300 and their handlers never run; exempt command IDs and the query run; writes accepted within 1 s after off; startup fails without the port; vault unaffected |
| TEST-PS-117-09.T28 | integration | PS-117-04.R07 | TenantPort stub with T1 suspended and T2 active: member command on T1, query on T1, operator configure on T1, command on T2; vault composition with LocalSettings.vaultId V1 dispatches a command, then a context with another tenantId | PLATFORM_TENANT_SUSPENDED 403 after authentication and before rate limiting; query and configure decided by the port; T2 ok; vault records and idempotency rows carry tenantId V1; foreign tenantId INTERNAL |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
