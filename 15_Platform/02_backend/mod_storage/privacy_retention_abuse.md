# PS-119-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R06, R07, R09, R10, R11), CTR-CAP-001 (R10), CTR-ERR-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-07.R01 | All location metadata removed from images before storage (PS-119-02 R05). | MVP |
| PS-119-07.R02 | Storage keys and object paths carry no owner ID, filename or content hash. | MVP |
| PS-119-07.R03 | Upload rate ≤ 30 per `acc_` per hour (ASSUMPTION); exceed → `SYS.RATE_LIMITED`. | MVP |
| PS-119-07.R04 | Retention per owner scope; deletion propagates to replicas, caches and CDN within 24 h (CTR-PRV-001 R06). | MVP |
| PS-119-07.R05 | Scanner and sweeper logs contain blob IDs and codes only. | MVP |

## Data / schema
Data classes: listing photos default PUBLIC after strip; attachments per owner (PRIVATE_PERSONAL or FINANCIAL_EVIDENCE for evidence PDFs, CTR-PRV-001 class); profile images PSEUDONYMOUS.

## Commands / queries / events
None.

## States & transitions
Retention purge per PS-119-03.

## Validation & errors
`STO.CLASS_DOWNGRADE` (PS-119-02). Privacy checks never reveal the class to non-owners.

## Authorization
Class visible only to owner and authorized participant (CTR-CAP-001 R10).

## Failure, idempotency, concurrency, offline
Purge retried until confirmed; purge receipt stored as completion record (CTR-PRV-001 R12).

## Privacy, retention, abuse
| Threat | Control |
|---|---|
| EXIF or GPS leakage | strip and re-encode (PS-119-02) |
| Malicious file (polyglot, SVG, bomb) | allow-list, sniffing, decode limits |
| Enumeration of blobs | opaque random IDs; uniform 404 |
| Storage abuse | per-owner quota 200 MiB; upload rate limit |
| Hosting of illegal content | quarantine path (PS-119-03) with `mod_` case |
| Stale copies after delete | 24 h propagation, CDN purge |

Retention: DELETED tombstones 30 days; orphan window 24 h; logs 14 days.

## Observability & budgets
Redaction canary test on logs; zero filename occurrences in logs.

## Tests
- TEST-PS-119-07-01 (security): canary filename absent from logs and errors.
- TEST-PS-119-07-02 (integration): deletion reaches CDN within 24 h test clock.
- TEST-PS-119-07-03 (privacy): storage key entropy and no ID substrings.

## Acceptance criteria
1. Zero GPS tags in stored images (sampled audit weekly).
2. Deletion propagation test passes.
3. Privacy Lead (F10) approves class mapping before release.

## Assumptions & open decisions
- ASSUMPTION: quota, upload rate and retention values above.
- D05 PROVISIONAL (default: coarse public regions; precision user-initiated; unapproved).
- D07 PROVISIONAL (unapproved): per-category retention.
