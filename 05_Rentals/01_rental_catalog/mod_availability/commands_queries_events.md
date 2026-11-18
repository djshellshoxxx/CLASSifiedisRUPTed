# PS-039-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-04. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle (commit and release), notifications (events), observability; shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-04.R01: Every command, query and event has a versioned name, a typed signature, a request and response example, an idempotency rule (commands) and a schema version.
- PS-039-04.R02: Commands are idempotent by `(actor_key, command_name, idempotency_key)`. Replays return the original result with `replayed: true`.
- PS-039-04.R03: Events are emitted through an outbox with at-least-once delivery. Consumers deduplicate by `event_id`.

## Conventions
- Names: `avail.<aggregate>.<verb>`, version carried in `schema_version` (integer, 1). Breaking change creates `.v2` names (A-AVAIL-14).
- Every command body carries `schema_version`, `idempotency_key` (ULID, client generated), `actor_context` (set by the platform, never by the body), and an optional `expected_revision` for updates.
- Envelope for events follows CTR-EVT-001 (pending expansion): `event_id`, `event_name`, `aggregate_id`, `revision`, `occurred_at_utc`, `correlation_id`, `schema_version`. Event payloads contain IDs and codes only.

## Commands
| Command | Signature | Actor | Idempotent | Emits |
|---|---|---|---|---|
| avail.window.publish | `publish(listing_id, starts_at_utc, ends_at_utc, timezone_id) -> {window_id, revision}` | owner | yes | `avail.window.published` |
| avail.window.withdraw | `withdraw(window_id, expected_revision) -> {window_id, revision}` | owner | yes | `avail.window.withdrawn` |
| avail.block.create | `createBlock(listing_id, starts_at_utc, ends_at_utc, reason_code) -> {block_id, revision}` | owner | yes | `avail.block.created` |
| avail.block.remove | `removeBlock(block_id, expected_revision) -> {block_id, revision}` | owner | yes | `avail.block.removed` |
| avail.claim.hold | `hold(listing_id, window_id, starts_at_utc, ends_at_utc, hold_ttl_seconds?) -> {claim_id, revision, hold_expires_at_utc}` | requester | yes | `avail.claim.held` |
| avail.claim.release | `release(claim_id, expected_revision, reason) -> {claim_id, revision}` | requester or owner | yes | `avail.claim.released` |
| avail.claim.commit | `commit(claim_id, source_ref, expected_revision) -> {claim_id, revision}` | lifecycle service | yes | `avail.claim.committed` |
| avail.claim.release_commitment | `releaseCommitment(claim_id, source_ref, reason, expected_revision) -> {claim_id, revision}` | lifecycle service | yes | `avail.claim.released` |

`reason` for release: `requester_withdrew`, `owner_declined`. `reason` for releaseCommitment: `rental_cancelled`, `rental_completed`.

## Queries
| Query | Signature | Actor | Response scope |
|---|---|---|---|
| avail.query.calendar | `calendar(listing_id, from_utc, to_utc) -> {intervals[]}` | public or any authenticated | open, requested, unavailable intervals; no IDs |
| avail.query.claim | `claim(claim_id) -> claim` | requester, owner, lifecycle service | full claim for permitted party |
| avail.query.windows | `windows(listing_id, include_withdrawn?) -> window[]` | owner | owner's windows and blocks |

Range limits: public calendar query at most 92 days; owner queries at most 366 days.

## Example: hold a period
Request:
```json
{
  "schema_version": 1,
  "idempotency_key": "01J9Z8X3K4M5N6P7Q8R9S0T1V1",
  "listing_id": "rl_example_0001",
  "window_id": "01J9Z8X3K4M5N6P7Q8R9S0T1VW",
  "starts_at_utc": "2026-12-03T09:00:00Z",
  "ends_at_utc": "2026-12-05T09:00:00Z",
  "hold_ttl_seconds": 259200
}
```
Response (201):
```json
{
  "claim_id": "01J9Z8X3K4M5N6P7Q8R9S0T1VY",
  "state": "held",
  "revision": 1,
  "hold_expires_at_utc": "2026-11-13T09:00:00Z",
  "replayed": false
}
```
Replay with the same key and body returns the same body with `replayed: true`. Same key with a different body returns `AVAIL_IDEMPOTENCY_KEY_REUSED`.

## Example: calendar query
Request: `GET avail.query.calendar?listing_id=rl_example_0001&from_utc=2026-12-01T00:00:00Z&to_utc=2026-12-08T00:00:00Z`
Response:
```json
{
  "listing_id": "rl_example_0001",
  "intervals": [
    {"starts_at_utc": "2026-12-01T00:00:00Z", "ends_at_utc": "2026-12-03T09:00:00Z", "status": "open"},
    {"starts_at_utc": "2026-12-03T09:00:00Z", "ends_at_utc": "2026-12-05T09:00:00Z", "status": "requested"}
  ]
}
```
Status values for public calendar: `open`, `requested` (held or committed), `unavailable` (block or outside windows). The public response never distinguishes held from committed.

## Event examples
Event `avail.claim.held.v1`:
```json
{
  "event_id": "01J9Z8X3K4M5N6P7Q8R9S0T1V2",
  "event_name": "avail.claim.held",
  "schema_version": 1,
  "aggregate_id": "01J9Z8X3K4M5N6P7Q8R9S0T1VY",
  "revision": 1,
  "listing_id": "rl_example_0001",
  "occurred_at_utc": "2026-11-10T08:05:00Z",
  "correlation_id": "01J9Z8X3K4M5N6P7Q8R9S0T1V1"
}
```
Events carry no requester pseudonym in public topics. Participant-scoped topics carry `requester_participant_id` only to the owner and the requester.

## Error and idempotency behavior
- Errors use the codes in validation_rules.md and are returned in the typed error envelope (CTR-ERR-001, pending).
- Missing key on a write returns `AVAIL_IDEMPOTENCY_KEY_MISSING`.
- Idempotency records are retained 7 days (A-AVAIL-13). After expiry, a replayed key is treated as new.

## Open decisions
- A-AVAIL-13: Idempotency record retention 7 days, scope `(actor_key, command_name, key)`.
- A-AVAIL-14: Schema versioning: additive changes keep version 1; breaking changes create `.v2` names. Subject to CTR-SCH-001 (OPEN).
- A-AVAIL-15: Outbox with at-least-once delivery. Exactly-once is not assumed. Event envelope subject to CTR-EVT-001.
