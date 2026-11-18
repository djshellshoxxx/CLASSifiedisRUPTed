# PS-029-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-04.R01 | Every state-changing command carries `idempotency_key` (UUIDv7 or ULID, 26 chars) and `expected_revision` on updates. | MVP |
| PS-029-04.R02 | Command names: `skill.attach`, `skill.detach`, `skill_taxonomy.publish`, `skill_taxonomy.map_label`. Queries: `skill.search`, `skill_taxonomy.get`. | MVP |
| PS-029-04.R03 | Events use `<aggregate>.<past-verb>`: `service_listing.skill_attached`, `service_listing.skill_detached`, `skill_taxonomy.published`. | MVP |
| PS-029-04.R04 | `skill.search` returns ≤ 50 results per page, cursor-based, ordered by `(skill_code, listing_id)`. | MVP |
| PS-029-04.R05 | Event payload ≤ 2 KiB; no label text in `skill_attached` events for `pending_review` (no event is emitted for pending rows). | MVP |
| PS-029-04.R06 | Schema IDs: `service_listing.skill_attached` v1.0.0 etc., registered per CTR-SCH-001 R01. | MVP |
| PS-029-04.R07 | `skill.search` accepts `skill_code` list ≤ 5 and returns `SKILLS.QUERY_TOO_BROAD` above that. | MVP |

## Data / schema
Command request body (attach):
```
{ "listing_id": "…", "skill_code": "…", "proficiency": "self_declared_working",
  "idempotency_key": "01J…", "expected_revision": 3 }
```
Event envelope per CTR-EVT-001 R01; `max_data_class` = PSEUDONYMOUS.

## Commands / queries / events
| Name | Kind | Idempotent | Version | Errors |
|---|---|---|---|---|
| skill.attach | command | yes | 1 | LIMIT_EXCEEDED, TAXONOMY_UNKNOWN, DUPLICATE_ATTACHMENT, EVT.REVISION_CONFLICT |
| skill.detach | command | yes | 1 | SYS.NOT_FOUND, EVT.REVISION_CONFLICT |
| skill_taxonomy.publish | command | yes | 1 | SKILLS.VERSION_EXISTS |
| skill_taxonomy.map_label | command | yes | 1 | SKILLS.INVALID_TRANSITION |
| skill.search | query | n/a | 1 | SKILLS.QUERY_TOO_BROAD |

## States & transitions
Commands map to transitions in [workflow_state_machine.md](workflow_state_machine.md); no command bypasses it.

## Validation & errors
Codes from [validation_rules.md](validation_rules.md), envelope per CTR-ERR-001 R01.

## Authorization
Command-level capability IDs in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope = (actor, command, key) per CTR-EVT-001 R03. Same key, same digest → original result. Same key, different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Search is read-only and safe to retry.

## Privacy, retention, abuse
Search responses expose `listing_id` and `skill_code` only; no owner `acc_` in search results (pseudonym view only, CTR-CAP-001 R02). Search rate limit: 60 requests per minute per principal (ASSUMPTION).

## Observability & budgets
Per-command latency histograms. Search p95 ≤ 250 ms at 2,000 listings per code (ASSUMPTION).

## Tests
- TEST-PS-029-04-01 contract: request/response golden fixtures for all five operations.
- TEST-PS-029-04-02 integration: idempotent replay of `skill.attach` returns one event.
- TEST-PS-029-04-03 negative: `skill.search` with six codes returns QUERY_TOO_BROAD.

## Acceptance criteria
1. Each operation in the table has a versioned schema registered per CTR-SCH-001.
2. Replay of any command produces zero additional events.
3. Search results never contain `acc_` identifiers.

## Assumptions & open decisions
- ASSUMPTION: rate limit 60 search requests per minute.
- ASSUMPTION: search cursor expires after 10 minutes.
- No payment or receipt checklist applies.
