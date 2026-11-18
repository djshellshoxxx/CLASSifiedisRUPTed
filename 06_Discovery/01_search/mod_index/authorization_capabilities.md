# PS-045-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001; PENDING CTR-DSC-001.

**Decision labels:** Capability grant model is PROVISIONAL (ASSUMPTION, unapproved). Default-deny is required (CTR-CAP-001 R01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-05.R01 | Index writes are allowed only for principal `sys_` with grant `index.consume` scoped `global` (consumer service). | MVP |
| PS-045-05.R02 | `index.suppress` requires `moderate` on `case:<cas_>` (F12). | MVP |
| PS-045-05.R03 | `index.rebuild` requires `administer` by `ope_` with dual control; `scope: all` requires two distinct `ope_` approvers. | MVP |
| PS-045-05.R04 | No principal other than the index consumer can write index docs directly. | MVP |
| PS-045-05.R05 | Denied requests return `SYS.NOT_FOUND` where the object is unreadable (CTR-ERR-001 R08). | MVP |

## Data / schema
Capability grants are `grt_` records (CTR-ID-001 prefix `grt`). Required grants:

| Capability | Resource scope | Verb (CTR-CAP-001 R03) | Holder |
|---|---|---|---|
| `index.consume` | global | execute | `sys_` consumer |
| `index.suppress` | case:`cas_` | moderate | `mod_` |
| `index.lift` | case:`cas_` | moderate | `mod_` plus `ope_` approval |
| `index.rebuild` | global | administer | `ope_` (dual) |

## Commands / queries / events
Authorization is evaluated before any command in PS-045-04 executes. Each decision writes a `dec_` record (CTR-ID-001 prefix `dec`).

## States & transitions
Grant revocation takes effect for new commands immediately; in-flight consumer batches finish under the grant they started with (ASSUMPTION).

## Validation & errors
Missing grant → `SYS.FORBIDDEN` for writes on visible resources, `SYS.NOT_FOUND` for hidden ones (CTR-ERR-001 R08).

## Authorization
Actor × action × resource matrix above. Field visibility: index query results expose only PUBLIC and LOCATION_COARSE fields (CTR-CAP-001 field visibility).

## Failure, idempotency, concurrency, offline
Authorization is re-checked on retry; a revoked grant turns a retry into `SYS.FORBIDDEN` (non-retryable).

## Privacy, retention, abuse
Decision records follow RET-AUD (12 months). Operator access to rebuild logs is limited to IDs.

## Observability & budgets
Metric `index_authz_denied_total{capability}`. Alert on any denial of `index.consume` (indicates misconfigured consumer).

## Tests
- TEST-PS-045-05-01 (unit): default deny for each capability without grant.
- TEST-PS-045-05-02 (integration): `scope: all` rebuild with one approver is refused.
- TEST-PS-045-05-03 (security, future): direct write attempt by `mod_` principal is denied and logged.

## Acceptance criteria
1. Matrix above implemented as code-level policy table with one test per row.
2. Dual-control rebuild enforced in integration test.
3. No index field exposed to a principal lacking CTR-CAP-001 field visibility.

## Assumptions & open decisions
- ASSUMPTION: capability names above are proposals pending F16 registry approval.
- D10 PROVISIONAL (user-controlled keys out of scope for index).
