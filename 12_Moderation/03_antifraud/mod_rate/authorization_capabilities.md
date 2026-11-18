# PS-099-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R02, R03, R10), CTR-FED-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-05.R01 | Capability used: `rate.consume` (internal, resource type `rate`, verb `execute`). | MVP |
| PS-099-05.R02 | Only registered `sys_` service principals may call `rate.consume`. Other callers → `SYS.FORBIDDEN`. | MVP |
| PS-099-05.R03 | Policy load requires the F16 signature key (key ID in policy header). Unsigned or unknown-key policies are rejected. | MVP |
| PS-099-05.R04 | Rate limits never grant access; a `RATE.LIMITED` result never changes authorization state. | MVP |
| PS-099-05.R05 | Operators may view class-level aggregate counts only; no per-subject view exists. | MVP |

## Data / schema
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| `sys_` (registered service) | `rate.consume` | class | ALLOW |
| `sys_` (unregistered) | `rate.consume` | class | DENY `SYS.FORBIDDEN` |
| `acc_`, `fpr_`, anonymous | `rate.consume` | any | DENY (internal only) |
| `ope_` | `rate.read_aggregate` | class | ALLOW aggregate |
| `ope_` | any per-subject read | any | DENY (no such capability) |
| F16 signing key | policy load | policy | ALLOW when signature verifies |

Field visibility (CTR-CAP-001 R10): policy `signature_key_id` = `case`; class definitions = `public` (values may be published for transparency, ASSUMPTION).

## Commands / queries / events
No grants are needed for `rate.consume` beyond service registration.

## States & transitions
Authorization does not change state.

## Validation & errors
`SYS.FORBIDDEN` for unregistered callers; `RATE.CLASS_UNKNOWN` only after authorization passes.

## Failure, idempotency, concurrency, offline
Service registration changes take effect within 60 s (ASSUMPTION).

## Privacy, retention, abuse
Callers cannot read bucket contents; `rate.consume` returns only allow or deny with timing.

## Observability & budgets
`rate_authz_denied_total{caller}`; alert on any unregistered caller attempt.

## Tests
- `TEST-PS-099-05-01` unit: matrix rows return outcomes.
- `TEST-PS-099-05-02` negative: unregistered `sys_` consume → `SYS.FORBIDDEN`.
- `TEST-PS-099-05-03` negative: policy with unknown key → rejected.
- `TEST-PS-099-05-04` negative: `ope_` per-subject read unavailable.

## Acceptance criteria
1. No public path reaches `rate.consume`.
2. Unsigned policies never load.
3. Aggregate-only operator view verified.

## Assumptions & open decisions
- ASSUMPTION: registered service list is maintained by F16 with F15.
- D10 (auth and portability), PROVISIONAL default: key rotation for the policy-signing key follows the same user-controlled-key rules (unapproved).
