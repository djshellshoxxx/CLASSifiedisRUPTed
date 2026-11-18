# PS-098-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-CAP-001 (referenced, not redefined).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-01.R01 | A quota policy `lim_` defines one `quota_key` (for example `active_listings`, `open_proposals`, `open_auctions`, `open_bookings`, `open_threads`), one numeric limit, and one scope (`acc`, `prf`-linked `acc_` or region cell). | MVP |
| PS-098-01.R02 | Policies are versioned; exactly one `active` policy per (`quota_key`, `scope`, `jurisdiction_code`) at any time. | MVP |
| PS-098-01.R03 | This module stores no usage counts. Counts are owned by the owning module (F01, F02, F04, F05, F08) and read at check time. | MVP |
| PS-098-01.R04 | Jurisdiction codes come from F18.S01.M01 `mod_jurisdictions` and are derived from LOCATION_COARSE cells only (CTR-PRV-001). | MVP |
| PS-098-01.R05 | Each policy change is an append-only `lim_event` row with `revision` starting at 1. | MVP |

## Data / schema
```sql
CREATE TABLE lim_policy (
  lim_id          CHAR(30) PRIMARY KEY,          -- lim_ ULID; prefix PENDING CTR-ID-001 registry entry
  quota_key       TEXT NOT NULL CHECK (quota_key IN
                    ('active_listings','open_proposals','open_auctions','open_bookings','open_threads')),
  scope_type      TEXT NOT NULL CHECK (scope_type IN ('acc','region_cell')),
  scope_value     TEXT NOT NULL,                 -- acc_ ID or registered cell ID
  jurisdiction    TEXT NOT NULL DEFAULT 'DEFAULT',
  limit_value     INTEGER NOT NULL CHECK (limit_value BETWEEN 0 AND 10000),
  version         INTEGER NOT NULL CHECK (version >= 1),
  state           TEXT NOT NULL,                 -- draft | active | retired
  revision        INTEGER NOT NULL CHECK (revision >= 1),
  rollout_percent SMALLINT NOT NULL DEFAULT 100 CHECK (rollout_percent BETWEEN 0 AND 100),
  effective_from  TIMESTAMPTZ NULL,
  rationale_code  TEXT NOT NULL,                 -- registry, PS-098-02
  created_by      CHAR(30) NOT NULL,             -- mod_ or ope_
  approved_by     CHAR(30) NULL,
  UNIQUE (quota_key, scope_type, scope_value, jurisdiction, version)
);
```
Field classes (CTR-PRV-001): `quota_key`, `limit_value`, `jurisdiction`, `state`, `version` = PUBLIC. `scope_value` for `acc` scope = PSEUDONYMOUS. `region_cell` = LOCATION_COARSE. `created_by`, `approved_by` = PSEUDONYMOUS, operator scope.

Provenance: `correlation_id` and policy `version` recorded on every check decision (`dec_`, CTR-CAP-001 R02 policy_version).

## Commands / queries / events
See [PS-098-04](commands_queries_events.md).

## States & transitions
See [PS-098-03](workflow_state_machine.md).

## Validation & errors
See [PS-098-02](validation_rules.md).

## Authorization
See [PS-098-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-098-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [PS-098-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-098-08](observability_performance.md).

## Tests
- `TEST-PS-098-01-01` unit: constraint allows one active policy per key/scope/jurisdiction.
- `TEST-PS-098-01-02` contract: no usage-count column exists in any table of this module.
- `TEST-PS-098-01-03` privacy: `region_cell` scope rejects values not in the registered cell set.

## Acceptance criteria
1. Every check decision can name the policy `lim_id` and `version` used.
2. No usage counts or account activity history are stored by this module.
3. Jurisdiction derivation uses coarse cells only.

## Assumptions & open decisions
- ASSUMPTION: `lim_` is a new prefix to register with CTR-ID-001 (owner F12).
- D05 (geoprivacy), PROVISIONAL default: coarse public regions and user-initiated precision disclosure; limits use coarse cells only (unapproved).
- D09 (rentals and deposits), PROVISIONAL default: `open_bookings` counts bookings only, never deposit amounts (unapproved).
