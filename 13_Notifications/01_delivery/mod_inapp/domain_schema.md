# PS-103-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`ntf_` is owned by F13 in the prefix registry), CTR-PRV-001, CTR-EVT-001, CTR-SCH-001 (referenced, not redefined).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-01.R01 | Canonical record for an in-app notification is `ntf_` (opaque class, F13 registry owner). This module owns the in-app channel state of each `ntf_` record: `inbox_state`, `read_at`, `dismissed_at`. | MVP |
| PS-103-01.R02 | Each notification has one recipient `acc_`, one template key from the registry, and at most 4 short parameters (≤ 64 characters each). | MVP |
| PS-103-01.R03 | Each recipient's inbox has a monotonically increasing `inbox_revision` (per `acc_`) used for sync cursors. | MVP |
| PS-103-01.R04 | Dedupe key = (`acc_`, `template_key`, `source_ref`). A duplicate delivery returns the existing `ntf_`. | MVP |
| PS-103-01.R05 | Each change is an append-only `ntf_event` row. | MVP |

## Data / schema
```sql
CREATE TABLE ntf_inapp (
  ntf_id          CHAR(30) PRIMARY KEY,           -- ntf_ opaque; owner F13 registry
  recipient_ref  CHAR(30) NOT NULL,               -- acc_
  template_key   TEXT NOT NULL,                   -- registry, PS-103-02
  params         JSONB NOT NULL CHECK (octet_length(params::text) <= 512),
  source_ref     TEXT NOT NULL,                   -- cor_ or domain event ref (no content)
  inbox_state    TEXT NOT NULL,                   -- PS-103-03
  inbox_revision BIGINT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL,
  delivered_at   TIMESTAMPTZ NULL,
  read_at        TIMESTAMPTZ NULL,
  dismissed_at   TIMESTAMPTZ NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  UNIQUE (recipient_ref, template_key, source_ref)
);
```
Field classes (CTR-PRV-001): `recipient_ref`, `source_ref` = PSEUDONYMOUS; `template_key`, `inbox_state`, timestamps = PUBLIC to the recipient only; `params` = PSEUDONYMOUS (short labels only, see PS-103-07). No body text, coordinates, amounts or message content are stored.

## Commands / queries / events
See [PS-103-04](commands_queries_events.md).

## States & transitions
See [PS-103-03](workflow_state_machine.md).

## Validation & errors
See [PS-103-02](validation_rules.md).

## Authorization
See [PS-103-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-103-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [PS-103-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-103-08](observability_performance.md).

## Tests
- `TEST-PS-103-01-01` unit: unique key rejects a duplicate source delivery.
- `TEST-PS-103-01-02` unit: `params` over 512 bytes rejected.
- `TEST-PS-103-01-03` contract: schema scan finds no body or content column.

## Acceptance criteria
1. Every row has one recipient, one template and one source reference.
2. `inbox_revision` strictly increases per recipient.
3. No message bodies, coordinates or amounts in any column.

## Assumptions & open decisions
- ASSUMPTION: `ntf_` ownership remains F13 (registry); this module is the implementing owner of the in-app channel state.
- D05 (geoprivacy), PROVISIONAL default: no location fields in notification parameters (unapproved).
- D07 (retention), PROVISIONAL default: PS-103-07 retention windows (unapproved).
