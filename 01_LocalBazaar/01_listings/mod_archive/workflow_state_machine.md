# PS-001-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (`listing.archived`, `listing.restored`, revision), CTR-CAP-001 (case scope), CTR-ERR-001. **Pending:** CTR-LST-001 (active references), CTR-NTF-001 (owner notice; not yet written).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-03.R01 | Only the transitions in the table exist. Any other (state, event) pair → `ARCHIVE.INVALID_STATE`. | MVP |
| PS-001-03.R02 | Each accepted transition is one commit: state, `revision` +1, one event, one idempotency record. All or nothing. | MVP |
| PS-001-03.R03 | Owner archive and restore: at most 10 accepted transitions per listing per rolling 24 h (ASSUMPTION). Excess → `ARCHIVE.TRANSITION_RATE_LIMITED`. | MVP |
| PS-001-03.R04 | No terminal state. Owner-archived listings are restorable (subject to R03). | MVP |
| PS-001-03.R05 | Archive removes listing from public discovery within 60 s p95 (ASSUMPTION). Restore re-indexes within 60 s p95. | MVP |
| PS-001-03.R06 | Time-based auto-expiry of archives. | Future |

## Data / schema
State fields and invariants: [domain_schema.md](domain_schema.md) (PS-001-01). States: `PUBLISHED`, `ARCHIVED` (module view; other F01 states are owned by mod_publish and not reachable from here).

## Commands / queries / events
Each transition below is triggered by a command in [commands_queries_events.md](commands_queries_events.md) (PS-001-04).

## States & transitions
| From | Event (command) | Guard | To | Side effect |
|---|---|---|---|---|
| PUBLISHED | `archive_listing` (owner) | `lst.update`; revision match; valid reason; no active reference | ARCHIVED | Set archive fields, `archived_by_kind=user`; emit `listing.archived`; de-index |
| PUBLISHED | `archive_listing_by_moderator` | `lst.moderate`; active case; reason `MODERATION_HOLD` | ARCHIVED | `archived_by_kind=mod`, `archive_case_ref` set; emit; owner notice (CTR-NTF-001 pending) |
| ARCHIVED | `restore_listing` (owner) | `archived_by_kind=user`; revision match; publish validators pass; R03 budget | PUBLISHED | Clear archive fields; emit `listing.restored`; re-index; `published_at` unchanged |
| ARCHIVED | `restore_listing` (owner) | validators fail | ARCHIVED | No write, no event; `ARCHIVE.RESTORE_VALIDATION_FAILED` |
| ARCHIVED | `restore_listing` (owner) | `archived_by_kind=mod` | ARCHIVED | No write, no event; `ARCHIVE.MODERATION_LOCKED` |
| ARCHIVED | `restore_listing_by_moderator` | `lst.moderate`; case closed without sanction | PUBLISHED | As owner restore; event `restored_by_kind=mod` |
| any | command with known key and same digest | key within 7-day window | unchanged | Return original result; no event |
| any | command with known key, different digest | key exists | unchanged | `EVT.IDEMPOTENCY_KEY_REUSED` |
| any | command in another state | — | unchanged | `ARCHIVE.INVALID_STATE` |

## Validation & errors
Guard failures map to codes in [validation_rules.md](validation_rules.md) (PS-001-02). No transition emits an event on failure.

## Authorization
Guards `lst.update` and `lst.moderate` are defined in [authorization_capabilities.md](authorization_capabilities.md) (PS-001-05).

## Failure, idempotency, concurrency, offline
- Transitions serialize on the `lst_` lock (CTR-EVT-001 R02). The second writer receives `EVT.REVISION_CONFLICT`.
- Server commit timeout 5 s. Ambiguous outcome → client retries with same key (PS-001-06).
- Offline: command sits in the local pending queue (D08 PROVISIONAL). No server state exists until relay acknowledgement.
- Cycle acceptance and archive race on the same lock; the active-reference guard decides the winner (D04 PROVISIONAL).

## Privacy, retention, abuse
Transition events carry no free text and no account ID for federated export (CTR-EVT-001 R13). Abuse control: R03.

## Observability & budgets
`archive_commands_total{command,outcome}` per transition; de-index lag gauge (PS-001-08 R03).

## Tests
- TEST-PS-001-03-01 — property: random transition sequences only follow the table.
- TEST-PS-001-03-02 — integration: archive emits exactly one event; failed guard emits none.
- TEST-PS-001-03-03 — integration: restore after validator failure leaves state ARCHIVED.
- TEST-PS-001-03-04 — integration: 11th transition in 24 h is rate limited.

## Acceptance criteria
1. Every row of the table has one passing test.
2. De-index p95 ≤ 60 s under load fixture.
3. No transition writes state without a matching event.

## Assumptions & open decisions
- D08 PROVISIONAL: local pending queue until relay acknowledgement.
- D04 PROVISIONAL: archive blocked during open cycle or exchange.
- ASSUMPTION: 10 transitions per 24 h; 60 s de-index budget.
- PENDING CTR-LST-001 and PENDING CTR-NTF-001.
