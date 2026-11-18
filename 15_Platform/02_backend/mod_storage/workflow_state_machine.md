# PS-119-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07), CTR-EVT-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-03.R01 | Blob states: PENDING_SCAN, AVAILABLE, QUARANTINED, DELETED. | MVP |
| PS-119-03.R02 | No blob is served while PENDING_SCAN or QUARANTINED. | MVP |
| PS-119-03.R03 | DELETED is terminal for bytes; tombstone row kept per PS-119-01. | MVP |
| PS-119-03.R04 | Legal hold blocks DELETED transition (CTR-PRV-001 R07). | MVP |

## Data / schema
`stored_blob.state`, `deleted_at`.

## Commands / queries / events
`blob.put` (creates PENDING_SCAN), `blob.scan_complete`, `blob.quarantine`, `blob.delete`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | blob.put | PS-119-02 passes | PENDING_SCAN | write object, insert row |
| PENDING_SCAN | scan clean | scanner `sys_` result | AVAILABLE | emit none |
| PENDING_SCAN | scan positive | — | QUARANTINED | emit `blob.quarantined` |
| AVAILABLE | owner delete | no legal hold, owner authorized | DELETED | remove object, emit `blob.deleted` |
| AVAILABLE | cascade delete (owner deleted) | retention elapsed | DELETED | as above |
| AVAILABLE | moderation quarantine | `mod_` case decision | QUARANTINED | emit `blob.quarantined` |
| QUARANTINED | case closed clean | `mod_` decision | AVAILABLE | none |
| QUARANTINED | retention elapsed | no hold | DELETED | as above |
| PENDING_SCAN | timeout 15 min | — | QUARANTINED | reason `SCAN_TIMEOUT` |

## Validation & errors
Serving request in PENDING_SCAN or QUARANTINED → `STO.NOT_AVAILABLE` (404 for non-owners per CTR-ERR-001 R08; 422 unprocessable_state for owners, retryable true while PENDING_SCAN).

## Authorization
Transitions by `sys_` scanner or `mod_` (quarantine); owner delete by owner's `acc_`.

## Failure, idempotency, concurrency, offline
Delete is idempotent (repeat returns DELETED). Scan results carry `scan_id`; duplicate results ignored. Upload offline handled by client queue (D08).

## Privacy, retention, abuse
DELETED blobs: bytes removed from object store, CDN purge requested, tombstone row retained 30 days.

## Observability & budgets
Scan queue p95 wait ≤ 60 s (ASSUMPTION). Alert when PENDING_SCAN count > 1000.

## Tests
- TEST-PS-119-03-01 (unit): transition table.
- TEST-PS-119-03-02 (integration): unscanned blob never served (HTTP 422/404).
- TEST-PS-119-03-03 (integration): legal hold blocks delete and records `aud_`.

## Acceptance criteria
1. Zero serving of PENDING_SCAN or QUARANTINED blobs in 10 000 requests test.
2. Delete reaches object store within 24 h.
3. Scan timeout moves to QUARANTINED within 15 min.

## Assumptions & open decisions
- ASSUMPTION: scanner availability and timeouts.
- D07 PROVISIONAL (unapproved): legal-hold exception on delete.
