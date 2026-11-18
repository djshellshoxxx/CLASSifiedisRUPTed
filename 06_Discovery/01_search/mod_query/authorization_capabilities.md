# PS-046-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R02, R04), CTR-ERR-001 (R08); PENDING CTR-DSC-001.

**Decision labels:** Guest search access is ASSUMPTION (F16 to decide; unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-05.R01 | Search requires capability `discovery.search` (verb `read`, scope `global` for public listings). | MVP |
| PS-046-05.R02 | Guest (unauthenticated) principal may search PUBLIC and LOCATION_COARSE results only; guest budget is keyed by hashed client identifier. | MVP |
| PS-046-05.R03 | Cell existence is checked after authorization; an unauthorized cell returns the same response as an empty cell (no enumeration oracle). | MVP |
| PS-046-05.R04 | Result rows never include fields of a listing the principal could not read through CTR-CAP-001. | MVP |

## Data / schema
| Capability | Scope | Verb | Principals |
|---|---|---|---|
| `discovery.search` | global | read | `acc_`, guest |
| `discovery.search.extended` | self / participant | read | `acc_` (Future: saved searches) |

## Commands / queries / events
Authorization evaluated in state `validated` (PS-046-03). Decision record `dec_` written only on denial (RET-AUD).

## States & transitions
Denied requests transition to `rejected` with `SYS.NOT_FOUND` or `SYS.FORBIDDEN` per CTR-ERR-001 R08.

## Validation & errors
Use `SYS.FORBIDDEN` for capability denial on visible endpoints.

## Authorization
Field visibility: guest sees PUBLIC and LOCATION_COARSE only; `acc_` sees same plus pseudonymous seller views (PSEUDO labels, PS-052).

## Failure, idempotency, concurrency, offline
Capability revocation applies to next request; cursors remain bound to principal and fail if principal changes.

## Privacy, retention, abuse
Guest client identifier hashed with rotating daily key (ASSUMPTION); key not retained beyond 24 h (RET-EPH).

## Observability & budgets
Metric `query_authz_denied_total{principal_type}`.

## Tests
- TEST-PS-046-05-01 (unit): guest request for PUBLIC succeeds; for PRIVATE_PERSONAL field omitted.
- TEST-PS-046-05-02 (security): unregistered-but-valid cell and unauthorized cell return identical bodies.
- TEST-PS-046-05-03 (integration): cursor reused by different principal fails with QUERY.INVALID_CURSOR.

## Acceptance criteria
1. Matrix rows each have one allow and one deny test.
2. Byte-identical responses for unauthorized and empty cells (test over 1 000 cases).
3. No row contains field above LOCATION_COARSE.

## Assumptions & open decisions
- ASSUMPTION: guest search permitted (F16 decision).
