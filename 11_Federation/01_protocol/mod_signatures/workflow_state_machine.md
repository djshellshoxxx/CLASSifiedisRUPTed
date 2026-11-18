# PS-085-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R09 key fields; peer states), CTR-EVT-001 (R02 revision), CTR-CAP-001 (R07 dual control, R08 audit), CTR-ERR-001.

Scope: the lifecycle of a key projection row. The key record itself is owned by F16 (see module SPEC). This module reads the lifecycle and applies it to verification.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-03.R01 | Five key states: `pending`, `active`, `expired`, `revoked`, `compromised`. Terminal: `revoked`, `compromised`. Transitions outside the table return `FED.SIGNATURE_INVALID` for verification and are refused for admin actions. | MVP |
| PS-085-03.R02 | `revoked` and `compromised` never return to `active`. A replacement key gets a new `key_id`. | MVP |
| PS-085-03.R03 | A revocation or compromise marking is in force for verification within 5 s of commit (ASSUMPTION; matches PS-089-03 R03). Verifier key cache TTL ≤ 60 s. | MVP |
| PS-085-03.R04 | Rotation: the old key stays `active` until its `valid_until`. Overlap between old and new keys is ≥ 0 s and configurable. Events signed by the old key before its `valid_until` remain valid. | MVP |
| PS-085-03.R05 | Compromise marking requires `compromised_at ≤ now`. A future `compromised_at` is refused. | MVP |

## Data / schema
State is derived from `valid_from`, `valid_until`, `revoked_at`, `compromised_at` (PS-085-01). Each admin transition increments the key record's `revision` under the aggregate lock (CTR-EVT-001 R02).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | key.created | valid public key; `origin_node` known | pending | emit key event (F16) |
| pending | clock reaches `valid_from` | now ≥ `valid_from` | active | cache refresh |
| active | rotation sets `valid_until` | `valid_until` > now | active (until expiry) | cache refresh at expiry |
| active | clock reaches `valid_until` | now ≥ `valid_until` | expired | cache refresh; events with `occurred_at ≥ valid_until` refused |
| active | key.revoked | dual control (PS-085-05); not already terminal | revoked | set `revoked_at`; cache invalidate; audit record |
| active, expired | key.compromised | dual control; `compromised_at ≤ now` | compromised | set `compromised_at`; cache invalidate; audit record; origin peer → quarantine candidate (CTR-FED-001) |
| expired | key.revoked | dual control | revoked | set `revoked_at`; audit record |

## Validation & errors
Invalid transitions return `FED.SIGNATURE_INVALID` on verification. Admin-action refusals use the F16 error code (PENDING F16 registry). No code is minted in this module.

## Authorization
Actor rules in PS-085-05. Self-approval of a revoke or compromise is refused.

## Failure, idempotency, concurrency, offline
- Each admin transition commits with its audit record in one transaction.
- Two concurrent revoke requests: first commit wins; second receives `EVT.REVISION_CONFLICT`.
- Clock-driven transitions (`pending`→`active`, `active`→`expired`) are idempotent; repeats are no-ops.
- Offline: not applicable. Federation key state changes are server-side only.

## Privacy, retention, abuse
Transition records carry key ID, node ID, state and timestamps only.

## Observability & budgets
`fed_key_transitions_total{from,to}`. Alert on any `compromised` transition (page ops and F16).

## Tests
- TEST-PS-085-03-01 (unit): every from × event pair is either in the table or refused.
- TEST-PS-085-03-02 (property): random event sequences never reach `active` from `revoked` or `compromised`.
- TEST-PS-085-03-03 (integration): revoke takes effect for verification within 5 s.
- TEST-PS-085-03-04 (integration): old-key events accepted until `valid_until`, refused after.
- TEST-PS-085-03-05 (unit): `compromised_at` in the future refused.

## Acceptance criteria
1. Transition table is exhaustive; TEST-PS-085-03-01 passes.
2. No terminal-to-active path; TEST-PS-085-03-02 passes.
3. Revocation propagates within 5 s; TEST-PS-085-03-03 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: 5 s propagation; 60 s cache TTL (F15 to confirm).
- ASSUMPTION: dual control for revoke and compromise (F16 to confirm).
- PROVISIONAL (D01 default, unapproved): imported events never activate without local verification.
