# PS-045-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision rules R02), CTR-CAP-001, CTR-PRV-001 (R06 propagation); PENDING CTR-DSC-001.

**Decision labels:** Suppression and removal timing are PROVISIONAL (D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-03.R01 | Document states: `absent`, `active`, `suppressed`, `removed`. No other state exists. | MVP |
| PS-045-03.R02 | An event with `revision` ≤ `source_revision` is a no-op (no state change, no event). | MVP |
| PS-045-03.R03 | `removed` is terminal for that `lst_` revision range; a new `listing.published` for the same `lst_` is impossible by CTR-ID-001; re-creation uses a new `lst_`. | MVP |
| PS-045-03.R04 | `suppressed` docs are excluded from all query results within 60 s of the transition (ASSUMPTION). | MVP |
| PS-045-03.R05 | Every transition emits `index.doc.changed` exactly once per committed revision. | MVP |

## Data / schema
State stored as `status` on the index document (see PS-045-01). Transition log is the audit event stream (`aud_`, RET-AUD), not the index doc.

## Commands / queries / events
Transitions are driven by `index.apply_event` and `index.suppress` (PS-045-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| absent | listing.published (rev r) | valid per PS-045-02 | active | insert doc, source_revision = r, emit changed |
| active | listing.updated (rev r > s) | valid | active | upsert fields, source_revision = r |
| active | listing.withdrawn (rev r) | r > s | removed | remove from query set, emit changed |
| active | index.suppress | reason in enum | suppressed | exclude from query, emit changed |
| suppressed | index.suppress lifted by `mod_`/`ope_` | case closed | active | re-include if cell ≥ K_MIN |
| suppressed | listing.withdrawn | r > s | removed | purge query copy |
| active / suppressed | listing.deleted (rev r) | r > s | removed | tombstone; purge within 24 h |
| any | event with revision ≤ s | — | unchanged | no-op (R02) |
| absent | listing.updated / withdrawn | — | absent | buffer (PS-045-06), no write |

## Validation & errors
Invalid transitions are rejected with `INDEX.INVALID_TRANSITION` (retryable false) and recorded in `aud_`.

## Authorization
Transitions require the principal rules in PS-045-05.

## Failure, idempotency, concurrency, offline
Transitions are serialized per `lst_` by revision compare-and-set. Concurrent writers losing the CAS retry by reload (PS-045-06).

## Privacy, retention, abuse
`removed` docs are purged in 24 h (ASSUMPTION). Suppression reasons are visible to F12 and the owner only where CTR-CAP-001 allows.

## Observability & budgets
Metric `index_transition_total{from,to}`. Dashboard shows `suppressed` counts per region cell only when ≥ K_MIN.

## Tests
- TEST-PS-045-03-01 (unit): transition table covered row by row.
- TEST-PS-045-03-02 (property): applying a random permutation of revisions yields the same final state.
- TEST-PS-045-03-03 (integration): suppress then withdraw leaves no query-visible copy.

## Acceptance criteria
1. Every row of the table has a test and a log assertion.
2. Final state is order-independent for any revision set (property test, 10^4 runs).
3. `removed` docs absent from query index after 60 s in integration environment.

## Assumptions & open decisions
- ASSUMPTION: 60 s query exclusion SLA (F15 to validate).
- D07 PROVISIONAL for purge windows.
