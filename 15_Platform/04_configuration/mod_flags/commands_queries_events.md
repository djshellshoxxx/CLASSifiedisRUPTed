# PS-124-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-04.R01 | `flag.evaluate` is the only client-reachable operation; it returns evaluated values for the caller's context, never rules. | MVP |
| PS-124-04.R02 | Admin commands require `expected_revision` and `idempotency_key`. | MVP |
| PS-124-04.R03 | `flag.kill` bypasses approval but records actor, reason code and timestamp. | MVP |

## Data / schema
| Command or query | Signature | Idempotency scope | Emits | Errors |
|---|---|---|---|---|
| `flag.evaluate` | (keys[], context allow-list) → values | none (read) | none | FLAG.UNKNOWN_KEY returns default, not error to clients |
| `flag.create` | (definition) | (actor, key) | `flag.created` | FLAG.DEFINITION_INVALID, FLAG.FEATURE_NOT_ACTIVE |
| `flag.update` | (key, patch, expected_revision, change_ref?) | (key, key) | `flag.updated` | FLAG.APPROVAL_MISSING, FLAG.ROLLOUT_INVALID, SYS.CONFLICT |
| `flag.kill` | (key, reason_code) | (key, key) | `flag.killed` | SYS.CONFLICT |
| `flag.clear_kill` | (key, expected_revision) | (key, key) | `flag.updated` | CAP.SELF_APPROVAL_FORBIDDEN |
| `flag.retire` | (key, expected_revision) | (key) | `flag.retired` | FLAG.FEATURE_NOT_ACTIVE |

## States & transitions
Effects per PS-124-03.

## Validation & errors
Per PS-124-02.

## Authorization
Per PS-124-05.

## Failure, idempotency, concurrency, offline
`flag.evaluate` falls back to default on any internal error. Admin commands are retry-safe with the same key.

## Privacy, retention, abuse
`flag.evaluate` accepts only the attribute allow-list; unknown attributes are dropped, not logged with values.

## Observability & budgets
`flag.evaluate` p95 <= 5 ms server-side (ASSUMPTION).

## Tests
- TEST-PS-124-04-01 (contract): command table matches implementation.
- TEST-PS-124-04-02 (negative): evaluate response contains no rule definitions.
- TEST-PS-124-04-03 (concurrency): two rollout updates on the same revision; one succeeds.
- TEST-PS-124-04-04 (fallback): evaluation error returns default values.

## Acceptance criteria
1. Command table matches implementation.
2. TEST-PS-124-04-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: `flag.evaluate` is idempotent and read-only.
