# PS-117-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-SCH-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-01.R01 | api owns exactly three persisted record classes: `api_idempotency`, `api_version`, and an ephemeral rate bucket held in cache only. It owns no business aggregate. | MVP |
| PS-117-01.R02 | Every persisted row carries `created_at` (UTC, microsecond) and `schema_version`. | MVP |
| PS-117-01.R03 | `request_id` is generated server-side as `req_` + opaque ID (CTR-ID-001 R02). It is never client-supplied. | MVP |
| PS-117-01.R04 | `api_idempotency` rows expire after 24 h (ASSUMPTION) and are purged by a TTL job within 1 h of expiry. | MVP |

## Data / schema
```sql
CREATE TABLE api_idempotency (
  actor_ref       CHAR(30)     NOT NULL,   -- acc_/sys_/ope_/mod_/fpr_ (CTR-ID-001)
  command_type    VARCHAR(96)  NOT NULL,   -- ^[a-z_]+\.[a-z_]+$
  idem_key        VARCHAR(64)  NOT NULL,   -- ^[A-Za-z0-9_-]{16,64}$, client-generated
  request_digest  CHAR(64)     NOT NULL,   -- SHA-256 hex of canonical JSON body (JCS)
  status          VARCHAR(16)  NOT NULL CHECK (status IN ('in_progress','succeeded','failed_final')),
  result_ref      CHAR(30)     NULL,       -- produced aggregate ID, if any
  http_status     SMALLINT     NULL,
  response_body  BYTEA        NULL,       -- stored envelope, max 16 KiB
  created_at      TIMESTAMPTZ  NOT NULL,
  expires_at      TIMESTAMPTZ  NOT NULL,
  schema_version  VARCHAR(8)   NOT NULL,
  PRIMARY KEY (actor_ref, command_type, idem_key)
);
CREATE INDEX api_idempotency_expiry ON api_idempotency (expires_at);

CREATE TABLE api_version (
  version_label   VARCHAR(8)   PRIMARY KEY CHECK (version_label ~ '^v[1-9][0-9]{0,2}$'),
  status          VARCHAR(16)  NOT NULL CHECK (status IN ('active','deprecated','sunset')),
  sunset_at       TIMESTAMPTZ  NULL,       -- required when status = 'sunset'
  schema_registry_ref VARCHAR(128) NOT NULL -- CTR-SCH-001 registry key
);
```
Provenance: rows are written only by the api service principal (`sys_`). `response_body` never contains PRIVATE_PERSONAL fields beyond what the original response already carried.

## Commands / queries / events
- Records above have no public command. `api_version` status changes are admin commands (see PS-117-04).
- Event: `api_version.deprecated` and `api_version.sunset` (CTR-EVT-001 R10 naming). Idempotency rows emit no events.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `version.deprecated` | status = active | deprecated | emit `api_version.deprecated` |
| deprecated | `version.sunset` | sunset_at ≤ now | sunset | emit `api_version.sunset`; requests return `API.VERSION_SUNSET` |
| deprecated | `version.reactivated` | ops approval | active | none |

## Validation & errors
Row-level constraints above. Field classes: `actor_ref` PSEUDONYMOUS; all others PUBLIC or SECRET-free. No free-text fields.

## Authorization
Table writes: `sys_` api principal only. Reads: `sys_` and `ope_` with `api_version.read`. No participant access.

## Failure, idempotency, concurrency, offline
Insert of `api_idempotency` uses the composite primary key as the concurrency guard. Duplicate insert returns the existing row. Version status updates use optimistic concurrency on `status` (compare-and-set).

## Privacy, retention, abuse
Retention: `api_idempotency` 24 h; `api_version` indefinite (configuration). Deletion of an actor does not require row deletion because `actor_ref` is pseudonymous and rows expire within 24 h.

## Observability & budgets
Metric: `api_idempotency_rows` gauge; alert if > 5 M rows (ASSUMPTION). Insert p95 ≤ 10 ms.

## Tests
- TEST-PS-117-01-01 (integration): composite key uniqueness under 50 concurrent inserts.
- TEST-PS-117-01-02 (unit): version state table, all transitions and rejected transitions.
- TEST-PS-117-01-03 (integration): TTL purge removes rows at expires_at + ≤ 1 h.

## Acceptance criteria
1. Schema matches the SQL above; migrations are expand-then-contract.
2. Only `sys_` writes; verified by authorization test.
3. No table has a column outside the declared classes (CTR-PRV-001 R01 CI check).

## Assumptions & open decisions
- ASSUMPTION: 24 h idempotency window.
- D10 (PROVISIONAL default: user-controlled keys with documented recovery and rotation, unapproved): not used by this schema; api stores no key material.
- D08 (PROVISIONAL default: local pending queue until authenticated relay acknowledgment, unapproved): drives the 24 h window (see PS-117-06).
