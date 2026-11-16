# CTR-PRV-001 — Data classes, retention and disclosure

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** F10 Privacy (named owner UNASSIGNED; S3-11). **Parent:** planning/CONTRACTS.md. **Canonical contracts:** CTR-PRV-001 (this file). **Depends on:** CTR-ID-001, CTR-SCH-001. **Consumed by:** CTR-EVT-001 (`max_data_class`), CTR-ERR-001 (diagnostics), CTR-CAP-001 (field visibility), CTR-COM-001, CTR-FED-001, all modules that store, log or export data.

**Decision labels:** Disclosure rules for locations are PROVISIONAL (D05 default, unapproved). Retention defaults are PROVISIONAL (D07 default, unapproved). Legal retention periods require R07 jurisdiction review (OPEN).

## Scope

Defines the data classes every field and record must carry, default retention classes, and the disclosure matrix that governs where each class may go: owner, counterparty, public, federation, logs, analytics, push previews, operators, backups and exports. Not a legal opinion.

## Requirements

| ID | Requirement (measurable) | Priority |
|---|---|---|
| CTR-PRV-001.R01 | Every schema field has exactly one class (CTR-SCH-001). Unclassified field → CI failure `PRV.UNCLASSIFIED_FIELD`. | MVP |
| CTR-PRV-001.R02 | Class ordering for `max_data_class`: PUBLIC < PSEUDONYMOUS < LOCATION_COARSE < PRIVATE_PERSONAL < FINANCIAL_EVIDENCE < LOCATION_PRECISE. `SECRET` is outside the ordering and never appears in events. | MVP |
| CTR-PRV-001.R03 | Precise location (exact coordinates, street address, home address) is LOCATION_PRECISE. It never enters public payloads, federation, logs, analytics or push previews (zero tolerance; tested). | MVP |
| CTR-PRV-001.R04 | Coarse location is limited to the approved region-cell set. A cell is published only when it contains at least K_MIN active items (ASSUMPTION: K_MIN = 5; F10 to validate). Cells below threshold are merged upward or suppressed. | MVP |
| CTR-PRV-001.R05 | Location query budget per principal: ≤ 30 region queries per 24 h (ASSUMPTION). Queries cannot take a precise center; centers snap to cell centroids. Repeated narrowing patterns raise an alert (CR-13). | MVP |
| CTR-PRV-001.R06 | Retention: every record carries a retention class (table below). Deletion and expiry propagate to replicas, caches, search indexes, derived location data and exports within 24 h (ASSUMPTION). Backups expire by their own schedule; restore replays deletions (BT-04). | MVP |
| CTR-PRV-001.R07 | Legal holds are scoped to a `cas_` ID or a named matter, require an `ope` approval and dual control, have a stated end date, and are released automatically at that date unless renewed. Holds never extend unrelated records. | MVP |
| CTR-PRV-001.R08 | Secrets (SECRET class) are stored as salted hashes or in a KMS-held store only. Plaintext is never logged, exported, federated or shown after creation (CTR-CAP-001; S3-03). | MVP |
| CTR-PRV-001.R09 | Routine logs and telemetry carry pseudonymous IDs only and never payload content. IP addresses are truncated or keyed-hashed before storage (ASSUMPTION). | MVP |
| CTR-PRV-001.R10 | Push and notification previews are generic text by default (for example "New message"). Content previews require explicit user opt-in per device (ASSUMPTION). | MVP |
| CTR-PRV-001.R11 | Data export (portability) includes the owner's data at its classes; PRIVATE_PERSONAL data of counterparties is redacted; LOCATION_PRECISE is exported only on explicit owner request. | MVP |
| CTR-PRV-001.R12 | Deletion produces a completion record (`dpr_`-style record is NOT allowed; use `aud_` with deletion scope) that contains no deleted content, only IDs, timestamps and counts. | MVP |

## Data / schema

Data class definitions:

| Class | Definition | Examples |
|---|---|---|
| PUBLIC | Intended for anyone; no personal data. | Listing title, public description, category. |
| PSEUDONYMOUS | Linked to an `acc_` or `prf_`; no legal identity. | Pseudonym, reputation counts, listing owner ref. |
| LOCATION_COARSE | Approved region cell only (R04). | `region_cell` such as `DE-BE-C1`. |
| PRIVATE_PERSONAL | Personal data not for public display. | Contact details, profile private fields, messages, attachment content. |
| FINANCIAL_EVIDENCE | Payment claims, attestations, transaction references, amounts. | CTR-COM-001 claim records. |
| LOCATION_PRECISE | Exact coordinates or addresses. | Home address, meetup point. |
| SECRET | Credentials and key material. | Passwords (hashes), recovery tokens, session secrets, private keys. |

Retention classes:

| Retention class | Default maximum | Applies to |
|---|---|---|
| RET-EPH | 24 h | Rate counters, decision caches, transient queues after server acknowledgement (purged on ack). |
| RET-OPS | 30 days (7-day default for idempotency records) | Operational logs (pseudonymous), idempotency records, error logs. |
| RET-AUD | 12 months | Audit records (`aud_`), grant and decision records, access logs. |
| RET-ACC | Account lifetime + 30 days grace | Account and profile records. |
| RET-PRIV | 365 days after last access, or user deletion, whichever first (ASSUMPTION) | Messages, attachment content, private profile fields. |
| RET-LOC | 30 days after end of the related transaction or meetup, or 7 days after last use, whichever first (ASSUMPTION) | LOCATION_PRECISE and derived location data. |
| RET-EVD | 24 months after final state (ASSUMPTION; jurisdiction review OPEN, R07). Personal fields redacted after 12 months while hashes remain. | Commerce evidence (CTR-COM-001), dispute records. |
| RET-SEC | Until revoked or rotated; hashes purged 30 days after revocation (ASSUMPTION) | SECRET-class records. |
| RET-FED | Tombstones and dedupe records kept ≥ 90 days beyond the maximum envelope expiry (ASSUMPTION) | Federation tombstones and dedupe state (CTR-FED-001). |
| RET-LEGAL | Scoped by legal hold (R07) | Records under hold only. |

## Disclosure matrix

Y = allowed. C = conditional (condition in the notes). N = forbidden.

| Destination | PUBLIC | PSEUDONYMOUS | LOCATION_COARSE | PRIVATE_PERSONAL | FINANCIAL_EVIDENCE | LOCATION_PRECISE | SECRET |
|---|---|---|---|---|---|---|---|
| Owner | Y | Y | Y | Y | Y | Y | N (fingerprint only) |
| Transaction counterparty | Y | C (in active transaction) | Y | C (in transaction or thread) | C (same transaction) | C (user-initiated, time-limited, D05) | N |
| Public, unauthenticated | Y | C (public profile) | C (approved cells, R04) | N | N | N | N |
| Federation peer | Y | C (per-item opt-in; per-audience pseudonym) | C (cell only, same thresholds) | N | C (deferred; redacted proof only, no counterparty IDs) | N | N |
| Logs and telemetry | Y (no content) | C (pseudonymous ID only) | C (cell ID only) | N | N (IDs only, no amounts) | N | N |
| Analytics | Y (aggregate) | C (aggregate, K_MIN) | C (aggregate, K_MIN) | N | N | N | N |
| Push or notification preview | Y | N | N | N (generic text only) | N (generic text only) | N | N |
| Operator or moderator | Y | C (case-scoped) | C (case-scoped) | C (case scope + dual control) | C (case scope + dual control) | C (case scope + dual control, only if necessary) | N |
| Backups | Y (encrypted) | Y (encrypted) | Y (encrypted) | Y (encrypted) | Y (encrypted) | Y (encrypted, excluded from analytics restores) | C (hashes or KMS-wrapped only) |
| Owner export | Y | Y | Y | Y | Y | C (on explicit owner request) | N |

Conditions:
- Counterparty visibility ends when the transaction is closed or the party is removed from the proposal (CTR-CAP-001 R05).
- LOCATION_PRECISE to counterparty: a user creates a per-meetup disclosure. It expires at the earlier of meetup end + 2 h or 24 h (ASSUMPTION). Revocation stops future access; it cannot recall copies already seen (state in UI).
- Federation of LOCATION_COARSE uses the same K_MIN rule as public display.

## Commands / queries / events

Disclosure grants for LOCATION_PRECISE are events: `location.disclosure_granted`, `location.disclosure_revoked`, `location.disclosure_expired` (CTR-EVT-001, `max_data_class = LOCATION_PRECISE`, local-only, never federated, never logged in payload). Deletion: `record.deleted` (payload: IDs and counts only; R12).

## Versioning and compatibility

- Adding a data class: MAJOR (every consumer must update the disclosure matrix).
- Adding a retention class: MINOR. Changing a default: MAJOR for the affected class, with a migration of existing records under the new default only when the change shortens retention; lengthening retention requires F10 approval and notice.
- Changing K_MIN, query budget or cell set: MINOR with F10 approval and regression tests (R04, R05).

## Examples

Valid classification of a schema field:

```json
{"field": "payload.region_cell", "data_class": "LOCATION_COARSE", "retention": "RET-ACC", "federated": "conditional", "logged": false}
```

Invalid (violations: exact coordinates classed as coarse; secret in logs):

```json
{"field": "payload.home_lat", "data_class": "LOCATION_COARSE", "retention": "RET-ACC", "federated": true, "logged": true}
```

Violations: `home_lat` is precise location (R03), misclassified as LOCATION_COARSE; `federated: true` forbidden for LOCATION_PRECISE; `logged: true` forbidden (R03, R09).

## Validation and errors

| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| PRV.UNCLASSIFIED_FIELD | false | validation / 400 (CI) | Field without class. |
| PRV.CLASS_VIOLATION | false | unprocessable_state / 422 | Write or export would violate the disclosure matrix. |
| PRV.PRECISE_LOCATION_FORBIDDEN | false | unprocessable_state / 422 | Precise location in public, federated or log path. |
| PRV.QUERY_BUDGET_EXCEEDED | true | rate_limited / 429 | Location query budget exhausted (R05). |
| PRV.K_THRESHOLD_NOT_MET | false | not_found / 404 | Cell suppressed for result set size (returned as empty set in list responses; this code is internal for analytics). |
| PRV.HOLD_SCOPE_INVALID | false | validation / 400 | Legal hold missing scope, approval or end date. |

## Authorization

Disclosure matrix changes require F10 approval and F16 review. Operator access to PRIVATE_PERSONAL, FINANCIAL_EVIDENCE and LOCATION_PRECISE requires case scope and dual control (CTR-CAP-001 R06, R07).

## Failure, idempotency, concurrency, offline

- Deletion is idempotent on record ID. A repeated deletion returns the same completion record.
- Offline clients hold PRIVATE_PERSONAL and LOCATION_PRECISE data only if the user enables local cache. Local caches are purged on logout and account switch (S3-10). Local cache retention is RET-EPH for pending queues, and cached profile data is cleared at logout.
- Backup restore: deletions and holds are replayed before the restored data is served (BT-04).

## Privacy, retention, abuse

This is the privacy contract. Abuse controls for location queries are in R05. Scraping of coarse cells is rate-limited under CTR-CAP-001 and CTR-ERR-001 `SYS.RATE_LIMITED`.

## Observability and budgets

- Metrics: `prv_class_violations_total` (must be 0 in production), `prv_location_query_budget_hits_total`, `prv_deletion_propagation_lag_seconds` p95 ≤ 86400 (ASSUMPTION).
- Alerts: any precise-location value detected in logs or telemetry (zero tolerance); deletion propagation past 24 h.
- Redaction tests run on application logs, reverse-proxy logs, analytics, crash reports and support exports (BT-08).

## Tests

- TEST-CTR-PRV-001-01 (lint): every schema field classified (R01); `SECRET` absent from event and federated schemas.
- TEST-CTR-PRV-001-02 (ordering): `max_data_class` computed correctly for mixed payloads (R02).
- TEST-CTR-PRV-001-03 (zero tolerance): fixtures with coordinates, addresses and home fields produce no occurrence in public API responses, federation batches, logs, analytics or push payloads.
- TEST-CTR-PRV-001-04 (K_MIN): cells with 4 items are suppressed; 5 items published (R04).
- TEST-CTR-PRV-001-05 (narrowing attack): 200 repeated queries with shifting centers and filters are throttled and alerted (R05; CR-13 triangulation).
- TEST-CTR-PRV-001-06 (retention): records expire at class maximum in replicas, caches and search indexes within 24 h (R06).
- TEST-CTR-PRV-001-07 (backup restore): restored store replays deletions and holds before serving (R06, BT-04).
- TEST-CTR-PRV-001-08 (legal hold): hold applies only to scoped `cas_`; auto-release at end date; overlapping unrelated records delete on schedule (R07).
- TEST-CTR-PRV-001-09 (secrets): SECRET values absent from logs, exports, federation batches; hash comparison used for verification (R08).
- TEST-CTR-PRV-001-10 (notifications): push payloads contain generic text only unless opt-in is set (R10).
- TEST-CTR-PRV-001-11 (export): owner export includes own PRIVATE_PERSONAL, redacts counterparties, omits LOCATION_PRECISE unless requested (R11).
- TEST-CTR-PRV-001-12 (deletion completion): completion record contains IDs, timestamps and counts only (R12).

## Acceptance criteria

1. Every field in every registered schema has a class; TEST-01 passes.
2. TEST-CTR-PRV-001-03 shows zero precise-location occurrences in any non-owner path, across the fixture corpus.
3. K_MIN and query budget are enforced (TEST-04, TEST-05).
4. Retention and deletion propagation pass within 24 h in the seeded environment (TEST-06, TEST-07).
5. TEST-CTR-PRV-001-01 through -12 pass in CI.

## Assumptions & open decisions

- PROVISIONAL (D05 default, unapproved): coarse public regions and user-initiated precision disclosure.
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
- ASSUMPTION: K_MIN = 5; 30 region queries per 24 h; per-meetup disclosure expiry at min(meetup end + 2 h, 24 h).
- ASSUMPTION: RET-PRIV 365 days; RET-LOC 30 days; RET-EVD 24 months (jurisdiction review OPEN, R07 in RISK_REGISTER.md).
- OPEN: region-cell scheme (grid size and admin-boundary choice). F06 and F10 to decide.
- Related: R01 (home-address leakage), R06 (federation metadata); S3-07, CR-13, CR-19, BT-08.
