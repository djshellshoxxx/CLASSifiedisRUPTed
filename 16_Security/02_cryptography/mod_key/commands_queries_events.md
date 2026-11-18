# PS-128-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-04.R01 | `key.register`, `key.rotate`, `key.revoke` require `idempotency_key`; `key.prove` requires the challenge ID. | MVP |
| PS-128-04.R02 | `key.get` and `key.list` return public metadata only, no ownership details beyond `owner_ref`. | MVP |
| PS-128-04.R03 | Events are CTR-EVT-001 envelopes with `max_data_class = PSEUDONYMOUS` at most. | MVP |

## Data / schema
| Command or query | Signature | Idempotency scope | Emits | Errors |
|---|---|---|---|---|
| `key.register` | (owner_ref, purpose, algorithm, public_key, valid_from, valid_until) | (owner_ref, fingerprint, purpose) | `key.registered` | PS-128-02 codes |
| `key.prove` | (key_id, challenge_id, signature) | (key_id, challenge_id) | `key.activated` | KEY.PROOF_INVALID, SYS.GONE |
| `key.rotate` | (predecessor_key_id, successor_key_id) | (predecessor_key_id) | `key.rotated` | SYS.CONFLICT |
| `key.revoke` | (key_id, reason, expected_revision) | (key_id) | `key.revoked` | CAP.SELF_APPROVAL_FORBIDDEN, SYS.CONFLICT |
| `key.get` / `key.list` | (key_id) / (owner_ref, page) | none | none | SYS.NOT_FOUND |

## States & transitions
Effects per PS-128-03.

## Validation & errors
Per PS-128-02 and PS-128-03.

## Authorization
Per PS-128-05.

## Failure, idempotency, concurrency, offline
Duplicate requests return the original result. `key.revoke` has a revision check.

## Privacy, retention, abuse
`key.list` is rate-limited per caller (`SYS.RATE_LIMITED`) to prevent graph enumeration (CTR-PRV-001 R05 analog).

## Observability & budgets
`key.prove` p95 <= 50 ms server-side (ASSUMPTION).

## Tests
- TEST-PS-128-04-01 (contract): command table matches implementation.
- TEST-PS-128-04-02 (negative): `key.get` response has no private or ownership fields beyond `owner_ref`.
- TEST-PS-128-04-03 (idempotency): repeated register returns same key ID.
- TEST-PS-128-04-04 (abuse): `key.list` throttled at configured limit.

## Acceptance criteria
1. Command table matches implementation.
2. TEST-PS-128-04-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: list rate limit set by F16 (OPEN number).
