# PS-128-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-03.R01 | `pending` is used only while the owner proves possession of the private key (challenge signature, 5 min window). | MVP |
| PS-128-03.R02 | `rotating` keeps old key valid for verifying signatures for up to 30 days after new key becomes `active` (ASSUMPTION). | MVP |
| PS-128-03.R03 | `revoked` is terminal. Signatures with `occurred_at` after `revoked_at` fail verification; earlier signatures remain valid. | MVP |
| PS-128-03.R04 | `expired` occurs automatically at `valid_until` and is terminal. | MVP |

## Data / schema
`status` field. Events: `key.registered`, `key.activated`, `key.rotated`, `key.revoked`, `key.expired` (CTR-EVT-001, aggregate `key`, public metadata only).

## Commands / queries / events
`key.register`, `key.prove`, `key.rotate`, `key.revoke`, `key.expire` (PS-128-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | register | PS-128-02 passes | pending | emit `key.registered`; challenge issued |
| pending | prove | valid signature over challenge within 5 min | active | emit `key.activated` |
| pending | timeout | 5 min elapsed | (none) | discard |
| active | rotate | successor key active | rotating | emit `key.rotated` |
| rotating | window_end | 30 days elapsed | expired | emit `key.expired` |
| active or rotating | revoke | owner or approved admin (PS-128-05) | revoked | emit `key.revoked`; propagate to federation peers (CTR-FED-001) |
| active | valid_until reached | — | expired | emit `key.expired` |

## Validation & errors
Illegal transitions: `SYS.CONFLICT`. Proof failure: `KEY.PROOF_INVALID` (validation, 400, retryable with new challenge).

## Authorization
Revoke by owner (self) or admin on compromise with F16 approval (PS-128-05).

## Failure, idempotency, concurrency, offline
Transitions idempotent on (`key_id`, from, to). Revocation is effective at the recorded time, not at propagation time; peers see it on next sync.

## Privacy, retention, abuse
Revocation events contain key ID and reason code only.

## Observability & budgets
Metric: `key_state_transitions_total{from,to}`; alert on revocation bursts > 20 per owner per hour (ASSUMPTION).

## Tests
- TEST-PS-128-03-01 (unit): transition table; illegal refused.
- TEST-PS-128-03-02 (integration): signature before revocation verifies; after revocation fails.
- TEST-PS-128-03-03 (integration): rotation window verifies old signatures for 30 days, then not.
- TEST-PS-128-03-04 (negative): proof with stale challenge refused.

## Acceptance criteria
1. Revocation semantics match R03 in conformance tests (TEST-02).
2. TEST-PS-128-03-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 5-minute challenge window; 30-day rotation overlap.
