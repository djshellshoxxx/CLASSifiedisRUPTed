# PS-120-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-04.R01 | Every state-changing command carries `idempotency_key` (CTR-EVT-001 R03) and returns the original result on repeat. | MVP |
| PS-120-04.R02 | Commands are internal (`sys`, `ope`); no client-facing endpoint. | MVP |
| PS-120-04.R03 | Queries return metadata only; no query returns object content or keys. | MVP |
| PS-120-04.R04 | Events are CTR-EVT-001 envelopes with `max_data_class` at most PSEUDONYMOUS (counts and IDs only). | MVP |

## Data / schema
| Command | Signature | Idempotency scope | Emits | Errors |
|---|---|---|---|---|
| `backup.schedule` | (scope, kind, window, parent_set_id?) | (actor, key) | `backup.scheduled` (local) | BACKUP.SCOPE_INVALID, BACKUP.WINDOW_OVERLAP, BACKUP.PARENT_INVALID |
| `backup.run` | (bkp_id) | (bkp_id) | `backup.started`, `backup.completed`, `backup.failed` | BACKUP.KEY_UNAVAILABLE, BACKUP.STORE_UNAVAILABLE |
| `backup.verify` | (bkp_id) | (bkp_id, manifest_sha256) | `backup.completed` or `backup.failed` | BACKUP.MANIFEST_MISMATCH, BACKUP.VERIFY_FAILED |
| `backup.expire` | (bkp_id, reason) | (bkp_id) | `backup.expired` | SYS.CONFLICT if hold active |
| `backup.purge` | (bkp_id) | (bkp_id) | `backup.purged` | SYS.GONE on repeat |

Queries: `backup.list` (metadata, page size <= 100), `backup.get` (one set metadata).

## States & transitions
Command effects follow PS-120-03.

## Validation & errors
Validation per PS-120-02. Error codes use CTR-ERR-001 envelope; `message_key` = `err.backup.<code>`.

## Authorization
See PS-120-05.

## Failure, idempotency, concurrency, offline
Duplicate `backup.run` for a running set returns current status (no second job). Event append uses CTR-EVT-001 revision check on the `backup` aggregate.

## Privacy, retention, abuse
Event payloads include `bkp_id`, scope, counts and class only. Never object names or record IDs.

## Observability & budgets
Commands p95 <= 200 ms excluding data transfer (ASSUMPTION).

## Tests
- TEST-PS-120-04-01 (contract): each command validated against signatures above.
- TEST-PS-120-04-02 (unit): repeat `backup.run` returns same status.
- TEST-PS-120-04-03 (lint): event payload fixtures contain no record IDs beyond `bkp_id`.
- TEST-PS-120-04-04 (negative): no public route exposes the commands.

## Acceptance criteria
1. Command table matches the registry of internal operations.
2. TEST-PS-120-04-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: events use `backup.*` names (CTR-EVT-001 R10 past tense).
- PENDING: `bkp` prefix (PS-120-01).
