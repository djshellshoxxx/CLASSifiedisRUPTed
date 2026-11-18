# PS-124-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-06.R01 | Evaluation is deterministic: bucket = first 4 bytes of HMAC-SHA-256(flag salt, pseudonymous subject ID) mod 10000, compared with `rollout_bp`. | MVP |
| PS-124-06.R02 | Flag salt is generated once per flag and changes only on explicit reset approved by two `ope` principals. | MVP |
| PS-124-06.R03 | Store unavailable: nodes evaluate from last-known-good rules up to 15 min old, then return defaults and alert. | MVP |
| PS-124-06.R04 | Evaluation errors return the default value and never throw into user flows. | MVP |
| PS-124-06.R05 | Rule push is all-or-nothing per revision (PS-123 R02 analog). | MVP |

## Data / schema
Evaluation result includes `source` (`live`, `last_known_good`, `default`) for diagnostics without identifiers.

## Commands / queries / events
`flag.evaluate` is pure given rules and subject bucket.

## States & transitions
Not applicable beyond PS-124-03.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| FLAG.RULES_STALE | true | unavailable / 503 | Admin path only; evaluation still returns defaults. |
| FLAG.UNKNOWN_KEY | false | not_found / 404 | Admin path; evaluation returns default. |

## Authorization
Not applicable at evaluation.

## Failure, idempotency, concurrency, offline
Clients use cached values offline for up to 24 h (R09 in PS-124 requirements, see PS-124-07).

## Privacy, retention, abuse
Salt reset changes bucket assignment; reset is audited.

## Observability & budgets
Metric: `flag_evaluations_total{source}`; alert when `default` source > 1% for 10 min.

## Tests
- TEST-PS-124-06-01 (property): same subject and salt always same bucket; distribution within ±1% over 1,000,000 subjects.
- TEST-PS-124-06-02 (fault): store down; last-known-good serves; after 15 min defaults.
- TEST-PS-124-06-03 (integration): rule push partially fails; no node applies partial revision.
- TEST-PS-124-06-04 (unit): evaluation exception returns default.

## Acceptance criteria
1. Bucket determinism and distribution (TEST-01).
2. TEST-PS-124-06-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 15-minute last-known-good window.
