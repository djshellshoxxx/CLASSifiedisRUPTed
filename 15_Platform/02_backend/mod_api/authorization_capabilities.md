# PS-117-05 — Authorization and capabilities: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-05.R01** The bus calls AuthzPort.authorize(actor, capability, resource, context) before the handler and denies by default; the vault composition passes the local principal with vault policy, the relay composition passes the relay actor with relay policy.
- **PS-117-05.R02** FORBIDDEN is mapped to NOT_FOUND when a definition sets hideForbidden (ERR-4), and vault-surface definitions are not reachable from a remote transport.
- **PS-117-05.R03** Every allow and deny decision for a state-changing command is recorded through AuditPort with actor, capability, operation, resource reference, decision and code, never payload content (CAP-7).
- **PS-117-05.R04** A missing session on a definition that requires authentication, or an invalid relay access token, yields UNAUTHENTICATED before rate limiting and validation.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.access_token.challenge | anonymous (relay policy) | relay rate limit per network prefix; no vault capability involved |
| platform.access_token.login | anonymous (relay policy) | valid unexpired single-use nonce and a signature by a device key the relay accepts for the principal |
| platform.access_token.revoke | anonymous (relay policy) | caller presents the token itself; possession is the authorization |

Vault policy: only the unlocked local principal dispatches vault commands; incoming signed statements are verified by their owning modules before any consumer runs. Relay policy: relay roles (member, moderator, operator, admin) exist per relay only (CAP-9) and are re-read on every request (CAP-6).

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T14 | abuse | PS-117-05.R01, PS-117-05.R02, PS-117-05.R04 | denied member, hidden resource, anonymous caller, remote call of a vault command, public relay command | FORBIDDEN, NOT_FOUND, UNAUTHENTICATED, NOT_FOUND, ok |
| TEST-PS-117-09.T15 | abuse | PS-117-05.R03 | deny then allow with a secret value in the input | two audit entries with decision, capability and resource; no input value in audit |
| TEST-PS-117-09.T26 | integration | PS-117-04.R05, PS-117-05.R04 | challenge, forged signature, login, nonce replay, expired nonce, idle expiry, revoke, and the same through the relay commands | tokens issued and stored hashed; all bad proofs UNAUTHENTICATED; revoked token rejected |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
