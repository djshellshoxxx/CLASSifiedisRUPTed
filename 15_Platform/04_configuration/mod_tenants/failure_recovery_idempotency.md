# PS-125-06 — Failure recovery and idempotency: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-06.R01** All relay commands are idempotent per CTR-IDM-001 and use expectedRevision, so concurrent operator edits never overwrite each other.
- **PS-125-06.R02** Bootstrap is safe to run repeatedly and never creates duplicate tenants or duplicate role assignments.
- **PS-125-06.R03** Vault-local settings changes work offline and have no distributed effect.

## Specification

- **idempotency:** Relay commands require Idempotency-Key with 24 h replay. platform.tenant.create with an existing slug and identical content returns the existing tenant and its assignments (idempotent), with different content PLATFORM_TENANT_SLUG_TAKEN. platform.local_settings.update with the same patch returns the current revision. Re-issuing a configuration statement for a revision that already has one returns the stored statement.
- **concurrency:** expectedRevision on configure, assign_operator and change_status; the unique slug index serializes concurrent creates; all writes run in one BEGIN IMMEDIATE transaction together with the F16 role rows, the signed configuration statement and the outbox event row.
- **retries:** Clients retry network errors and RATE_LIMITED with IDM-4 backoff; conflicts and validation errors are not retried automatically.
- **offline:** Tenant commands need the relay and are not queued because they are operator decisions needing live feedback; clients keep the last verified configuration statement in LocalSettings and show it marked as possibly stale when the relay is unreachable. LocalSettings work fully offline.
- **partial failure:** If the RoleBootstrapPort, the signing or the event row fails the transaction rolls back and no tenant, assignment or change is visible. If a consumer fails on platform.tenant.configured it retries and dead-letters per CTR-EVT-001 EVT-6 without affecting the tenant record.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T04 | integration | PS-125-03.R03, PS-125-04.R02, PS-125-06.R03 | status change with injected event-insert failure | transaction rolled back, no status change, no new statement, no event |
| TEST-PS-125-09.T07 | integration | PS-125-06.R01, PS-125-06.R02 | replay same Idempotency-Key with same and different body; run bootstrap twice; stale expectedRevision | original response replayed; IDEMPOTENCY_KEY_REUSED; second bootstrap returns existing tenant and assignments; CONFLICT_REVISION |
| TEST-PS-125-09.T08 | integration | PS-125-06.R03, PS-125-05.R03 | vault offline, change language and currencies; relay offline, read tenant | LocalSettings update works; tenant shown from the stored signed statement marked stale |
| TEST-PS-125-09.T23 | integration | PS-125-03.R01, PS-125-06.R02 | bootstrap with a RoleBootstrapPort that fails on the admin assignment; then a successful bootstrap | no tenant and no assignment after the failure; afterwards one tenant in active with operator and admin assignments and revision 1 statement in one transaction |
| TEST-PS-125-09.T30 | integration | PS-125-02.R04, PS-125-03.R01, PS-125-06.R02 | bootstrap a fresh relay with --admin and --operator; bootstrap a second tenant with --admin; again with --break-glass and a 10 code point reason, then a 30 code point reason; HTTP create by admin A1 with adminKey; assign_operator by A1 | first creates tenant, operator and admin in one transaction; second SECURITY_BOOTSTRAP_REFUSED with nothing created; 10 code points refused, 30 accepted as break_glass; HTTP create VALIDATION_FAILED; assign_operator calls security.roleassignment.assign with role operator and scope tenant:<id> and grants no admin |

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
