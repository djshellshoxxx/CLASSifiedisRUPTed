# PS-029-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-03.R01 | `listing_skill.status` ∈ {`pending_review`, `active`, `detached`}. No other states. | MVP |
| PS-029-03.R02 | `detached` is terminal for that row. Re-attaching creates a new row with a new ID. | MVP |
| PS-029-03.R03 | Each transition emits one CTR-EVT-001 event and increments `revision` by exactly 1. | MVP |
| PS-029-03.R04 | A taxonomy deprecation does not change `status`. It sets `deprecated_code = true` on rows, which blocks new attachments only. | MVP |
| PS-029-03.R05 | `pending_review` rows are excluded from public search and from F06 index tokens. | MVP |
| PS-029-03.R06 | An operator mapping event must reference a published `taxonomy_version`; otherwise the transition is refused. | MVP |
| PS-029-03.R07 | A pending row expires to `detached` after 30 days without mapping (reason `expired`). | MVP |

## Data / schema
Status and revision fields from [domain_schema.md](domain_schema.md). Transition log is append-only (CTR-EVT-001 R08).

## Commands / queries / events
Transitions are driven by `skill.attach`, `skill.detach`, `skill_taxonomy.map_label`, and the scheduled `expire_pending` job (`sys_` principal). Events: `service_listing.skill_attached`, `service_listing.skill_detached`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | attach, code active | validation passes | active | emit attached; index token |
| (none) | attach, label unmapped | allow_pending true | pending_review | operator queue; no index |
| pending_review | map_label | valid published version | active | emit attached; index token |
| pending_review | map_label rejected | operator reason code | detached | emit detached (reason `rejected`) |
| pending_review | expire_pending | age ≥ 30 days | detached | emit detached (reason `expired`); purge label |
| active | detach | actor is owner | detached | emit detached; remove token |
| active | taxonomy deprecates code | none | active | set deprecated_code; no event beyond taxonomy event |

## Validation & errors
Invalid transitions return `SKILLS.INVALID_TRANSITION` (retryable false) with `details.from`. Concurrent detach and map: loser receives `EVT.REVISION_CONFLICT`.

## Authorization
Owner may attach and detach. Operator `map_label` requires `skill.map_label` with purpose and expiry (CTR-CAP-001 R06). See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Each transition is keyed by (actor, command, idempotency_key). Expiry job is idempotent per row and revision. Offline detach is queued until relay acknowledgment (D08 PROVISIONAL).

## Privacy, retention, abuse
Purge of expired label text occurs on the `detached` transition. Detached rows keep IDs and status for 30 days, then are removed (D07 PROVISIONAL).

## Observability & budgets
Gauge: rows per status. Counter: transitions by from/to. Expiry job completes within 5 min per 10,000 rows (ASSUMPTION).

## Tests
- TEST-PS-029-03-01 unit: each row of the transition table.
- TEST-PS-029-03-02 property: no sequence yields a transition out of `detached`.
- TEST-PS-029-03-03 integration: expiry job run twice produces one event per row.

## Acceptance criteria
1. Transition table is exhaustive; any unlisted (from, event) pair is refused with `SKILLS.INVALID_TRANSITION`.
2. Deprecation never changes `status`.
3. Pending labels are absent from public search results at all times.

## Assumptions & open decisions
- ASSUMPTION: 30-day pending expiry.
- D08 (offline writes) PROVISIONAL: queue until relay ack.
- No payment or receipt checklist applies.
