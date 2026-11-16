# PS-090-01 — Domain schema: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-01.R01** A MigrationRecord stores kind, subject, from and to relay, the move statement cid, effective time, redirect end, status, copy progress and direction (own or observed) with tenant and revision per CTR-ID-001.
- **PS-090-01.R02** The move statement is a public signed statement and carries only did, relay ids, base URLs and times; it never contains record contents or contact details.
- **PS-090-01.R03** The redirect period is 180 days, equal to the tombstone retention, so a moved author cannot be resurrected on the old relay by replay.

## Specification

### MigrationRecord

Schema `classrup.federation.migration/v1` · storage **relay+device** · privacy **P0** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| kind | enum — account \| relay |
| direction | enum — own \| observed |
| subject | string — did:key of the principal for account moves, relay id for relay moves |
| fromRelay | string — relay id or base URL before the move |
| toRelay | string — relay id or base URL after the move |
| moveCid? | string — cid of the signed classrup.federation.move/v1 statement |
| announcedAt? | timestamp — local clock when the statement was signed |
| effectiveAt? | timestamp — announcedAt + 24 h veto window, claim of the signer for observed moves |
| redirectUntil? | timestamp — effectiveAt + 180 days |
| copyProgress | json — {records: int, tombstones: int, delivered: int, failed: int} |
| vetoedBy? | string — did of the device key that cancelled during the window |
| status | enum — prepared \| announced \| effective \| cancelled \| closed |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one non-terminal own account MigrationRecord per principal.
- status effective implies moveCid verified, effectiveAt ≤ now and no veto was recorded before effectiveAt.
- The subject did never changes in an account move; only the home relay changes.
- A new own account move requires the previous effective move to be at least 30 days old.

### Storage DDL

```sql
CREATE TABLE fed_migration (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, kind TEXT NOT NULL, direction TEXT NOT NULL, subject TEXT NOT NULL,
  status TEXT NOT NULL, effective_at TEXT, redirect_until TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_migration_open ON fed_migration(tenant_id, subject)
  WHERE direction = 'own' AND status IN ('prepared','announced');
CREATE INDEX fed_migration_redirect ON fed_migration(subject, status, redirect_until);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T01 | integration | PS-090-01.R01, PS-090-01.R02, PS-090-04.R01 | prepare, copy, announce, wait 24 h | status effective, moveCid verified, account.moved emitted once, did unchanged |
| TEST-PS-090-09.T16 | manual | PS-090-09.R03, PS-090-01.R03 | review docs/federation/bridges.md | ActivityPub and AT Protocol mappings listed and each labelled Future and not implemented |
| TEST-PS-090-09.T17 | a11y | PS-090-03.R03, PS-090-01.R01 | operate wizard, countdown and veto prompt by keyboard and screen reader | steps announced, countdown text milestones announced, targets ≥ 44 px |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S03.M01, F07.S02.M01, F10.S01.M04, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
