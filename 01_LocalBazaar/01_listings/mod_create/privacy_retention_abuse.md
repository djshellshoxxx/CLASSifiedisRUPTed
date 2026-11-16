# PS-002-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes R01–R12, retention, disclosure matrix), CTR-EVT-001 (R06 actor refs, R11 max class), CTR-CAP-001 (R13 decision records), CTR-FED-001 (federation boundary), CTR-ID-001 (ID privacy).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-07.R01 | Exact coordinates, street and home addresses never enter a draft, event, log, response or analytics record. Zero occurrences in the fixture corpus. | MVP |
| PS-002-07.R02 | Drafts are visible only to the owner. No public, counterparty or federation disclosure happens at create (CTR-PRV-001 matrix). | MVP |
| PS-002-07.R03 | Quota: 20 successful creates per `acc_` per 24 h (ASSUMPTION). Excess returns `SYS.RATE_LIMITED` with `retry_after_ms`. | MVP |
| PS-002-07.R04 | Open-draft cap: 50 drafts per `acc_` (ASSUMPTION). Above the cap returns `LST.DRAFT_LIMIT_REACHED` (422, not retryable). | MVP |
| PS-002-07.R05 | Drafts with no edit for 90 days expire and are purged within 24 h (ASSUMPTION; CTR-PRV-001 R06). | MVP |
| PS-002-07.R06 | Federated sources (`federated_import`) are refused by create. Federation of listings is decided by mod_publish and CTR-FED-001. | MVP |
| PS-002-07.R07 | Each create or refusal is logged with pseudonymous IDs only. IP addresses are truncated or keyed-hashed (CTR-PRV-001 R09). | MVP |

## Data / schema
Data classes per field: PS-002-01. Event max class: LOCATION_COARSE (PS-002-04). Owner-facing `content_digest` is not a personal identifier.

## Commands / queries / events
No additional command. Abuse signals are published as aggregate counters, never per-user events.

## States & transitions
Draft expiry (R05) is `active → expired → purged`, per CTR-PRV-001 retention lifecycle. Expiry is owned by the retention job, not by create.

## Validation & errors
`LST.DRAFT_LIMIT_REACHED` (unprocessable_state, 422, retryable false): R04 breached. `SYS.RATE_LIMITED` (429, retryable): R03 breached.

## Authorization
Owner-only reads and writes (PS-002-05). Enumeration defense: unreadable drafts return `SYS.NOT_FOUND` (CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Quota counters are kept in RET-EPH (24 h). A replayed create that returns a stored result does not consume quota.

## Privacy, retention, abuse
| Data | Class | Retention |
|---|---|---|
| Draft record | Mixed (PS-002-01) | Owner account lifetime, expiry per R05 |
| `listing.created` envelope | LOCATION_COARSE max | Event store default (OPEN, D07) |
| Idempotency rows | Digests only | RET-OPS, 7 days |
| Quota counters | Pseudonymous | RET-EPH, 24 h |
| Error and decision logs | Pseudonymous | RET-OPS 30 days; decisions RET-AUD 12 months |

Residual risks:
- Title and description may contain personal data typed by the owner. Create does not guarantee detection. Publish-time checks belong to mod_publish; reports go to mod_flags.
- `lst_` IDs reveal creation time to the millisecond (CTR-ID-001). Drafts are not public, and the ID is shared only with the owner.
- Duplicate-spam drafts are passed to F12 aggregate signals (mod_spam, mod_risk) and are not blocked by create alone.

Deletion: owner delete of a draft is handled by mod_archive. Its completion record is an `aud_` record without content (CTR-PRV-001 R12).

## Observability & budgets
Alerts: any precise-location match in logs (zero tolerance, CTR-PRV-001). Rate-limit hits above 1% of creates for 15 min. See PS-002-08.

## Tests
- TEST-PS-002-07-01 (zero tolerance): fixtures with coordinates, street and home addresses appear in no response, event, log or analytics output.
- TEST-PS-002-07-02 (abuse): 21st create in 24 h returns `SYS.RATE_LIMITED` with `retry_after_ms`; 51st open draft returns `LST.DRAFT_LIMIT_REACHED`.
- TEST-PS-002-07-03 (retention): a draft unedited for 90 days is purged from replicas, caches and indexes within 24 h.
- TEST-PS-002-07-04 (federation): a `federated_import` create is refused with `SYS.FORBIDDEN`.

## Acceptance criteria
1. Zero precise-location occurrences in the fixture corpus (TEST-PS-002-07-01).
2. Quota and cap behave as stated in TEST-PS-002-07-02.
3. Expiry and purge pass within 24 h (TEST-PS-002-07-03).
4. TEST-PS-002-07-01 to -04 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D05 default, unapproved): coarse public regions; precise location only by user-initiated disclosure, not part of create.
- PROVISIONAL (D07 default, unapproved): minimal retention with legal-hold exceptions. Draft expiry of 90 days is ASSUMPTION.
- OPEN (F10): review of residual free-text personal data risk.
- Pseudonyms do not guarantee anonymity against metadata or legal process (PROJECT_SPEC).
