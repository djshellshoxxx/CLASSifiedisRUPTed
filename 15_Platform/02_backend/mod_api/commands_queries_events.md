# PS-117-04 — Commands, queries and events: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-04.R01** Commands and queries are declared with defineCommand and defineQuery (name, module, capability, strict zod input, idempotent flag, surface vault, relay or both, deliveryEligible, handler) and registered once; duplicates are rejected at startup.
- **PS-117-04.R02** The dispatch pipeline runs flag, authn, rate limit, validation, authorize, idempotency, handler in one transaction, outbox, idempotent response and audit in that order, and each stage short-circuits with its CTR-ERR-001 code.
- **PS-117-04.R03** Events are CTR-EVT-001 envelopes built from defineEvent(type, version, privacy, payload schema); payloads are validated strictly, written to the local outbox in the handler transaction and published to the EventSink only after commit.
- **PS-117-04.R04** The bus runs in-process in the vault without any network, and the Node HTTP adapter exposes only relay-surface definitions at POST /api/v1/cmd/<name> and POST /api/v1/query/<name> with problem+json errors.
- **PS-117-04.R05** The module provides three relay commands for access tokens; none of them is a vault command and none produces a signed statement.

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

**Note:** Library module: feature modules declare their own vault commands, signed-statement commands and relay commands with defineCommand; the bus only adds the access-token relay commands above. Statements are queued into the F15.S02.M03 sync outbox only by definitions flagged deliveryEligible.

### Example

```
In the vault (no network):
  bus.dispatch({ actor: localPrincipal, tenantId: vaultId }, 'bazaar.offer.make', input, { idempotencyKey })
  → ok { status: 201, replayed: false, value: { offerId, revision: 1 }, events: [bazaar.offer.made] }
On a relay:
  POST /api/v1/cmd/platform.access_token.challenge  {}            → 200 { nonce, message, expiresAt }
  POST /api/v1/cmd/platform.access_token.login  { principal, nonce, signature } → 200 { token, expiresAt }
  POST /api/v1/cmd/discovery.projection.publish  Authorization: Bearer <token>  Idempotency-Key: <uuidv7>
  → 201 { … }; the same request again → 201 with Idempotent-Replay: true
  → 422 application/problem+json { type: urn:classrup:error:IDEMPOTENCY_KEY_REUSED, correlationId } on a changed body
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T06 | unit | PS-117-04.R03, PS-117-10.R02 | defineEvent with bad names and an envelope with an extra payload key | definitions rejected; envelope has exactly the CTR-EVT-001 keys; bad payload throws |
| TEST-PS-117-09.T09 | integration | PS-117-04.R01, PS-117-04.R02 | every stage failing at once, then fixed one by one | FEATURE_DISABLED, UNAUTHENTICATED, RATE_LIMITED, VALIDATION_FAILED, FORBIDDEN in order; handler runs only at the end; duplicate registration throws |
| TEST-PS-117-09.T19 | integration | PS-117-04.R04, PS-117-07.R03, PS-117-10.R03 | sample relay over node:http with replay, reuse, 300 KiB body, form body, GET, bad JSON, bad token, vault command, /api/v2 | 201, Idempotent-Replay, problem+json 422, 413, 415, 405, 422, 401, 404, 404; security headers; logs carry truncated IP only |
| TEST-PS-117-09.T25 | integration | PS-117-04.R03 | command emits an event, then a deliveryEligible and a non-eligible sync enqueue | event in outbox and sink after commit only; eligible enqueue prepared; non-eligible INTERNAL |
| TEST-PS-117-09.T26 | integration | PS-117-04.R05, PS-117-05.R04 | challenge, forged signature, login, nonce replay, expired nonce, idle expiry, revoke, and the same through the relay commands | tokens issued and stored hashed; all bad proofs UNAUTHENTICATED; revoked token rejected |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
