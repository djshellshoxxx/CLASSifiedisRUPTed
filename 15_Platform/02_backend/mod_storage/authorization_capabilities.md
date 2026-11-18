# PS-119-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R05, R06, R09, R10), CTR-PRV-001 (R03), CTR-ID-001 (R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-05.R01 | Every byte read requires a decision from the referencing owner's module (`attachment.read`, `listing.read`, etc.). Storage never authorizes by possession of a `blob_id`. | MVP |
| PS-119-05.R02 | Signed or public URLs are forbidden in MVP; downloads go through the API (ASSUMPTION; Future scope for CDN signed URLs with expiry ≤ 5 min). | MVP |
| PS-119-05.R03 | Scanner and cleanup principals are `sys_` scoped to `blob` only. | MVP |
| PS-119-05.R04 | Quarantine by `mod_` requires a `cas_` case ID (CTR-CAP-001 R04). | MVP |

## Data / schema
| Actor | Action | Scope |
|---|---|---|
| acc_ owner | attachment.create, listing.update (upload) | owner |
| acc_ participant | attachment.read | participant (F08 rules) |
| acc_ other | any blob read | deny (404) |
| sys_ scanner | blob.scan_complete | internal |
| mod_ moderator | blob.quarantine | case:cas_ |
| ope_ operator | blob.read_metadata | global, no bytes |

## Commands / queries / events
None beyond PS-119-04.

## States & transitions
Not applicable.

## Validation & errors
Unreadable blob → 404 `SYS.NOT_FOUND` (CTR-ERR-001 R08). Denied write → 403 `SYS.FORBIDDEN`.

## Authorization
Operators never receive bytes of blobs with data class PRIVATE_PERSONAL or higher without dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Decisions are not cached for downloads (CTR-CAP-001 R09: zero cache for private access). Public listing images may be cached `public`.

## Privacy, retention, abuse
Access to a blob is audited as `aud_` for privileged reads only (CTR-CAP-001 R08).

## Observability & budgets
Counter `stored_authz_denied_total{owner_scope}`. Alert on any `ope_` byte read.

## Tests
- TEST-PS-119-05-01 (unit): matrix above.
- TEST-PS-119-05-02 (security): guessed blob_id from another account returns 404.
- TEST-PS-119-05-03 (integration): revoked participant loses read at next request.

## Acceptance criteria
1. No byte read path bypasses an owner decision (static route audit).
2. Operator byte reads blocked without dual control.
3. Zero signed URLs issued in MVP.

## Assumptions & open decisions
- ASSUMPTION: signed URLs deferred.
- D10 PROVISIONAL (unapproved): not applied; storage holds no user keys.
